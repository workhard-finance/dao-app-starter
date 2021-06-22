import { constants, Contract, ethers, providers } from "ethers";
import { Pool } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";
import { abi as IUniswapV3PoolABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import { abi as IUniswapV3FactoryABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json";

interface Immutables {
  factory: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  maxLiquidityPerTick: ethers.BigNumber;
}

interface State {
  liquidity: ethers.BigNumber;
  sqrtPriceX96: ethers.BigNumber;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
}

export async function getExactPoolAddress(
  provider: providers.Provider,
  token0: string,
  token1: string,
  fee: number
): Promise<string> {
  const factoryAddr = `0x1F98431c8aD98523631AE4a59f267346ea31F984`;
  const factory = new ethers.Contract(
    factoryAddr,
    IUniswapV3FactoryABI,
    provider
  );
  const poolAddr = await factory.getPool(token0, token1, fee);
  return poolAddr;
}

export async function getPoolAddress(
  provider: providers.Provider,
  token0: string,
  token1: string
): Promise<string | undefined> {
  const pools = await Promise.all(
    [10000, 3000, 500].map((fee) =>
      getExactPoolAddress(provider, token0, token1, fee)
    )
  );
  return pools.find((p) => p !== constants.AddressZero);
}

export async function getPoolContract(
  address: string,
  provider: providers.Provider
): Promise<Contract> {
  const contract = new ethers.Contract(address, IUniswapV3PoolABI, provider);
  return contract;
}

export async function getPoolImmutables(poolContract: Contract) {
  const immutables: Immutables = {
    factory: await poolContract.factory(),
    token0: await poolContract.token0(),
    token1: await poolContract.token1(),
    fee: await poolContract.fee(),
    tickSpacing: await poolContract.tickSpacing(),
    maxLiquidityPerTick: await poolContract.maxLiquidityPerTick(),
  };
  return immutables;
}

export async function getPoolState(poolContract: Contract) {
  const slot = await poolContract.slot0();
  const PoolState: State = {
    liquidity: await poolContract.liquidity(),
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  };
  return PoolState;
}

export async function getPool(poolContract: Contract): Promise<Pool> {
  const immutables = await getPoolImmutables(poolContract);
  const state = await getPoolState(poolContract);
  const TokenA = new Token(1, immutables.token0, 18);
  const TokenB = new Token(1, immutables.token1, 18);
  const pool = new Pool(
    TokenA,
    TokenB,
    immutables.fee,
    state.sqrtPriceX96.toString(),
    state.liquidity.toString(),
    state.tick
  );
  return pool;
}
