import React, { useEffect, useState } from "react";
import Page from "../layouts/Page";
import {
  Button,
  Card,
  Form,
  FormControl,
  FormLabel,
  Image,
  InputGroup,
  OverlayTrigger,
  Tab,
  Tabs,
  Tooltip,
} from "react-bootstrap";
// import { PostAJobBox } from "./Work/tabs/PostAJob";
import { useWorkhardContracts } from "../providers/WorkhardContractProvider";
import { BigNumber } from "ethers";

const Work: React.FC = () => {
  const contracts = useWorkhardContracts()
  // const { account, library, chainId } = useWeb3React();

  const [activeProjects, setActiveProjects] = useState<string[]>(
    [] as string[]
  );
  const [inactiveProjects, setInactiveProjects] = useState<string[]>(
    [] as string[]
  );

  useEffect(() => {
    if (!!contracts) {
      let stale = false;
      const { project, projectManager } = contracts;
      project
        .totalSupply()
        .then((n: BigNumber) => {
          if (!stale) {
            Array(n.toNumber())
              .fill(undefined)
              .map((_, i) => i.toString())
              .forEach((projId) => {
                projectManager.approvedProjects(projId).then((approved) => {
                  if (approved) {
                    activeProjects.push(projId);
                    setActiveProjects([...new Set(activeProjects)]);
                  } else {
                    inactiveProjects.push(projId);
                    setInactiveProjects([...new Set(inactiveProjects)]);
                  }
                });
              });
          }
        })
        .catch(() => {
          if (!stale) {
            setActiveProjects([]);
            setInactiveProjects([]);
          }
        });

      return () => {
        stale = true;
        setActiveProjects([]);
        setInactiveProjects([]);
      };
    }
  }, [contracts]); // ensures refresh if referential identity of library doesn't change across chainIds
  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/work.jpg"}
        style={{
          width: "100%",
          padding: "0px",
          borderWidth: "5px",
        }}
      />
      <blockquote className="blockquote" style={{ textAlign: "right" }}>
        <p className="mb-0">
          All men must work, even the rich, because to work was the will of God
        </p>
        {/* <footer className="blockquote-footer">John Calvin</footer> */}
      </blockquote>
      {/* <Alert variant={"warning"}>
        All men must work, even the rich, because to work was the will of God
      </Alert> */}
      <hr />
      <h1>Crypto Job Board</h1>
      <p>Work for projects and earn $COMMITMENT tokens.</p>
      <Tabs defaultActiveKey="activeProjects" id="uncontrolled-tab-example">
        <Tab
          eventKey="activeProjects"
          title="Active projects"
          style={{ marginTop: "1rem" }}
        >
          <Card>
            <Card.Header as="h5">Curve dev</Card.Header>
            <Card.Body>
              <Card.Title>Budgets</Card.Title>
              <Card.Text style={{ fontSize: "3rem" }}>
                93219 $COMMITMENT ($163710)
              </Card.Text>
              <Card.Title>Details</Card.Title>
              <Card.Text>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </Card.Text>
              <Card.Title>Budget owner</Card.Title>
              <Card.Text>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://etherscan.com"
                >
                  0xABCDEF0123456789ABCDEF0123456789ABCDEF
                </a>
              </Card.Text>
              <Card.Title>Workspace</Card.Title>
              <a target="_blank" rel="noreferrer" href="https://github.com">
                https://discord.gg/gg
              </a>
              {/* <Card.Text as={"a"}>https://discord.gg/gg</Card.Text> */}
              <hr />
              <Button variant={"outline-primary"}>
                ▼ Open budget owner tool
              </Button>
            </Card.Body>
          </Card>
          <br />
          <Card>
            <Card.Header as="h5">YFI dev</Card.Header>
            <Card.Body>
              <Card.Title>Budgets</Card.Title>
              <Card.Text style={{ fontSize: "3rem" }}>
                43210 $COMMITMENT ($73710)
              </Card.Text>
              <Card.Title>Details</Card.Title>
              <Card.Text>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </Card.Text>
              <Card.Title>Budget owner</Card.Title>
              <Card.Text>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://etherscan.com"
                >
                  0xABCDEF0123456789ABCDEF0123456789ABCDEF
                </a>
              </Card.Text>
              <Card.Title>Workspace</Card.Title>
              <Card.Text as={"a"}>https://discord.gg/gg</Card.Text>
              <hr />
              <Button variant={"outline-primary"}>
                ▲ Close budget owner tool
              </Button>
              <br />
              <br />
              <Form>
                <Form.Group controlId="formBasicEmail">
                  <Card.Title>Pay wages</Card.Title>
                  {/* <Form.Label>Lock</Form.Label> */}
                  <FormLabel>Employee address</FormLabel>
                  <InputGroup className="mb-2">
                    <FormControl
                      id="inlineFormInputGroup"
                      placeholder="0xABCDEF0123456789ABCDEF0123456789ABCDEF"
                    />
                  </InputGroup>
                  <FormLabel>Amount</FormLabel>
                  <InputGroup className="mb-2">
                    <FormControl
                      id="inlineFormInputGroup"
                      placeholder="3214.23"
                    />
                  </InputGroup>
                </Form.Group>
                <OverlayTrigger
                  // key={placement}
                  // placement={placement}
                  overlay={
                    <Tooltip id={`tooltip-dispatchable-farmers`}>
                      Only budget owner can call this function.
                    </Tooltip>
                  }
                >
                  <Button variant="primary" type="submit">
                    Pay
                  </Button>
                </OverlayTrigger>{" "}
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        <Tab
          eventKey="pending"
          title="Pending"
          style={{ marginTop: "1rem" }}
        ></Tab>
        <Tab eventKey="ended" title="Ended" style={{ marginTop: "1rem" }}></Tab>
        <Tab eventKey="post" title="Post a job" style={{ marginTop: "1rem" }}>
          {/* <PostAJobBox /> */}
        </Tab>
        <Tab
          eventKey="buy"
          title="Buy $COMMITMENT"
          style={{ marginTop: "1rem" }}
        >
          <Card>
            <Card.Header as="h5">
              I'll pay instead of working to get $COMMITMENT
            </Card.Header>
            <Card.Body>
              <Card.Title>
                DAI per $COMMITMENT
                <OverlayTrigger
                  // key={placement}
                  // placement={placement}
                  overlay={
                    <Tooltip id={`tooltip-dispatchable-farmers`}>
                      Annual Percentage Yield by Burning $Commitment token =
                      (Revenue - Burn) / Year
                    </Tooltip>
                  }
                >
                  <span style={{ fontSynthesis: "o" }}>❔</span>
                </OverlayTrigger>
              </Card.Title>
              <Card.Text style={{ fontSize: "3rem" }}>2 DAI</Card.Text>
              {/* <Card.Title>Stake & lock to dispatch farmers</Card.Title> */}
              <Form>
                <Form.Group controlId="formBasicEmail">
                  <Card.Title>Buy</Card.Title>
                  {/* <Form.Label>Staking</Form.Label> */}
                  <InputGroup className="mb-2">
                    <InputGroup.Prepend>
                      <InputGroup.Text>MAX</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl
                      id="inlineFormInputGroup"
                      placeholder="Username"
                    />
                  </InputGroup>
                </Form.Group>
                <Button variant="primary" type="submit">
                  Get $COMMITMENT
                </Button>{" "}
              </Form>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Page>
  );
};

export default Work;
