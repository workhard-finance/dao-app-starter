import React, { useEffect, useState } from "react";
import Page from "../layouts/Page";
import { Alert, Col, Image, Row } from "react-bootstrap";
import { StakeMiningPool } from "../components/contracts/mining-pool/StakeMiningPool";
import { useWorkhardContracts } from "../providers/WorkhardContractProvider";
import { BigNumber } from "@ethersproject/bignumber";
import { useWeb3React } from "@web3-react/core";
import { parseEther } from "@ethersproject/units";
import { BurnMiningPool } from "../components/contracts/mining-pool/BurnMiningPool";
import { getAddress } from "ethers/lib/utils";
import { getPriceFromCoingecko } from "../utils/coingecko";

const Mine = () => {
  const { library } = useWeb3React();
  const contracts = useWorkhardContracts();
  const [pools, setPools] = useState<string[]>();
  const [poolLength, setPoolLength] = useState<BigNumber>();
  const [visionPrice, setVisionPrice] = useState<number>();
  const [emission, setEmission] = useState<BigNumber>();

  const [liquidityMiningIdx, setLiquidityMiningIdx] = useState<number>(-1);
  const [commitmentMiningIdx, setCommitmentMiningIdx] = useState<number>(-1);

  useEffect(() => {
    if (!!contracts) {
      let stale = false;
      contracts.visionTokenEmitter.getNumberOfPools().then(setPoolLength);
      return () => {
        stale = true;
        setPoolLength(undefined);
      };
    }
  }, [contracts]);

  useEffect(() => {
    if (!!contracts && !!poolLength) {
      let stale = false;
      const { visionTokenEmitter } = contracts;
      Promise.all(
        Array(poolLength.toNumber())
          .fill(0)
          .map((_, i) => visionTokenEmitter.pools(i))
      ).then(setPools);
      return () => {
        stale = true;
        setPools([]);
      };
    }
  }, [contracts, poolLength]);

  useEffect(() => {
    if (!!contracts && !!pools) {
      let stale = false;
      setLiquidityMiningIdx(
        pools.findIndex(
          (v) => getAddress(v) === getAddress(contracts.liquidityMining.address)
        )
      );
      setCommitmentMiningIdx(
        pools.findIndex(
          (v) =>
            getAddress(v) === getAddress(contracts.commitmentMining.address)
        )
      );
      contracts.visionTokenEmitter.getEmission().then(setEmission);
      getPriceFromCoingecko(contracts.visionToken.address).then(setVisionPrice);
      return () => {
        stale = true;
        setPoolLength(undefined);
        setEmission(undefined);
        setLiquidityMiningIdx(-1);
        setCommitmentMiningIdx(-1);
      };
    }
  }, [library, contracts, pools]);

  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/goldrush.jpg"}
        style={{ width: "100%", padding: "0px", borderWidth: "5px" }}
      />
      <h1>Mine</h1>
      <Alert variant={"info"}>
        You can mine $VISION tokens here by providing Uniswap $VISION/ETH pair
        or burning your $COMMITMENT tokens. Currently 50% of the total emission
        goes to the liquidity mining pool and the other 50% goes to the
        commitment mining pool.
      </Alert>
      <Row>
        <Col>
          {pools && liquidityMiningIdx !== -1 && (
            <StakeMiningPool
              poolIdx={liquidityMiningIdx}
              title={"Liquidity Mining"}
              tokenName={"VISION/ETH LP"}
              poolAddress={pools[liquidityMiningIdx]}
              tokenEmission={emission || BigNumber.from(0)}
              visionPrice={visionPrice || 0}
            />
          )}
        </Col>
        <Col>
          {pools && commitmentMiningIdx !== -1 && (
            <BurnMiningPool
              poolIdx={commitmentMiningIdx}
              title={"Commitment Mining"}
              tokenName={"COMMITMENT"}
              poolAddress={pools[commitmentMiningIdx]}
              tokenEmission={emission || BigNumber.from(0)}
              visionPrice={visionPrice || 0}
            />
          )}
        </Col>
      </Row>
      <hr />
      <h1>Boosters</h1>
      <p>
        Workhard finance offers "WORK BOOSTER" for protocols that are posting
        crypto jobs on Workhard finance. If your protocol gets the "WORK
        BOOSTER" by community vote, you can stake that protocol token and share
        a portion of $VISION token emission. If you're willing to start a new
        protocol, get in touch with Workhard community. You can boost your
        protocol while hiring talents in the very crypto way.
      </p>
      {pools?.map((addr, idx) => {
        if (idx === liquidityMiningIdx || idx === commitmentMiningIdx)
          return undefined;
        else
          return (
            <>
              <br />
              <StakeMiningPool
                poolIdx={idx}
                title={"Liquidity Mining"}
                tokenName={"VISION/ETH LP"}
                poolAddress={addr}
                tokenEmission={emission || BigNumber.from(0)}
                visionPrice={visionPrice || 0}
                collapsible={true}
              />
            </>
          );
      })}
    </Page>
  );
};

export default Mine;
