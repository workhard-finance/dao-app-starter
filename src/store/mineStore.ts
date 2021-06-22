import React from "react";
import { action, get, observable } from "mobx";
import { formatEther, getAddress } from "ethers/lib/utils";
import { getPriceFromCoingecko } from "../utils/coingecko";
import { BigNumber, Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";
import { WorkhardLibrary } from "../providers/WorkhardProvider";
import { weiToEth } from "../utils/utils";
import { MiningPool__factory } from "@workhard/protocol";
import { getPool, getPoolAddress, getPoolContract } from "../utils/uniV3";

export class MineStore {
  @observable public lib: WorkhardLibrary | undefined;
  @observable public pools: string[] = [];
  @observable public apys: { [poolAddr: string]: number } = {};
  @observable public maxApys: { [poolAddr: string]: number | undefined } = {};
  @observable public distributable: boolean = false;
  @observable public visionPrice: number | undefined = 0;
  @observable public commitPrice: number | undefined = 0;
  @observable public ethPerVision: number | undefined = 0;
  @observable public visionPerLP: number = 0;
  @observable public ethPrice: number | undefined = 0;
  @observable public emission: BigNumber = BigNumber.from(0);
  @observable public emissionWeightSum: BigNumber = BigNumber.from(0);
  @observable private initialContributorPool: string | undefined;
  @observable private commitDaiUniV3Pool: Contract | undefined;

  @get
  liquidityMiningIdx = () => {
    return this.pools.findIndex(
      (v) =>
        !!v && getAddress(v) === this.lib?.periphery.liquidityMining.address
    );
  };

  @get
  commitMiningIdx = () => {
    return this.pools.findIndex(
      (v) => !!v && getAddress(v) === this.lib?.periphery.commitMining.address
    );
  };

  @get
  apy = (poolAddress: string) => {
    return this.apys[poolAddress] || NaN;
  };

  @get
  maxAPY = (poolAddress: string) => {
    return this.maxApys[poolAddress] || NaN;
  };

  @action
  init = async (whfLibrary: WorkhardLibrary | undefined) => {
    this.lib = whfLibrary;
    this.loadPools();
    this.loadEthPrice();
  };

  @action
  loadEthPrice = async () => {
    this.ethPrice = await getPriceFromCoingecko(
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    );
  };

  @action
  loadPools = async () => {
    if (this.lib) {
      const poolLength =
        (await this.lib.dao.visionEmitter.getNumberOfPools()) || 0;
      const _pools = [];
      for (let i = 0; i < poolLength.toNumber(); i++) {
        _pools.push(await this.lib?.dao.visionEmitter?.pools(i));
      }
      this.pools = _pools;
      this.initialContributorPool = await this.lib.dao.visionEmitter.initialContributorPool();
    }
  };

  @action
  loadVisionPrice = async () => {
    if (!this.ethPrice) {
      await this.loadEthPrice();
    }
    if (this.lib && !!this.ethPrice) {
      const {
        reserve0: reservedVISION,
        reserve1: reservedETH,
      } = await this.lib.periphery.visionLP.getReserves();
      const supply = await this.lib.periphery.visionLP.totalSupply();
      const visionPerLP = (2 * weiToEth(reservedVISION)) / weiToEth(supply);
      const ethPerVision = weiToEth(reservedETH) / weiToEth(reservedVISION);
      this.visionPerLP = visionPerLP;
      this.ethPerVision = ethPerVision;
      this.visionPrice = this.ethPrice * ethPerVision;
    }
  };

  @action
  loadCommitPrice = async () => {
    if (!this.commitDaiUniV3Pool && !!this.lib) {
      const poolAddress = await getPoolAddress(
        this.lib.web3.library,
        this.lib.dao.baseCurrency.address,
        this.lib.dao.commit.address
      );
      if (poolAddress) {
        const pool = await getPoolContract(poolAddress, this.lib.web3.library);
        this.commitDaiUniV3Pool = pool;
      }
      if (this.commitDaiUniV3Pool) {
        const pool = await getPool(this.commitDaiUniV3Pool);
        this.commitPrice = parseFloat(pool.token1Price.toFixed());
      }
    }
  };

  @action
  loadAPYs = async () => {
    if (this.pools && this.lib) {
      for (let pool of this.pools) {
        if (pool === this.lib.periphery.liquidityMining.address) {
          this.loadLiquidityMiningAPY();
        } else if (pool === this.lib.periphery.commitMining.address) {
          this.loadCommitMiningAPY();
        } else {
          this.loadERC20StakingAPY(pool);
        }
      }
      this.loadInitialContributorSharePoolAPY();
    }
  };

  @action
  loadEmission = async () => {
    if (this.lib) {
      this.emission = await this.lib.dao.visionEmitter.emission();
    }
  };

  @action
  loadEmissionWeightSum = async () => {
    if (this.lib) {
      this.emissionWeightSum = (
        await this.lib.dao.visionEmitter.emissionWeight()
      ).sum;
    }
  };

  @action
  isDistributable = (account: Signer | Provider) => {
    if (this.lib) {
      this.lib.dao.visionEmitter
        .connect(account)
        .estimateGas.distribute()
        .then((_) => (this.distributable = true))
        .catch((_) => (this.distributable = false));
    }
  };

  @action
  loadLiquidityMiningAPY = async () => {
    if (this.lib) {
      const visionPerYear = weiToEth(
        (await this.lib.periphery.liquidityMining.tokenPerMiner())
          .div(86400 * 7)
          .mul(86400 * 365)
      );
      const apy = 100 * (visionPerYear / this.visionPerLP);
      this.apys[this.lib.periphery.liquidityMining.address] = apy;
    }
  };

  @action
  loadCommitMiningAPY = async () => {
    if (this.lib) {
      const visionPerYear = weiToEth(
        (await this.lib.periphery.commitMining.tokenPerMiner())
          .div(86400 * 7)
          .mul(86400 * 365)
      );
      let commitPrice =
        this.commitPrice ||
        (await getPriceFromCoingecko(this.lib.dao.commit.address));
      commitPrice = Math.min(commitPrice || 1, 2);
      if (commitPrice) {
        const apy =
          100 *
            ((visionPerYear * (this.visionPrice || 0)) / (commitPrice || NaN)) -
          100;
        this.apys[this.lib.periphery.commitMining.address] = apy;
        this.maxApys[this.lib.periphery.commitMining.address] = undefined;
      } else {
        const apy = 100 * (visionPerYear * (this.visionPrice || 0)) - 100;
        this.apys[this.lib.periphery.commitMining.address] = apy * 0.5;
        this.maxApys[this.lib.periphery.commitMining.address] = apy;
      }
    }
  };

  @action
  loadInitialContributorSharePoolAPY = async () => {
    if (this.lib && this.initialContributorPool) {
      const visionPerYear = weiToEth(
        (
          await MiningPool__factory.connect(
            this.initialContributorPool,
            this.lib.web3.library
          ).tokenPerMiner()
        )
          .div(86400 * 7)
          .mul(86400 * 365)
      );
      const apy = 100 * (visionPerYear * (this.visionPrice || 0)) - 100;
      this.apys[this.initialContributorPool] = apy;
    }
  };

  @action
  loadERC20StakingAPY = async (poolAddress: string) => {
    if (this.lib) {
      const initialContributorPool = await this.lib.dao.visionEmitter.initialContributorPool();
      const visionPerYear = weiToEth(
        (
          await MiningPool__factory.connect(
            initialContributorPool,
            this.lib.web3.library
          ).tokenPerMiner()
        )
          .div(86400 * 7)
          .mul(86400 * 365)
      );
      const baseToken = await MiningPool__factory.connect(
        poolAddress,
        this.lib.web3.library
      ).baseToken();
      const baseTokenPrice = await getPriceFromCoingecko(baseToken);
      const apy =
        100 *
        ((visionPerYear * (this.visionPrice || 0)) / (baseTokenPrice || NaN));
      this.apys[initialContributorPool] = apy;
    }
  };

  @action
  loadERC20BurnAPY = async (poolAddress: string) => {
    if (this.lib) {
      const initialContributorPool = await this.lib.dao.visionEmitter.initialContributorPool();
      const visionPerYear = weiToEth(
        (
          await MiningPool__factory.connect(
            initialContributorPool,
            this.lib.web3.library
          ).tokenPerMiner()
        )
          .div(86400 * 7)
          .mul(86400 * 365)
      );
      const baseToken = await MiningPool__factory.connect(
        poolAddress,
        this.lib.web3.library
      ).baseToken();
      const baseTokenPrice = await getPriceFromCoingecko(baseToken);
      const apy =
        100 *
          ((visionPerYear * (this.visionPrice || 0)) /
            (baseTokenPrice || NaN)) -
        100;
      this.apys[initialContributorPool] = apy;
    }
  };
}
