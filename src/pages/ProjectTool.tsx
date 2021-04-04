import React, { useEffect, useState } from "react";
import Page from "../layouts/Page";

import { Row, Col, Tab, Nav, Card, Button } from "react-bootstrap";
import ReactHtmlParser from 'react-html-parser'
import { useWorkhardContracts } from "../providers/WorkhardContractProvider";
import { BigNumber } from "ethers";
import { useParams } from "react-router";
import { useWeb3React } from "@web3-react/core";
import { getAddress } from "ethers/lib/utils";
import { Compensate } from "../components/box/Compensate";
import { AddBudget } from "../components/box/AddBudget";
import { useHistory } from "react-router-dom";
import { wrapUrl } from "../utils/utils";

const ProjectTool: React.FC = () => {
  const { account, library, chainId } = useWeb3React();
  const history = useHistory();
  const contracts = useWorkhardContracts();

  const { id } = useParams<{ id: string }>();
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [fund, setFund] = useState("");
  const [budgetOwner, setBudgetOwner] = useState("");
  const [admin, toggleAdmin] = useState(false);

  useEffect(() => {
    if (!!account && !!library && !!chainId && !!contracts) {
      let stale = false;
      const { project, commitmentFund } = contracts;
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
          if (!stale) setBudgetOwner(getAddress(owner));
        })
        .catch(() => {
          if (!stale) setBudgetOwner("");
        });
      commitmentFund
        .projectFund(id)
        .then((fund: BigNumber) => {
          if (!stale) setFund(fund.toString());
        })
        .catch(() => {
          if (!stale) setFund("Unknown");
        });

      return () => {
        stale = true;
        setDescription("Disconnected");
        setTitle("Disconnected");
        setFund("Disconnected");
      };
    }
  }, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

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
                <Nav.Link eventKey="budget">Add budget</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="approve">Approve project</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          <Col sm={9}>
            <Tab.Content>
              <Tab.Pane eventKey="pay">
                <Compensate projId={id} fund={fund} budgetOwner={budgetOwner} />
              </Tab.Pane>
              <Tab.Pane eventKey="budget">
                <AddBudget projId={id} fund={fund} budgetOwner={budgetOwner} />
              </Tab.Pane>
              <Tab.Pane eventKey="approve">
                <Compensate projId={id} fund={fund} budgetOwner={budgetOwner} />
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Page>
  );
};

export default ProjectTool;
