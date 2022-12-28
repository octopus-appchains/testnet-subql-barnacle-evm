import { EventRecord } from "@polkadot/types/interfaces";
import { SubstrateBlock } from "@subql/types";
import { UpwardMessage } from "../types";
import _ from "lodash";

export function handleUpwardMessages(
  block: SubstrateBlock,
  event: EventRecord,
): UpwardMessage[] {
  const { event: { data } } = event;
  const humanData: any = data.toHuman();
  return humanData.data.map(({ nonce, payloadType, payload }: any) => {
    const newUpwardMessage = new UpwardMessage(nonce.replaceAll(',', ''));
    newUpwardMessage.sequence = Number(nonce.replaceAll(',', ''));
    newUpwardMessage.payloadType = payloadType.toString();
    newUpwardMessage.payload = payload.toString();

    newUpwardMessage.timestamp = block.timestamp;
    newUpwardMessage.blockId = block.block.header.hash.toString();

    return newUpwardMessage;
  })
}