import { Interface, LogDescription, Result } from "@ethersproject/abi";
import { Log } from "@ethersproject/abstract-provider";
import { getAddress } from "@ethersproject/address";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { formatEther } from "@ethersproject/units";
import { IERC20__factory } from "@workhard/protocol";
import devDeploy from "@workhard/protocol/deployed.json";
import { constants, Contract, ContractTransaction, Signer } from "ethers";
import { Dispatch, SetStateAction } from "react";
import { WorkhardContracts } from "../providers/WorkhardContractProvider";

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

export const acceptableTokenList = [
  {
    symbol: "DAI",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  // {
  //   symbol: "BASECURRENCY-TEST",
  //   address: devDeploy.localhost.BaseCurrency,
  // },
];

export const getTokenSymbol = (address: string): string | undefined => {
  const token = acceptableTokenList.find(
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
  contracts: WorkhardContracts,
  target: string,
  data: string,
  value: BigNumber
): DecodedTxData {
  const targetContract = (Object.entries(contracts) as Array<
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

export function approveAndRun(
  signer: Signer,
  erc20: string,
  approve: string,
  setApproveTx: Dispatch<SetStateAction<ContractTransaction | undefined>>,
  setApproved: Dispatch<SetStateAction<boolean>>,
  run: () => void
) {
  IERC20__factory.connect(erc20, signer)
    .approve(approve, constants.MaxUint256)
    .then((tx) => {
      setApproveTx(tx);
      tx.wait()
        .then((_) => {
          setApproveTx(undefined);
          setApproved(true);
          if (run) run();
        })
        .catch((rejected) => {
          setApproveTx(undefined);
          alert(`Rejected with ${rejected}`);
        });
    })
    .catch(() => {
      setApproved(false);
    });
}

export const permaPinToArweave = async (cid: string): Promise<string> => {
  const res = await fetch(`https://ipfs2arweave.com/permapin/${cid}`);
  const { arweaveId } = await res.json();
  return arweaveId;
};
