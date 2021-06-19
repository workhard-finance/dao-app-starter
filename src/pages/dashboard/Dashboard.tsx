import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Image, Col, Row, Card, Button, Table } from "react-bootstrap";
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
import { getAddress } from "ethers/lib/utils";
import { useIPFS } from "../../providers/IPFSProvider";
import { OverlayTooltip } from "../../components/OverlayTooltip";
import { Erc20Balance } from "../../components/contracts/erc20/Erc20Balance";
import { FatherSays } from "../../components/views/FatherSays";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Allocation } from "../../components/contracts/vision-emitter/Allocation";
import { SetEmission } from "../../components/contracts/vision-emitter/SetEmission";

const Dashboard = () => {
  const { addToast } = useToasts();

  const workhardCtx = useWorkhard();
  const { daoId } = workhardCtx || { daoId: 0 };

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

  const { ipfs } = useIPFS();
  const [metadata, setMetadata] = useState<ProjectMetadata>();
  const [emissionStarted, setEmissionStarted] = useState<number>();
  const [reserved, setReserved] = useState<BigNumber>();
  const [burnedCommit, setBurnedCommit] = useState<BigNumber>();
  const [baseCurrencySymbol, setBaseCurrencySymbol] = useState<string>();
  const [visionSupply, setVisionSupply] = useState<BigNumber>();
  const [rightSupply, setRightSupply] = useState<BigNumber>();

  useEffect(() => {
    if (daoId === 0) {
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
        .emissionStarted()
        .then((num) => setEmissionStarted(num.toNumber()))
        .catch(errorHandler(addToast));
      workhardCtx.dao.baseCurrency
        .balanceOf(workhardCtx.dao.stableReserve.address)
        .then(setReserved)
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
      workhardCtx.dao.commit
        .totalBurned()
        .then(setBurnedCommit)
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, daoId]);

  useEffect(() => {
    if (!!workhardCtx && !!ipfs) {
      const projId = daoId || 0;
      workhardCtx.project
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
        getAddress(address) ===
        getAddress(workhardCtx.periphery.liquidityMining.address)
      ) {
        return "Liquidity Providers";
      } else if (
        getAddress(address) ===
        getAddress(workhardCtx.periphery.commitMining.address)
      ) {
        return "Commit Burners";
      }
    }
    return address;
  };

  const fetching = (
    <Page>
      <FatherSays say={`Loading...`} />
    </Page>
  );
  const fetched = (
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
          {(daoId || 0) !== 0 && metadata?.url && (
            <Button as={"a"} href={metadata.url} target="_blank" variant="info">
              Go to app
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
            title={workhardCtx?.metadata.commitName || "COMMIT Token"}
            address={workhardCtx?.dao.commit.address}
            symbolAlt={workhardCtx?.metadata.commitSymbol || "COMMIT"}
          >
            <Button as={Link} to={prefix(daoId, "work")}>
              Go to work
            </Button>
          </Erc20Balance>
        </Col>
        <Col md={4}>
          <Erc20Balance
            title={workhardCtx?.metadata.visionName || "VISION Token"}
            address={workhardCtx?.dao.vision.address}
            symbolAlt={workhardCtx?.metadata.visionSymbol || "VISION"}
          >
            <Button as={Link} to={prefix(daoId, "mine")}>
              Go to mine
            </Button>
          </Erc20Balance>
        </Col>
        <Col md={4}>
          <Erc20Balance
            title={workhardCtx?.metadata.rightName || "RIGHT Token"}
            address={workhardCtx?.dao.right.address}
            symbolAlt={workhardCtx?.metadata.rightSymbol || "RIGHT"}
          >
            <Button as={Link} to={prefix(daoId, "gov")}>
              Go to lock ${workhardCtx?.metadata.visionSymbol}
            </Button>
          </Erc20Balance>
        </Col>
      </Row>
      <br />
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
          <Allocation />
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
                  tip={`Governance can mint more ${
                    workhardCtx?.metadata.commitSymbol || "COMMIT"
                  } and give grants to contributors.`}
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
                Burned {workhardCtx?.metadata.commitSymbol || "COMMIT"}
                <OverlayTooltip
                  tip={`A stablecoin to tokenize your revenue stream. Pay your workers with value-added money.`}
                  text={`❔`}
                />
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(burnedCommit || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${workhardCtx?.metadata.commitSymbol || "COMMIT"}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg={"warning"} text={"white"}>
            <Card.Body>
              <Card.Title>
                Total {workhardCtx?.metadata.visionSymbol || "VISION"}
                <OverlayTooltip
                  tip={`Liquid stock options for your project. Believers are ${
                    workhardCtx?.metadata.visionSymbol || "VISION"
                  } long term HODLers. Unbelievers can easily exit.`}
                  text={`❔`}
                />
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(visionSupply || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${workhardCtx?.metadata.visionSymbol || "VISION"}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card bg={"info"} text={"white"}>
            <Card.Body>
              <Card.Title>
                Total {workhardCtx?.metadata.rightSymbol || "RIGHT"}
                <OverlayTooltip
                  tip={`
                  Reward your long term ${
                    workhardCtx?.metadata.visionSymbol || "VISION"
                  } believers with access to devidends and voting power.`}
                  text={`❔`}
                />
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(rightSupply || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${workhardCtx?.metadata.rightSymbol || "RIGHT"}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <br />
      <br />
      <h2>
        <b>Contracts</b>
      </h2>
      <Row>
        <Col md={7}>
          <Table>
            <thead>
              <tr>
                <th scope="col">Contract Name</th>
                <th scope="col">Address</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Workhard Project Contract", workhardCtx?.project.address],
                ["Multisig", workhardCtx?.dao.multisig.address],
                ["Timelock", workhardCtx?.dao.timelock.address],
                [
                  workhardCtx?.metadata.visionName,
                  workhardCtx?.dao.vision.address,
                ],
                [
                  workhardCtx?.metadata.commitName,
                  workhardCtx?.dao.commit.address,
                ],
                [
                  workhardCtx?.metadata.rightName,
                  workhardCtx?.dao.right.address,
                ],
                [
                  workhardCtx?.metadata.baseCurrencySymbol,
                  workhardCtx?.dao.baseCurrency.address,
                ],
                ["Stable Reserve", workhardCtx?.dao.stableReserve.address],
                ["Contribution Board", workhardCtx?.dao.stableReserve.address],
                ["Marketplace", workhardCtx?.dao.marketplace.address],
                ["Dividend Pool", workhardCtx?.dao.dividendPool.address],
                ["Vote Counter", workhardCtx?.dao.voteCounter.address],
                ["Workers Union", workhardCtx?.dao.workersUnion.address],
                ["Token Emitter", workhardCtx?.dao.visionEmitter.address],
                ["Voting Escrow", workhardCtx?.dao.votingEscrow.address],
                [
                  "Commit Mining Pool",
                  workhardCtx?.periphery.commitMining.address,
                ],
                [
                  "Liquidity Mining Pool",
                  workhardCtx?.periphery.liquidityMining.address,
                ],
                [
                  `${workhardCtx?.metadata.visionSymbol}/ETH LP`,
                  workhardCtx?.periphery.visionLP.address,
                ],
              ].map((contract) => (
                <tr>
                  <td>{contract[0]}</td>
                  <td>
                    <>
                      <a
                        href={`https://etherscan.io/address/${contract[1]}`}
                        target="_blank"
                      >
                        {contract[1]}
                      </a>
                    </>
                  </td>
                  <td>
                    <CopyToClipboard
                      text={contract[1] || ""}
                      onCopy={() =>
                        addToast({
                          variant: "info",
                          content: "copied!",
                        })
                      }
                    >
                      <FontAwesomeIcon
                        icon={faCopy}
                        style={{ cursor: "pointer" }}
                      />
                    </CopyToClipboard>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Page>
  );

  return !!metadata && !!workhardCtx ? fetched : fetching;
};

export default Dashboard;
