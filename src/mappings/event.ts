import { EventRecord } from "@polkadot/types/interfaces";
import { SubstrateExtrinsic, SubstrateBlock } from "@subql/types";
import { WrappedExtrinsic } from "./types";
import { Event } from "../types";
import _ from "lodash";


export function handleEvent(
  block: SubstrateBlock,
  extrinsic: WrappedExtrinsic,
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