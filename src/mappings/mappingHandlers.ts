import _ from "lodash";
import type { Vec, u32 } from '@polkadot/types'
import { EventRecord, DispatchError } from "@polkadot/types/interfaces";
import { AccountId, Balance } from '@polkadot/types/interfaces/runtime';
import { SubstrateExtrinsic, SubstrateBlock } from "@subql/types";
import { Block, Event, Extrinsic, Call, Account, EvmLog, SystemTokenTransfer } from "../types";
import { AnyCall } from './types'
import { getAccount, getAccountCode } from './moonbeam-handlers/utils/api';
import { tryUpdateAccount } from './accounts';
import { IEvent } from '@polkadot/types/types'
import { CreatorIdMap } from './moonbeam-handlers/utils/types';
import { handleExtrinsic, wrapExtrinsics } from './extrinsics';
import { handleAccount } from './accounts';
import { getBaseFee } from './moonbeam-handlers/utils/api';
import { setBaseFeeSync } from "./moonbeam-handlers/transactions";

export async function handleBlock(block: SubstrateBlock): Promise<void> {
  logger.debug("handleBlock===========");
  setBaseFeeSync(await getBaseFee());
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
  const newTransactions: Call[] = extrinsicWraps.reduce((ts, { newTransactions }) => [...ts, ...newTransactions], []);
  const newCalls: Call[] = extrinsicWraps.reduce((cs, { newCalls }) => [...cs, ...newCalls], []);
  const newEvents: Event[] = extrinsicWraps.reduce((es, { newEvents }) => [...es, ...newEvents], []);
  const newSystemTokenTransfers: SystemTokenTransfer[] = extrinsicWraps.reduce((ss, { newSystemTokenTransfers }) => [...ss, ...newSystemTokenTransfers], []);
  const newEvmLogs: EvmLog[] = extrinsicWraps.reduce((ls, { newEvmLogs }) => [...ls, ...newEvmLogs], []);
  const creatorIdMap = extrinsicWraps.reduce((am, { creatorIdMap }) => {
    Object.keys(creatorIdMap).forEach((key) => {
      am[key] = am[key] || creatorIdMap[key];
    });
    return am;
  }, {});

  await newBlock.save();
  const newAccounts: Account[] = [];

  await Promise.all(Object.keys(creatorIdMap).map(async accountId => {
    const existedAccount = await Account.get(accountId);
    if (existedAccount) {
      await tryUpdateAccount(existedAccount, newBlock);
    } else {
      const handledAccount: Account = await handleAccount({ accountId, block: newBlock, creatorId: creatorIdMap[accountId] });
      newAccounts.push(handledAccount);
    }
  }));
  await store.bulkCreate("Account", newAccounts)
  await store.bulkCreate("Extrinsic", newExtrinsics);
  await store.bulkCreate("Transaction", newTransactions);

  await Promise.all([
    store.bulkCreate("Call", newCalls),
    store.bulkCreate("Event", newEvents),
    store.bulkCreate("SystemTokenTransfer", newSystemTokenTransfers),
    store.bulkCreate("EvmLog", newEvmLogs),
  ]);
}

export * from "./frontier-evm-handlers";