import React from "react";
import { useWeb3React } from "@web3-react/core";
import { useContext } from "react";
import {
  // deployed,
  Deployed,
  getNetworkName,
} from "@workhard/protocol/dist/deployed";
import devDeploy from "@workhard/protocol/deployed.json";
import {
  BurnMining,
  BurnMining__factory,
  StableReserve,
  StableReserve__factory,
  Project,
  Project__factory,
  StakeMining,
  StakeMining__factory,
  TimelockedGovernance,
  TimelockedGovernance__factory,
  ERC20Mock as ERC20,
  ERC20Mock__factory as ERC20__factory,
  Marketplace,
  Marketplace__factory,
  JobBoard,
  DividendPool,
  VisionEmitter,
  WorkersUnion,
  COMMIT,
  VISION,
  RIGHT,
  JobBoard__factory,
  DividendPool__factory,
  VisionEmitter__factory,
  WorkersUnion__factory,
  VotingEscrowLock,
  VotingEscrowLock__factory,
  COMMIT__factory,
  VISION__factory,
  RIGHT__factory,
} from "@workhard/protocol";

// let deployedContracts: Deployed = deployed;
// if (process.env.REACT_APP_DEV_MODE) {
//   deployedContracts = devDeploy;
// }

let deployedContracts: Deployed = devDeploy;

export interface WorkhardContracts {
  project: Project;
  jobBoard: JobBoard;
  stableReserve: StableReserve;
  dividendPool: DividendPool;
  liquidityMining: StakeMining;
  commitMining: BurnMining;
  visionEmitter: VisionEmitter;
  workersUnion: WorkersUnion;
  timelockedGovernance: TimelockedGovernance;
  baseCurrency: ERC20;
  commit: COMMIT;
  vision: VISION;
  right: RIGHT;
  veLocker: VotingEscrowLock;
  visionLP: ERC20;
  marketplace: Marketplace;
}

export const WorkhardContractCtx = React.createContext<
  WorkhardContracts | undefined
>(undefined);

export function useWorkhardContracts() {
  const contracts = useContext(WorkhardContractCtx);
  return contracts;
}

export const WorkhardContractsProvider = ({ children }: { children: any }) => {
  const { active, library, chainId } = useWeb3React();
  const getContext = () => {
    if (!active) return undefined;
    if (!library) return undefined;
    if (!chainId) return undefined;
    const contracts = deployedContracts[getNetworkName(chainId)];
    if (
      !contracts ||
      !contracts.Project ||
      !contracts.JobBoard ||
      !contracts.DividendPool ||
      !contracts.LiquidityMining ||
      !contracts.CommitMining ||
      !contracts.WorkersUnion ||
      !contracts.TimelockedGovernance ||
      !contracts.BaseCurrency ||
      !contracts.COMMIT ||
      !contracts.VISION ||
      !contracts.RIGHT ||
      !contracts.VisionEmitter ||
      !contracts.VisionLP ||
      !contracts.StableReserve ||
      !contracts.VotingEscrowLock ||
      !contracts.Marketplace
    ) {
      return undefined;
    }

    const project = Project__factory.connect(contracts.Project, library);
    const jobBoard = JobBoard__factory.connect(contracts.JobBoard, library);
    const stableReserve = StableReserve__factory.connect(
      contracts.StableReserve,
      library
    );
    const dividendPool = DividendPool__factory.connect(
      contracts.DividendPool,
      library
    );
    const liquidityMining = StakeMining__factory.connect(
      contracts.LiquidityMining,
      library
    );
    const commitMining = BurnMining__factory.connect(
      contracts.CommitMining,
      library
    );
    const visionEmitter = VisionEmitter__factory.connect(
      contracts.VisionEmitter,
      library
    );
    const workersUnion = WorkersUnion__factory.connect(
      contracts.WorkersUnion,
      library
    );
    const timelockedGovernance = TimelockedGovernance__factory.connect(
      contracts.TimelockedGovernance,
      library
    );
    const baseCurrency = ERC20__factory.connect(
      contracts.BaseCurrency,
      library
    );
    const commit = COMMIT__factory.connect(contracts.COMMIT, library);
    const vision = VISION__factory.connect(contracts.VISION, library);
    const right = RIGHT__factory.connect(contracts.RIGHT, library);
    const veLocker = VotingEscrowLock__factory.connect(
      contracts.VotingEscrowLock,
      library
    );
    const visionLP = ERC20__factory.connect(contracts.VisionLP, library);
    const marketplace = Marketplace__factory.connect(
      contracts.Marketplace,
      library
    );
    const context: WorkhardContracts = {
      project,
      jobBoard,
      dividendPool,
      liquidityMining,
      commitMining,
      visionEmitter,
      stableReserve,
      workersUnion,
      timelockedGovernance,
      baseCurrency,
      commit,
      vision,
      right,
      visionLP,
      marketplace,
      veLocker,
    };
    return context;
  };
  const context = getContext();

  return (
    <WorkhardContractCtx.Provider value={context}>
      {children}
    </WorkhardContractCtx.Provider>
  );
};
