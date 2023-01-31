import { SubstrateBlock } from "@subql/types";
import {
  EvmLog,
  Account,

  Erc20TokenContract,
  Erc20Transfer,
  Erc20Balance,

  Erc721TokenContract,
  Erc721Token,
  Erc721Transfer,
  Erc721Balance,

  Erc1155TokenContract,
  Erc1155Token,
  Erc1155Transfer,
  Erc1155Balance,
} from "../../types";
import { jsonLog } from "../utils/utils";
import { erc20Abi } from "./abi/erc20";
import {
  getErc20Info,
  getErc721Info,
  getErc721TokenInfo,
  getErc1155TokenInfo,
} from "./utils/web3";

// import { AbiDecoder } from "./utils/abi-decoder";
// import uniqBy from "lodash";

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

const TransferHex = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const TransferSingleHex = "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";
const TransferBatchHex = "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb";
// const erc20Decoder = new AbiDecoder(erc20Abi);

// function logDataToObj(data: any[]): any {
//   const obj = {};
//   data.forEach(e => {
//     if (e.type === "uint256") {
//       obj[e.name] = BigInt(e.value);
//     } else {
//       obj[e.name] = e.value;
//     }
//   });
//   return obj;
// }

export async function handleTokenTransfers(evmLogs: EvmLog[], transactionId: string, timestamp: Date): Promise<{
  accountIds: string[],
  newErc20Transfers: Erc20Transfer[],
  newErc20Balances: Erc20Balance[],
  existsErc20Balances: Erc20Balance[],
  newErc20TokenContracts: Erc20TokenContract[],
  existsErc20TokenContracts: Erc20TokenContract[],

  newErc721Transfers: Erc721Transfer[],
  newErc721Balances: Erc721Balance[],
  existsErc721Balances: Erc721Balance[],
  newErc721TokenContracts: Erc721TokenContract[],
  newErc721Tokens: Erc721Token[],

  newErc1155Transfers: Erc1155Transfer[],
  newErc1155Balances: Erc1155Balance[],
  existsErc1155Balances: Erc1155Balance[],
  newErc1155TokenContracts: Erc1155TokenContract[],
  newErc1155Tokens: Erc1155Token[],
  existsErc1155Tokens: Erc1155Token[],
}> {
  const accountIds = [];

  const newErc20Transfers = [];
  const newErc20Balances = [];
  const existsErc20Balances = [];
  const newErc20TokenContracts = [];
  const existsErc20TokenContracts = [];

  const newErc721Transfers = [];
  const newErc721Balances = [];
  const existsErc721Balances = [];
  const newErc721TokenContracts = [];
  const newErc721Tokens = [];

  const newErc1155Transfers = [];
  const newErc1155Balances = [];
  const existsErc1155Balances = [];
  const newErc1155TokenContracts = [];
  const newErc1155Tokens = [];
  const existsErc1155Tokens = [];
  await Promise.all(evmLogs.map(async (log) => {
    const { contractId, topics, data } = log;
    if (topics[0] === TransferHex) {
      if (topics.length === 3) {
        // const logData = { address: contractId, topics, data };
        // const { events } = erc20Decoder.decodeLogs(logData);
        try {
          // erc20
          const from = `0x${topics[1].slice(-40).toLowerCase()}`;
          const to = `0x${topics[2].slice(-40).toLowerCase()}`;
          const value = BigInt(data);
          accountIds.push(from);
          accountIds.push(to);
          const erc20TokenContract = await Erc20TokenContract.get(contractId) || newErc20TokenContracts.find(tk => tk.id === contractId);
          if (!erc20TokenContract) {
            const { name, symbol, decimals, totalSupply } = await getErc20Info(contractId);
            const newErc20TokenContract = new Erc20TokenContract(contractId);
            newErc20TokenContract.totalSupply = totalSupply.toBigInt();
            newErc20TokenContract.name = name;
            newErc20TokenContract.symbol = symbol;
            newErc20TokenContract.decimals = decimals;
            newErc20TokenContracts.push(newErc20TokenContract);
          } else {
            if (from === NULL_ADDRESS) {
              erc20TokenContract.totalSupply += value;
            } else if (to === NULL_ADDRESS) {
              erc20TokenContract.totalSupply -= value;
            }
            existsErc20TokenContracts.push(erc20TokenContract);
          }

          const balances = await Promise.all(
            [from, to].map(async accountId => {
              const balanceId = `${contractId}-${accountId}`;
              const erc20Balance = await Erc20Balance.get(balanceId) || newErc20Balances.find(b => b.id === balanceId);
              return {
                balanceId,
                accountId,
                erc20Balance
              }
            })
          );

          balances.forEach(({ balanceId, accountId, erc20Balance }) => {
            if (!erc20Balance) {
              const newErc20Balance = new Erc20Balance(balanceId);
              newErc20Balance.accountId = accountId;
              newErc20Balance.tokenContractId = contractId;
              newErc20Balance.value = to === accountId ? value : BigInt(0);
              newErc20Balances.push(newErc20Balance);
            } else {
              if (from === accountId) {
                erc20Balance.value -= value;
              } else if (to === accountId) {
                erc20Balance.value += value;
              }
              existsErc20Balances.push(erc20Balance);
            }
          });

          const newErc20Transfer = new Erc20Transfer(`erc20tx-${transactionId}-${log.logIndex}`);
          newErc20Transfer.fromId = from;
          newErc20Transfer.toId = to;
          newErc20Transfer.tokenContractId = contractId;
          newErc20Transfer.value = value;
          newErc20Transfer.transactionId = transactionId;
          newErc20Transfer.timestamp = timestamp;
          newErc20Transfers.push(newErc20Transfer);
        } catch (error) {
          logger.warn("handle erc20 Transfer event error")
          logger.warn(error.toString())
        }
      } else if (topics.length === 4) {
        try {
          const from = `0x${topics[1].slice(-40).toLowerCase()}`;
          const to = `0x${topics[2].slice(-40).toLowerCase()}`;
          const tokenId = BigInt(topics[3].slice(-16));
          accountIds.push(from);
          accountIds.push(to);
          const erc721TokenContract = await Erc721TokenContract.get(contractId) || newErc721TokenContracts.find(tk => tk.id === contractId);
          if (!erc721TokenContract) {
            const { name, symbol } = await getErc721Info(contractId);
            const newErc721TokenContract = new Erc721TokenContract(contractId);
            newErc721TokenContract.name = name;
            newErc721TokenContract.symbol = symbol;
            newErc721TokenContracts.push(newErc721TokenContract);
          }
          const erc721TokenId = `${contractId}-${tokenId.toString()}`;
          const erc721Token = await Erc721Token.get(erc721TokenId) || newErc721Tokens.find(tk => tk.id === erc721TokenId);
          if (!erc721Token) {
            const { tokenURI } = await getErc721TokenInfo(contractId, tokenId);
            const newErc721Token = new Erc721Token(erc721TokenId);
            newErc721Token.tokenContractId = contractId;
            newErc721Token.idInContract = tokenId;
            newErc721Token.tokenURI = tokenURI;
            newErc721Tokens.push(newErc721Token);
          }

          const balanceId = `${contractId}-${tokenId.toString()}`;
          const erc721Balance = await Erc721Balance.get(balanceId) || newErc721Balances.find(b => b.id === balanceId);
          if (!erc721Balance) {
            const newErc721Balance = new Erc721Balance(balanceId);
            newErc721Balance.tokenContractId = contractId;
            newErc721Balance.accountId = to;
            newErc721Balance.tokenId = erc721TokenId;
            newErc721Balances.push(newErc721Balance);
          } else {
            erc721Balance.accountId = to;
            existsErc721Balances.push(erc721Balance);
          }

          const newErc721Transfer = new Erc721Transfer(`erc721tx-${transactionId}-${log.logIndex}`);
          newErc721Transfer.fromId = from;
          newErc721Transfer.toId = to;
          newErc721Transfer.tokenContractId = contractId;
          newErc721Transfer.tokenId = erc721TokenId;
          newErc721Transfer.transactionId = transactionId;
          newErc721Transfer.timestamp = timestamp;
          newErc721Transfers.push(newErc721Transfer);
        } catch (error) {
          logger.warn("handle erc721 Transfer event error")
          logger.warn(error.toString())
        }
      }
    } else if ([TransferSingleHex, TransferBatchHex].includes(topics[0]) && topics.length === 4) {
      const singleTransfers = [];
      const uint256Length = 64;
      try {
        const operator = `0x${topics[1].slice(-40).toLowerCase()}`;
        const from = `0x${topics[2].slice(-40).toLowerCase()}`;
        const to = `0x${topics[3].slice(-40).toLowerCase()}`;
        if (topics[0] === TransferSingleHex) {
          const hexString = data.slice(2);
          singleTransfers.push({
            operator,
            from,
            to,
            tokenId: BigInt(`0x${hexString.slice(0 * uint256Length, 1 * uint256Length)}`),
            value: BigInt(`0x${hexString.slice(1 * uint256Length, 2 * uint256Length)}`)
          })
        } else if (topics[0] === TransferBatchHex && topics.length === 4) {
          const arrayHex = data.slice(130);
          const bigIntArray: BigInt[] = [];
          for (let index = 0; index < arrayHex.length / uint256Length; index++) {
            const bytes = `0x${arrayHex.slice(index * uint256Length, (index + 1) * uint256Length)}`;
            bigIntArray.push(BigInt(bytes));
          }
          const idArrayLength = Number(bigIntArray[0]);
          const idArray = bigIntArray.slice(1, 1 + idArrayLength);
          const valueArrayLength = Number(bigIntArray[1 + idArrayLength]);
          const valueArray = bigIntArray.slice(2 + idArrayLength, 2 + idArrayLength + valueArrayLength);
          singleTransfers.push(...idArray.map((tokenId, idx) => {
            return {
              operator,
              from,
              to,
              tokenId,
              value: valueArray[idx]
            };
          }))

        }

        await Promise.all(singleTransfers.map(async ({
          operator,
          from,
          to,
          tokenId,
          value
        }, idx) => {
          accountIds.push(from);
          accountIds.push(to);
          const erc1155TokenContract = await Erc1155TokenContract.get(contractId) || newErc1155TokenContracts.find(tk => tk.id === contractId);
          if (!erc1155TokenContract) {
            const newErc1155TokenContract = new Erc1155TokenContract(contractId);
            newErc1155TokenContracts.push(newErc1155TokenContract);
          }
          const erc1155TokenId = `${contractId}-${tokenId.toString()}`;
          const erc1155Token = await Erc1155Token.get(erc1155TokenId) || newErc1155Tokens.find(tk => tk.id === erc1155TokenId);
          if (!erc1155Token) {
            const { uri } = await getErc1155TokenInfo(contractId, tokenId);
            const newErc1155Token = new Erc1155Token(erc1155TokenId);
            newErc1155Token.tokenContractId = contractId;
            newErc1155Token.idInContract = tokenId;
            newErc1155Token.uri = uri;
            newErc1155Token.totalSupply = value;
            newErc1155Tokens.push(newErc1155Token);
          } else {
            if (from === NULL_ADDRESS) {
              erc1155Token.totalSupply += value;
            } else if (to === NULL_ADDRESS) {
              erc1155Token.totalSupply -= value;
            }
            existsErc1155Tokens.push(erc1155Token);
          }
          const balances = await Promise.all(
            [from, to].map(async accountId => {
              const balanceId = `${contractId}-${tokenId.toString()}-${accountId}`;
              const erc1155Balance = await Erc1155Balance.get(balanceId) || newErc1155Balances.find(b => b.id === balanceId);
              return {
                balanceId,
                accountId,
                erc1155Balance
              }
            })
          );

          balances.forEach(({ balanceId, accountId, erc1155Balance }) => {
            if (!erc1155Balance) {
              if (accountId === to) {
                const newErc1155Balance = new Erc1155Balance(balanceId);
                newErc1155Balance.tokenContractId = contractId;
                newErc1155Balance.accountId = accountId;
                newErc1155Balance.tokenId = erc1155TokenId;
                newErc1155Balance.value = value;
                newErc1155Balances.push(newErc1155Balance);
              }
            } else {
              if (from === accountId) {
                erc1155Balance.value -= value;
                erc1155Balance.value = erc1155Balance.value < BigInt(0) ? BigInt(0) : erc1155Balance.value;
              } else if (to === accountId) {
                erc1155Balance.value += value;
              }
              existsErc1155Balances.push(erc1155Balance);
            }
          });

          const newErc1155Transfer = new Erc1155Transfer(`erc1155tx-${transactionId}-${log.logIndex}-${idx}`);
          newErc1155Transfer.operatorId = operator;
          newErc1155Transfer.fromId = from;
          newErc1155Transfer.toId = to;
          newErc1155Transfer.tokenContractId = contractId;
          newErc1155Transfer.tokenId = erc1155TokenId;
          newErc1155Transfer.value = value;
          newErc1155Transfer.transactionId = transactionId;
          newErc1155Transfer.timestamp = timestamp;
          newErc1155Transfers.push(newErc1155Transfer);
        }))
      } catch (error) {
        logger.warn("handle erc1155 Transfer event error")
        logger.warn(error.toString())
      }
    }
  }));

  return {
    accountIds,

    newErc20TokenContracts,
    newErc20Transfers,
    newErc20Balances,
    existsErc20Balances,
    existsErc20TokenContracts,

    newErc721Transfers,
    newErc721Balances,
    existsErc721Balances,
    newErc721TokenContracts,
    newErc721Tokens,

    newErc1155Transfers,
    newErc1155Balances,
    existsErc1155Balances,
    newErc1155TokenContracts,
    newErc1155Tokens,
    existsErc1155Tokens
  };
}
