import { EventRecord, Event } from "@polkadot/types/interfaces";
import { SubstrateExtrinsic, SubstrateBlock } from "@subql/types";
import { LastBridgeMessageEventSequence, BridgeMessageEvent, EraEvent, AppchainToNearTransfer, NearToAppchainTransfer } from "../types";
import { isEraEvent, isBridgeTransferEvent, isBridgeTransferEventOld } from './utils/matches';
import { WrappedExtrinsic } from "./types";
import { config } from "../config";
import _ from "lodash";

export async function storeBridgeMessageEvent(
  block: SubstrateBlock,
  extrinsicWraps: WrappedExtrinsic[],
  evt: EventRecord,
) {
  const { event } = evt;
  let lastBridgeMessageEventSequence = await LastBridgeMessageEventSequence.get("last");
  if (lastBridgeMessageEventSequence) {
    lastBridgeMessageEventSequence.sequence += 1
  } else {
    lastBridgeMessageEventSequence = new LastBridgeMessageEventSequence("last");
    lastBridgeMessageEventSequence.sequence = config.bridgeMessageStartAt.sequence;
  }
  await lastBridgeMessageEventSequence.save();

  const { sequence } = lastBridgeMessageEventSequence;
  const newBridgeMessageEvent = new BridgeMessageEvent(sequence.toString());
  newBridgeMessageEvent.sequence = sequence;
  newBridgeMessageEvent.eventType = event.method;
  newBridgeMessageEvent.blockId = block.block.header.hash.toString();
  newBridgeMessageEvent.timestamp = block.timestamp;
  await newBridgeMessageEvent.save();

  if (isEraEvent(event)) {
    await storeEraEvent(block, event, sequence);
  } else {
    const extrinsicIdx = extrinsicWraps.findIndex((ext: WrappedExtrinsic) =>
      ext.events.findIndex(({ event }: EventRecord) =>
        isBridgeTransferEventOld(event) || isBridgeTransferEvent(event)) > -1)
    const extrinsicId = `${block.block.header.number}-${extrinsicIdx}`;
    await storeAppchainToNearTransfer(block, extrinsicId, event, sequence);
  }
}

export async function storeEraEvent(
  block: SubstrateBlock,
  event: Event,
  sequence: number,
) {
  const { method, data } = event;
  const [eraIndex] = data;
  const newEraEvent = new EraEvent(sequence.toString());
  newEraEvent.sequence = sequence;
  newEraEvent.bridgeMessageEventId = sequence.toString();
  newEraEvent.eventType = method;
  newEraEvent.eraIndex = Number(eraIndex.toString().replaceAll(',', ''));
  newEraEvent.timestamp = block.timestamp;
  newEraEvent.blockId = block.block.header.hash.toString();
  await newEraEvent.save();
}

export function storeAppchainToNearTransfer(
  block: SubstrateBlock,
  extrinsicId: string,
  event: Event,
  sequence: number,
) {
  const { method, data } = event;
  const { fee = "0" }: any = data.toHuman();
  const newAppchainToNearTransfer = new AppchainToNearTransfer(sequence.toString());
  newAppchainToNearTransfer.sequence = sequence;
  newAppchainToNearTransfer.bridgeMessageEventId = sequence.toString();
  if (["Locked"].includes(method)) {
    const [sender, receiver, amount] = data;
    newAppchainToNearTransfer.senderId = sender.toString();
    newAppchainToNearTransfer.receiver = Buffer.from(receiver.toHex().replace("0x", ""), "hex").toString("utf8");
    newAppchainToNearTransfer.type = "Locked";
    newAppchainToNearTransfer.amount = BigInt(amount.toString().replaceAll(',', ''));
    newAppchainToNearTransfer.fee = BigInt(fee.replaceAll(',', ''));
  } else if (["AssetBurned", "Nep141Burned"].includes(method)) {
    const [assetId, sender, receiver, amount] = data;
    newAppchainToNearTransfer.senderId = sender.toString();
    newAppchainToNearTransfer.receiver = Buffer.from(receiver.toHex().replace("0x", ""), "hex").toString("utf8");
    newAppchainToNearTransfer.type = "Nep141Burned";
    newAppchainToNearTransfer.assetId = Number(assetId.toString().replaceAll(',', ''));
    newAppchainToNearTransfer.amount = BigInt(amount.toString().replaceAll(',', ''));
    newAppchainToNearTransfer.fee = BigInt(fee.replaceAll(',', ''));
  } else if (["NftLocked", "NonfungibleLocked"].includes(method)) {
    const [collection, item, sender, receiver] = data;
    newAppchainToNearTransfer.senderId = sender.toString();
    newAppchainToNearTransfer.receiver = Buffer.from(receiver.toHex().replace("0x", ""), "hex").toString("utf8");
    newAppchainToNearTransfer.type = "NonfungibleLocked";
    newAppchainToNearTransfer.collection = BigInt(collection.toString().replaceAll(',', ''));
    newAppchainToNearTransfer.item = BigInt(item.toString().replaceAll(',', ''));
    newAppchainToNearTransfer.fee = BigInt(fee.replaceAll(',', ''));
  }
  newAppchainToNearTransfer.timestamp = block.timestamp;
  newAppchainToNearTransfer.extrinsicId = extrinsicId;
  newAppchainToNearTransfer.save();
}

