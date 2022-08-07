import { SubstrateEvent, SubstrateExtrinsic } from "@subql/types"
import { MoonbeamEvent } from "@subql/contract-processors/dist/moonbeam"
import { Balance } from '@polkadot/types/interfaces'
import type { CallBase, AnyTuple } from '@polkadot/types/types'

// Type construct is not correct
export type AccountType = {
  nonce: number
  consumers: number
  providers: number
  sufficients: number
  data: {
    free: Balance
    reserved: Balance
    miscFrozen: Balance
    feeFrozen: Balance
  }
}

export type CreatorIdMap = { [key: string]: null | string }