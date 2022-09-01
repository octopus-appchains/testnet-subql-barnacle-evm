
import { SubstrateExtrinsic, SubstrateBlock } from "@subql/types";
import type { CallBase, AnyTuple } from '@polkadot/types/types'
import { Extrinsic, EventRecord, SignedBlock } from '@polkadot/types/interfaces';

export type AnyCall = CallBase<any>

export interface WrappedExtrinsic {
  idx: number;
  extrinsic: Extrinsic;
  block: SubstrateBlock;
  events: EventRecord[];
  success: boolean;
}
