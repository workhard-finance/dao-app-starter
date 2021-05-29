import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Image, Col, Row, Card, Button } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { EmissionChart } from "../../components/views/EmissionChart";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { BigNumber } from "@ethersproject/bignumber";
import { useToasts } from "react-toast-notifications";
import {
  bigNumToFixed,
  errorHandler,
  fetchProjectMetadataFromIPFS,
  prefix,
  ProjectMetadata,
  uriToURL,
} from "../../utils/utils";
import { getIcapAddress } from "ethers/lib/utils";
import { AllocationChart } from "../../components/views/AllocationChart";
import { useIPFS } from "../../providers/IPFSProvider";
import { constants } from "ethers";
import { OverlayTooltip } from "../../components/OverlayTooltip";
import { Erc20Balance } from "../../components/contracts/erc20/Erc20Balance";

const Dashboard = () => {
  const { daoId } = useParams<{ tab?: string; daoId?: string }>();
  const { addToast } = useToasts();

  const workhardCtx = useWorkhard();

  const [emissionRule, setEmissionRule] = useState<{
    initialEmission: BigNumber;
    emissionCut: number;
    minimumRate: number;
    currentWeek: number;
  }>({
    initialEmission: BigNumber.from(0),
    emissionCut: 0,
    minimumRate: 0,
    currentWeek: 0,
  });

  const [emissionWeight, setEmissionWeight] = useState<{
    treasury: BigNumber;
    caller: BigNumber;
    protocol: BigNumber;
    dev: BigNumber;
    sum: BigNumber;
  }>();

  const [poolNum, setPoolNum] = useState<number>();
  const { ipfs } = useIPFS();
  const [pools, setPools] = useState<{ name: string; weight: number }[]>();
  const [metadata, setMetadata] = useState<ProjectMetadata>();
  const [emissionStarted, setEmissionStarted] = useState<number>();
  const [reserved, setReserved] = useState<BigNumber>();
  const [burnedCommit, setBurnedCommit] = useState<BigNumber>();
  const [visionName, setVisionName] = useState<string>();
  const [commitName, setCommitName] = useState<string>();
  const [rightName, setRightName] = useState<string>();
  const [visionSymbol, setVisionSymbol] = useState<string>();
  const [commitSymbol, setCommitSymbol] = useState<string>();
  const [rightSymbol, setRightSymbol] = useState<string>();
  const [baseCurrencySymbol, setBaseCurrencySymbol] = useState<string>();
  const [visionSupply, setVisionSupply] = useState<BigNumber>();
  const [rightSupply, setRightSupply] = useState<BigNumber>();

  useEffect(() => {
    if (!daoId || parseInt(daoId) === 0) {
      // fast load for master dao
      setMetadata({
        name: "Work Hard Finance",
        description:
          "Work Hard Finance empowers contributors with the choice to be compensated now, in stablecoins, or in the future via liquid stock options. No more stressful haggling over what’s fair — your compensation, in your hands, real time.",
        image: "ipfs://QmPj8nm5d9hPVp7te9qiAWYvDkdnQaz1uNgU9mxN5ym5Ei",
        url: "https://workhard.finance",
      });
    }
    if (workhardCtx) {
      const id = daoId || 0;
      // get emission rule
      Promise.all([
        workhardCtx.dao.visionEmitter.INITIAL_EMISSION(),
        workhardCtx.dao.visionEmitter.emissionCutRate(),
        workhardCtx.dao.visionEmitter.minEmissionRatePerWeek(),
        workhardCtx.dao.visionEmitter.emissionWeekNum(),
      ])
        .then(([initialEmission, emissionCut, minimumRate, currentWeek]) => {
          setEmissionRule({
            initialEmission,
            emissionCut: emissionCut.toNumber(),
            minimumRate: minimumRate.toNumber(),
            currentWeek: currentWeek.toNumber(),
          });
        })
        .catch(errorHandler(addToast));
      workhardCtx.dao.visionEmitter
        .emissionWeight()
        .then(setEmissionWeight)
        .catch(errorHandler(addToast));
      workhardCtx.dao.visionEmitter
        .getNumberOfPools()
        .then((num) => setPoolNum(num.toNumber()))
        .catch(errorHandler(addToast));
      workhardCtx.dao.visionEmitter
        .emissionStarted()
        .then((num) => setEmissionStarted(num.toNumber()))
        .catch(errorHandler(addToast));
      workhardCtx.dao.baseCurrency
        .balanceOf(workhardCtx.dao.stableReserve.address)
        .then(setReserved)
        .catch(errorHandler(addToast));
      workhardCtx.dao.commit
        .balanceOf(constants.AddressZero)
        .then(setBurnedCommit)
        .catch(errorHandler(addToast));
      workhardCtx.dao.vision
        .name()
        .then(setVisionName)
        .catch(errorHandler(addToast));
      workhardCtx.dao.vision
        .symbol()
        .then(setVisionSymbol)
        .catch(errorHandler(addToast));
      workhardCtx.dao.commit
        .name()
        .then(setCommitName)
        .catch(errorHandler(addToast));
      workhardCtx.dao.commit
        .symbol()
        .then(setCommitSymbol)
        .catch(errorHandler(addToast));
      workhardCtx.dao.right
        .name()
        .then(setRightName)
        .catch(errorHandler(addToast));
      workhardCtx.dao.right
        .symbol()
        .then(setRightSymbol)
        .catch(errorHandler(addToast));
      workhardCtx.dao.baseCurrency
        .symbol()
        .then(setBaseCurrencySymbol)
        .catch(errorHandler(addToast));
      workhardCtx.dao.vision
        .totalSupply()
        .then(setVisionSupply)
        .catch(errorHandler(addToast));
      workhardCtx.dao.right
        .totalSupply()
        .then(setRightSupply)
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, daoId]);

  useEffect(() => {
    if (!!workhardCtx && !!poolNum) {
      Promise.all([
        Promise.all(
          Array(poolNum)
            .fill(workhardCtx.dao.visionEmitter)
            .map((emitter, i) => emitter.getPoolWeight(i))
        ),
        Promise.all(
          Array(poolNum)
            .fill(workhardCtx.dao.visionEmitter)
            .map((emitter, i) => emitter.pools(i))
        ),
      ])
        .then(([weights, pools]) =>
          setPools(
            weights.map((w, i) => ({
              weight: w.toNumber(),
              name: poolName(pools[i]),
            }))
          )
        )
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, daoId, poolNum]);

  useEffect(() => {
    if (!!workhardCtx && !!ipfs) {
      const projId = daoId || 0;
      workhardCtx.workhard
        .tokenURI(projId)
        .then(async (uri) => {
          setMetadata(await fetchProjectMetadataFromIPFS(ipfs, uri));
        })
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, daoId, ipfs]);

  const poolName = (address: string): string => {
    if (workhardCtx) {
      if (
        getIcapAddress(address) ===
        getIcapAddress(workhardCtx.periphery.liquidityMining.address)
      ) {
        return "Liquidity Providers";
      } else if (
        getIcapAddress(address) ===
        getIcapAddress(workhardCtx.periphery.commitMining.address)
      ) {
        return "Commit Burners";
      }
    }
    return address;
  };

  return (
    <Page>
      <Row>
        <Col md={5}>
          <Image
            src={
              metadata
                ? uriToURL(metadata.image)
                : process.env.PUBLIC_URL + "/images/daily-life.jpeg"
            }
            style={{ maxWidth: "100%" }}
          />
        </Col>
        <Col md={7}>
          <h2>
            What is <b>{metadata?.name}?</b>
          </h2>
          <p>{metadata?.description}</p>
          {metadata?.url && (
            <Button as={Link} to={metadata.url} variant="info">
              Go to homepage
            </Button>
          )}
        </Col>
      </Row>
      <hr />
      <h2>
        <b>Your balance</b>
      </h2>
      <Row>
        <Col md={4}>
          <Erc20Balance
            title={commitName || "COMMIT Token"}
            address={workhardCtx?.dao.commit.address}
            symbolAlt={commitSymbol || "COMMIT"}
          >
            <Button as={Link} to={prefix(daoId, "work")}>
              Go to work
            </Button>
          </Erc20Balance>
        </Col>
        <Col md={4}>
          <Erc20Balance
            title={visionName || "VISION Token"}
            address={workhardCtx?.dao.vision.address}
            symbolAlt={visionSymbol || "VISION"}
          >
            <Button as={Link} to={prefix(daoId, "mine")}>
              Go to mine
            </Button>
          </Erc20Balance>
        </Col>
        <Col md={4}>
          <Erc20Balance
            title={rightName || "RIGHT Token"}
            address={workhardCtx?.dao.right.address}
            symbolAlt={rightSymbol || "RIGHT"}
          >
            <Button as={Link} to={prefix(daoId, "gov")}>
              Go to lock ${visionSymbol}
            </Button>
          </Erc20Balance>
        </Col>
      </Row>
      <hr />
      <Row>
        <Col md={6}>
          <h2>
            <b>Emission</b> schedule
          </h2>
          <EmissionChart {...emissionRule} />
          <p>
            Emission started at{" "}
            {emissionStarted && new Date(emissionStarted * 1000).toDateString()}{" "}
            and its first distribution was{" "}
            {emissionStarted &&
              new Date(
                emissionStarted * 1000 + 86400 * 7 * 1000
              ).toDateString()}
          </p>
        </Col>
        <Col md={6}>
          <h2>
            <b>Allocation</b>
          </h2>
          <AllocationChart
            pools={pools || []}
            treasury={emissionWeight?.treasury.toNumber() || 1}
            caller={emissionWeight?.caller.toNumber() || 0}
            protocol={emissionWeight?.protocol.toNumber() || 0}
            founder={emissionWeight?.dev.toNumber() || 0}
            sum={emissionWeight?.sum.toNumber() || 1}
          />
        </Col>
      </Row>
      <h2>
        <b>Statistics</b>
      </h2>
      <Row>
        <Col md={3}>
          <Card bg={"success"} text={"white"}>
            <Card.Body>
              <Card.Title>
                Reserved Stables
                <OverlayTooltip
                  tip={
                    "Governance can mint more $COMMIT and give grants to contributors."
                  }
                  text={`❔`}
                />
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(reserved || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${baseCurrencySymbol}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg={"danger"} text={"white"}>
            <Card.Body>
              <Card.Title>
                Burned Commits
                <OverlayTooltip
                  tip={
                    "Governance can mint more $COMMIT and give grants to contributors."
                  }
                  text={`❔`}
                />
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(burnedCommit || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${commitSymbol || "COMMIT"}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg={"warning"} text={"white"}>
            <Card.Body>
              <Card.Title>
                Total Vision
                <OverlayTooltip
                  tip={
                    "Governance can mint more $COMMIT and give grants to contributors."
                  }
                  text={`❔`}
                />
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(visionSupply || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${visionSymbol || "VISION"}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg={"info"} text={"white"}>
            <Card.Body>
              <Card.Title>
                Total Rights
                <OverlayTooltip
                  tip={
                    "Governance can mint more $COMMIT and give grants to contributors."
                  }
                  text={`❔`}
                />
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(rightSupply || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${rightSymbol || "RIGHT"}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Page>
  );
};

export default Dashboard;
