import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";

import { Row, Col, Tab, Nav, Card, Button } from "react-bootstrap";
import ReactHtmlParser from "react-html-parser";
import { useWorkhardContracts } from "../../providers/WorkhardContractProvider";
import { BigNumber } from "ethers";
import { useParams } from "react-router";
import { useWeb3React } from "@web3-react/core";
import { Compensate } from "../../components/contracts/job-board/Compensate";
import { AddBudget } from "../../components/contracts/job-board/AddBudget";
import { useHistory } from "react-router-dom";
import {
  errorHandler,
  fetchProjectMetadataFromIPFS,
  ProjectMetadata,
  wrapUrl,
} from "../../utils/utils";
import { ExecuteBudget } from "../../components/contracts/job-board/ExecuteBudget";
import { useIPFS } from "../../providers/IPFSProvider";
import { useToasts } from "react-toast-notifications";

export const Project: React.FC = () => {
  const { account, library, chainId } = useWeb3React();
  const history = useHistory();
  const contracts = useWorkhardContracts();
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
    if (!!contracts && !!ipfs) {
      const { project, jobBoard } = contracts;
      project
        .ownerOf(id)
        .then(setBudgetOwner)
        .catch(errorHandler(addToast, undefined, () => setExist(false)));
      project
        .tokenURI(id)
        .then(async (uri) => {
          setMeatadata(await fetchProjectMetadataFromIPFS(ipfs, uri));
        })
        .catch(errorHandler(addToast));
      jobBoard.projectFund(id).then(setFund).catch(errorHandler(addToast));
    }
  }, [contracts, ipfs]); // ensures refresh if referential identity of library doesn't change across chainIds

  useEffect(() => {
    if (!!account && !!library && !!chainId && !!contracts) {
      const { jobBoard } = contracts;
      jobBoard.getTotalBudgets(id).then((len: BigNumber) => {
        Promise.all(
          new Array(len.toNumber())
            .fill(0)
            .map((_, i) => jobBoard.projectBudgets(id, i))
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
          <Card.Subtitle>Name</Card.Subtitle>
          <Card.Text>{metadata?.name}</Card.Text>
          <Card.Subtitle>Description</Card.Subtitle>
          <Card.Text>
            {ReactHtmlParser(wrapUrl(metadata?.description || ""))}
          </Card.Text>
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
                <Nav.Link eventKey="budget">Budget</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          <Col sm={9}>
            <Tab.Content>
              <Tab.Pane eventKey="pay">
                <Compensate
                  projId={id}
                  fund={fund || 0}
                  budgetOwner={budgetOwner}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="budget">
                <h2>Add budget</h2>
                <AddBudget
                  projId={id}
                  fund={fund || 0}
                  budgetOwner={budgetOwner}
                />
                <hr />
                <h2>History</h2>
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
          <h1>Project setting</h1>
        </Col>
        <Col md={{ span: 4, offset: 4 }} style={{ textAlign: "end" }}>
          <Button
            variant="outline-primary"
            onClick={() => history.goBack()}
            children={"Go back"}
          />
        </Col>
      </Row>
      <hr />
      {exist ? WhenExist() : WhenNotExist()}
    </Page>
  );
};
