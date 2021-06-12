import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Alert, Button, Col, Image, Row } from "react-bootstrap";
import { ERC20StakeMiningV1 } from "../../components/contracts/mining-pool/ERC20StakeMiningV1";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { BigNumber } from "@ethersproject/bignumber";
import { useWeb3React } from "@web3-react/core";
import { ERC20BurnMiningV1 } from "../../components/contracts/mining-pool/ERC20BurnMiningV1";
import {
  errorHandler,
  handleTransaction,
  prefix,
  TxStatus,
} from "../../utils/utils";
import { useToasts } from "react-toast-notifications";
import { initMineStore, MineStore } from "../../store/mineStore";
import { observer } from "mobx-react";
import { SerHelpPlz } from "../../components/views/HelpSer";
import { TitleButSer } from "../../components/views/TitleButSer";
import {
  ContributionBoard__factory,
  InitialContributorShare__factory,
} from "@workhard/protocol";
import { InitialContributorSharePool } from "../../components/contracts/mining-pool/InitialContributorSharePool";
import { useBlockNumber } from "../../providers/BlockNumberProvider";
import { MiningPool } from "../../components/views/MiningPool";

const Mine = observer(() => {
  const { addToast } = useToasts();
  const { account, library, chainId } = useWeb3React();
  const workhardCtx = useWorkhard();
  const { daoId, dao, periphery } = workhardCtx || {};
  const mineStore: MineStore = initMineStore(
    !!dao ? dao.visionEmitter : null,
    !!periphery ? periphery.liquidityMining.address : null,
    !!periphery ? periphery.commitMining.address : null,
    !!dao ? dao.vision.address : null
  );
  const { blockNumber } = useBlockNumber();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [initialContributor, setInitialContributor] = useState<boolean>();
  const [
    initialContributorShare,
    setInitialContributorShare,
  ] = useState<string>();
  const [
    initialContributorPool,
    setInitialContributorPool,
  ] = useState<string>();

  useEffect(() => {
    if (!!dao && account && library) {
      const signer = library.getSigner(account);
      mineStore.loadPools().then();
      mineStore.isDistributable(signer);
      dao.visionEmitter
        .initialContributorShare()
        .then(setInitialContributorShare)
        .catch(errorHandler(addToast));
      dao.visionEmitter
        .initialContributorPool()
        .then(setInitialContributorPool)
        .catch(errorHandler(addToast));
    }
  }, [dao, blockNumber, account, library]);

  useEffect(() => {
    if (
      !!initialContributorPool &&
      !!initialContributorShare &&
      !!library &&
      !!account
    ) {
      ContributionBoard__factory.connect(initialContributorShare, library)
        .balanceOf(account, daoId || "0")
        .then((bal) => {
          if (bal.gt(0)) {
            setInitialContributor(true);
          }
        });
      InitialContributorShare__factory.connect(initialContributorPool, library)
        .dispatchedMiners(account)
        .then((miners) => {
          if (miners.gt(0)) {
            setInitialContributor(true);
          }
        });
    }
  }, [account, library, initialContributorShare, initialContributorPool]);

  useEffect(() => {
    if (!!dao && !!mineStore.pools) {
      mineStore.loadEmission();
      mineStore.loadEmissionWeightSum();
      mineStore.loadVisionPrice();
    }
  }, [library, dao, txStatus]);

  const distribute = () => {
    if (!!account && !!dao && !!library) {
      const signer = library.getSigner(account);
      handleTransaction(
        dao.visionEmitter.connect(signer).distribute(),
        setTxStatus,
        addToast,
        "You've mined the distribution transaction!!",
        () => mineStore.isDistributable(signer)
      );
    }
  };

  const subPools = mineStore.pools
    ?.map((addr, idx) => {
      if (
        idx === mineStore.liquidityMiningIdx() ||
        idx === mineStore.commitMiningIdx() ||
        !mineStore.emissionWeightSum
      )
        return undefined;
      else
        return (
          <div key={`mine-${addr}-${idx}`}>
            <br />
            <MiningPool
              poolIdx={idx}
              poolAddress={addr}
              totalEmission={mineStore.emission}
              emissionWeightSum={mineStore.emissionWeightSum}
              visionPrice={mineStore.visionPrice || 0}
              collapsible
            />
          </div>
        );
    })
    .filter((pool) => pool !== undefined);

  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/goldrush.jpg"}
        style={{ width: "100%", padding: "0px", borderWidth: "5px" }}
      />
      {mineStore.distributable && (
        <Alert variant={"info"}>
          You just discovered a{" "}
          {workhardCtx?.metadata.visionSymbol || "$VISION"} mine. Please call
          that smart contract function now.
          {"  "}
          <Button onClick={distribute} variant={"info"}>
            distribute()
          </Button>
        </Alert>
      )}
      <TitleButSer link="#todo">Main pools</TitleButSer>
      <p>
        Got some hard earned{" "}
        {workhardCtx && workhardCtx.daoId !== 0
          ? `${workhardCtx.metadata.commitName}(${workhardCtx.metadata.commitSymbol})`
          : "$COMMIT"}{" "}
        wages? Prove your dedication and belief by mining your project's
        on-chain stock option,{" "}
        {workhardCtx && workhardCtx.daoId !== 0
          ? `${workhardCtx.metadata.visionName}(${workhardCtx.metadata.visionSymbol})`
          : "$VISION"}{" "}
        or LP{" "}
        {workhardCtx && workhardCtx.daoId !== 0
          ? workhardCtx.metadata.visionSymbol
          : "$VISION"}
        !
      </p>
      <Row>
        <Col md={6}>
          {mineStore.pools &&
            mineStore.liquidityMiningIdx() !== -1 &&
            workhardCtx &&
            mineStore.emissionWeightSum && (
              <ERC20StakeMiningV1
                poolIdx={mineStore.liquidityMiningIdx()}
                title={"Liquidity Mining"}
                description={`Provide more liquidity for your project's on-chain stock options. LP your ${
                  workhardCtx && workhardCtx.daoId !== 0
                    ? `${workhardCtx.metadata.visionName}(${workhardCtx.metadata.visionSymbol})`
                    : "$VISION"
                } to earn more ${
                  workhardCtx && workhardCtx.daoId !== 0
                    ? workhardCtx.metadata.visionSymbol
                    : "$VISION"
                }`}
                tokenName={`${
                  workhardCtx?.metadata.visionSymbol || "VISION"
                }/ETH LP`}
                link={
                  chainId === 1
                    ? `https://app.sushi.com/add/ETH/${workhardCtx.dao.vision.address}`
                    : `https://app.uniswap.org/#/add/v2/ETH/${workhardCtx.dao.vision.address}`
                }
                poolAddress={workhardCtx.periphery.liquidityMining.address}
                totalEmission={mineStore.emission}
                emissionWeightSum={mineStore.emissionWeightSum}
                visionPrice={mineStore.visionPrice || 0}
              />
            )}
        </Col>
        <Col md={6}>
          {mineStore.pools &&
            mineStore.commitMiningIdx() !== -1 &&
            workhardCtx &&
            mineStore.emissionWeightSum && (
              <ERC20BurnMiningV1
                poolIdx={mineStore.commitMiningIdx()}
                title={"Commit Mining"}
                tokenName={workhardCtx.metadata.commitSymbol}
                description={`Show your true, long-term belief in your project. Burn ${
                  workhardCtx && workhardCtx.daoId !== 0
                    ? `${workhardCtx.metadata.commitName}(${workhardCtx.metadata.commitSymbol})`
                    : "$COMMIT"
                } to continuously mine ${
                  workhardCtx && workhardCtx.daoId !== 0
                    ? `${workhardCtx.metadata.visionName}(${workhardCtx.metadata.visionSymbol})`
                    : "$VISION"
                }`}
                link={prefix(daoId, "/work")}
                poolAddress={workhardCtx.periphery.commitMining.address}
                totalEmission={mineStore.emission || BigNumber.from(0)}
                emissionWeightSum={mineStore.emissionWeightSum}
                visionPrice={mineStore.visionPrice || 0}
              />
            )}
        </Col>
      </Row>

      {subPools.length > 0 && (
        <>
          <br />
          <br />
          <TitleButSer link="#todo">Sub pools</TitleButSer>
          <Row>
            {subPools.map((subPool) => (
              <Col md={4}>{subPool}</Col>
            ))}
          </Row>
        </>
      )}
      {initialContributor && initialContributorPool && (
        <>
          <br />
          <TitleButSer>Early Stage Contributors Pool!</TitleButSer>
          <p>
            You are one of the early stage contributors! Thanks for your hard
            commitment for this project. Enjoy this special rewards!
          </p>
          <InitialContributorSharePool
            poolAddress={initialContributorPool}
            totalEmission={mineStore.emission || BigNumber.from(0)}
            emissionWeightSum={mineStore.emissionWeightSum}
          />
        </>
      )}
      <br />

      <SerHelpPlz>
        <p>
          The two ways to mine{" "}
          {workhardCtx && workhardCtx.daoId !== 0
            ? `${workhardCtx.metadata.visionName}(${workhardCtx.metadata.visionSymbol})`
            : "$VISION"}{" "}
          <a href="#" className="text-info">
            (Emission Detail)
          </a>
          :
          <ol>
            <li>
              Burn{" "}
              {workhardCtx && workhardCtx.daoId !== 0
                ? `${workhardCtx.metadata.commitName}(${workhardCtx.metadata.commitSymbol})`
                : "$COMMIT"}{" "}
              to get{" "}
              {workhardCtx && workhardCtx.daoId !== 0
                ? `${workhardCtx.metadata.visionName}(${workhardCtx.metadata.visionSymbol})`
                : "$VISION"}{" "}
              through COMMIT MINING.
              <a href="#" className="text-info">
                (Example)
              </a>
            </li>
            <li>
              Provide {workhardCtx?.metadata.visionSymbol || "$VISION"}/ETH LP
              token to LIQUIDITY MINE{" "}
              {workhardCtx?.metadata.visionName || "$VISION"}
            </li>
          </ol>
          Stake & lock{" "}
          {workhardCtx && workhardCtx.daoId !== 0
            ? workhardCtx.metadata.visionName
            : "$VISION"}{" "}
          to receive{" "}
          <a href="#" className="text-info">
            {workhardCtx && workhardCtx.daoId !== 0
              ? workhardCtx.metadata.rightName
              : "$RIGHT"}
          </a>{" "}
          (
          {workhardCtx && workhardCtx.daoId !== 0
            ? workhardCtx.metadata.rightSymbol
            : "$veVISION"}
          ) and join to{" "}
          <a href="#" className="text-info">
            govern
          </a>{" "}
          the WORKER’S UNION. With{" "}
          {workhardCtx?.metadata.rightSymbol || "$RIGHT"} you can claim a share
          of the{" "}
          {workhardCtx && workhardCtx.daoId !== 0
            ? workhardCtx.metadata.daoName
            : "Work Hard Finance"}
          ’s profit.
        </p>
      </SerHelpPlz>
    </Page>
  );
});

export default Mine;
