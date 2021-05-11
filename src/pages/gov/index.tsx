import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Image, Tab, Tabs } from "react-bootstrap";
import { TimelockTxs } from "./tabs/TimelockTxs";
import { Propose } from "./tabs/Propose";
import Vote from "./tabs/Vote";
import { EscrowAndDividend } from "./tabs/EscrowAndDividend";
import { Erc20Balance } from "../../components/contracts/erc20/Erc20Balance";
import { useWorkhardContracts } from "../../providers/WorkhardContractProvider";

const Gov: React.FC = () => {
  const contracts = useWorkhardContracts();
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
          <Erc20Balance
            address={contracts?.right.address}
            description={`= staked amount x locking period / max period`}
            symbolAlt={`$veVISION(a.k.a. $RIGHT)`}
          />
        </Tab>
        <Tab
          eventKey="dividend"
          title="Escrow & Dividend"
          style={{ marginTop: "1rem" }}
        >
          <EscrowAndDividend />
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
