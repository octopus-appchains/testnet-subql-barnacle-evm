
import { BigNumber } from "ethers";
import { FrontierEvmEvent, FrontierEvmCall } from '@subql/contract-processors/dist/frontierEvm';
const util = require('util');
import {
  GameItemsApproveCall,
  GameItemsDevClaimCall,
  GameItemsRenounceOwnershipCall,
  GameItemsSafeTransferFromCall,
  GameItemsSetApprovalForAllCall,
  GameItemsSetKeyCall,
  GameItemsTransferFromCall,
  GameItemsSetBaseURICall,
  GameItemsSetNameAndSymbolCall,
  GameItemsTransferLowerOwnershipCall,
  GameItemsTransferOwnershipCall,
  GameItemsTransferRealOwnershipCall,
  GameItemsUpdateMetadataCall,
  GameItemsApprovalEvent,
  GameItemsApprovalForAllEvent,
  GameItemsOwnershipTransferredEvent,
  GameItemsTransferEvent
} from "../../types"

type GameItemsApproveCallArgs = [string, BigNumber] & { to: string; tokenId: BigNumber; };
export async function handleGameItemsApproveCall(event: FrontierEvmCall<GameItemsApproveCallArgs>): Promise<void> {
  const data = new GameItemsApproveCall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  data.to = event.args.to;
  data.tokenId = event.args.tokenId.toBigInt();
  data.success = event.success

  await data.save();
}

type GameItemsDevClaimCallArgs = [string, BigNumber, string[]] & { to: string; quantity: BigNumber; ipfsHash: string[]; };
export async function handleGameItemsDevClaimCall(event: FrontierEvmCall<GameItemsDevClaimCallArgs>): Promise<void> {
  const data = new GameItemsDevClaimCall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  data.to = event.args.to;
  data.quantity = event.args.quantity.toBigInt();
  data.ipfsHash = event.args.ipfsHash;
  data.success = event.success

  await data.save();
}


export async function handleGameItemsRenounceOwnershipCall(event: FrontierEvmCall): Promise<void> {
  const data = new GameItemsRenounceOwnershipCall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;


  data.success = event.success

  await data.save();
}

type GameItemsSafeTransferFromCallArgs = [string, string, BigNumber, string] & { from: string; to: string; tokenId: BigNumber; _data: string; };
export async function handleGameItemsSafeTransferFromCall(event: FrontierEvmCall<GameItemsSafeTransferFromCallArgs>): Promise<void> {
  const data = new GameItemsSafeTransferFromCall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  data.from = event.args.from;
  data.to = event.args.to;
  data.tokenId = event.args.tokenId.toBigInt();
  data._data = event.args._data;
  data.success = event.success

  await data.save();
}

type GameItemsSetApprovalForAllCallArgs = [string, boolean] & { operator: string; approved: boolean; };
export async function handleGameItemsSetApprovalForAllCall(event: FrontierEvmCall<GameItemsSetApprovalForAllCallArgs>): Promise<void> {
  const data = new GameItemsSetApprovalForAllCall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  data.operator = event.args.operator;
  data.approved = event.args.approved;
  data.success = event.success

  await data.save();
}

type GameItemsSetKeyCallArgs = [string] & { signer: string; };
export async function handleGameItemsSetKeyCall(event: FrontierEvmCall<GameItemsSetKeyCallArgs>): Promise<void> {
  const data = new GameItemsSetKeyCall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  data.signer = event.args.signer;
  data.success = event.success

  await data.save();
}

type GameItemsTransferFromCallArgs = [string, string, BigNumber] & { from: string; to: string; tokenId: BigNumber; };
export async function handleGameItemsTransferFromCall(event: FrontierEvmCall<GameItemsTransferFromCallArgs>): Promise<void> {
  const data = new GameItemsTransferFromCall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  data.from = event.args.from;
  data.to = event.args.to;
  data.tokenId = event.args.tokenId.toBigInt();
  data.success = event.success

  await data.save();
}

type GameItemsSetBaseURICallArgs = [string] & { baseURI: string; };
export async function handleGameItemsSetBaseURICall(event: FrontierEvmCall<GameItemsSetBaseURICallArgs>): Promise<void> {
  const data = new GameItemsSetBaseURICall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  data.baseURI = event.args.baseURI;
  data.success = event.success

  await data.save();
}

