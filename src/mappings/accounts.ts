import { Account } from "../types";
import { isEqual } from "lodash";
import { getAccount, getAccountCode } from './moonbeam-handlers/utils/api';

export async function handleAccount({ accountId, createdAt, creatorId }:
  { accountId: string, createdAt: Date, creatorId?: string }): Promise<Account> {
  const address = accountId.toLowerCase();
  const {
    nonce,
    data: {
      free,
      reserved,
      miscFrozen,
      feeFrozen
    }
  } = await getAccount(address)
  const acccoutCode = await getAccountCode(address);
  return Account.create({
    id: address,
    nonce: Number(nonce.toString()),
    freeBalance: free.toBigInt(),
    reservedBalance: reserved.toBigInt(),
    miscFrozenBalance: miscFrozen.toBigInt(),
    feeFrozenBalance: feeFrozen.toBigInt(),
    createdAt,
    isContract: acccoutCode.length > 0,
    creatorId: acccoutCode.length > 0 ? creatorId : null
  });
}

export async function tryUpdateAccount(account: Account) {
  const prevAccount = { ...account };
  const {
    nonce,
    data: {
      free,
      reserved,
      miscFrozen,
      feeFrozen
    }
  } = await getAccount(account.id);
  account.nonce = nonce;
  account.freeBalance = free.toBigInt()
  account.reservedBalance = reserved.toBigInt()
  account.miscFrozenBalance = miscFrozen.toBigInt()
  account.feeFrozenBalance = feeFrozen.toBigInt()

  if (!isEqual(prevAccount, account)) {
    account.save();
  }
}
