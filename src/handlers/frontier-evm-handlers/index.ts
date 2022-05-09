
import { Erc20Approval, Erc20Transaction, SopometaForsell, SopometaListandforsell, SopometaListed, SopometaNewoffer, SopometaSelled, SopometaWithdraw } from "../../types";
import { BigNumber } from "ethers";
import { FrontierEvmEvent, FrontierEvmCall } from '@subql/contract-processors/dist/frontierEvm';

// Setup types from ABI
type TransferEventArgs = [string, string, BigNumber] & { from: string; to: string; value: BigNumber; };
type ApproveEventArgs = [string, string, BigNumber] & { owner: string; spender: string; value: BigNumber; }

export async function handleErc20Transaction(event: FrontierEvmEvent<TransferEventArgs>): Promise<void> {
  console.error("event", event);
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

type SopometaForsellArgs = [BigNumber, BigNumber] & { sopo_id: BigNumber; price: BigNumber; };
export async function handleSopometaForsell(event: FrontierEvmEvent<SopometaForsellArgs>): Promise<void> {
  const data = new SopometaForsell(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.sopo_id = event.args.sopo_id.toBigInt();
  data.price = event.args.price.toBigInt();

  await data.save();
}


type SopometaListandforsellArgs = [string, string, BigNumber, BigNumber, string, BigNumber] & { from: string; to: string; sopo_id: BigNumber; nft_id: BigNumber; nft_programe_address: string; price: BigNumber; };
export async function handleSopometaListandforsell(event: FrontierEvmEvent<SopometaListandforsellArgs>): Promise<void> {
  const data = new SopometaListandforsell(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.from = event.args.from;
  data.to = event.args.to;
  data.sopo_id = event.args.sopo_id.toBigInt();
  data.nft_id = event.args.nft_id.toBigInt();
  data.nft_programe_address = event.args.nft_programe_address;
  data.price = event.args.price.toBigInt();

  await data.save();
}


type SopometaListedArgs = [string, string, BigNumber, BigNumber, string] & { from: string; to: string; sopo_id: BigNumber; nft_id: BigNumber; nft_programe_address: string; };
export async function handleSopometaListed(event: FrontierEvmEvent<SopometaListedArgs>): Promise<void> {
  const data = new SopometaListed(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.from = event.args.from;
  data.to = event.args.to;
  data.sopo_id = event.args.sopo_id.toBigInt();
  data.nft_id = event.args.nft_id.toBigInt();
  data.nft_programe_address = event.args.nft_programe_address;

  await data.save();
}


type SopometaNewofferArgs = [string, string, BigNumber, BigNumber] & { from: string; to: string; sopo_id: BigNumber; price: BigNumber; };
export async function handleSopometaNewoffer(event: FrontierEvmEvent<SopometaNewofferArgs>): Promise<void> {
  const data = new SopometaNewoffer(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.from = event.args.from;
  data.to = event.args.to;
  data.sopo_id = event.args.sopo_id.toBigInt();
  data.price = event.args.price.toBigInt();

  await data.save();
}


type SopometaSelledArgs = [string, string, BigNumber, number, BigNumber, string, string] & { from: string; to: string; sopo_id: BigNumber; selled_at: number; nft_id: BigNumber; nft_programe_address: string; owner: string; };
export async function handleSopometaSelled(event: FrontierEvmEvent<SopometaSelledArgs>): Promise<void> {
  const data = new SopometaSelled(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.from = event.args.from;
  data.to = event.args.to;
  data.sopo_id = event.args.sopo_id.toBigInt();
  data.selled_at = event.args.selled_at;
  data.nft_id = event.args.nft_id.toBigInt();
  data.nft_programe_address = event.args.nft_programe_address;
  data.owner = event.args.owner;

  await data.save();
}


type SopometaWithdrawArgs = [string, string, BigNumber, BigNumber, string, number] & { from: string; to: string; sopo_id: BigNumber; nft_id: BigNumber; nft_programe_address: string; withdrawout_at: number; };
export async function handleSopometaWithdraw(event: FrontierEvmEvent<SopometaWithdrawArgs>): Promise<void> {
  const data = new SopometaWithdraw(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.from = event.args.from;
  data.to = event.args.to;
  data.sopo_id = event.args.sopo_id.toBigInt();
  data.nft_id = event.args.nft_id.toBigInt();
  data.nft_programe_address = event.args.nft_programe_address;
  data.withdrawout_at = event.args.withdrawout_at;

  await data.save();
}