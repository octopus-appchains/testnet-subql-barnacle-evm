import { SubstrateExtrinsic, SubstrateBlock } from "@subql/types";
import { EventRecord } from "@polkadot/types/interfaces";
import {
  Event,
  Extrinsic,
  Call,
  SystemTokenTransfer,
  Transaction,
  EvmLog,
  Erc20Transfer,
  Erc20TokenContract
} from "../types";
import { CreatorIdMap } from './moonbeam-handlers/utils/types';
import { handleCalls } from './calls';
import { handleSystemTokenTransfer } from './systemTokenTransfer';
import { handleEvent } from './event';
import { handleTransaction } from "./moonbeam-handlers/transactions";
import { handleEvmLogs } from "./moonbeam-handlers/evmLogs";
import { handleTokenTransfers } from "./moonbeam-handlers/tokens";
import _ from "lodash";

export function wrapExtrinsics(wrappedBlock: SubstrateBlock): SubstrateExtrinsic[] {
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

export async function handleExtrinsic(
  block: SubstrateBlock,
  extrinsic: SubstrateExtrinsic,
  idx: number,
  startEvtIdx: number,
): Promise<{
  newExtrinsic: Extrinsic,
  newCalls: Call[],
  newEvents: Event[],
  newSystemTokenTransfers: SystemTokenTransfer[],
  newEvmLogs: EvmLog[],
  creatorIdMap: CreatorIdMap,
  newTransactions: Transaction[],
  newErc20Transfers: Erc20Transfer[],
  newErc20TokenContracts: Erc20TokenContract[],
  existsErc20TokenContracts: Erc20TokenContract[]
}> {
  const extrinsicId = `${block.block.header.number}-${idx}`;
  const newExtrinsic = new Extrinsic(extrinsicId);
  newExtrinsic.hash = extrinsic.extrinsic.hash.toString();
  newExtrinsic.method = extrinsic.extrinsic.method.method;
  newExtrinsic.section = extrinsic.extrinsic.method.section;
  newExtrinsic.args = extrinsic.extrinsic.args?.toString();
  newExtrinsic.signerId = extrinsic.extrinsic.signer?.toString().toLowerCase();
  newExtrinsic.nonce = BigInt(extrinsic.extrinsic.nonce.toString()) || BigInt(0);
  newExtrinsic.timestamp = block.timestamp;
  newExtrinsic.signature = extrinsic.extrinsic.signature.toString();
  newExtrinsic.tip = BigInt(extrinsic.extrinsic.tip.toString()) || BigInt(0);
  newExtrinsic.isSigned = extrinsic.extrinsic.isSigned;
  newExtrinsic.isSuccess = extrinsic.success;
  newExtrinsic.blockId = block.block.header.hash.toString();

  const newCalls = handleCalls(newExtrinsic, extrinsic);

  const newEvents: Event[] = [];
  const newSystemTokenTransfers = [];
  const logEvts: EventRecord[] = [];
  const newTransactions: Transaction[] = [];
  let newEvmLogs = [];
  let ethTransactData = null;
  let extrinsicSuccessDispatchInfo = null;

  const creatorIdMap: CreatorIdMap = {};
  creatorIdMap[newExtrinsic.signerId] = null;

  extrinsic.events
    .forEach((evt, idx) => {
      newEvents.push(handleEvent(block, extrinsic, evt, extrinsicId, startEvtIdx + idx));
      if (evt.event.section === "balances" && evt.event.method === "Transfer") {
        newSystemTokenTransfers.push(handleSystemTokenTransfer(block, extrinsic, evt, extrinsicId, startEvtIdx + idx));
      } else if (evt.event.section === "balances" && (evt.event.method === "Withdraw" || evt.event.method === "Deposit")) {
        const eventData = evt.event.data.toHuman() as any;
        const who = eventData.who.toLowerCase();
        creatorIdMap[who] = creatorIdMap[who] || null;
      } else if (evt.event.section === "evm" && evt.event.method === "Log") {
        logEvts.push(evt);
      } else if (evt.event.section === "ethereum" && evt.event.method === "Executed") {
        const eventData = evt.event.data.toJSON();
        const fromId = eventData[0].toLowerCase();
        const toId = eventData[1].toLowerCase();
        const txHash = eventData[2].toLowerCase();
        const exitReason = eventData[3];
        creatorIdMap[fromId] = creatorIdMap[fromId] || null;
        creatorIdMap[toId] = fromId;
        if (newExtrinsic.section === "ethereum" && newExtrinsic.method === "transact") {
          ethTransactData = {
            fromId,
            toId,
            txHash,
            exitReason,
            argsObj: JSON.parse(newExtrinsic.args),
          };
        }
      } else if (evt.event.section === "system" && evt.event.method === "ExtrinsicSuccess") {
        const extrinsicSuccessEvtDataObj = evt.event.data.toHuman() as any;
        extrinsicSuccessDispatchInfo = extrinsicSuccessEvtDataObj.dispatchInfo;
      }
    });

  newSystemTokenTransfers.forEach(t => {
    creatorIdMap[t.fromId] = null;
    creatorIdMap[t.toId] = null;
  });

  const result = {
    newExtrinsic,
    newCalls,
    newEvents,
    newSystemTokenTransfers,
    creatorIdMap,
    newEvmLogs,
    newTransactions,
    newErc20Transfers: [],
    newErc20Balances: [],
    existsErc20Balances: [],
    newErc20TokenContracts: [],
    existsErc20TokenContracts: [],
    newErc721Transfers: [],
    newErc721Balances: [],
    existsErc721Balances: [],
    newErc721TokenContracts: [],
    newErc721Tokens: [],
    newErc1155Transfers: [],
    newErc1155Balances: [],
    existsErc1155Balances: [],
    newErc1155TokenContracts: [],
    newErc1155Tokens: [],
    existsErc1155Tokens: [],
  }

  if (ethTransactData) {
    const newTransaction = handleTransaction(newExtrinsic, ethTransactData, extrinsicSuccessDispatchInfo);
    newTransactions.push(newTransaction);
    newEvmLogs = handleEvmLogs(block, logEvts, ethTransactData, startEvtIdx);
    const {
      accountIds,
      newErc20Transfers,
      newErc20Balances,
      existsErc20Balances,
      newErc20TokenContracts,
      existsErc20TokenContracts,

      newErc721Transfers,
      newErc721Balances,
      existsErc721Balances,
      newErc721TokenContracts,
      newErc721Tokens,

      newErc1155Transfers,
      newErc1155Balances,
      existsErc1155Balances,
      newErc1155TokenContracts,
      newErc1155Tokens,
      existsErc1155Tokens
    } = await handleTokenTransfers(newEvmLogs, newTransaction.id, block.timestamp);

    Object.assign(result, {
      accountIds,
      newErc20Transfers,
      newErc20Balances,
      existsErc20Balances,
      newErc20TokenContracts,
      existsErc20TokenContracts,

      newErc721Transfers,
      newErc721Balances,
      existsErc721Balances,
      newErc721TokenContracts,
      newErc721Tokens,

      newErc1155Transfers,
      newErc1155Balances,
      existsErc1155Balances,
      newErc1155TokenContracts,
      newErc1155Tokens,
      existsErc1155Tokens
    });
    accountIds.forEach(ac => {
      creatorIdMap[ac] = creatorIdMap[ac] ? creatorIdMap[ac] : null
    })
  }

  return result;
}