import { action, observable } from "mobx";
import { BigNumber } from "ethers";

export class UserStore {
  @observable public tokenAdded = false;
  @observable public visionTokenBalance: BigNumber = BigNumber.from(0);
  @observable public commitTokenBalance: BigNumber = BigNumber.from(0);
  @observable public baseTokenBalance: BigNumber = BigNumber.from(0);

  @action setTokenAdded = (v: boolean) => {
    this.tokenAdded = v;
  };

  @action setVisionTokenBalance = (v: BigNumber) => {
    console.log(v);
    this.visionTokenBalance = v;
  };

  @action setCommitBalance = (v: BigNumber) => {
    console.log(v);
    this.commitTokenBalance = v;
  };

  @action setBaseTokenBalance = (v: BigNumber) => {
    this.baseTokenBalance = v;
  };
}
