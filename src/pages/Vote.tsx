import React from "react";
import Page from "../layouts/Page";
import {
  Button,
  Card,
  Form,
  FormControl,
  Image,
  InputGroup,
  ProgressBar,
  Tab,
  Tabs,
} from "react-bootstrap";
import { TimelockTxs } from "../components/contracts/timelocked-governance/TimelockTxs";
import { Propose } from "../components/contracts/farmers-union/Propose";
import { VoteFor } from "../components/contracts/farmers-union/VoteFor";

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
      <h1>Farmers Union</h1>
      <Tabs defaultActiveKey="voting" id="uncontrolled-tab-example">
        <Tab eventKey="voting" title="Voting" style={{ marginTop: "1rem" }}>
          <VoteFor />
        </Tab>
        <Tab eventKey="ended" title="Ended" style={{ marginTop: "1rem" }}></Tab>
        <Tab
          eventKey="pending"
          title="Pending"
          style={{ marginTop: "1rem" }}
        ></Tab>
        <Tab eventKey="proposal" title="Proposal" style={{ marginTop: "1rem" }}>
          <Propose />
        </Tab>
        <Tab eventKey="timelock" title="Timelock" style={{ marginTop: "1rem" }}>
          <TimelockTxs />
        </Tab>
      </Tabs>
    </Page>
  );
};

export default Vote;
