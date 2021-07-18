import { Interface, LogDescription, Result } from "@ethersproject/abi";
import { Log } from "@ethersproject/abstract-provider";
import { getAddress } from "@ethersproject/address";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { formatEther, parseEther } from "@ethersproject/units";
import EthersSafe, {
  SafeTransactionDataPartial,
} from "@gnosis.pm/safe-core-sdk";
import {
  IERC20__factory,
  DAO,
  getNetworkName,
  MyNetwork,
  GnosisSafe__factory,
  ERC721__factory,
  ERC1155__factory,
  Workhard,
  ERC20__factory,
} from "@workhard/protocol";
import deployed from "@workhard/protocol/deployed.json";
import { UniswapV2Pair__factory } from "@workhard/protocol/dist/build/@uniswap";
import {
  ethers,
  constants,
  Contract,
  ContractReceipt,
  ContractTransaction,
  Signer,
  providers,
  PopulatedTransaction,
} from "ethers";
import IPFS from "ipfs-core/src/components";
import { Dispatch, SetStateAction } from "react";
import { AddToast } from "react-toast-notifications";
import { WorkhardLibrary } from "../providers/WorkhardProvider";
import { ERC165, PoolType } from "./ERC165Interfaces";

export const parseLog = (
  contract: {
    interface: Interface;
  },
  logs: Log[],
  topic?: string
): LogDescription[] => {
  const topicHash = topic ? contract.interface.getEventTopic(topic) : undefined;
  const parsed = logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return undefined;
      }
    })
    .filter((log) => {
      if (topicHash) {
        return log?.topic === topicHash;
      } else {
        return !!log;
      }
    });
  return parsed as LogDescription[];
};

