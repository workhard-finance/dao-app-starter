import { Interface, LogDescription } from "@ethersproject/abi";
import { Log } from "@ethersproject/abstract-provider";
import { getAddress } from "@ethersproject/address";
import devDeploy from "@workhard/protocol/deployed.dev.json";
import {
  PARAM_TYPE,
  PresetProposalProps,
} from "../components/contracts/farmers-union/proposal-types/PresetProposal";
import { Contract } from "ethers";
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
  {
    symbol: "BASECURRENCY-TEST",
    address: devDeploy.localhost.BaseCurrency,
  },
];

export const buildPresets = (
  contracts: WorkhardContracts | undefined
): PresetProposalProps[] => [
  {
    paramArray: [
      { name: "projId", type: PARAM_TYPE.NUMBER },
      { name: "amount", type: PARAM_TYPE.NUMBER },
    ],
    methodName: "grant",
    contract: contracts?.cryptoJobBoard,
    contractName: "CryptoJobBoard",
  },
  {
    paramArray: [{ name: "currency", type: PARAM_TYPE.STRING }],
    methodName: "addCurrency",
    contract: contracts?.cryptoJobBoard,
    contractName: "CryptoJobBoard",
  },
  {
    paramArray: [{ name: "currency", type: PARAM_TYPE.STRING }],
    methodName: "removeCurrency",
    contract: contracts?.cryptoJobBoard,
    contractName: "CryptoJobBoard",
  },
  {
    paramArray: [
      { name: "manager", type: PARAM_TYPE.STRING },
      { name: "active", type: PARAM_TYPE.BOOLEAN },
    ],
    methodName: "setManager",
    contract: contracts?.cryptoJobBoard,
    contractName: "CryptoJobBoard",
  },
  {
    paramArray: [{ name: "projId", type: PARAM_TYPE.NUMBER }],
    methodName: "approveProject",
    contract: contracts?.cryptoJobBoard,
    contractName: "CryptoJobBoard",
  },
  {
    paramArray: [{ name: "projId", type: PARAM_TYPE.NUMBER }],
    methodName: "disapproveProject",
    contract: contracts?.cryptoJobBoard,
    contractName: "CryptoJobBoard",
  },
  {
    paramArray: [{ name: "_oneInch", type: PARAM_TYPE.STRING }],
    methodName: "setExchange",
    contract: contracts?.cryptoJobBoard,
    contractName: "CryptoJobBoard",
  },
  {
    paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
    methodName: "setTaxRate",
    contract: contracts?.cryptoJobBoard,
    contractName: "CryptoJobBoard",
  },
  {
    paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
    methodName: "setTaxRateForUndeclared",
    contract: contracts?.cryptoJobBoard,
    contractName: "CryptoJobBoard",
  },
  {
    paramArray: [
      { name: "currency", type: PARAM_TYPE.STRING },
      { name: "amount", type: PARAM_TYPE.NUMBER },
    ],
    methodName: "taxToVisionFarm",
    contract: contracts?.cryptoJobBoard,
    contractName: "CryptoJobBoard",
  },
  {
    paramArray: [{ name: "planter", type: PARAM_TYPE.STRING }],
    methodName: "addPlanter",
    contract: contracts?.visionFarm,
    contractName: "VisionFarm",
  },
  {
    paramArray: [{ name: "planter", type: PARAM_TYPE.STRING }],
    methodName: "removePlanter",
    contract: contracts?.visionFarm,
    contractName: "VisionFarm",
  },
  {
    paramArray: [{ name: "_fund", type: PARAM_TYPE.STRING }],
    methodName: "setProtocolFund",
    contract: contracts?.visionTokenEmitter,
    contractName: "VisionTokenEmitter",
  },
  {
    paramArray: [],
    methodName: "start",
    contract: contracts?.visionTokenEmitter,
    contractName: "VisionTokenEmitter",
  },
  {
    paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
    methodName: "setMinimumRate",
    contract: contracts?.visionTokenEmitter,
    contractName: "VisionTokenEmitter",
  },
  {
    paramArray: [{ name: "period", type: PARAM_TYPE.NUMBER }],
    methodName: "setEmissionPeriod",
    contract: contracts?.visionTokenEmitter,
    contractName: "VisionTokenEmitter",
  },
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