type GameItemsSetNameAndSymbolCallArgs = [string, string] & { _newName: string; _newSymbol: string; };
export async function handleGameItemsSetNameAndSymbolCall(event: FrontierEvmCall<GameItemsSetNameAndSymbolCallArgs>): Promise<void> {
  const data = new GameItemsSetNameAndSymbolCall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  data._newName = event.args._newName;
  data._newSymbol = event.args._newSymbol;
  data.success = event.success

  await data.save();
}

type GameItemsTransferLowerOwnershipCallArgs = [string] & { newOwner: string; };
export async function handleGameItemsTransferLowerOwnershipCall(event: FrontierEvmCall<GameItemsTransferLowerOwnershipCallArgs>): Promise<void> {
  const data = new GameItemsTransferLowerOwnershipCall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  data.newOwner = event.args.newOwner;
  data.success = event.success

  await data.save();
}

type GameItemsTransferOwnershipCallArgs = [string] & { newOwner: string; };
export async function handleGameItemsTransferOwnershipCall(event: FrontierEvmCall<GameItemsTransferOwnershipCallArgs>): Promise<void> {
  const data = new GameItemsTransferOwnershipCall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  data.newOwner = event.args.newOwner;
  data.success = event.success

  await data.save();
}

type GameItemsTransferRealOwnershipCallArgs = [string] & { newRealOwner: string; };
export async function handleGameItemsTransferRealOwnershipCall(event: FrontierEvmCall<GameItemsTransferRealOwnershipCallArgs>): Promise<void> {
  const data = new GameItemsTransferRealOwnershipCall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  data.newRealOwner = event.args.newRealOwner;
  data.success = event.success

  await data.save();
}

type GameItemsUpdateMetadataCallArgs = [BigNumber, string, string] & { tokenId: BigNumber; ipfsHash: string; signature: string; };
export async function handleGameItemsUpdateMetadataCall(event: FrontierEvmCall<GameItemsUpdateMetadataCallArgs>): Promise<void> {
  const data = new GameItemsUpdateMetadataCall(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  data.tokenId = event.args.tokenId.toBigInt();
  data.ipfsHash = event.args.ipfsHash;
  data.signature = event.args.signature;
  data.success = event.success

  await data.save();
}

type GameItemsApprovalEventArgs = [string, string, BigNumber] & { owner: string; approved: string; tokenId: BigNumber; };
export async function handleGameItemsApprovalEvent(event: FrontierEvmEvent<GameItemsApprovalEventArgs>): Promise<void> {
  const data = new GameItemsApprovalEvent(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.owner = event.args.owner;
  data.approved = event.args.approved;
  data.tokenId = event.args.tokenId.toBigInt();

  await data.save();
}

type GameItemsApprovalForAllEventArgs = [string, string, boolean] & { owner: string; operator: string; approved: boolean; };
export async function handleGameItemsApprovalForAllEvent(event: FrontierEvmEvent<GameItemsApprovalForAllEventArgs>): Promise<void> {
  const data = new GameItemsApprovalForAllEvent(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.owner = event.args.owner;
  data.operator = event.args.operator;
  data.approved = event.args.approved;

  await data.save();
}

type GameItemsOwnershipTransferredEventArgs = [string, string] & { previousOwner: string; newOwner: string; };
export async function handleGameItemsOwnershipTransferredEvent(event: FrontierEvmEvent<GameItemsOwnershipTransferredEventArgs>): Promise<void> {
  const data = new GameItemsOwnershipTransferredEvent(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.previousOwner = event.args.previousOwner;
  data.newOwner = event.args.newOwner;

  await data.save();
}

type GameItemsTransferEventArgs = [string, string, BigNumber] & { from: string; to: string; tokenId: BigNumber; };
export async function handleGameItemsTransferEvent(event: FrontierEvmEvent<GameItemsTransferEventArgs>): Promise<void> {
  const data = new GameItemsTransferEvent(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  data.from = event.args.from;
  data.to = event.args.to;
  data.tokenId = event.args.tokenId.toBigInt();

  await data.save();
}