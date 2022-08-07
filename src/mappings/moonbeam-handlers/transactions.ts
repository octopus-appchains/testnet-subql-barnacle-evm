import { Extrinsic, Transaction } from "../../types";
import { humanNumberToBigInt } from "../utils";

export function handleTransaction(
  extrinsic: Extrinsic,
  ethTransactData: any,
  extrinsicSuccessDispatchInfo: any
): Transaction {
  const { fromId, toId, txHash, exitReason, argsObj: { eip1559 } } = ethTransactData;
  const transaction = new Transaction(txHash);

  transaction.fromId = fromId
  transaction.toId = toId
  transaction.isSuccess = extrinsic.isSuccess && exitReason.Succeed;
  transaction.value = BigInt(eip1559.value)
  transaction.nonce = eip1559.nonce
  transaction.gasLimit = BigInt(eip1559.gasLimit)
  transaction.maxFeePerGas = BigInt(eip1559.maxFeePerGas)
  transaction.maxPriorityFeePerGas = BigInt(eip1559.maxPriorityFeePerGas)
  transaction.gasUsed = extrinsicSuccessDispatchInfo ? transaction.maxFeePerGas * humanNumberToBigInt(extrinsicSuccessDispatchInfo.weight) / BigInt(25000) : BigInt(0);
  transaction.inputData = eip1559.input;
  transaction.timestamp = extrinsic.timestamp
  transaction.blockId = extrinsic.blockId;
  transaction.extrinsicId = extrinsic.id;

  return transaction;
}
