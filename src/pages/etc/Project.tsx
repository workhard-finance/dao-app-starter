import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";

import {
  Row,
  Col,
  Tab,
  Nav,
  Card,
  Button,
  Image,
  Badge,
} from "react-bootstrap";
import ReactHtmlParser from "react-html-parser";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { BigNumber } from "ethers";
import { useParams } from "react-router";
import { useWeb3React } from "@web3-react/core";
import { Pay } from "../../components/contracts/contribution-board/Pay";
import { FundProject } from "../../components/contracts/contribution-board/FundProject";
import { useHistory } from "react-router-dom";
import {
  bigNumToFixed,
  errorHandler,
  fetchProjectMetadataFromIPFS,
  ProjectMetadata,
  uriToURL,
  wrapUrl,
} from "../../utils/utils";
import { ExecuteBudget } from "../../components/contracts/contribution-board/ExecuteBudget";
import { useIPFS } from "../../providers/IPFSProvider";
import { useToasts } from "react-toast-notifications";
import { TitleButSer } from "../../components/views/TitleButSer";
import { SerHelpPlz } from "../../components/views/HelpSer";
import { ContributorChart } from "../../components/views/ContributorChart";
import { OverlayTooltip } from "../../components/OverlayTooltip";
import { Grant } from "../../components/contracts/stable-reserve/Grant";
import { Stream } from "../../components/contracts/sablier/Stream";
import { formatEther, getAddress } from "ethers/lib/utils";
import { getNetworkName } from "@workhard/protocol";
import { ProjectAdmin } from "../../components/contracts/contribution-board/ProjectAdmin";

