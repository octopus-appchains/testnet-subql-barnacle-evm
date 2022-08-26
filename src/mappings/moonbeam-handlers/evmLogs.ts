import { SubstrateBlock } from "@subql/types";
import { EvmLog } from "../../types";
import { EventRecord } from "@polkadot/types/interfaces";

export function handleEvmLogs(
  block: SubstrateBlock,
  logEvts: EventRecord[],
  ethTransactData: any,
  startEvtIdx: number,
): EvmLog[] {
  return logEvts.map((evt, idx) => {
    const { event: { data: [log] } } = evt;
    const { address, topics, data } = log.toJSON() as any;
    let newEvmLog = new EvmLog(`${block.block.header.number.toString()}-${startEvtIdx + idx}`);
    newEvmLog.transactionId = ethTransactData.txHash;
    newEvmLog.logIndex = startEvtIdx + idx;
    newEvmLog.contractId = address.toLocaleLowerCase();
    newEvmLog.data = data;
    newEvmLog.topics = topics;
    newEvmLog.timestamp = block.timestamp;
    return newEvmLog;
  });
}