export function handleAppchainToNearAccount(
  event: Event,
): { senderId: undefined | string } {
  const { method, data } = event;
  let appchainToNearAccount = { senderId: undefined };
  if (["Locked"].includes(method)) {
    const [sender] = data;
    appchainToNearAccount.senderId = sender.toString();
  } else if (["AssetBurned", "Nep141Burned"].includes(method)) {
    const [assetId, sender] = data;
    appchainToNearAccount.senderId = sender.toString();
  } else if (["NftLocked", "NonfungibleLocked"].includes(method)) {
    const [collection, item, sender] = data;
    appchainToNearAccount.senderId = sender.toString();
  }
  return appchainToNearAccount;
}


export function handleNearToAppchainTransfer(
  block: SubstrateBlock,
  extrinsic: SubstrateExtrinsic,
  event: Event,
  extrinsicId: string,
  idx: number,
): NearToAppchainTransfer {
  const { method, data } = event;

  const { sequence }: any = data.toHuman();
  const sequenceStr = sequence.toString().replaceAll(',', '');
  let newNearToAppchainTransfer = new NearToAppchainTransfer(sequenceStr);
  newNearToAppchainTransfer.sequence = Number(sequenceStr);
  if (["Unlocked", "UnlockFailed"].includes(method)) {
    const [sender, receiver, amount] = data;
    newNearToAppchainTransfer.sender = Buffer.from(sender.toHex().replace("0x", ""), "hex").toString("utf8");
    newNearToAppchainTransfer.receiverId = receiver.toString();
    newNearToAppchainTransfer.type = method;
    newNearToAppchainTransfer.amount = BigInt(amount.toString().replaceAll(',', ''));
  } else if ([
    "AssetMinted",
    "Nep141Minted",
    "AssetMintFailed",
    "MintNep141Failed",
  ].includes(method)) {
    const [assetId, sender, receiver, amount] = data;
    newNearToAppchainTransfer.sender = Buffer.from(sender.toHex().replace("0x", ""), "hex").toString("utf8");
    newNearToAppchainTransfer.receiverId = receiver.toString();
    newNearToAppchainTransfer.type = method;
    newNearToAppchainTransfer.assetId = Number(assetId.toString().replaceAll(',', ''));
    newNearToAppchainTransfer.amount = BigInt(amount.toString().replaceAll(',', ''));
  } else if ([
    "NftUnlocked",
    "NonfungibleUnlocked",
    "NftUnlockFailed",
    "UnlockNonfungibleFailed",
  ].includes(method)) {
    const [collection, item, sender, receiver, sequence] = data;
    newNearToAppchainTransfer.sender = Buffer.from(sender.toHex().replace("0x", ""), "hex").toString("utf8");
    newNearToAppchainTransfer.receiverId = receiver.toString();
    newNearToAppchainTransfer.type = method;
    newNearToAppchainTransfer.collection = BigInt(collection.toString().replaceAll(',', ''));
    newNearToAppchainTransfer.item = BigInt(item.toString().replaceAll(',', ''));
  }
  newNearToAppchainTransfer.timestamp = block.timestamp;
  newNearToAppchainTransfer.extrinsicId = extrinsicId;
  return newNearToAppchainTransfer;
}