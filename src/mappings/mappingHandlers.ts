import _ from "lodash";
import type { Vec, u32 } from '@polkadot/types'
import { EventRecord, DispatchError } from "@polkadot/types/interfaces";
import { AccountId, Balance } from '@polkadot/types/interfaces/runtime';
import { SubstrateExtrinsic, SubstrateBlock } from "@subql/types";
import {
  Block,
  Account,
  Event,
  Call,
  SystemTokenTransfer,
  UpwardMessage,
  NearToAppchainTransfer,
  EvmLog,
  Erc20Transfer,
  Erc20Balance,
  Erc20TokenContract,
  Erc721TokenContract,
  Erc721Transfer,
  Erc721Balance,
} from "../types";
import { tryUpdateAccount, handleAccount } from './accounts';
import { handleExtrinsic, wrapExtrinsics } from './extrinsics';
import { getBaseFee } from './moonbeam-handlers/utils/api';
import { setBaseFeeSync } from "./moonbeam-handlers/transactions";
import { handleUpwardMessages } from './bridgeMessages';
import { storeBridgeMessageEvent } from './bridgeEvents';
import { isEraEvent, isBridgeTransferEvent, isBridgeTransferEventOld } from './utils/matches';
import { config } from "../config";


export async function handleBlock(block: SubstrateBlock): Promise<void> {
  logger.debug("handleBlock===========");
  logger.debug(block.block.header.number.toBigInt());
  setBaseFeeSync(await getBaseFee());
  const newBlock = new Block(block.block.header.hash.toString())
  const newUpwardMessages: UpwardMessage[] = [];
  newBlock.number = block.block.header.number.toBigInt() || BigInt(0);
  newBlock.timestamp = block.timestamp;
  newBlock.parentHash = block.block.header.parentHash.toString();
  newBlock.specVersion = block.specVersion;

  // // Process all calls in block
  const wExtrinsics = wrapExtrinsics(block);

  let startEvtIdx = 0;
  const extrinsicWraps = [];
  for (let idx = 0; idx < wExtrinsics.length; idx++) {
    const ext = wExtrinsics[idx];
    const wraps = await handleExtrinsic(block, ext, idx, startEvtIdx);
    startEvtIdx += ext.events.length;
    extrinsicWraps.push(wraps);
  }

  const newExtrinsics = extrinsicWraps.map(({ newExtrinsic }) => newExtrinsic);
  const newTransactions: Call[] = extrinsicWraps.reduce((ts, { newTransactions }) => [...ts, ...newTransactions], []);
  const newCalls: Call[] = extrinsicWraps.reduce((cs, { newCalls }) => [...cs, ...newCalls], []);
  const newEvents: Event[] = extrinsicWraps.reduce((es, { newEvents }) => [...es, ...newEvents], []);
  const newSystemTokenTransfers: SystemTokenTransfer[] = extrinsicWraps.reduce((ss, { newSystemTokenTransfers }) => [...ss, ...newSystemTokenTransfers], []);
  const newNearToAppchainTransfers: NearToAppchainTransfer[] = extrinsicWraps.reduce((ts, { newNearToAppchainTransfers }) => [...ts, ...newNearToAppchainTransfers], []);
  const newEvmLogs: EvmLog[] = extrinsicWraps.reduce((ls, { newEvmLogs }) => [...ls, ...newEvmLogs], []);

  const newErc20TokenContracts: Erc20TokenContract[] = extrinsicWraps.reduce((ts, { newErc20TokenContracts }) => [...ts, ...newErc20TokenContracts], []);
  const existsErc20TokenContracts: Erc20TokenContract[] = extrinsicWraps.reduce((ts, { existsErc20TokenContracts }) => [...ts, ...existsErc20TokenContracts], []);
  const newErc20Transfers: Erc20Transfer[] = extrinsicWraps.reduce((ts, { newErc20Transfers }) => [...ts, ...newErc20Transfers], []);
  const newErc20Balances: Erc20Balance[] = extrinsicWraps.reduce((bs, { newErc20Balances }) => [...bs, ...newErc20Balances], []);
  const existsErc20Balances: Erc20Balance[] = extrinsicWraps.reduce((bs, { existsErc20Balances }) => [...bs, ...existsErc20Balances], []);

  const newErc721TokenContracts: Erc721TokenContract[] = extrinsicWraps.reduce((ts, { newErc721TokenContracts }) => [...ts, ...newErc721TokenContracts], []);
  const newErc721Tokens: Erc721TokenContract[] = extrinsicWraps.reduce((ts, { newErc721Tokens }) => [...ts, ...newErc721Tokens], []);
  const newErc721Transfers: Erc721Transfer[] = extrinsicWraps.reduce((ts, { newErc721Transfers }) => [...ts, ...newErc721Transfers], []);
  const newErc721Balances: Erc721Balance[] = extrinsicWraps.reduce((bs, { newErc721Balances }) => [...bs, ...newErc721Balances], []);
  const existsErc721Balances: Erc721Balance[] = extrinsicWraps.reduce((bs, { existsErc721Balances }) => [...bs, ...existsErc721Balances], []);

  const newErc1155TokenContracts: Erc721TokenContract[] = extrinsicWraps.reduce((ts, { newErc1155TokenContracts }) => [...ts, ...newErc1155TokenContracts], []);
  const newErc1155Tokens: Erc721TokenContract[] = extrinsicWraps.reduce((ts, { newErc1155Tokens }) => [...ts, ...newErc1155Tokens], []);
  const existsErc1155Tokens: Erc721TokenContract[] = extrinsicWraps.reduce((ts, { existsErc1155Tokens }) => [...ts, ...existsErc1155Tokens], []);
  const newErc1155Transfers: Erc721Transfer[] = extrinsicWraps.reduce((ts, { newErc1155Transfers }) => [...ts, ...newErc1155Transfers], []);
  const newErc1155Balances: Erc721Balance[] = extrinsicWraps.reduce((bs, { newErc1155Balances }) => [...bs, ...newErc1155Balances], []);
  const existsErc1155Balances: Erc721Balance[] = extrinsicWraps.reduce((bs, { existsErc1155Balances }) => [...bs, ...existsErc1155Balances], []);

  const creatorIdMap = extrinsicWraps.reduce((am, { creatorIdMap }) => {
    Object.keys(creatorIdMap).forEach((key) => {
      am[key.toLowerCase()] = am[key.toLowerCase()] || creatorIdMap[key];
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
    await store.bulkCreate("Erc20TokenContract", newErc20TokenContracts),
    await store.bulkCreate("Erc721TokenContract", newErc721TokenContracts),
    await store.bulkCreate("Erc1155TokenContract", newErc1155TokenContracts)
  ]);
  await Promise.all([
    await store.bulkCreate("Erc721Token", newErc721Tokens),
    await store.bulkCreate("Erc1155Token", newErc1155Tokens),
  ]);

  await Promise.all([
    await store.bulkCreate("Call", newCalls),
    await store.bulkCreate("Event", newEvents),
    await store.bulkCreate("SystemTokenTransfer", newSystemTokenTransfers),
    await store.bulkCreate("EvmLog", newEvmLogs),
    await store.bulkCreate("Erc20Transfer", newErc20Transfers),
    await store.bulkCreate("Erc20Balance", newErc20Balances),
    await store.bulkCreate("Erc721Transfer", newErc721Transfers),
    await store.bulkCreate("Erc721Balance", newErc721Balances),
    await store.bulkCreate("Erc1155Transfer", newErc1155Transfers),
    await store.bulkCreate("Erc1155Balance", newErc1155Balances)
  ]);

  if (block.block.header.number.toBigInt() >= config.bridgeMessageStartAt.blockNumber) {
    await Promise.all(block.events.map(async (evt, idx) => {
      if (evt.event.section === "octopusUpwardMessages" && evt.event.method === "Committed") {
        newUpwardMessages.push(...handleUpwardMessages(block, evt));
      }
      if (isEraEvent(evt.event) || isBridgeTransferEventOld(evt.event) || isBridgeTransferEvent(evt.event)) {
        await storeBridgeMessageEvent(block, wExtrinsics, evt);
      }
    }));
    await Promise.all(newUpwardMessages.map(async (data) => await data.save()))
  }
  await Promise.all(newNearToAppchainTransfers.map(async (data) => await data.save()))

  await updateStates([
    existsErc20TokenContracts,
    existsErc20Balances,
    existsErc721Balances,
    existsErc1155Tokens,
    existsErc1155Balances,
  ])

  await setContractToAccountBatch([
    { erc20TokenContract: newErc20TokenContracts },
    { erc721TokenContract: newErc721TokenContracts },
    { erc1155TokenContract: newErc1155TokenContracts }
  ])

}

async function updateStates(statesArr: any[]) {
  await Promise.all(statesArr.map(async (states: any[]) => {
    for (let index = 0; index < states.length; index++) {
      const erc20Token = states[index];
      await erc20Token.save();
    }
  }));
}

async function setContractToAccountBatch(newContractsWraps: any[]) {
  await Promise.all(newContractsWraps.map(async (contractsWrap: any) => {
    const key = Object.keys(contractsWrap)[0];
    const contracts = contractsWrap[key];
    await Promise.all(contracts.map(async (contract) => {
      const account = await Account.get(contract.id);
      account[`${key}Id`] = contract.id;
      await account.save();
    }))
  }));
}
