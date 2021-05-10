import { parseEther } from "@ethersproject/units";
import { Contract } from "ethers";
import { WorkhardContracts } from "../providers/WorkhardContractProvider";

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
      return value == "true";
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

export const buildPresets = (
  contracts: WorkhardContracts | undefined
): Preset[] | undefined => {
  if (!contracts) return undefined;
  else {
    return [
      {
        paramArray: [
          { name: "projId", type: PARAM_TYPE.NUMBER },
          { name: "amount", type: PARAM_TYPE.ETHER },
        ],
        methodName: "grant",
        contract: contracts.jobBoard,
        contractName: "JobBoard",
      },
      {
        paramArray: [{ name: "currency", type: PARAM_TYPE.STRING }],
        methodName: "addCurrency",
        contract: contracts.jobBoard,
        contractName: "JobBoard",
      },
      {
        paramArray: [{ name: "currency", type: PARAM_TYPE.STRING }],
        methodName: "removeCurrency",
        contract: contracts.jobBoard,
        contractName: "JobBoard",
      },
      {
        paramArray: [
          { name: "manager", type: PARAM_TYPE.STRING },
          { name: "active", type: PARAM_TYPE.BOOLEAN },
        ],
        methodName: "setManager",
        contract: contracts.jobBoard,
        contractName: "JobBoard",
      },
      {
        paramArray: [{ name: "projId", type: PARAM_TYPE.NUMBER }],
        methodName: "approveProject",
        contract: contracts.jobBoard,
        contractName: "JobBoard",
      },
      {
        paramArray: [{ name: "projId", type: PARAM_TYPE.NUMBER }],
        methodName: "disapproveProject",
        contract: contracts.jobBoard,
        contractName: "JobBoard",
      },
      {
        paramArray: [{ name: "_oneInch", type: PARAM_TYPE.STRING }],
        methodName: "setExchange",
        contract: contracts.jobBoard,
        contractName: "JobBoard",
      },
      {
        paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
        methodName: "setTaxRate",
        contract: contracts.jobBoard,
        contractName: "JobBoard",
      },
      {
        paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
        methodName: "setTaxRateForUndeclared",
        contract: contracts.jobBoard,
        contractName: "JobBoard",
      },
      {
        paramArray: [
          { name: "currency", type: PARAM_TYPE.STRING },
          { name: "amount", type: PARAM_TYPE.NUMBER },
        ],
        methodName: "taxToDividendPool",
        contract: contracts.jobBoard,
        contractName: "JobBoard",
      },
      {
        paramArray: [{ name: "planter", type: PARAM_TYPE.STRING }],
        methodName: "addPlanter",
        contract: contracts.dividendPool,
        contractName: "DividendPool",
      },
      {
        paramArray: [{ name: "planter", type: PARAM_TYPE.STRING }],
        methodName: "removePlanter",
        contract: contracts.dividendPool,
        contractName: "DividendPool",
      },
      {
        paramArray: [{ name: "_fund", type: PARAM_TYPE.STRING }],
        methodName: "setProtocolFund",
        contract: contracts.visionEmitter,
        contractName: "VisionEmitter",
      },
      {
        paramArray: [],
        methodName: "start",
        contract: contracts.visionEmitter,
        contractName: "VisionEmitter",
      },
      {
        paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
        methodName: "setMinimumRate",
        contract: contracts.visionEmitter,
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
        contract: contracts.visionEmitter,
        contractName: "VisionEmitter",
      },
      {
        paramArray: [{ name: "period", type: PARAM_TYPE.NUMBER }],
        methodName: "setEmissionPeriod",
        contract: contracts.visionEmitter,
        contractName: "VisionEmitter",
      },
    ];
  }
};
