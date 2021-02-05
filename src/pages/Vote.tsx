import React from "react";
import Page from "../layouts/Page";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  FormControl,
  FormLabel,
  Image,
  InputGroup,
  ListGroup,
  ListGroupItem,
  OverlayTrigger,
  ProgressBar,
  Row,
  Tab,
  Tabs,
  Tooltip,
} from "react-bootstrap";
import { Link } from "react-router-dom";

const getVariant = (percent: number) => {
  if (percent <= 25) return "danger";
  else if (percent <= 50) return "warning";
  else if (percent <= 75) return "info";
  else return "success";
};
const Vote = () => {
  const stakePercent = 60;
  const lockedPercent = 90;
  const remainingPercent = 10;
  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/vote.jpg"}
        style={{ width: "100%", padding: "0px", borderWidth: "5px" }}
      />
      {/* <Alert variant={"warning"}>
        All men must work, even the rich, because to work was the will of God
      </Alert> */}
      <Card>
        <Card.Header as="h5">Submit a new proposal</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group controlId="formBasicEmail">
              <Card.Title>To</Card.Title>
              {/* <Form.Label>Staking</Form.Label> */}
              <InputGroup className="mb-2">
                <FormControl
                  id="inlineFormInputGroup"
                  placeholder="0xABCDEF0123456789ABCDEF0123456789ABCDEF01"
                />
              </InputGroup>
              <Card.Title>Value</Card.Title>
              {/* <Form.Label>Staking</Form.Label> */}
              <InputGroup className="mb-2">
                <FormControl
                  id="inlineFormInputGroup"
                  placeholder="1234.00000000000000001"
                />
                <InputGroup.Append>
                  <InputGroup.Text>MAX</InputGroup.Text>
                </InputGroup.Append>
              </InputGroup>
              <Card.Title>Data</Card.Title>
              <InputGroup className="mb-2">
                <FormControl id="inlineFormInputGroup" placeholder="msg.data" />
              </InputGroup>
              <Card.Title>Details</Card.Title>
              <InputGroup className="mb-2">
                <Form.Control as="textarea" rows={3} />
              </InputGroup>
            </Form.Group>
            <Button variant="primary" type="submit">
              Submit
            </Button>{" "}
          </Form>
        </Card.Body>
      </Card>
      <hr />
      <h1>Vote</h1>
      <Tabs defaultActiveKey="voting" id="uncontrolled-tab-example">
        <Tab eventKey="voting" title="Voting" style={{ marginTop: "1rem" }}>
          <Card>
            <Card.Header as="h5">WHIP #32</Card.Header>
            <Card.Body>
              <Card.Title>To</Card.Title>
              <Card.Text>0xABCDEF0123456789ABCDEF0123456789ABCDEF01</Card.Text>
              <Card.Title>Value</Card.Title>
              <Card.Text>1234123489123418</Card.Text>
              <Card.Title>Data</Card.Title>
              <Card.Text>
                0x912818abc87a7807af79e78c797a978e9798d79d912818abc87a7807af79e78c797a978e9798d79912818abc87a7807af79e78c797a978e9798d79dd
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
              <Card.Title>Voting</Card.Title>
              <ProgressBar>
                <ProgressBar animated variant="success" now={30} key={1} />
                <ProgressBar animated variant="danger" now={70} key={2} />
              </ProgressBar>
              <Card.Text>1432 votes for / 4323 votes against</Card.Text>
              <Form>
                <Form.Group controlId="formBasicEmail">
                  <Card.Title>Amount</Card.Title>
                  {/* <Form.Label>Staking</Form.Label> */}
                  <InputGroup className="mb-2">
                    <FormControl
                      id="inlineFormInputGroup"
                      placeholder="14918"
                    />
                    <InputGroup.Append>
                      <InputGroup.Text>MAX</InputGroup.Text>
                    </InputGroup.Append>
                  </InputGroup>
                </Form.Group>
                <Button variant="success" type="submit">
                  For
                </Button>{" "}
                <Button variant="danger" type="submit">
                  Against
                </Button>{" "}
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="ended" title="Ended" style={{ marginTop: "1rem" }}></Tab>
        <Tab
          eventKey="pending"
          title="Pending"
          style={{ marginTop: "1rem" }}
        ></Tab>
      </Tabs>
    </Page>
  );
};

export default Vote;
