import { action, observable } from "mobx";
import { BigNumber } from "ethers";

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
