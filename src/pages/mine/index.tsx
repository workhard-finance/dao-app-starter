import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import {
  Alert,
  Button,
  Card,
  Col,
  Image,
  Row,
  Tab,
  Tabs,
} from "react-bootstrap";
import { ERC20StakeMiningV1 } from "../../components/contracts/mining-pool/ERC20StakeMiningV1";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { BigNumber } from "@ethersproject/bignumber";
import { useWeb3React } from "@web3-react/core";
import { ERC20BurnMiningV1 } from "../../components/contracts/mining-pool/ERC20BurnMiningV1";
import { Erc20Balance } from "../../components/contracts/erc20/Erc20Balance";
import {
  altWhenEmptyList,
  handleTransaction,
  prefix,
  TxStatus,
} from "../../utils/utils";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useToasts } from "react-toast-notifications";
import { initMineStore, MineStore } from "../../store/mineStore";
import { observer } from "mobx-react";
import { SerHelpPlz } from "../../components/views/HelpSer";
import { TitleButSer } from "../../components/views/TitleButSer";

const Mine = observer(() => {
  const { tab, daoId } = useParams<{ tab?: string; daoId?: string }>();
  const history = useHistory();
  const { addToast } = useToasts();
  const { account, library } = useWeb3React();
  const { dao, periphery } = useWorkhard() || {};
  const mineStore: MineStore = initMineStore(
    !!dao ? dao.visionEmitter : null,
    !!periphery ? periphery.liquidityMining.address : null,
    !!periphery ? periphery.commitMining.address : null,
    !!dao ? dao.vision.address : null
  );
  const [txStatus, setTxStatus] = useState<TxStatus>();

  useEffect(() => {
    if (!!dao) {
      mineStore.loadPools().then();
      mineStore.isDistributable();
    }
  }, [dao]);

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
        mineStore.isDistributable
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
            <ERC20StakeMiningV1
              poolIdx={idx}
              title={"Stake"}
              poolAddress={addr}
              totalEmission={mineStore.emission}
              emissionWeightSum={mineStore.emissionWeightSum}
              visionPrice={mineStore.visionPrice || 0}
            />
          </div>
        );
    })
    .filter((pool) => pool !== undefined);

  return (
    <Page>
      {!daoId && (
        <Image
          className="jumbotron"
          src={process.env.PUBLIC_URL + "/images/goldrush.jpg"}
          style={{ width: "100%", padding: "0px", borderWidth: "5px" }}
        />
      )}
      {mineStore.distributable && (
        <Alert variant={"info"}>
          You just discovered a $VISION mine. Please call that smart contract
          function now.
          {"  "}
          <Button onClick={distribute} variant={"info"}>
            distribute()
          </Button>
        </Alert>
      )}
      <TitleButSer link="#todo">Main pools</TitleButSer>
      <Row>
        <Col md={6}>
          {mineStore.pools &&
            mineStore.liquidityMiningIdx() !== -1 &&
            mineStore.emissionWeightSum && (
              <ERC20StakeMiningV1
                poolIdx={mineStore.liquidityMiningIdx()}
                title={"Liquidity Mining"}
                tokenName={"VISION/ETH LP"}
                poolAddress={mineStore.pools[mineStore.liquidityMiningIdx()]}
                totalEmission={mineStore.emission}
                emissionWeightSum={mineStore.emissionWeightSum}
                visionPrice={mineStore.visionPrice || 0}
              />
            )}
        </Col>
        <Col md={6}>
          {mineStore.pools &&
            mineStore.commitMiningIdx() !== -1 &&
            mineStore.emissionWeightSum && (
              <ERC20BurnMiningV1
                poolIdx={mineStore.commitMiningIdx()}
                title={"Commit Mining"}
                tokenName={"COMMIT"}
                poolAddress={mineStore.pools[mineStore.commitMiningIdx()]}
                totalEmission={mineStore.emission || BigNumber.from(0)}
                emissionWeightSum={mineStore.emissionWeightSum}
                visionPrice={mineStore.visionPrice || 0}
              />
            )}
        </Col>
      </Row>
      <br />
      <SerHelpPlz>
        <p>
          The two ways to mine $VISION{" "}
          <a href="#" className="text-info">
            (Emission Detail)
          </a>
          :
          <ol>
            <li>
              Burn $COMMIT to get $VISION through COMMIT MINING $VISION.
              <a href="#" className="text-info">
                (Example)
              </a>
            </li>
            <li>Provide $VISION/$ETH LP token to LIQUIDITY MINE $VISION</li>
          </ol>
          Stake & lock $VISION to receive{" "}
          <a href="#" className="text-info">
            $RIGHT
          </a>{" "}
          ($veVISION) and join to{" "}
          <a href="#" className="text-info">
            govern
          </a>{" "}
          the WORKER’S UNION. With $RIGHT you can claim a share of the Work Hard
          Finance’s profit.
        </p>
      </SerHelpPlz>

      {subPools.length > 0 && (
        <>
          <hr />
          <TitleButSer link="#todo">Sub pools</TitleButSer>
          {subPools}
        </>
      )}
    </Page>
  );
});

export default Mine;
