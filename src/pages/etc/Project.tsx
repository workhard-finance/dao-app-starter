import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";

import { Row, Col, Tab, Nav, Card, Button, Image } from "react-bootstrap";
import ReactHtmlParser from "react-html-parser";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { BigNumber } from "ethers";
import { useParams } from "react-router";
import { useWeb3React } from "@web3-react/core";
import { Compensate } from "../../components/contracts/contribution-board/Compensate";
import { AddBudget } from "../../components/contracts/contribution-board/AddBudget";
import { useHistory } from "react-router-dom";
import {
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
import { RecordContribution } from "../../components/contracts/contribution-board/RecordContribution";
import { ContributorChart } from "../../components/views/ContributorChart";
import { OverlayTooltip } from "../../components/OverlayTooltip";

export const Project: React.FC = () => {
  const { account, library, chainId } = useWeb3React();
  const history = useHistory();
  const { workhard, dao } = useWorkhard() || { dao: undefined };
  const { ipfs } = useIPFS();
  const { addToast } = useToasts();

  const { id } = useParams<{ id: string }>();
  const [metadata, setMeatadata] = useState<ProjectMetadata>();
  const [fund, setFund] = useState<BigNumber>();
  const [budgetOwner, setBudgetOwner] = useState("");
  const [exist, setExist] = useState<boolean>(true);
  const [budgets, setBudgets] = useState<
    Array<{
      amount: BigNumber;
      transferred: boolean;
    }>
  >(new Array(0));
  useEffect(() => {
    if (!!dao && !!workhard && !!ipfs) {
      const { contributionBoard } = dao;
      workhard
        .ownerOf(id)
        .then(setBudgetOwner)
        .catch(errorHandler(addToast, undefined, () => setExist(false)));
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
    }
  }, [dao, ipfs]); // ensures refresh if referential identity of library doesn't change across chainIds

  useEffect(() => {
    if (!!account && !!library && !!chainId && !!dao) {
      const { contributionBoard } = dao;
      contributionBoard.getTotalBudgets(id).then((len: BigNumber) => {
        Promise.all(
          new Array(len.toNumber())
            .fill(0)
            .map((_, i) => contributionBoard.projectBudgets(id, i))
        )
          .then((_budgets) => {
            setBudgets(_budgets);
          })
          .catch(errorHandler(addToast));
      });
    }
  }, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

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
            <Col md={10}>
              <Card.Subtitle>Description</Card.Subtitle>
              <Card.Text>
                {ReactHtmlParser(wrapUrl(metadata?.description || ""))}
              </Card.Text>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <br />
      <Tab.Container defaultActiveKey="pay">
        <Row>
          <Col sm={3}>
            <Nav variant="pills" className="flex-column">
              <Nav.Item>
                <Nav.Link eventKey="pay">Pay</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="budget">Add budget</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="record">Record Contribution</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          <Col sm={9}>
            <Tab.Content>
              <Tab.Pane eventKey="pay">
                <Card>
                  <Card.Body>
                    <Compensate
                      projId={id}
                      fund={fund || 0}
                      budgetOwner={budgetOwner}
                    />
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="budget">
                <Card>
                  <Card.Body>
                    <AddBudget
                      projId={id}
                      fund={fund || 0}
                      budgetOwner={budgetOwner}
                    />
                  </Card.Body>
                </Card>

                {budgets.length > 0 && (
                  <>
                    <hr />
                    <h2>History</h2>
                  </>
                )}
                {budgets
                  .map((budget, i) => {
                    if (!!budget) {
                      return (
                        <>
                          <br />
                          <ExecuteBudget
                            projId={id}
                            budgetIndex={i}
                            budgetOwner={budgetOwner}
                            {...budget}
                          />
                        </>
                      );
                    }
                  })
                  .reverse()}
              </Tab.Pane>
              <Tab.Pane eventKey="record">
                <Card>
                  <Card.Body>
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
                    <h5>
                      Record{" "}
                      <OverlayTooltip
                        tip={
                          "Contributions are automatically recorded when budget owner pays to the contributor. Otherwise, budget owner can record contributions manually using this form."
                        }
                        text={`❔`}
                      />
                    </h5>
                    <RecordContribution projId={id} budgetOwner={budgetOwner} />
                  </Card.Body>
                </Card>
                <br />
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
      <br />
      <br />
      <SerHelpPlz>
        <p>
          You can add budgets in 3 ways.
          <ol>
            <li>
              Get grants by the governance. If the project is absolutely helpful
              for the protocol, governance will give it some grants to
              accelerate the development.
            </li>
            <li>
              Get approved to mint $COMMIT with vision tax. Approved project can
              mint $COMMIT with 20% of vision tax. For example, you have a
              permission to mint 8000 $COMMIT with 10000 $DAI.
            </li>
            <li>
              Or, you can add fund without any approval but the tax rate is 50%.
              This rate is same with the premium ration in the stable reserve to
              buy $COMMIT with $DAI.
            </li>
          </ol>
          Projects will be grown organically by the support from the community,
          or getting driven by project owner's strong willingness. Once the
          project matures enough, project owner can upgrade it to a dao and
          start its own token emission.
        </p>
      </SerHelpPlz>
    </Page>
  );
};
