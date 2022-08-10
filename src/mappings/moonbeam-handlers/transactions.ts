import { Extrinsic, Transaction } from "../../types";
import { humanNumberToBigInt, bigIntMin } from "../utils";

let baseFee: bigint | null = null;

export function setBaseFeeSync(fee: bigint) {
  baseFee = fee;
}

export function handleTransaction(
  extrinsic: Extrinsic,
  ethTransactData: any,
  extrinsicSuccessDispatchInfo: any
): Transaction {
  const { fromId, toId, txHash, exitReason, argsObj: { eip1559 } } = ethTransactData;

  const transaction = new Transaction(txHash);
  transaction.fromId = fromId
  transaction.toId = toId
  transaction.isSuccess = extrinsic.isSuccess && !!exitReason.succeed;
  transaction.value = BigInt(eip1559.value)
  transaction.nonce = eip1559.nonce
  transaction.gasLimit = BigInt(eip1559.gasLimit)
  transaction.maxFeePerGas = BigInt(eip1559.maxFeePerGas)
  transaction.maxPriorityFeePerGas = BigInt(eip1559.maxPriorityFeePerGas)
  transaction.gasUsed = extrinsicSuccessDispatchInfo ? bigIntMin(transaction.maxFeePerGas, baseFee + transaction.maxPriorityFeePerGas) * humanNumberToBigInt(extrinsicSuccessDispatchInfo.weight) / BigInt(25000) : BigInt(0);
  transaction.inputData = eip1559.input;
  transaction.exitReason = JSON.stringify(exitReason);
  transaction.timestamp = extrinsic.timestamp
  transaction.blockId = extrinsic.blockId;
  transaction.extrinsicId = extrinsic.id;

  return transaction;
}
