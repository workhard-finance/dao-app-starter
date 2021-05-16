import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Alert, Button, Col, Image, Row, Tab, Tabs } from "react-bootstrap";
import { StakeMiningPool } from "../../components/contracts/mining-pool/StakeMiningPool";
import { useWorkhardContracts } from "../../providers/WorkhardContractProvider";
import { BigNumber } from "@ethersproject/bignumber";
import { useWeb3React } from "@web3-react/core";
import { parseEther } from "@ethersproject/units";
import { BurnMiningPool } from "../../components/contracts/mining-pool/BurnMiningPool";
import { getAddress } from "ethers/lib/utils";
import { getPriceFromCoingecko } from "../../utils/coingecko";
import { ContractReceipt } from "@ethersproject/contracts";
import { Erc20Balance } from "../../components/contracts/erc20/Erc20Balance";

const Mine = () => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  const [pools, setPools] = useState<string[]>();
  const [poolLength, setPoolLength] = useState<BigNumber>();
  const [visionPrice, setVisionPrice] = useState<number>();
  const [emission, setEmission] = useState<BigNumber>();
  const [emissionWeightSum, setEmissionWeightSum] = useState<BigNumber>();
  const [distributionEnabled, setDistributionEnabled] = useState<boolean>(
    false
  );

  const [liquidityMiningIdx, setLiquidityMiningIdx] = useState<number>(-1);
  const [commitMiningIdx, setCommitMiningIdx] = useState<number>(-1);
  const [lastTx, setLastTx] = useState<ContractReceipt>();

  useEffect(() => {
    if (!!contracts) {
      let stale = false;
      contracts.visionEmitter.getNumberOfPools().then(setPoolLength);
      contracts.visionEmitter.estimateGas
        .distribute()
        .then((_) => setDistributionEnabled(true))
        .catch((_) => setDistributionEnabled(false));
      return () => {
        stale = true;
        setPoolLength(undefined);
      };
    }
  }, [contracts]);

  useEffect(() => {
    if (!!contracts && !!poolLength) {
      let stale = false;
      const { visionEmitter } = contracts;
      Promise.all(
        Array(poolLength.toNumber())
          .fill(0)
          .map((_, i) => visionEmitter.pools(i))
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
      setCommitMiningIdx(
        pools.findIndex(
          (v) => getAddress(v) === getAddress(contracts.commitMining.address)
        )
      );
      contracts.visionEmitter.emission().then(setEmission);
      contracts.visionEmitter.emissionWeight().then((w) => {
        setEmissionWeightSum(w.sum);
      });
      getPriceFromCoingecko(contracts.vision.address).then(setVisionPrice);
      return () => {
        stale = true;
        setPoolLength(undefined);
        setEmission(undefined);
        setLiquidityMiningIdx(-1);
        setCommitMiningIdx(-1);
      };
    }
  }, [library, contracts, pools]);

  const distribute = () => {
    if (!!account && !!contracts && !!library) {
      const signer = library.getSigner(account);
      contracts.visionEmitter
        .connect(signer)
        .distribute()
        .then((tx) => {
          tx.wait().then(setLastTx);
        })
        .catch(alert);
    }
  };

  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/goldrush.jpg"}
        style={{ width: "100%", padding: "0px", borderWidth: "5px" }}
      />
      {distributionEnabled && (
        <Alert variant={"info"}>
          You just discovered a $VISION mine. Please call that smart contract
          function now.
          {"  "}
          <Button onClick={distribute} variant={"info"}>
            distribute()
          </Button>
        </Alert>
      )}
      <Tabs defaultActiveKey="vision">
        <Tab eventKey="vision" title="$VISION" style={{ marginTop: "1rem" }}>
          <Erc20Balance address={contracts?.vision.address} />
        </Tab>
        <Tab
          eventKey="liquidity-mining"
          title="Liquidity Mining"
          style={{ marginTop: "1rem" }}
        >
          {(pools && liquidityMiningIdx !== -1 && emissionWeightSum && (
            <StakeMiningPool
              poolIdx={liquidityMiningIdx}
              title={"Liquidity Mining"}
              tokenName={"VISION/ETH LP"}
              poolAddress={pools[liquidityMiningIdx]}
              totalEmission={emission || BigNumber.from(0)}
              emissionWeightSum={emissionWeightSum}
              visionPrice={visionPrice || 0}
            />
          )) || <h1>Not Found</h1>}
        </Tab>
        <Tab
          eventKey="commit-mining"
          title="Commit Mining"
          style={{ marginTop: "1rem" }}
        >
          {(pools && commitMiningIdx !== -1 && emissionWeightSum && (
            <BurnMiningPool
              poolIdx={commitMiningIdx}
              title={"Commit Mining"}
              tokenName={"COMMIT"}
              poolAddress={pools[commitMiningIdx]}
              totalEmission={emission || BigNumber.from(0)}
              emissionWeightSum={emissionWeightSum}
              visionPrice={visionPrice || 0}
            />
          )) || <h1>Not Found</h1>}
        </Tab>
        <Tab
          eventKey="airdrop-mining"
          title="Airdrops"
          style={{ marginTop: "1rem" }}
        >
          <p>
            Workhard finance offers "WORK BOOSTER" for protocols that are
            posting crypto jobs on Workhard finance. If your protocol gets the
            "WORK BOOSTER" by community vote, you can stake that protocol token
            and share a portion of $VISION token emission. If you're willing to
            start a new protocol, get in touch with Workhard community. You can
            boost your protocol while hiring talents in the very crypto way.
          </p>
          {pools?.map((addr, idx) => {
            if (
              idx === liquidityMiningIdx ||
              idx === commitMiningIdx ||
              !emissionWeightSum
            )
              return undefined;
            else
              return (
                <div key={`mine-${addr}-${idx}`}>
                  <br />
                  <StakeMiningPool
                    poolIdx={idx}
                    title={"Stake"}
                    poolAddress={addr}
                    totalEmission={emission || BigNumber.from(0)}
                    emissionWeightSum={emissionWeightSum}
                    visionPrice={visionPrice || 0}
                    collapsible={true}
                  />
                </div>
              );
          })}
        </Tab>
      </Tabs>
    </Page>
  );
};

export default Mine;
