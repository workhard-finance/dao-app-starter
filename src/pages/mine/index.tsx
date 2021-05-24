import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Alert, Button, Image, Tab, Tabs } from "react-bootstrap";
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
      <Tabs defaultActiveKey={tab || "vision"}>
        <Tab
          eventKey="vision"
          title="$VISION"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push(prefix(daoId, "/mine/vision"))}
        >
          <Erc20Balance address={dao?.vision.address} symbolAlt={"VISION"} />
        </Tab>
        <Tab
          eventKey="liquidity"
          title="Liquidity Mining"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push(prefix(daoId, "/mine/liquidity"))}
        >
          {(mineStore.pools &&
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
            )) || (
            <p>
              Oops, we cannot find the liquidity mining pool. Are you connected
              to the wallet?
            </p>
          )}
        </Tab>
        <Tab
          eventKey="commit"
          title="Commit Mining"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push(prefix(daoId, "/mine/commit"))}
        >
          {(mineStore.pools &&
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
            )) || (
            <p>
              Oops, we cannot find the commit mining pool. Are you connected to
              the wallet?
            </p>
          )}
        </Tab>
        <Tab
          eventKey="airdrops"
          title="Airdrops"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push(prefix(daoId, "/mine/airdrops"))}
        >
          {altWhenEmptyList(
            <p>Partnerships are on the way 👀</p>,
            mineStore.pools?.map((addr, idx) => {
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
                      collapsible={true}
                    />
                  </div>
                );
            })
          )}
        </Tab>
        <Tab
          eventKey="faq"
          title="FAQ"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push(prefix(daoId, "/mine/faq"))}
        >
          <h5>
            <strong>What can I do with VISION?</strong>
          </h5>
          <p>
            You can stake VISION/ETH LP to the liquidity mining pool and get
            more $VISION. Or lock up your $VISION and get $RIGHT which is the
            voting escrow token (a.k.a. veVISION). You become the Workers
            Union(Workhard DAO) member with $RIGHT, and can vote or claim the
            share of the protocol's profit.
          </p>
          <h5>
            <strong>How the Commit Mining works?</strong>
          </h5>
          <p>
            Commit Mining is the key component of Workhard system to achieve its
            goal for fair work. To explain how it works in more detail let's see
            an example!
            <br />
            <br />
            <ol>
              <li>
                Alice, Bob and Carl worked for the protocol and created profit
                generating applications. So they three now have 10000 $COMMIT
                for each for the compensation.
              </li>
              <li>
                Alice burned 10000 COMMIT / Bob burned 5000 COMMIT / Carl burned
                0 COMMIT
              </li>
              <ul>
                <li>
                  Alice gets 2/3 of the total vision emission for Commit Mining.
                </li>
                <li>
                  Bob gets 1/3 of the total vision emission for Commit Mining.
                </li>
                <li>
                  Bob redeemed 5000 $COMMIT for DAI and Carl redeemed 10000
                  $COMMIT for DAI.
                </li>
                <li>
                  The Stable Reserve now has extra $15000 COMMIT, and can grant
                  them to make more apps for more profits.
                </li>
              </ul>
              <li>
                Alice now wants to leave the community, so wants to sell the
                VISION.
              </li>
              <ul>
                <li>
                  Now she withdraw the mined $VISION and there will be no more
                  emission sharing with her.
                </li>
                <li>
                  It makes sense because she won't contribute to the protocol
                  anymore.
                </li>
                <li>
                  Otherwise, as Alice withraws her mining, Bob will get 3/3 of
                  the future vision emission from now.
                </li>
                <li>
                  It also makes sense, because the protocol is rewarding more to
                  who has more will to contribute to the protocol.
                </li>
              </ul>
            </ol>
            TLDR: Contributors get more $VISION by burning $COMMIT. Once you
            withdraw mined VISION, no more emission sharing unless you burn
            $COMMIT again.
            <br />
          </p>
          <h5>
            <strong>Airdrops?</strong>
          </h5>
          <p>
            Workhard finance offers "WORK BOOSTER" for protocols that are
            posting jobs on Workhard finance. If your protocol gets the "WORK
            BOOSTER" by community voting, you can stake that protocol token and
            share a portion of $VISION token emission. If you're willing to
            start a new protocol, get in touch with Workhard community. You can
            boost your protocol while hiring talents in the very crypto way.
          </p>
          <h5>
            <strong>VISION Emission?</strong>
          </h5>
          <p>
            Emission plan:
            <ul>
              <li>Distribution Amount: 100.22M $VISION for the 1st year</li>
              <li>Initial Boosting Period: ~12 weeks</li>
              <li>Inflation Rate: 36% (yearly)</li>
              <li>
                Weekly Emission Cut: -30% until it reaches 0.6% of weekly
                inflation
              </li>
            </ul>
            Distribution Weights:
            <ul>
              <li>Liquidity Mining: 42.86%</li>
              <li>Commit Mining: 42.86%</li>
              <li>Airdrop: 4.76%</li>
              <li>Treasury: 4.75%</li>
              <li>Team: 4.76%</li>
              <li>Caller Fee: 0.01%</li>
            </ul>
          </p>
        </Tab>
      </Tabs>
    </Page>
  );
});

export default Mine;
