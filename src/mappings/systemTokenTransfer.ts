import { EventRecord } from "@polkadot/types/interfaces";
import { AccountId, Balance } from '@polkadot/types/interfaces/runtime';
import { SubstrateExtrinsic, SubstrateBlock } from "@subql/types";
import { SystemTokenTransfer } from "../types";
import _ from "lodash";

export function handleSystemTokenTransfer(
  block: SubstrateBlock,
  extrinsic: SubstrateExtrinsic,
  event: EventRecord,
  extrinsicId: string,
  idx: number,
): SystemTokenTransfer {
  const { event: { data: [from_origin, to_origin, amount_origin] } } = event;
  const from = (from_origin as AccountId).toString().toLowerCase();
  const to = (to_origin as AccountId).toString().toLowerCase();
  const amount = (amount_origin as Balance).toBigInt();

  let newSystemTokenTransfer = new SystemTokenTransfer(`${block.block.header.number.toString()}-${idx}`);
  newSystemTokenTransfer.fromId = from;
  newSystemTokenTransfer.toId = to;
  newSystemTokenTransfer.amount = amount;
  newSystemTokenTransfer.timestamp = block.timestamp;
  newSystemTokenTransfer.extrinsicId = extrinsicId;

  return newSystemTokenTransfer;
}