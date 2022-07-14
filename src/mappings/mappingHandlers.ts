import type { Vec, u32 } from '@polkadot/types'
import { EventRecord, DispatchError } from "@polkadot/types/interfaces";
import { AccountId, Balance } from '@polkadot/types/interfaces/runtime';
import { SubstrateExtrinsic, SubstrateBlock } from "@subql/types";
import { Block, Event, Extrinsic, Call, Account, SystemTokenTransfer, EvmLog } from "../types";
import { AnyCall } from './types'
import { IEvent } from '@polkadot/types/types'
import _ from "lodash";

export async function handleBlock(block: SubstrateBlock): Promise<void> {
  const newBlock = new Block(block.block.header.hash.toString())
  newBlock.number = block.block.header.number.toBigInt() || BigInt(0);
  newBlock.timestamp = block.timestamp;
  newBlock.parentHash = block.block.header.parentHash.toString();
  newBlock.specVersion = block.specVersion;

  // Process all calls in block
  const wExtrinsics = wrapExtrinsics(block);

  let startEvtIdx = 0;
  const extrinsicWraps = wExtrinsics.map((ext, idx) => {
    const wraps = handleExtrinsic(block, ext, idx, startEvtIdx);
    startEvtIdx += ext.events.length;
    return wraps;
  });

  const newExtrinsics = extrinsicWraps.map(({ newExtrinsic }) => newExtrinsic);
  const newCalls: Call[] = extrinsicWraps.reduce((cs, { newCalls }) => [...cs, ...newCalls], []);
  const newEvents: Event[] = extrinsicWraps.reduce((es, { newEvents }) => [...es, ...newEvents], []);
  const newSystemTokenTransfers: SystemTokenTransfer[] = extrinsicWraps.reduce((ss, { newSystemTokenTransfers }) => [...ss, ...newSystemTokenTransfers], []);
  const newEvmLogs: EvmLog[] = extrinsicWraps.reduce((ls, { newEvmLogs }) => [...ls, ...newEvmLogs], []);
  const accounts: Account[] = _.uniqBy(extrinsicWraps.reduce((as, { accounts }) => [...as, ...accounts], []), "id");

  await newBlock.save();
  await (async () => {
    const existAccounts = await Promise.all(accounts.map(async a => {
      return await Account.get(a.id);
    }));
    const newAccounts = _.differenceBy(accounts, existAccounts, "id");

    await store.bulkCreate("Account", newAccounts)
  })();

  await store.bulkCreate("Extrinsic", newExtrinsics);

  await Promise.all([
    store.bulkCreate("Call", newCalls),
    store.bulkCreate("Event", newEvents),
    store.bulkCreate("SystemTokenTransfer", newSystemTokenTransfers),
    store.bulkCreate("EvmLog", newEvmLogs),
  ]);
}

function handleExtrinsic(
  block: SubstrateBlock,
  extrinsic: SubstrateExtrinsic,
  idx: number,
  startEvtIdx: number,
): {
  newExtrinsic: Extrinsic,
  newCalls: Call[],
  newEvents: Event[],
  newSystemTokenTransfers: SystemTokenTransfer[],
  newEvmLogs: EvmLog[],
  accounts: Account[]
} {
  const extrinsicId = `${block.block.header.number}-${idx}`;
  const newExtrinsic = new Extrinsic(extrinsicId);
  newExtrinsic.hash = extrinsic.extrinsic.hash.toString();
  newExtrinsic.method = extrinsic.extrinsic.method.method;
  newExtrinsic.section = extrinsic.extrinsic.method.section;
  newExtrinsic.args = extrinsic.extrinsic.args?.toString();
  newExtrinsic.signerId = extrinsic.extrinsic.signer?.toString();
  newExtrinsic.nonce = BigInt(extrinsic.extrinsic.nonce.toString()) || BigInt(0);
  newExtrinsic.timestamp = block.timestamp;
  newExtrinsic.signature = extrinsic.extrinsic.signature.toString();
  newExtrinsic.tip = BigInt(extrinsic.extrinsic.tip.toString()) || BigInt(0);
  newExtrinsic.isSigned = extrinsic.extrinsic.isSigned;
  newExtrinsic.isSuccess = extrinsic.success;
  newExtrinsic.blockId = block.block.header.hash.toString();

  const newCalls = handleCalls(newExtrinsic, extrinsic);

  const newEvents = [];
  const newSystemTokenTransfers = [];
  const newEvmLogs = [];
  extrinsic.events
    .forEach((evt, idx) => {
      newEvents.push(handleEvent(block, extrinsic, evt, extrinsicId, startEvtIdx + idx));
      if (evt.event.section === "balances" && evt.event.method === "Transfer") {
        newSystemTokenTransfers.push(handleSystemTokenTransfer(block, extrinsic, evt, extrinsicId, startEvtIdx + idx));
      } else if (evt.event.section === "evm" && evt.event.method === "Log") {
        newEvmLogs.push(handleEvmLog(block, extrinsic, evt, extrinsicId, startEvtIdx + idx));
      }
    });

  const accountIds = [newExtrinsic.signerId];
  newSystemTokenTransfers.forEach(t => accountIds.push(t.fromId, t.toId));

  const accounts: Account[] = accountIds.map((aId) => {
    const account = new Account(aId);
    account.timestamp = block.timestamp;
    return account;
  });

  return { newExtrinsic, newCalls, newEvents, newSystemTokenTransfers, newEvmLogs, accounts };
}

