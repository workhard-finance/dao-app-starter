import { Interface, LogDescription, Result } from "@ethersproject/abi";
import { Log } from "@ethersproject/abstract-provider";
import { getAddress } from "@ethersproject/address";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { formatEther, parseEther } from "@ethersproject/units";
import {
  IERC20__factory,
  WorkhardDAO,
  getNetworkName,
  MyNetwork,
} from "@workhard/protocol";
import deployed from "@workhard/protocol/deployed.json";
import {
  constants,
  Contract,
  ContractReceipt,
  ContractTransaction,
  Signer,
} from "ethers";
import IPFS from "ipfs-core/src/components";
import { Dispatch, SetStateAction } from "react";
import { AddToast } from "react-toast-notifications";
// import { WorkhardContracts } from "../providers/WorkhardContractProvider";

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
  const dao =
    process.env.NODE_ENV === "development"
      ? require("../deployed.dev.json")
      : deployed;
  return [
    {
      symbol: "Base Currency",
      address: dao[getNetworkName(chainId)].BaseCurrency as string,
    },
  ];
};

export const getStablecoinList = (chainId?: number) => {
  if (!chainId) return [];
  if (process.env.NODE_ENV === "development") {
    const dao = require("../deployed.dev.json");
    return [
      {
        symbol: "Mock Token",
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
        address: "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa",
      },
    ];
  }
};

export const getTargetNetworkName = (): MyNetwork => {
  if (process.env.REACT_APP_NETWORK)
    return process.env.REACT_APP_NETWORK as MyNetwork;
  const hostname = window.location.hostname;
  if (hostname.includes("localhost")) return "localhost";
  else if (hostname.includes("rinkeby")) return "rinkeby";
  else if (hostname === "app.workhard.finance") return "mainnet";
  else return "hardhat";
};

export const getTokenSymbol = (
  address: string,
  chainId?: number
): string | undefined => {
  if (!chainId) return undefined;
  const token = acceptableTokenList(chainId).find(
    (a) => getAddress(a.address) === getAddress(address)
  );
  if (token) {
    return token.symbol;
  } else {
    return undefined;
  }
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
  dao: WorkhardDAO,
  target: string,
  data: string,
  value: BigNumber
): DecodedTxData {
  const targetContract = (Object.entries(dao) as Array<
    [string, Contract]
  >).find(
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
  if ((err as any).data?.message) {
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
  console.log("uri", uri);
  for await (const chunk of ipfs.cat(uri.replace("ipfs://", ""))) {
    result += chunk;
  }
  const metadata = JSON.parse(result) as ProjectMetadata;
  console.log("metadata", metadata);
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

export const prefix = (daoId: string | number | undefined, url: string) => {
  if (daoId && `${daoId}` !== "0") {
    return `/${daoId}` + url;
  } else {
    return url;
  }
};
