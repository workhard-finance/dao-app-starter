import { parseEther } from "@ethersproject/units";
import { WorkhardDAO } from "@workhard/protocol";
import {
  BigNumber,
  BigNumberish,
  BytesLike,
  Contract,
  PopulatedTransaction,
} from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";

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
  hint?: string;
}

export interface Preset {
  contractName: string;
  methodName: string;
  paramArray: Param[];
  contract?: Contract;
  handler?: (params: any[]) => Promise<PopulatedTransaction>;
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
      contractName: "StableReserve",
      methodName: "grant",
      paramArray: [
        { name: "projId", type: PARAM_TYPE.STRING },
        { name: "amount", type: PARAM_TYPE.ETHER },
      ],
      contract: dao.stableReserve,
      handler: async (params: any[]) => {
        console.log("hi");
        console.log(params);
        const popTx = await dao.stableReserve.populateTransaction.grant(
          dao.contributionBoard.address,
          params[1] as BytesLike, // amount
          defaultAbiCoder.encode(["uint256"], [params[0] as BigNumberish]) // projId
        );
        console.log("resulting", popTx);
        return popTx;
      },
    },
    {
      contractName: "StableReserve",
      methodName: "setMinter",
      paramArray: [
        { name: "minter", type: PARAM_TYPE.STRING },
        { name: "active", type: PARAM_TYPE.BOOLEAN },
      ],
      contract: dao.stableReserve,
    },
    {
      contractName: "DividendPool",
      methodName: "setFeaturedRewards",
      paramArray: [{ name: "tokens", type: PARAM_TYPE.ARRAY }],
      contract: dao.dividendPool,
    },
    {
      contractName: "VisionEmitter",
      methodName: "setEmission",
      paramArray: [
        { name: "_baseToken", type: PARAM_TYPE.ARRAY },
        { name: "_weights", type: PARAM_TYPE.ARRAY },
        { name: "_poolType", type: PARAM_TYPE.ARRAY },
        { name: "_protocolFund", type: PARAM_TYPE.NUMBER },
        { name: "_caller", type: PARAM_TYPE.NUMBER },
      ],
      contract: dao.visionEmitter,
      handler: async (params: any[]) => {
        const calldata = {
          pools: params[0].map((addr: string, i: number) => ({
            baseToken: addr,
            weight: params[1][i],
            poolType: params[2][i],
          })),
          treasuryWeight: params[3],
          callerWeight: params[4],
        };
        const popTx = await dao.visionEmitter.populateTransaction.setEmission(
          calldata
        );
        return popTx;
      },
    },
    {
      contractName: "VisionEmitter",
      methodName: "setFactory",
      paramArray: [{ name: "factory", type: PARAM_TYPE.STRING }],
      contract: dao.visionEmitter,
    },
    {
      contractName: "VisionEmitter",
      methodName: "setTreasury",
      paramArray: [{ name: "_treasury", type: PARAM_TYPE.STRING }],
      contract: dao.visionEmitter,
    },
    {
      contractName: "VisionEmitter",
      methodName: "setEmissionCutRate",
      paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
      contract: dao.visionEmitter,
    },
    {
      contractName: "VisionEmitter",
      methodName: "setMinimumRate",
      paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
      contract: dao.visionEmitter,
    },
    {
      contractName: "Marketplace",
      methodName: "setTaxRate",
      paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
      contract: dao.visionEmitter,
    },
    {
      contractName: "VotingEscrowLock",
      methodName: "updateBaseUri",
      paramArray: [{ name: "baseURI", type: PARAM_TYPE.STRING }],
      contract: dao.votingEscrow,
    },
    {
      contractName: "WorkersUnion",
      methodName: "changeVotingRule",
      paramArray: [
        { name: "minimumPendingPeriod", type: PARAM_TYPE.NUMBER },
        { name: "maximumPendingPeriod", type: PARAM_TYPE.NUMBER },
        { name: "minimumVotingPeriod", type: PARAM_TYPE.NUMBER },
        { name: "maximumVotingPeriod", type: PARAM_TYPE.NUMBER },
        { name: "minimumVotesForProposing", type: PARAM_TYPE.NUMBER },
        { name: "minimumVotes", type: PARAM_TYPE.NUMBER },
        { name: "voteCounter", type: PARAM_TYPE.STRING },
      ],
      contract: dao.workersUnion,
    },
    {
      contractName: "Manual",
      methodName: "proposeTx",
      paramArray: [],
      contract: dao.workersUnion,
    },
    {
      contractName: "Manual",
      methodName: "proposeBatchTx",
      paramArray: [],
      contract: dao.workersUnion,
    },
    // {
    //   paramArray: [{ name: "currency", type: PARAM_TYPE.STRING }],
    //   methodName: "addCurrency",
    //   contract: dao.jobBoard,
    //   contractName: "JobBoard",
    // },
    // {
    //   paramArray: [{ name: "currency", type: PARAM_TYPE.STRING }],
    //   methodName: "removeCurrency",
    //   contract: dao.jobBoard,
    //   contractName: "JobBoard",
    // },
    // {
    //   paramArray: [
    //     { name: "manager", type: PARAM_TYPE.STRING },
    //     { name: "active", type: PARAM_TYPE.BOOLEAN },
    //   ],
    //   methodName: "setManager",
    //   contract: dao.jobBoard,
    //   contractName: "JobBoard",
    // },
    // {
    //   paramArray: [{ name: "projId", type: PARAM_TYPE.STRING }],
    //   methodName: "approveProject",
    //   contract: dao.jobBoard,
    //   contractName: "JobBoard",
    // },
    // {
    //   paramArray: [{ name: "projId", type: PARAM_TYPE.STRING }],
    //   methodName: "disapproveProject",
    //   contract: dao.jobBoard,
    //   contractName: "JobBoard",
    // },
    // {
    //   paramArray: [{ name: "_oneInch", type: PARAM_TYPE.STRING }],
    //   methodName: "setExchange",
    //   contract: dao.jobBoard,
    //   contractName: "JobBoard",
    // },
    // {
    //   paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
    //   methodName: "setTaxRate",
    //   contract: dao.jobBoard,
    //   contractName: "JobBoard",
    // },
    // {
    //   paramArray: [{ name: "rate", type: PARAM_TYPE.NUMBER }],
    //   methodName: "setTaxRateForUndeclared",
    //   contract: dao.jobBoard,
    //   contractName: "JobBoard",
    // },
    // {
    //   paramArray: [
    //     { name: "currency", type: PARAM_TYPE.STRING },
    //     { name: "amount", type: PARAM_TYPE.NUMBER },
    //   ],
    //   methodName: "taxToDividendPool",
    //   contract: dao.jobBoard,
    //   contractName: "JobBoard",
    // },
  ];
};
