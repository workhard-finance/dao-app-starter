import { action, observable } from "mobx";
import { BigNumber } from "ethers";

export class UserStore {
  TOKEN_ADDED_KEY = "workhard_token_added";
  @observable public visionTokenBalance: BigNumber = BigNumber.from(0);
  @observable public commitTokenBalance: BigNumber = BigNumber.from(0);
  @observable public baseTokenBalance: BigNumber = BigNumber.from(0);

  constructor() {
    // console.log("created");
  }

  @action setTokenAdded = (v: boolean) => {
    localStorage.setItem(this.TOKEN_ADDED_KEY, v ? "true" : "false");
  };

  @action setVisionTokenBalance = (v: BigNumber) => {
    // console.log("vision balance",v);
    this.visionTokenBalance = v;
  };

  @action setCommitBalance = (v: BigNumber) => {
    // console.log(v);
    this.commitTokenBalance = v;
  };

  @action setBaseTokenBalance = (v: BigNumber) => {
    this.baseTokenBalance = v;
  };

  get tokenAdded() {
    return localStorage.getItem("workhard_token_added") == "true"
      ? true
      : false;
  }
}
