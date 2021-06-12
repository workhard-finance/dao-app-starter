import { action, observable } from "mobx";

export class UserConfigStore {
  @observable public tokenAdded = false;

  @action setTokenAdded(v: boolean) {
    this.tokenAdded = v;
  }
}
