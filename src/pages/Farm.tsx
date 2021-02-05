import React from "react";
import Page from "../layouts/Page";
import {
  Alert,
  Button,
  Card,
  Form,
  FormControl,
  Image,
  InputGroup,
  ListGroup,
  ListGroupItem,
  OverlayTrigger,
  ProgressBar,
  Tooltip,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";

// move this func to utils
const getVariant = (percent: number) => {
  if (percent <= 25) return "danger";
  else if (percent <= 50) return "warning";
  else if (percent <= 75) return "info";
  else return "success";
};

const Farm = () => {
  const stakePercent = 60;
  const lockedPercent = 90;
  const remainingPercent = 10;
  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/farm.jpg"}
        style={{ width: "100%", padding: "0px", borderWidth: "5px" }}
      />
      <Alert variant={"info"}>
        To dispatch farmers, you need to stake and lock $VISION tokens. You can
        get $VISION token by <a href="https://app.uniswap.org">trading</a> or{" "}
        <Link to="/mine">mining</Link>!
      </Alert>
      <Card>
        {/* <Card.Header as="h5">Featured</Card.Header> */}
        <Card.Body>
          {/* <Card.Title>Stake & lock to dispatch farmers</Card.Title> */}
          <Form>
            <Form.Group controlId="formBasicEmail">
              <Card.Title>Staking</Card.Title>
              {/* <Form.Label>Staking</Form.Label> */}
              <InputGroup className="mb-2">
                <FormControl id="inlineFormInputGroup" placeholder="Username" />
                <InputGroup.Append>
                  <InputGroup.Text>MAX</InputGroup.Text>
                </InputGroup.Append>
              </InputGroup>
            </Form.Group>
            <ProgressBar
              variant={getVariant(stakePercent)}
              animated
              now={stakePercent}
            />
            <Card.Text>1432 / 4323 of your $VISION token is staked.</Card.Text>
            <Button variant="primary" type="submit">
              Stake
            </Button>{" "}
            <Button variant="secondary" type="submit">
              Withdraw
            </Button>
          </Form>
          <hr />
          <Form>
            <Form.Group controlId="formBasicEmail">
              <Card.Title>Lock</Card.Title>
              {/* <Form.Label>Lock</Form.Label> */}
              <InputGroup className="mb-2">
                <FormControl
                  id="inlineFormInputGroup"
                  placeholder="min: 184 / max: 200"
                />
                <InputGroup.Append>
                  <InputGroup.Text>MAX</InputGroup.Text>
                </InputGroup.Append>
              </InputGroup>
            </Form.Group>
            <ProgressBar
              variant={getVariant(lockedPercent)}
              animated
              now={lockedPercent}
            />
            <Card.Text>
              183 / 200 week(s) locked. You can withdraw 2023/03/13 09:13 UTC
              (depends on block.timestamp).
            </Card.Text>
            <Button variant="primary" type="submit">
              Lock
            </Button>
          </Form>
          <hr />
          <Card.Title>
            Current dispatchable farmers
            <OverlayTrigger
              // key={placement}
              // placement={placement}
              overlay={
                <Tooltip id={`tooltip-dispatchable-farmers`}>
                  = staked amount x locking period
                </Tooltip>
              }
            >
              <span style={{ fontSynthesis: "o" }}>❔</span>
            </OverlayTrigger>
          </Card.Title>
          <Card.Text style={{ fontSize: "3rem" }}>4321</Card.Text>
        </Card.Body>
      </Card>
      <hr />
      <Card border="success">
        <Card.Header className="bg-success" style={{ color: "white" }}>
          Farm #15 - planting
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group controlId="formBasicEmail">
              <Card.Title>Dispatch farmers</Card.Title>
              {/* <Form.Label>Lock</Form.Label> */}
              <InputGroup className="mb-2">
                <FormControl
                  id="inlineFormInputGroup"
                  placeholder="min: 184 / max: 200"
                />
                <InputGroup.Append>
                  <InputGroup.Text>MAX</InputGroup.Text>
                </InputGroup.Append>
              </InputGroup>
            </Form.Group>
            <ProgressBar
              variant={getVariant(remainingPercent)}
              animated
              now={100 - remainingPercent}
            />
            <Card.Text>4 day(s) left</Card.Text>
            <Button variant="primary" type="submit">
              Dispatch
            </Button>
          </Form>
          <hr />
          <Card.Title>
            APY
            <OverlayTrigger
              // key={placement}
              // placement={placement}
              overlay={
                <Tooltip id={`tooltip-dispatchable-farmers`}>
                  Calculated with maximum lock period.
                </Tooltip>
              }
            >
              <span style={{ fontSynthesis: "o" }}>❔</span>
            </OverlayTrigger>
          </Card.Title>
          <Card.Text style={{ fontSize: "3rem" }}>4321 %</Card.Text>
          <hr />
          <Card.Title>Crops</Card.Title>
          <Card.Text style={{ fontSize: "3rem" }}>$ 43211</Card.Text>
          <ListGroup className="list-group-flush">
            <ListGroupItem>$DAI: 1000 ($1000)</ListGroupItem>
            <ListGroupItem>$COMMITMENT: 34120 ($51323)</ListGroupItem>
            <ListGroupItem>$VISION: 340 ($91339)</ListGroupItem>
          </ListGroup>
          {/* <br/>
          <Button variant="primary">Harvest</Button> */}
        </Card.Body>
      </Card>
      <br />
      <Card>
        <Card.Header>Farm #14 - farmed</Card.Header>
        <Card.Body>
          {/* <Form>
            <Form.Group controlId="formBasicEmail">
              <Card.Title>Dispatch farmers</Card.Title>
              <InputGroup className="mb-2">
                <InputGroup.Prepend>
                  <InputGroup.Text>MAX</InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl
                  id="inlineFormInputGroup"
                  placeholder="min: 184 / max: 200"
                />
              </InputGroup>
            </Form.Group>
            <ProgressBar
              variant={getVariant(lockedPercent)}
              animated
              now={lockedPercent}
            />
            <Card.Text>
              183 / 200 week(s) locked. You can withdraw 2023/03/13 09:13 UTC
              (depends on block.timestamp).
            </Card.Text>
            <Button variant="primary" type="submit">
              Dispatch
            </Button>
          </Form>
          <hr/> */}
          <Card.Title>
            APY
            <OverlayTrigger
              // key={placement}
              // placement={placement}
              overlay={
                <Tooltip id={`tooltip-dispatchable-farmers`}>
                  Calculated with maximum lock period.
                </Tooltip>
              }
            >
              <span style={{ fontSynthesis: "o" }}>❔</span>
            </OverlayTrigger>
          </Card.Title>
          <Card.Text style={{ fontSize: "3rem" }}>4321 %</Card.Text>
          <hr />
          <Card.Title>Crops</Card.Title>
          <Card.Text style={{ fontSize: "3rem" }}>$ 43211</Card.Text>
          <ListGroup className="list-group-flush">
            <ListGroupItem>$DAI: 1000 ($1000)</ListGroupItem>
            <ListGroupItem>$COMMITMENT: 34120 ($51323)</ListGroupItem>
            <ListGroupItem>$VISION: 340 ($91339)</ListGroupItem>
          </ListGroup>
          <hr />
          <Card.Title>Earned</Card.Title>
          <Card.Text style={{ fontSize: "3rem" }}>$ 4321</Card.Text>
          <Button variant="primary">Harvest</Button>
        </Card.Body>
      </Card>
    </Page>
  );
};

export default Farm;
