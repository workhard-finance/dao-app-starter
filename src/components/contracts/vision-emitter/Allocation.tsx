import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import {
  compareAddress,
  errorHandler,
  getTokenSymbol,
  getTokenType,
} from "../../../utils/utils";
import { AllocationChart } from "../../views/AllocationChart";
import { useToasts } from "react-toast-notifications";
import { BigNumber, providers } from "ethers";
import { MiningPool__factory } from "@workhard/protocol";
import { useWeb3React } from "@web3-react/core";

export const Allocation = () => {
  const workhardCtx = useWorkhard();
  const { library } = useWeb3React<providers.Web3Provider>();
  const { addToast } = useToasts();

  const [pools, setPools] = useState<
    | {
        baseToken: string;
        poolType: string;
        weight: number;
        name?: string;
      }[]
    | undefined
  >();

  const [founderShareDenom, setFounderShareDenom] = useState<BigNumber>();
  const [emissionWeight, setEmissionWeight] = useState<{
    treasury: BigNumber;
    caller: BigNumber;
    protocol: BigNumber;
    dev: BigNumber;
    sum: BigNumber;
  }>();
  const [emissionWeightForChart, setEmissionWeightForChart] = useState<{
    treasury: number;
    caller: number;
    protocol: number;
    dev: number;
    sum: number;
  }>();

  const getPresetTokenName = (address: string): string | undefined => {
    if (compareAddress(address, workhardCtx?.periphery.visionLP.address)) {
      return "Vision LP";
    } else {
      return undefined;
    }
  };

  useEffect(() => {
    if (workhardCtx && library) {
      workhardCtx.dao.visionEmitter
        .emissionWeight()
        .then(setEmissionWeight)
        .catch(errorHandler(addToast));
      workhardCtx.dao.visionEmitter
        .FOUNDER_SHARE_DENOMINATOR()
        .then(setFounderShareDenom)
        .catch(errorHandler(addToast));
      workhardCtx.dao.visionEmitter
        .getNumberOfPools()
        .then(async (num) => {
          const [_weights, _pools] = await Promise.all([
            Promise.all(
              Array(num.toNumber())
                .fill(workhardCtx.dao.visionEmitter)
                .map((emitter, i) => emitter.getPoolWeight(i))
            ),
            Promise.all(
              Array(num.toNumber())
                .fill(workhardCtx.dao.visionEmitter)
                .map((emitter, i) => emitter.pools(i))
            ),
          ]);
          const [_types, _baseTokens] = await Promise.all([
            Promise.all(
              _pools.map((addr) =>
                workhardCtx.dao.visionEmitter.poolTypes(addr)
              )
            ),
            Promise.all(
              _pools.map((addr) =>
                MiningPool__factory.connect(addr, library).baseToken()
              )
            ),
          ]);
          const fetchedPools = _weights.map((weight, i) => ({
            weight: weight.toNumber(),
            baseToken: _baseTokens[i],
            poolType: _types[i],
            name: undefined,
          }));
          Promise.all(
            fetchedPools.map((pool) => getTokenType(pool.baseToken, library))
          ).then((tokenTypes) =>
            Promise.all(
              fetchedPools.map((pool, i) => {
                const { baseToken } = pool;
                const tokenType = tokenTypes[i];
                return getTokenSymbol(baseToken, tokenType, library);
              })
            ).then((symbols) => {
              console.log("pools", fetchedPools);
              setPools(
                fetchedPools.map((pool, i) => ({ ...pool, name: symbols[i] }))
              );
            })
          );
        })
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, library]);

  useEffect(() => {
    if (pools && emissionWeight && founderShareDenom) {
      let sum = BigNumber.from(0)
        .add(emissionWeight.treasury)
        .add(emissionWeight.caller);
      sum = pools.reduce((acc, pool) => acc.add(pool.weight), sum);
      const dev = sum.div(founderShareDenom);
      sum = sum.add(dev);
      const protocol = emissionWeight.protocol.eq(0)
        ? BigNumber.from(0)
        : sum.div(33);
      sum = sum.add(protocol);
      setEmissionWeightForChart({
        treasury: emissionWeight.treasury.toNumber(),
        caller: emissionWeight.caller.toNumber(),
        protocol: protocol.toNumber(),
        dev: dev.toNumber(),
        sum: sum.toNumber(),
      });
    }
  }, [pools, emissionWeight, founderShareDenom]);

  return (
    <Container>
      {!pools && <p>Fetching...</p>}
      {emissionWeightForChart && (
        <AllocationChart
          pools={
            pools
              ? pools.map((pool) => ({
                  name: `${pool.name || pool.baseToken}`,
                  weight: pool.weight,
                  poolType: pool.poolType,
                }))
              : []
          }
          treasury={emissionWeightForChart.treasury || 1}
          caller={emissionWeightForChart.caller || 0}
          protocol={emissionWeightForChart.protocol || 0}
          founder={emissionWeightForChart.dev || 0}
          sum={emissionWeightForChart.sum || 1}
        />
      )}
    </Container>
  );
};
