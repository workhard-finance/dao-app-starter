import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Image, Tab, Tabs } from "react-bootstrap";
import { TimelockTxs } from "../../components/contracts/timelocked-governance/TimelockTxs";
import { Propose } from "../../components/contracts/workers-union/Propose";
import Vote from "./Vote";
import Right from "./Right";

const Gov: React.FC = () => {
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
      <Tabs defaultActiveKey="right">
        <Tab eventKey="right" title="$RIGHT" style={{ marginTop: "1rem" }}>
          <Right />
        </Tab>
        <Tab
          eventKey="timelock"
          title="Transactions"
          style={{ marginTop: "1rem" }}
        >
          <TimelockTxs />
        </Tab>
        <Tab eventKey="vote" title="Vote" style={{ marginTop: "1rem" }}>
          <Vote />
        </Tab>
        <Tab eventKey="proposal" title="Proposal" style={{ marginTop: "1rem" }}>
          <Propose />
        </Tab>
      </Tabs>
    </Page>
  );
};

export default Gov;
