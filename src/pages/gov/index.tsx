import React from "react";
import Page from "../../layouts/Page";
import { Image, Tab, Tabs } from "react-bootstrap";
import { TimelockTxs } from "./tabs/TimelockTxs";
import Vote from "./tabs/Vote";
import { EscrowAndDividend } from "./tabs/EscrowAndDividend";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import { prefix } from "../../utils/utils";
import { TitleButSer } from "../../components/views/TitleButSer";

const Gov: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const history = useHistory();
  const workhardCtx = useWorkhard();
  const { daoId } = workhardCtx || { daoId: 0 };

  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/vote.jpg"}
        style={{ width: "100%", padding: "0px", borderWidth: "5px" }}
      />
      <p>
        True believers who stake & lock the project’s{" "}
        {workhardCtx ? `$${workhardCtx.metadata.visionSymbol}` : "$VISION"}{" "}
        tokens unlock non-transferable{" "}
        {workhardCtx ? `$${workhardCtx.metadata.rightSymbol}` : "$RIGHT"}{" "}
        tokens. Claim your project’s revenue dividends with{" "}
        {workhardCtx ? `$${workhardCtx.metadata.rightSymbol}` : "$RIGHT"} and
        vote with{" "}
        {workhardCtx ? `$${workhardCtx.metadata.rightSymbol}` : "$RIGHT"} in the
        WORKER’S UNION.
      </p>
      {/* <Alert variant={"warning"}>
        All men must work, even the rich, because to work was the will of God
      </Alert> */}
      <TitleButSer link="#todo" />
      <Tabs defaultActiveKey={tab || "dividend"}>
        <Tab
          eventKey="dividend"
          title="Escrow & Dividend"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push(prefix(daoId, "/gov/dividend"))}
        >
          <EscrowAndDividend />
        </Tab>
        <Tab
          eventKey="timelock"
          title="Transactions"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push(prefix(daoId, "/gov/timelock"))}
        >
          <TimelockTxs />
        </Tab>
        <Tab
          eventKey="vote"
          title="Vote"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push(prefix(daoId, "/gov/vote"))}
        >
          <Vote />
        </Tab>
      </Tabs>
    </Page>
  );
};

export default Gov;
