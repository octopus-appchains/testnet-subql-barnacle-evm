import type { Vec, u32 } from '@polkadot/types'
import { DispatchError } from "@polkadot/types/interfaces";
import { SubstrateExtrinsic } from "@subql/types";
import { Extrinsic, Call } from "../types";
import { AnyCall } from './types'
import { IEvent } from '@polkadot/types/types'
import _ from "lodash";

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

export function handleCalls(
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

    newCall.signerId = substrateExtrinsic.extrinsic.signer.toString().toLowerCase();

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