function handleCalls(
  extrinsic: Extrinsic,
  substrateExtrinsic: SubstrateExtrinsic
): Call[] {
  const list = [];
  const inner = async (
    data: AnyCall,
    parentCallId: string,
    idx: number,
    isRoot: boolean,
    depth: number
  ) => {
    const id = isRoot ? parentCallId : `${parentCallId}-${idx}`
    const section = data.section
    const method = data.method
    const args = data.args

    const newCall = new Call(id)
    newCall.section = section
    newCall.method = method
    newCall.args = JSON.stringify(args)
    newCall.timestamp = extrinsic.timestamp
    newCall.isSuccess = depth === 0 ? extrinsic.isSuccess : getBatchInterruptedIndex(substrateExtrinsic) > idx;

    newCall.signerId = substrateExtrinsic.extrinsic.signer.toString();

    if (!isRoot) {
      newCall.parentCallId = isRoot ? '' : parentCallId
    }

    newCall.extrinsicId = extrinsic.id

    list.push(newCall)

    if (depth < 1 && section === 'utility' && (method === 'batch' || method === 'batchAll')) {
      const temp = args[0] as unknown as Vec<AnyCall>
      temp.forEach((item, idx) => inner(item, id, idx, false, depth + 1));
    }
  }

  inner(substrateExtrinsic.extrinsic.method, extrinsic.id, 0, true, 0)
  return list;
}

function handleEvent(
  block: SubstrateBlock,
  extrinsic: SubstrateExtrinsic,
  event: EventRecord,
  extrinsicId: string,
  idx: number,
): Event {
  const newEvent = new Event(`${block.block.header.number}-${idx}`);
  newEvent.index = Number(event.event.index);
  newEvent.section = event.event.section;
  newEvent.method = event.event.method;
  newEvent.data = JSON.stringify(event.event.data.toHuman());

  newEvent.blockId = block.block.header.hash.toString();
  newEvent.extrinsicId = extrinsicId;

  return newEvent;
}

function handleSystemTokenTransfer(
  block: SubstrateBlock,
  extrinsic: SubstrateExtrinsic,
  event: EventRecord,
  extrinsicId: string,
  idx: number,
): SystemTokenTransfer {
  const { event: { data: [from_origin, to_origin, amount_origin] } } = event;
  const from = (from_origin as AccountId).toString();
  const to = (to_origin as AccountId).toString();
  const amount = (amount_origin as Balance).toBigInt();

  let newSystemTokenTransfer = new SystemTokenTransfer(`${block.block.header.number.toString()}-${idx}`);
  newSystemTokenTransfer.fromId = from;
  newSystemTokenTransfer.toId = to;
  newSystemTokenTransfer.amount = amount;
  newSystemTokenTransfer.timestamp = block.timestamp;
  newSystemTokenTransfer.extrinsicId = extrinsicId;

  return newSystemTokenTransfer;
}

function wrapExtrinsics(wrappedBlock: SubstrateBlock): SubstrateExtrinsic[] {
  return wrappedBlock.block.extrinsics.map((extrinsic, idx) => {
    const events = wrappedBlock.events.filter(
      ({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eqn(idx)
    );
    return {
      idx,
      extrinsic,
      block: wrappedBlock,
      events,
      success:
        events.findIndex((evt) => evt.event.method === "ExtrinsicSuccess") > -1,
    };
  });
}

function getBatchInterruptedIndex(extrinsic: SubstrateExtrinsic): number {
  const { events } = extrinsic
  const interruptedEvent = events.find((event) => {
    const _event = event?.event

    if (!_event) return false

    const { section, method } = _event

    return section === 'utility' && method === 'BatchInterrupted'
  })

  if (interruptedEvent) {
    const { data } = (interruptedEvent.event as unknown) as IEvent<[u32, DispatchError]>

    return Number(data[0].toString())
  }

  return -1
}

function handleEvmLog(
  block: SubstrateBlock,
  extrinsic: SubstrateExtrinsic,
  event: EventRecord,
  extrinsicId: string,
  idx: number,
): EvmLog {
  const { event: { data: [log] } } = event;
  const { address, topics, data } = log.toJSON() as any;

  let newEvmLog = new EvmLog(`${block.block.header.number.toString()}-${idx}`);
  newEvmLog.address = address;
  newEvmLog.topics = topics;
  newEvmLog.data = data;
  newEvmLog.timestamp = block.timestamp;
  newEvmLog.extrinsicId = extrinsicId;

  return newEvmLog;
}


export * from "./frontier-evm-handlers";