import { parseEther } from "@ethersproject/units";
import { WorkhardDAO } from "@workhard/protocol";
import { Contract } from "ethers";

export enum PARAM_TYPE {
  ARRAY = "Array",
  STRING = "string",
  BOOLEAN = "boolean",
  NUMBER = "number",
  ETHER = "ether",
}
export interface Param {
  name: string;
  type: PARAM_TYPE;
}

export interface Preset {
  paramArray: Param[];
  methodName: string;
  contract?: Contract;
  contractName: string;
}

export const convertType = (type: PARAM_TYPE, value: string) => {
  switch (type) {
    case PARAM_TYPE.STRING:
      return value;
    case PARAM_TYPE.BOOLEAN:
      return value === "true";
    case PARAM_TYPE.ETHER:
      return parseEther(value);
    case PARAM_TYPE.NUMBER:
      return Number(value);
    case PARAM_TYPE.ARRAY:
      return Array.from(JSON.parse(value));
    default:
      return value;
  }
};

export const buildPresets = (dao: WorkhardDAO): Preset[] => {
  return [
    {
      paramArray: [
        { name: "projId", type: PARAM_TYPE.STRING },
        { name: "amount", type: PARAM_TYPE.ETHER },
      ],
      methodName: "grant",
      contract: dao.contributionBoard,
      contractName: "ContributionBoard",
    },
    {
      paramArray: [{ name: "currency", type: PARAM_TYPE.STRING }],
      methodName: "addCurrency",
      contract: dao.contributionBoard,
      contractName: "ContributionBoard",
    },
    {
      paramArray: [{ name: "currency", type: PARAM_TYPE.STRING }],
      methodName: "removeCurrency",
      contract: dao.contributionBoard,
      contractName: "ContributionBoard",
    },
    {
      paramArray: [
        { name: "manager", type: PARAM_TYPE.STRING },
        { name: "active", type: PARAM_TYPE.BOOLEAN },
      ],
      methodName: "setManager",
      contract: dao.contributionBoard,
      contractName: "ContributionBoard",
    },
    {
      paramArray: [{ name: "projId", type: PARAM_TYPE.STRING }],
      methodName: "approveProject",
      contract: dao.contributionBoard,
      contractName: "ContributionBoard",
    },
    {
      paramArray: [{ name: "projId", type: PARAM_TYPE.STRING }],
      methodName: "disapproveProject",
      contract: dao.contributionBoard,
      contractName: "ContributionBoard",
    },
    {
      paramArray: [{ name: "_oneInch", type: PARAM_TYPE.STRING }],
      methodName: "setExchange",
      contract: dao.contributionBoard,
      contractName: "ContributionBoard",
    },
    {
      paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
      methodName: "setTaxRate",
      contract: dao.contributionBoard,
      contractName: "ContributionBoard",
    },
    {
      paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
      methodName: "setTaxRateForUndeclared",
      contract: dao.contributionBoard,
      contractName: "ContributionBoard",
    },
    {
      paramArray: [
        { name: "currency", type: PARAM_TYPE.STRING },
        { name: "amount", type: PARAM_TYPE.NUMBER },
      ],
      methodName: "taxToDividendPool",
      contract: dao.contributionBoard,
      contractName: "ContributionBoard",
    },
    {
      paramArray: [{ name: "planter", type: PARAM_TYPE.STRING }],
      methodName: "addPlanter",
      contract: dao.dividendPool,
      contractName: "DividendPool",
    },
    {
      paramArray: [{ name: "planter", type: PARAM_TYPE.STRING }],
      methodName: "removePlanter",
      contract: dao.dividendPool,
      contractName: "DividendPool",
    },
    {
      paramArray: [{ name: "_fund", type: PARAM_TYPE.STRING }],
      methodName: "setProtocolFund",
      contract: dao.visionEmitter,
      contractName: "VisionEmitter",
    },
    {
      paramArray: [],
      methodName: "start",
      contract: dao.visionEmitter,
      contractName: "VisionEmitter",
    },
    {
      paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
      methodName: "setMinimumRate",
      contract: dao.visionEmitter,
      contractName: "VisionEmitter",
    },
    {
      paramArray: [{ name: "factory", type: PARAM_TYPE.STRING }],
      methodName: "setFactory",
      contract: dao.visionEmitter,
      contractName: "VisionEmitter",
    },
    {
      paramArray: [
        { name: "_miningPool", type: PARAM_TYPE.ARRAY },
        { name: "_weights", type: PARAM_TYPE.ARRAY },
        { name: "_protocolFund", type: PARAM_TYPE.NUMBER },
        { name: "_caller", type: PARAM_TYPE.NUMBER },
      ],
      methodName: "setEmission",
      contract: dao.visionEmitter,
      contractName: "VisionEmitter",
    },
    {
      paramArray: [{ name: "period", type: PARAM_TYPE.NUMBER }],
      methodName: "setEmissionPeriod",
      contract: dao.visionEmitter,
      contractName: "VisionEmitter",
    },
  ];
};
