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
  const { fromId, toId, txHash, exitReason, argsObj: { eip1559, legacy, eip2930 } } = ethTransactData;
  const transaction = new Transaction(txHash);
  transaction.fromId = fromId
  transaction.toId = toId
  transaction.isSuccess = extrinsic.isSuccess && !!exitReason.succeed;
  transaction.exitReason = JSON.stringify(exitReason);
  transaction.timestamp = extrinsic.timestamp
  transaction.blockId = extrinsic.blockId;
  transaction.extrinsicId = extrinsic.id;

  if (eip1559) {
    transaction.type = "eip1559"
    transaction.signature = eip1559.signature?.toString()
    transaction.value = BigInt(eip1559.value)
    transaction.nonce = eip1559.nonce
    transaction.gasLimit = BigInt(eip1559.gasLimit)
    transaction.maxFeePerGas = BigInt(eip1559.maxFeePerGas)
    transaction.maxPriorityFeePerGas = BigInt(eip1559.maxPriorityFeePerGas)
    transaction.gasUsed = extrinsicSuccessDispatchInfo ? bigIntMin(transaction.maxFeePerGas, baseFee + transaction.maxPriorityFeePerGas) * humanNumberToBigInt(extrinsicSuccessDispatchInfo.weight) / BigInt(25000) : BigInt(0);
    transaction.accessList = eip1559.accessList.toString();
    transaction.inputData = eip1559.input;
  } else if (legacy) {
    transaction.type = "legacy"
    transaction.signature = legacy.signature?.toString()
    transaction.value = BigInt(legacy.value)
    transaction.nonce = Number(legacy.nonce)
    transaction.gasLimit = BigInt(legacy.gasLimit)
    transaction.gasPrice = BigInt(legacy.gasPrice)
    transaction.gasUsed = extrinsicSuccessDispatchInfo ? transaction.gasPrice * humanNumberToBigInt(extrinsicSuccessDispatchInfo.weight) / BigInt(25000) : BigInt(0)
    transaction.inputData = legacy.input;
  } else if (eip2930) {
    transaction.type = "eip2930"
    transaction.signature = eip2930.signature?.toString()
    transaction.value = BigInt(eip2930.value)
    transaction.nonce = Number(eip2930.nonce)
    transaction.gasLimit = BigInt(eip2930.gasLimit)
    transaction.gasPrice = BigInt(eip2930.gasPrice)
    transaction.gasUsed = extrinsicSuccessDispatchInfo ? transaction.gasPrice * humanNumberToBigInt(extrinsicSuccessDispatchInfo.weight) / BigInt(25000) : BigInt(0)
    transaction.accessList = eip2930.accessList.toString();
    transaction.inputData = eip2930.input;
  }

  return transaction;
}