export const Project: React.FC = () => {
  const { account, library, chainId } = useWeb3React();
  const history = useHistory();
  const workhardCtx = useWorkhard();
  const { ipfs } = useIPFS();
  const { addToast } = useToasts();

  const { id } = useParams<{ id: string }>();
  const [metadata, setMeatadata] = useState<ProjectMetadata>();
  const [fund, setFund] = useState<BigNumber>();
  const [budgetOwner, setBudgetOwner] = useState("");
  const [exist, setExist] = useState<boolean>(true);
  const [streams, setStreams] = useState<BigNumber[]>([]);
  const [contributors, setContributors] = useState<string[]>([]);
  const [hasAdminPermission, setHasAdminPermission] = useState<boolean>();
  const [minimumShare, setMinimumShare] = useState<BigNumber>();
  const [ownedByMultisig, setOwnedByMultisig] = useState<boolean>();
  const [totalContribution, setTotalContribution] = useState<BigNumber>();

  useEffect(() => {
    if (!!workhardCtx && !!ipfs && account && !!chainId) {
      const { dao, workhard } = workhardCtx;
      const { contributionBoard } = dao;
      workhard
        .ownerOf(id)
        .then((owner) => {
          setBudgetOwner(owner);
          if (getAddress(account) === getAddress(owner)) {
            setHasAdminPermission(true);
          } else {
            const network = getNetworkName(chainId);
            const gnosisAPI =
              network === "mainnet"
                ? `https://safe-transaction.gnosis.io/api/v1/`
                : network === "rinkeby"
                ? `https://safe-transaction.rinkeby.gnosis.io/api/v1/`
                : undefined;

            if (gnosisAPI) {
              fetch(gnosisAPI + `safes/${owner}/`)
                .then(async (response) => {
                  const result = await response.json();
                  if ((result.owners as string[]).length > 0) {
                    setOwnedByMultisig(true);
                  }
                  if (
                    (result.owners as string[])
                      .map(getAddress)
                      .includes(getAddress(account))
                  ) {
                    setHasAdminPermission(true);
                  }
                })
                .catch((_) => {
                  setOwnedByMultisig(false);
                  setHasAdminPermission(false);
                });
            } else {
              setOwnedByMultisig(false);
            }
          }
        })
        .catch(() => setExist(false));
      workhard
        .tokenURI(id)
        .then(async (uri) => {
          setMeatadata(await fetchProjectMetadataFromIPFS(ipfs, uri));
        })
        .catch(errorHandler(addToast));
      contributionBoard
        .projectFund(id)
        .then(setFund)
        .catch(errorHandler(addToast));
      contributionBoard
        .minimumShare(id)
        .then(setMinimumShare)
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, ipfs, account, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

  useEffect(() => {
    if (workhardCtx) {
      workhardCtx.dao.contributionBoard
        .getStreams(id)
        .then(setStreams)
        .catch(errorHandler(addToast));
      workhardCtx.dao.contributionBoard
        .getContributors(id)
        .then(setContributors)
        .catch(errorHandler(addToast));
      workhardCtx.dao.contributionBoard
        .totalSupplyOf(id)
        .then(setTotalContribution)
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx]);

  const WhenNotExist = () => <p>Not exist</p>;
  const WhenExist = () => (
    <>
      <Card>
        <Card.Body>
          <Row>
            <Col md={2}>
              <Card>
                <Image
                  style={{ borderRadius: 0 }}
                  src={uriToURL(
                    metadata?.image ||
                      "QmZ6WAhrUArQPQHQZFJBaQnHDcu5MhcrnfyfX4uwLHWMj1"
                  )}
                />
              </Card>
            </Col>
            <Col md={4}>
              <Card.Subtitle>Budget owner</Card.Subtitle>
              <Card.Text>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://etherscan.com/address/${budgetOwner}`}
                >
                  {budgetOwner}
                </a>
              </Card.Text>
              {metadata?.url && (
                <>
                  <Card.Subtitle>URL</Card.Subtitle>
                  <Card.Text>
                    <a href={metadata.url} target="_blank">
                      {metadata.url}
                    </a>
                  </Card.Text>
                </>
              )}
              <Card.Subtitle>Total contributions</Card.Subtitle>
              <Card.Text>
                {bigNumToFixed(totalContribution || 0)}{" "}
                {workhardCtx?.metadata.commitSymbol || "COMMIT"}(s)
              </Card.Text>
            </Col>
            <Col md={6}>
              <Card.Subtitle>Description</Card.Subtitle>
              <Card.Text>
                {ReactHtmlParser(wrapUrl(metadata?.description || ""))}
              </Card.Text>
              {minimumShare && minimumShare.gt(0) && (
                <Badge variant={`success`}>initial contributor program</Badge>
              )}{" "}
              <Badge variant={ownedByMultisig ? `success` : "danger"}>
                {ownedByMultisig ? `managed by multisig` : "managed by EOA"}
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <br />
      <Tab.Container defaultActiveKey="funding">
        <Row>
          <Col sm={3}>
            <Nav variant="pills" className="flex-column">
              <Nav.Item>
                <Nav.Link eventKey="funding">Funding</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="pay">Pay</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="contributors">Contributors</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="admin">Admin</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          <Col sm={9}>
            <Tab.Content>
              <Tab.Pane eventKey="pay">
                <Card>
                  <Card.Body>
                    <Pay
                      projId={id}
                      fund={fund || 0}
                      projectOwner={budgetOwner}
                    />
                  </Card.Body>
                </Card>
                {streams.length > 0 && (
                  <>
                    <hr />
                    <h1>Streamings</h1>
                    <Row>
                      {streams.map((stream) => (
                        <Col md={4}>
                          <Card>
                            <Card.Body>
                              <Stream streamId={stream.toNumber()} />
                            </Card.Body>
                          </Card>
                          <br />
                        </Col>
                      ))}
                    </Row>
                    <br />
                  </>
                )}
              </Tab.Pane>
              <Tab.Pane eventKey="contributors">
                {contributors.length > 0 ? (
                  <>
                    <h5>
                      Contributors
                      <OverlayTooltip
                        tip={
                          "This becomes the initial contributors' share when this project gets upgraded to a DAO."
                        }
                        text={`❔`}
                      />
                    </h5>
                    <ContributorChart id={id} />
                  </>
                ) : (
                  <p>
                    Hey there, we're looking forward to your contributions :)
                  </p>
                )}
              </Tab.Pane>
              <Tab.Pane eventKey="funding">
                <Card>
                  <Card.Body>
                    <Card.Title>Fund this project!</Card.Title>
                    <FundProject
                      projId={id}
                      fund={fund || 0}
                      budgetOwner={budgetOwner}
                      minimumShare={minimumShare}
                    />
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="admin">
                {!hasAdminPermission ? (
                  <p>You are not authorized to access this functions.</p>
                ) : (
                  <ProjectAdmin
                    projId={id}
                    owner={budgetOwner}
                    fundable={(minimumShare && minimumShare.gt(0)) || false}
                    ownedByMultisig={ownedByMultisig || false}
                    hasAdminPermission={hasAdminPermission || false}
                  />
                )}
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </>
  );
  return (
    <Page>
      <Row>
        <Col md={4}>
          <h3>
            <b>{metadata?.name}</b>
          </h3>
        </Col>
        <Col md={{ span: 4, offset: 4 }} style={{ textAlign: "end" }}>
          <Button
            variant="outline-primary"
            onClick={() => history.goBack()}
            children={"Go back"}
          />
        </Col>
      </Row>
      <br />
      {exist ? WhenExist() : WhenNotExist()}
    </Page>
  );
};
