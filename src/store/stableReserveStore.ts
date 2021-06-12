import { action, observable } from "mobx";
import { BigNumber } from "ethers";
import { TxStatus } from "../utils/utils";
import React from "react";

export class StableReserveStore {
  @observable public daiBalance: BigNumber = BigNumber.from(0);
  @observable public commitBalance: BigNumber = BigNumber.from(0);
  @observable public allowance: BigNumber = BigNumber.from(0);
  @observable public spendingDai: BigNumber = BigNumber.from(0);

  @action setDaiBalance = (v: BigNumber) => {
    this.daiBalance = v;
  };
  @action setCommitBalance = (v: BigNumber) => {
    this.commitBalance = v;
  };

  @action setAllowance = (v: BigNumber) => {
    this.allowance = v;
  };
}

const storeContext = React.createContext<StableReserveStore | null>(null);
export const useStableReserveStore = () => {
  const store = React.useContext(storeContext);
  if (!store) {
    // this is especially useful in TypeScript so you don't need to be checking for null all the time
    throw new Error("useStore must be used within a StoreProvider.");
  }
  return store;
};
