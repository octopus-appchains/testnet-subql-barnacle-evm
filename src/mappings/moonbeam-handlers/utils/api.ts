import { Bytes } from '@polkadot/types';
import { Balance } from '@polkadot/types/interfaces'
import { AccountType } from './types';

export async function getAccount(address: string): Promise<AccountType> {
  const account: unknown = await api.query.system.account(address)
  return account as AccountType
}

export async function getAccountCode(address: string) {
  const code: Bytes = await api.rpc.eth.getCode(address)
  return code;
}

export async function getIssuannce() {
  const issuance = await api.query.balances.totalIssuance();
  return issuance
}

export async function getContractInfo(address: string) {
  return await api.query.system.account(address)
}

