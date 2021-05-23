import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useContext } from "react";
import {
  // deployed,
  Deployed,
  getNetworkName,
  Workhard,
  WorkhardClient,
  WorkhardCommons,
  WorkhardDAO,
  WorkhardPeriphery,
} from "@workhard/protocol";
import deployed from "@workhard/protocol/deployed.json";
import { useRouteMatch } from "react-router-dom";
import { BigNumber, BigNumberish, ethers } from "ethers";

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

export interface WorkhardLibrary {
  workhard: Workhard;
  dao: WorkhardDAO;
  periphery: WorkhardPeriphery;
  commons: WorkhardCommons;
  client: WorkhardClient;
}

export const WorkhardCtx = React.createContext<WorkhardLibrary | undefined>(
  undefined
);

export function useWorkhard() {
  const ctx = useContext(WorkhardCtx);
  return ctx;
}

export const WorkhardProvider: React.FC = ({ children }) => {
  const {
    active,
    library,
    chainId,
  } = useWeb3React<ethers.providers.Web3Provider>();
  const match = useRouteMatch<{ daoId?: string }>("/:daoId?/");
  const parsed = parseInt(match?.params.daoId || "0");
  const daoId = Number.isNaN(parsed) ? 0 : parsed;
  console.log("daoId", daoId);
  const [context, setContext] = useState<WorkhardLibrary>();
  const getContext = async (
    daoId: BigNumberish
  ): Promise<WorkhardLibrary | undefined> => {
    if (!active) return undefined;
    if (!library) return undefined;
    if (!chainId) return undefined;
    const contracts = deployedContracts[getNetworkName(chainId)];
    const workhardAddress = contracts?.Workhard;

    if (!workhardAddress) return undefined;
    const client = await WorkhardClient.from(library, workhardAddress);
    const [dao, periphery] = await Promise.all([
      client.getDAO(daoId),
      client.getPeriphery(daoId),
    ]);
    if (!dao || !periphery) return undefined;
    return {
      client,
      dao,
      periphery,
      commons: client.commons,
      workhard: client.workhard,
    };
  };
  useEffect(() => {
    // dao id = 0 : master dao
    getContext(daoId).then((ctx) => {
      setContext(ctx);
    });
  }, [active, library, chainId, daoId]);

  return (
    <WorkhardCtx.Provider value={context}>{children}</WorkhardCtx.Provider>
  );
};
