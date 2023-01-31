
import { Erc20__factory } from '../typechain/output';
import { Erc721__factory } from '../typechain/output';
import { Erc1155__factory } from '../typechain/output';
import { FrontierEthProvider } from '@subql/frontier-evm-processor';
import { jsonLog } from "../../utils/utils";

export async function getErc20Info(contractId: string) {
  const contract = Erc20__factory.connect(
    contractId,
    new FrontierEthProvider()
  );
  const name = await contract.name();
  const symbol = await contract.symbol();
  const decimals = await contract.decimals();
  const totalSupply = await contract.totalSupply();
  return {
    name,
    symbol,
    decimals,
    totalSupply
  };
}

export async function getErc721Info(contractId: string) {
  const contract = Erc721__factory.connect(
    contractId,
    new FrontierEthProvider()
  );
  const name = await contract.name();
  const symbol = await contract.symbol();
  return {
    name,
    symbol
  };
}

export async function getErc721TokenInfo(contractId: string, tokenId: BigInt) {
  const contract = Erc721__factory.connect(
    contractId,
    new FrontierEthProvider()
  );
  const tokenURI = await contract.tokenURI(tokenId.toString());
  return {
    tokenURI
  };
}


export async function getErc1155TokenInfo(contractId: string, tokenId: BigInt) {
  const contract = Erc1155__factory.connect(
    contractId,
    new FrontierEthProvider()
  );
  const uri = await contract.uri(tokenId.toString());
  return {
    uri
  }
}
