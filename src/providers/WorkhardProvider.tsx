import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useContext } from "react";
import {
  // deployed,
  Deployed,
  getNetworkName,
  Project,
  Workhard,
  CommonContracts,
  DAO,
  Periphery,
} from "@workhard/protocol";
import deployed from "@workhard/protocol/deployed.json";
import { ethers } from "ethers";
import { Helmet } from "react-helmet";
import { useStores } from "../hooks/user-stores";
import config from "../config.json";
import { WHFAppConfig } from "../types/config";

let deployedContracts: Deployed;
if (process.env.NODE_ENV === "development") {
  try {
    const devDeployed = require("../deployed.dev.json");
    const { mainnet, rinkeby, localhost, hardhat } = devDeployed;
    deployedContracts = {
      mainnet: Object.keys(mainnet).length !== 0 ? mainnet : deployed.mainnet,
      rinkeby: Object.keys(rinkeby).length !== 0 ? rinkeby : deployed.rinkeby,
      localhost,
      hardhat,
    };
  } catch (_err) {}
} else {
  deployedContracts = deployed;
}

export interface DAOMetadata {
  daoName: string;
  daoSymbol: string;
  visionName: string;
  visionSymbol: string;
  commitName: string;
  commitSymbol: string;
  rightName: string;
  rightSymbol: string;
  baseCurrencySymbol: string;
}

export interface WorkhardLibrary {
  daoId: number;
  project: Project;
  dao: DAO;
  periphery: Periphery;
  commons: CommonContracts;
  workhard: Workhard;
  metadata: DAOMetadata;
  web3: {
    active: boolean;
    library: ethers.providers.Web3Provider;
    chainId: number;
  };
}

export const WorkhardCtx = React.createContext<WorkhardLibrary | undefined>(
  undefined
);

export function useWorkhard() {
  const ctx = useContext(WorkhardCtx);
  return ctx;
}

export const WorkhardProvider: React.FC = ({ children }) => {
  const daoId = ((config as any) as WHFAppConfig).daoId;
  const {
    active,
    library,
    chainId,
  } = useWeb3React<ethers.providers.Web3Provider>();
  const [context, setContext] = useState<WorkhardLibrary>();
  const { mineStore } = useStores();
  const getContext = async (
    daoId: number
  ): Promise<WorkhardLibrary | undefined> => {
    if (!active) return undefined;
    if (!library) return undefined;
    if (!chainId) return undefined;
    const contracts = deployedContracts[getNetworkName(chainId)];
    const workhardAddress = contracts?.Project;

    if (!workhardAddress) return undefined;
    const workhard = await Workhard.from(library, workhardAddress);
    const [dao, periphery, daoName, daoSymbol] = await Promise.all([
      workhard.getDAO(daoId),
      workhard.getPeriphery(daoId),
      workhard.project.nameOf(daoId),
      workhard.project.symbolOf(daoId),
    ]);

    if (!dao || !periphery) return undefined;
    const [
      visionName,
      visionSymbol,
      commitName,
      commitSymbol,
      rightName,
      rightSymbol,
      baseCurrencySymbol,
    ] = await Promise.all([
      dao.vision.name(),
      dao.vision.symbol(),
      dao.commit.name(),
      dao.commit.symbol(),
      dao.right.name(),
      dao.right.symbol(),
      dao.baseCurrency.symbol(),
    ]);
    return {
      daoId,
      workhard,
      dao,
      periphery,
      commons: workhard.commons,
      project: workhard.project,
      metadata: {
        daoName,
        daoSymbol,
        visionName,
        visionSymbol,
        commitName,
        commitSymbol,
        rightName,
        rightSymbol,
        baseCurrencySymbol,
      },
      web3: { active, library, chainId },
    };
  };
  useEffect(() => {
    // dao id = 0 : master dao
    if (context) {
      if (context.daoId !== daoId) {
        setContext(undefined);
      }
    }
    getContext(daoId).then((ctx) => {
      mineStore.init(ctx);
      setContext(ctx);
    });
  }, [active, library, chainId, daoId]);

  return (
    <WorkhardCtx.Provider value={context}>
      {context?.daoId !== 0 && (
        <Helmet>{context && <title>{context?.metadata.daoName}</title>}</Helmet>
      )}
      {children}
    </WorkhardCtx.Provider>
  );
};
