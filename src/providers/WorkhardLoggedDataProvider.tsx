import { BigNumber } from "@ethersproject/bignumber";
import React, { useState } from "react";
import { useContext } from "react";
import { useWorkhard } from "./WorkhardProvider";

export interface WorkhardLoggedData {
  projects: string[];
}

const WorkhardLoggedDataCtx = React.createContext<
  WorkhardLoggedData | undefined
>(undefined);

export function useWorkhardLoggedData() {
  const ctx = useContext(WorkhardLoggedDataCtx);
  return ctx;
}

export const WorkhardLoggedDataProvider = ({ children }: { children: any }) => {
  const [projects, setProjects] = useState<string[]>([]);
  const { dao } = useWorkhard() || {};
  if (dao) {
    const { jobBoard } = dao;
    jobBoard
      .queryFilter(jobBoard.filters.ProjectPosted(null))
      .then((result) => console.log("filtered result", result));
    jobBoard.on("ProjectPosted(uint256)", (event: BigNumber) => {
      if (!projects.find((p) => event.toString() === p))
        projects.push(event.toString());
      setProjects(projects);
    });
  }

  return (
    <WorkhardLoggedDataCtx.Provider value={{ projects }}>
      {children}
    </WorkhardLoggedDataCtx.Provider>
  );
};