export const wrapUrl = (text: string) => {
  const pattern = /(?:(?:https?):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\x{00a1}\-\x{ffff}0-9]+-?)*[a-z\x{00a1}\-\x{ffff}0-9]+)(?:\.(?:[a-z\x{00a1}\-\x{ffff}0-9]+-?)*[a-z\x{00a1}\-\x{ffff}0-9]+)*(?:\.(?:[a-z\x{00a1}\-\x{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?/gi;
  const wrapped = text.replace(pattern, (url) => {
    const protocol_pattern = /^(?:(?:https?|ftp):\/\/)/i;
    const href = protocol_pattern.test(url) ? url : "http://" + url;
    return `<a href="${href}" target="_blank">${url}</a>`;
  });
  return wrapped;
};

export const acceptableTokenList = (chainId?: number) => {
  if (!chainId) return [];
  const dao = deployed as any;
  return [
    {
      symbol: "Base Currency",
      address: dao[getNetworkName(chainId)].BaseCurrency as string,
    },
  ];
};

export const getStablecoinList = (chainId?: number) => {
  if (!chainId) return [];
  const dao = deployed as any;
  if (process.env.NODE_ENV === "development") {
    return [
      {
        symbol: "Mock",
        address: dao[getNetworkName(chainId)].BaseCurrency as string,
      },
    ];
  } else if (getNetworkName(chainId) === "mainnet") {
    return [
      {
        symbol: "DAI",
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      },
      {
        symbol: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      },
      {
        symbol: "USDT",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      },
    ];
  } else if (getNetworkName(chainId) === "rinkeby") {
    return [
      {
        symbol: "Rinkeby DAI",
        address: "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735",
      },
    ];
  }
};

export const isOnTargetNetwork = (chainId?: number): boolean => {
  if (!chainId) return false;
  const targetNetwork = getTargetNetworkName() || getNetworkName(chainId);
  return getNetworkName(chainId) === targetNetwork;
};

export const getTargetNetworkName = (): MyNetwork | undefined => {
  if (process.env.REACT_APP_NETWORK)
    return process.env.REACT_APP_NETWORK as MyNetwork;
  const hostname = window.location.hostname;
  if (hostname.includes("localhost")) return undefined;
  else if (hostname === "app.workhard.finance") return "mainnet";
  else return "rinkeby";
};

export const getVariantForProgressBar = (percent: number) => {
  if (percent <= 25) return "danger";
  else if (percent <= 50) return "warning";
  else if (percent <= 75) return "info";
  else return "success";
};

export const bigNumToFixed = (n: BigNumberish) => {
  return parseFloat(parseFloat(formatEther(n)).toFixed(2));
};

export interface DecodedTxData {
  address: string;
  contractName: string;
  methodName: string;
  args: { [key: string]: any };
  value: BigNumber;
  result: Result;
}

export function decodeTxDetails(
  workhard: WorkhardLibrary,
  target: string,
  data: string,
  value: BigNumber
): DecodedTxData {
  const contracts = [
    ...(Object.entries(workhard.dao) as Array<[string, Contract]>),
    ...(Object.entries(workhard.commons) as Array<[string, Contract]>),
    ...(Object.entries({ Project: workhard.project }) as Array<
      [string, Contract]
    >),
  ];
  const targetContract = contracts.find(
    ([_, contract]) => getAddress(target) === getAddress(contract.address)
  );
  if (targetContract) {
    const [contractName, contract] = targetContract;
    const fragment = contract.interface.getFunction(data.slice(0, 10));
    const methodName = fragment.name;
    const result: Result = contract.interface.decodeFunctionData(
      fragment,
      data
    );
    const argNames = Object.getOwnPropertyNames(result).filter((name) => {
      return ![
        ...Array(result.length)
          .fill(0)
          .map((_, i) => `${i}`),
        "length",
      ].includes(name);
    });
    const args: { [key: string]: any } = {};
    argNames.forEach((key) => {
      args[key] = result[key];
    });
    return {
      address: target,
      contractName:
        contractName.slice(0, 1).toUpperCase() + contractName.slice(1),
      methodName,
      args,
      value,
      result,
    };
  } else {
    throw Error("Failed to find contract interface");
  }
}

type ContractValue = string | number | BigNumber | undefined;

export function flatten(val: ContractValue | ContractValue[]): string {
  if (Array.isArray(val)) {
    return `[${val.map((v) => flatten(v))}]`;
  } else {
    if (typeof val === "string") {
      return val;
    } else if (typeof val === "number") {
      return `${val}`;
    } else if (val === undefined) {
      return ``;
    } else {
      return val.toString();
    }
  }
}

export enum TxStatus {
  NOT_EXIST,
  PENDING,
  REVERTED,
  CONFIRMED,
}

export function approveAndRun(
  signer: Signer,
  erc20: string,
  approve: string,
  setApproveTxStatus: Dispatch<SetStateAction<TxStatus | undefined>>,
  setAllowance: Dispatch<SetStateAction<BigNumber>>,
  run: () => void
) {
  IERC20__factory.connect(erc20, signer)
    .approve(approve, constants.MaxUint256)
    .then((tx) => {
      setApproveTxStatus(TxStatus.PENDING);
      tx.wait()
        .then((_) => {
          setApproveTxStatus(TxStatus.CONFIRMED);
          setAllowance(constants.MaxUint256);
          if (run) run();
        })
        .catch((rejected) => {
          setApproveTxStatus(TxStatus.REVERTED);
          alert(`Rejected with ${rejected}`);
        });
    })
    .catch(() => {
      setApproveTxStatus(undefined);
    });
}

export const permaPinToArweave = async (cid: string): Promise<string> => {
  const res = await fetch(`https://ipfs2arweave.com/permapin/${cid}`);
  const { arweaveId } = await res.json();
  return arweaveId;
};

export const errorHandler = (
  addToast: AddToast,
  msg?: string,
  fn?: (_err?: Error) => void
) => (err: Error) => {
  let errMsg: string;
  if ((err as any).error) {
    errMsg = `${(err as any).reason} - ${(err as any).error.message}`;
  } else if ((err as any).data?.message) {
    errMsg = (err as any).data?.message;
  } else {
    errMsg = err.message;
  }
  addToast({
    variant: "danger",
    content: msg ? `${msg}: ${errMsg}` : `${errMsg}`,
  });
  if (fn) {
    fn(err);
  }
};

export const handleTransaction = (
  transaction: Promise<ContractTransaction>,
  setTxStatus: React.Dispatch<React.SetStateAction<TxStatus | undefined>>,
  addToast: AddToast,
  msg: string,
  callback?: (receipt: ContractReceipt) => void
) => {
  transaction
    .then((tx) => {
      setTxStatus(TxStatus.PENDING);
      tx.wait()
        .then((receipt) => {
          setTxStatus(TxStatus.CONFIRMED);
          addToast({
            variant: "success",
            content: msg,
          });
          if (callback) {
            callback(receipt);
          }
        })
        .catch((err) => {
          setTxStatus(TxStatus.REVERTED);
          errorHandler(addToast)(err);
        });
    })
    .catch(errorHandler(addToast, "Cancelled"));
};

export const isApproved = (
  allowance?: BigNumber,
  amount?: BigNumberish
): boolean => {
  if (!amount) {
    return true;
  } else if (typeof amount === "string") {
    if (amount === "") return true;
    return (allowance || constants.Zero).gte(parseEther(amount));
  } else {
    return (allowance || constants.Zero).gte(amount || 0);
  }
};

export interface ProjectMetadata {
  name: string;
  description: string;
  image: string;
  url?: string;
}

export const fetchProjectMetadataFromIPFS = async (
  ipfs: IPFS,
  uri: string
): Promise<ProjectMetadata> => {
  let result = "";
  for await (const chunk of ipfs.cat(uri.replace("ipfs://", ""))) {
    result += chunk;
  }
  const metadata = JSON.parse(result) as ProjectMetadata;
  return metadata;
};

export const uriToURL = (uri: string) => {
  const gateway = "ipfs.io";
  const url = `https://${gateway}/ipfs/${uri.replace("ipfs://", "")}`;
  return url;
};

export const altWhenEmptyList = (alt: JSX.Element, list?: any[]) => {
  if (list) {
    return list.length > 0 ? list : alt;
  } else {
    return alt;
  }
};

export const weiToEth = (wei: BigNumberish, fixed?: number): number => {
  return parseFloat(parseFloat(formatEther(wei)).toFixed(fixed || 2));
};

export const compareAddress = (a?: string, b?: string): boolean => {
  if (!a || !b) return false;
  return getAddress(a) === getAddress(b);
};

export const getGnosisAPI = (chainId?: number): string | undefined => {
  if (!chainId) return undefined;
  const network = getNetworkName(chainId);
  const gnosisAPI =
    network === "mainnet"
      ? `https://safe-transaction.gnosis.io/api/v1/`
      : network === "rinkeby"
      ? `https://safe-transaction.rinkeby.gnosis.io/api/v1/`
      : undefined;
  return gnosisAPI;
};

export const gnosisTx = async (
  chainId: number,
  safe: string,
  popTx: PopulatedTransaction,
  signer: Signer,
  safeTxGas?: number
) => {
  const { to, data, value } = popTx;
  if (!to || !data) {
    throw Error("No target data.");
  }
  const partialTx: SafeTransactionDataPartial = {
    to,
    data,
    value: value?.toString() || "0",
    safeTxGas,
  };
  const safeSdk = await EthersSafe.create(ethers, safe, signer);
  const safeTx = await safeSdk.createTransaction(partialTx);
  await safeSdk.signTransaction(safeTx);
  const gnosisAPI = getGnosisAPI(chainId);
  if (!gnosisAPI) {
    throw Error("Support only Rinkeby & Mainnet.");
  } else {
    const contractTransactionHash = await safeSdk.getTransactionHash(safeTx);
    const req = {
      ...safeTx.data,
      safeTxGas: safeTxGas || safeTx.data.safeTxGas,
      safe,
      contractTransactionHash,
      sender: await signer.getAddress(),
      signature: safeTx.encodedSignatures(),
      origin: "Workhard",
    };
    const response = await fetch(
      gnosisAPI + `safes/${safe}/multisig-transactions/`,
      {
        method: "post",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(req),
      }
    );
    if (!response.ok) {
      throw Error(response.statusText);
    }
  }
};

export const safeTxHandler = async (
  chainId: number,
  safe: string,
  popTx: PopulatedTransaction,
  signer: Signer,
  setTxStatus: React.Dispatch<React.SetStateAction<TxStatus | undefined>>,
  addToast: AddToast,
  msg: string,
  callback?: (receipt?: ContractReceipt) => void,
  safeTxGas?: number
) => {
  const signerAddress = await signer.getAddress();
  if (compareAddress(safe, signerAddress)) {
    handleTransaction(
      signer.sendTransaction(popTx),
      setTxStatus,
      addToast,
      msg,
      callback
    );
  } else {
    gnosisTx(chainId, safe, popTx, signer, safeTxGas)
      .then(() => {
        callback && callback();
      })
      .catch(errorHandler(addToast));
  }
};

export enum TokenType {
  ERC20 = "ERC20",
  ERC721 = "ERC721",
  ERC1155 = "ERC1155",
}

export const isERC1155 = async (
  address: string,
  provider: providers.Provider
): Promise<boolean> => {
  try {
    const support = await ERC1155__factory.connect(
      address,
      provider
    ).supportsInterface(ERC165.ERC1155);
    return support;
  } catch (_err) {
    return false;
  }
};

export const isERC721 = async (
  address: string,
  provider: providers.Provider
): Promise<boolean> => {
  try {
    const support = await ERC721__factory.connect(
      address,
      provider
    ).supportsInterface(ERC165.ERC721);
    return support;
  } catch (_err) {
    return false;
  }
};

export const getTokenType = async (
  address: string,
  provider: providers.Provider
): Promise<TokenType> => {
  if (await isERC1155(address, provider)) return TokenType.ERC1155;
  if (await isERC721(address, provider)) return TokenType.ERC721;
  return TokenType.ERC20;
};

export const humanReadablePoolType = (poolType?: string): string => {
  if (poolType === PoolType.ERC20BurnV1) return "ERC20 Burn Mining";
  if (poolType === PoolType.ERC20StakeV1) return "ERC20 Stake Mining";
  if (poolType === PoolType.ERC721StakeV1) return "ERC721 Stake Mining";
  if (poolType === PoolType.ERC1155BurnV1) return "ERC1155 Burn Mining";
  if (poolType === PoolType.ERC1155StakeV1) return "ERC1155 Stake Mining";
  if (poolType === undefined) return "Etc";
  return "unknown";
};

export const getTokenLogo = (address: string): string => {
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${getAddress(
    address
  )}/logo.png`;
};

export const getLPTokenSymbols = async (
  lp: string,
  provider: providers.Web3Provider
): Promise<{
  token0: string;
  token1: string;
  symbol0: string;
  symbol1: string;
}> => {
  const [token0, token1] = await Promise.all([
    UniswapV2Pair__factory.connect(lp, provider).token0(),
    UniswapV2Pair__factory.connect(lp, provider).token1(),
  ]);
  const [symbol0, symbol1] = await Promise.all([
    ERC20__factory.connect(token0, provider).symbol(),
    ERC20__factory.connect(token1, provider).symbol(),
  ]);
  return {
    token0,
    token1,
    symbol0,
    symbol1,
  };
};

export const getTokenSymbol = async (
  address: string,
  tokenType: TokenType,
  provider: providers.Web3Provider
): Promise<string> => {
  if (tokenType === TokenType.ERC20) {
    const symbol = await ERC20__factory.connect(address, provider).symbol();
    if (symbol === "UNI-V2") {
      const { symbol0, symbol1 } = await getLPTokenSymbols(address, provider);
      return `${symbol0}/${symbol1} LP`;
    } else {
      return symbol;
    }
  } else if (tokenType === TokenType.ERC721) {
    return await ERC721__factory.connect(address, provider).symbol();
  } else if (tokenType === TokenType.ERC1155) {
    return `ERC1155 ${address.slice(0, 6)}...${address.slice(0, 4)}`;
  } else {
    return `Unknown Type ${address.slice(0, 6)}...${address.slice(0, 4)}`;
  }
};
