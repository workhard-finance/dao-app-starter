import { action, get, observable } from "mobx";
import { VisionEmitter } from "@workhard/protocol";
import { getAddress } from "ethers/lib/utils";
import { getPriceFromCoingecko } from "../utils/coingecko";
import { BigNumber, Signer } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";

export class MineStore {
  @observable public pools: string[] = [];
  @observable public distributable: boolean = false;
  @observable public visionPrice: number | undefined = 0;
  @observable public emission: BigNumber = BigNumber.from(0);
  @observable public emissionWeightSum: BigNumber = BigNumber.from(0);
  private visionEmitter: VisionEmitter;
  private liquidityMiningAddress: string;
  private commitMiningAddress: string;
  private visionAddress: string;

  constructor(
    visionEmitter: VisionEmitter,
    liquidityMiningAddress: any,
    commitMiningAddress: any,
    visionAddress: any
  ) {
    this.visionEmitter = visionEmitter;
    this.liquidityMiningAddress = liquidityMiningAddress;
    this.commitMiningAddress = commitMiningAddress;
    this.visionAddress = visionAddress;
  }

  @get
  liquidityMiningIdx = () => {
    return this.pools.findIndex(
      (v) => !!v && getAddress(v) === getAddress(this.liquidityMiningAddress)
    );
  };

  @get
  commitMiningIdx = () => {
    return this.pools.findIndex(
      (v) => getAddress(v) === getAddress(this.commitMiningAddress)
    );
  };

  @action
  loadPools = async () => {
    const poolLength = await this.visionEmitter?.getNumberOfPools();
    const _pools = [];
    for (let i = 0; i < poolLength.toNumber(); i++) {
      _pools.push(await this.visionEmitter?.pools(i));
    }
    this.pools = _pools;
  };

  @action
  loadVisionPrice = async () => {
    this.visionPrice = await getPriceFromCoingecko(this.visionAddress);
  };

  @action
  loadEmission = async () => {
    this.emission = await this.visionEmitter.emission();
  };

  @action
  loadEmissionWeightSum = async () => {
    this.emissionWeightSum = (await this.visionEmitter.emissionWeight()).sum;
  };

  @action
  isDistributable = (account: Signer | Provider) => {
    this.visionEmitter
      .connect(account)
      .estimateGas.distribute()
      .then((_) => (this.distributable = true))
      .catch((_) => (this.distributable = false));
  };
}

export const initMineStore = function (
  visionEmitter: VisionEmitter | any,
  liquidityMiningAddress: string | null,
  commitMiningAddress: string | null,
  visionAddress: string | null
) {
  return new MineStore(
    visionEmitter,
    liquidityMiningAddress,
    commitMiningAddress,
    visionAddress
  );
};
