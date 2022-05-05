
import { Erc20Approval, Erc20Transaction, EvmCall, EvmEvent } from "../../types";
import { BigNumber } from "ethers";
import { FrontierEvmEvent, FrontierEvmCall } from '@subql/contract-processors/dist/frontierEvm';

// Setup types from ABI
type TransferEventArgs = [string, string, BigNumber] & { from: string; to: string; value: BigNumber; };
type ApproveEventArgs = [string, string, BigNumber] & { owner: string; spender: string; value: BigNumber; }

export async function handleErc20Transaction(event: FrontierEvmEvent<TransferEventArgs>): Promise<void> {
  const erc20Transaction = new Erc20Transaction(`${event.transactionHash}-${event.logIndex}`);

  erc20Transaction.value = event.args.value.toBigInt();
  erc20Transaction.from = event.args.from;
  erc20Transaction.to = event.args.to;
  erc20Transaction.contractAddress = event.address;

  await erc20Transaction.save();
}

export async function handleErc20Approval(event: FrontierEvmEvent<ApproveEventArgs>): Promise<void> {
  const erc20Approval = new Erc20Approval(`${event.transactionHash}-${event.logIndex}`);

  erc20Approval.value = event.args.value.toBigInt();
  erc20Approval.owner = event.args.owner;
  erc20Approval.spender = event.args.spender;
  erc20Approval.contractAddress = event.address;

  await erc20Approval.save();
}

export async function handleEvmCall(call: FrontierEvmCall): Promise<void> {
  const evmCall = new EvmCall(call.hash);

  evmCall.from = call.from;
  evmCall.to = call.to;
  evmCall.args = JSON.stringify(call.args);
  evmCall.raw = call.raw;
  evmCall.type = call.type;
  evmCall.isSuccess = call.success;

  await evmCall.save();
}

export async function handleEvmEvent(event: FrontierEvmEvent): Promise<void> {
  const evmEvent = new EvmEvent(`${event.transactionHash}-${event.logIndex}`);
  evmEvent.address = event.address;
  evmEvent.data = event.data;
  evmEvent.args = JSON.stringify(event.args);
  evmEvent.topics = event.topics;
  evmEvent.index = event.logIndex;
  await evmEvent.save();
}
