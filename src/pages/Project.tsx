import React, { useEffect, useState } from "react";
import Page from "../layouts/Page";

import { Row, Col, Tab, Nav, Card, Button } from "react-bootstrap";
import ReactHtmlParser from "react-html-parser";
import { useWorkhardContracts } from "../providers/WorkhardContractProvider";
import { BigNumber } from "ethers";
import { useParams } from "react-router";
import { useWeb3React } from "@web3-react/core";
import { getAddress } from "ethers/lib/utils";
import { Compensate } from "../components/contracts/commitment-fund/Compensate";
import { AddBudget } from "../components/contracts/crypto-job-board/AddBudget";
import { useHistory } from "react-router-dom";
import { wrapUrl } from "../utils/utils";
import { ApproveProject } from "../components/contracts/crypto-job-board/ApproveProject";
import { CloseProject } from "../components/contracts/crypto-job-board/CloseProject";
import { ExecuteBudget } from "../components/contracts/crypto-job-board/ExecuteBudget";

const Project: React.FC = () => {
  const { account, library, chainId } = useWeb3React();
  const history = useHistory();
  const contracts = useWorkhardContracts();

  const { id } = useParams<{ id: string }>();
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [fund, setFund] = useState("");
  const [budgetOwner, setBudgetOwner] = useState("");
  const [admin, toggleAdmin] = useState(false);
  const [exist, setExist] = useState<boolean>();
  const [budgets, setBudgets] = useState<
    Array<{
      currency: string;
      amount: BigNumber;
      transferred: boolean;
    }>
  >(new Array(0));

  useEffect(() => {
    if (!!account && !!library && !!chainId && !!contracts) {
      let stale = false;
      const { project, commitmentFund, cryptoJobBoard } = contracts;
      project
        .titles(id)
        .then((t: string) => {
          if (!stale) setTitle(t);
        })
        .catch(() => {
          if (!stale) setTitle("Unknown");
        });
      project
        .jobDescription(id)
        .then((desc: string) => {
          if (!stale) setDescription(desc);
        })
        .catch(() => {
          if (!stale) setDescription("Unknown");
        });
      project
        .ownerOf(id)
        .then((owner: string) => {
          if (!stale) {
            setBudgetOwner(getAddress(owner));
            setExist(true);
          }
        })
        .catch(() => {
          if (!stale) setExist(false);
        });
      commitmentFund
        .projectFund(id)
        .then((fund: BigNumber) => {
          if (!stale) setFund(fund.toString());
        })
        .catch(() => {
          if (!stale) setFund("Unknown");
        });
      cryptoJobBoard.getTotalBudgets(id).then((len: BigNumber) => {
        Promise.all(
          new Array(len.toNumber())
            .fill(0)
            .map((_, i) => cryptoJobBoard.projectBudgets(id, i))
        ).then((_budgets) => {
          setBudgets(_budgets);
        });
      });

      return () => {
        stale = true;
        setDescription("Disconnected");
        setTitle("Disconnected");
        setFund("Disconnected");
      };
    }
  }, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

  const WhenNotExist = () => <p>Not exist</p>;
  const WhenExist = () => (
    <>
      <Card>
        <Card.Body>
          <Card.Subtitle>Name</Card.Subtitle>
          <Card.Text>{title}</Card.Text>
          <Card.Subtitle>Description</Card.Subtitle>
          <Card.Text>{ReactHtmlParser(wrapUrl(description))}</Card.Text>
        </Card.Body>
      </Card>
      <br />
      <Tab.Container id="left-tabs-example" defaultActiveKey="pay">
        <Row>
          <Col sm={3}>
            <Nav variant="pills" className="flex-column">
              <Nav.Item>
                <Nav.Link eventKey="pay">Pay</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="budget">Budget</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="etc">Etc</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          <Col sm={9}>
            <Tab.Content>
              <Tab.Pane eventKey="pay">
                <Compensate projId={id} fund={fund} budgetOwner={budgetOwner} />
              </Tab.Pane>
              <Tab.Pane eventKey="budget">
                <h2>Add budget</h2>
                <AddBudget projId={id} fund={fund} budgetOwner={budgetOwner} />
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
              <Tab.Pane eventKey="etc">
                <>
                  <ApproveProject
                    projId={id}
                    fund={fund}
                    budgetOwner={budgetOwner}
                  />
                  <hr />
                  <CloseProject projId={id} budgetOwner={budgetOwner} />
                </>
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

export default Project;
