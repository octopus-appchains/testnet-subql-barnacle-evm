
import {
  Sopometa721nftApproval,
  Sopometa721nftApprovalForAll,
  Sopometa721nftTransfer,
  SopometaMarketApprovalForAll,
  SopometaMarketTransferBatch,
  SopometaMarketTransferSingle,
  SopometaMarketURI
} from "../../types";
import { BigNumber } from "ethers";
import { FrontierEvmEvent, FrontierEvmCall } from '@subql/contract-processors/dist/frontierEvm';

// Setup types from ABI
type Sopometa721nftApprovalArgs = [string, string, BigNumber] & { owner: string; approved: string; tokenId: BigNumber; };
export async function handleSopometa721nftApproval(event: FrontierEvmEvent<Sopometa721nftApprovalArgs>): Promise<void> {
  logger.info("handleSopometa721nftApproval/////");
  const data = new Sopometa721nftApproval(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.owner = event.args.owner;
  data.approved = event.args.approved;
  data.tokenId = event.args.tokenId.toBigInt();

  await data.save();
}


type Sopometa721nftApprovalForAllArgs = [string, string, boolean] & { owner: string; operator: string; approved: boolean; };
export async function handleSopometa721nftApprovalForAll(event: FrontierEvmEvent<Sopometa721nftApprovalForAllArgs>): Promise<void> {
  logger.info("handleSopometa721nftApprovalForAll/////");
  const data = new Sopometa721nftApprovalForAll(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.owner = event.args.owner;
  data.operator = event.args.operator;
  data.approved = event.args.approved;

  await data.save();
}


type Sopometa721nftTransferArgs = [string, string, BigNumber] & { from: string; to: string; tokenId: BigNumber; };
export async function handleSopometa721nftTransfer(event: FrontierEvmEvent<Sopometa721nftTransferArgs>): Promise<void> {
  logger.info("handleSopometa721nftTransfer/////");
  const data = new Sopometa721nftTransfer(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.from = event.args.from;
  data.to = event.args.to;
  data.tokenId = event.args.tokenId.toBigInt();

  await data.save();
}

type SopometaMarketApprovalForAllArgs = [string, string, boolean] & { account: string; operator: string; approved: boolean; };
export async function handleSopometaMarketApprovalForAll(event: FrontierEvmEvent<SopometaMarketApprovalForAllArgs>): Promise<void> {
  logger.info("handleSopometaMarketApprovalForAll/////");
  const id = (event.transactionHash + "-" + event.logIndex) + "";
  const data = new SopometaMarketApprovalForAll(id);

  data.contractAddress = event.address;

  data.account = event.args.account;
  data.operator = event.args.operator;
  data.approved = event.args.approved;

  await data.save();
}


type SopometaMarketTransferBatchArgs = [string, string, string, BigNumber[], BigNumber[]] & { operator: string; from: string; to: string; ids: BigNumber[]; values: BigNumber[]; };
export async function handleSopometaMarketTransferBatch(event: FrontierEvmEvent<SopometaMarketTransferBatchArgs>): Promise<void> {
  logger.info("handleSopometaMarketTransferBatch/////");
  const id = (event.transactionHash + "-" + event.logIndex) + "";
  const data = new SopometaMarketTransferBatch(id);

  data.contractAddress = event.address;

  data.operator = event.args.operator;
  data.from = event.args.from;
  data.to = event.args.to;
  data.ids = event.args.ids.map(n => n.toBigInt());
  data.values = event.args.values.map(n => n.toBigInt());

  await data.save();
}


type SopometaMarketTransferSingleArgs = [string, string, string, BigNumber, BigNumber] & { operator: string; from: string; to: string; id: BigNumber; value: BigNumber; };
export async function handleSopometaMarketTransferSingle(event: FrontierEvmEvent<SopometaMarketTransferSingleArgs>): Promise<void> {
  logger.info("handleSopometaMarketTransferSingle/////");
  const id = (event.args?.id) + "";
  const data = new SopometaMarketTransferSingle(id);

  data.contractAddress = event.address;

  data.operator = event.args.operator;
  data.from = event.args.from;
  data.to = event.args.to;
  data.value = event.args.value.toBigInt();

  await data.save();
}


type SopometaMarketURIArgs = [string, BigNumber] & { value: string; id: BigNumber; };
export async function handleSopometaMarketURI(event: FrontierEvmEvent<SopometaMarketURIArgs>): Promise<void> {
  logger.info("handleSopometaMarketURI/////");
  const id = (event.args?.id) + "";
  const data = new SopometaMarketURI(id);

  data.contractAddress = event.address;

  data.value = event.args.value;

  await data.save();
}