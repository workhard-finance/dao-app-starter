import React, { useEffect, useState } from "react";
import Page from "../layouts/Page";
import { Image, Tab, Tabs } from "react-bootstrap";
import { TimelockTxs } from "../components/contracts/timelocked-governance/TimelockTxs";
import { Propose } from "../components/contracts/farmers-union/Propose";
import {
  VoteForTx,
  ProposedTx,
  VoteForTxStatus,
} from "../components/contracts/farmers-union/VoteForTx";
import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../providers/BlockNumberProvider";
import { useWorkhardContracts } from "../providers/WorkhardContractProvider";
import { BigNumber, providers } from "ethers";

const Vote: React.FC = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [proposedTxs, setProposedTxs] = useState<ProposedTx[]>([]);
  const [myVotes, setMyVotes] = useState<BigNumber>();
  // const [page, setPage] = useState(0);
  // const [projIdToVote, setProjIdToVote] = useState();
  const [fetchedBlock, setFetchedBlock] = useState<number>(0);
  const [timestamp, setTimestamp] = useState<number>(0);
  useEffect(() => {
    if (!account || !library || !chainId || !contracts) {
      return;
    }
    let stale = false;
    const farmersUnion = contracts.farmersUnion;
    farmersUnion.getVotes(account).then((vote) => {
      setMyVotes(vote);
    });
    return () => {
      stale = true;
    };
  }, [account, library, chainId]);

  useEffect(() => {
    if (!library || !contracts || !blockNumber) {
      return;
    }
    const farmersUnion = contracts.farmersUnion;
    farmersUnion
      .queryFilter(
        farmersUnion.filters.TxProposed(
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null
        ),
        fetchedBlock + 1,
        blockNumber
      )
      .then((events) => {
        if (blockNumber) setFetchedBlock(blockNumber);
        setProposedTxs([...proposedTxs, ...events.map((event) => event.args)]);
      });
    library
      .getBlock(blockNumber)
      .then((block) => setTimestamp(block.timestamp));
  }, [contracts, blockNumber]);

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
          {proposedTxs
            .filter(
              (proposedTx) =>
                proposedTx.start.lt(timestamp) && proposedTx.end.gt(timestamp)
            )
            .map((proposedTx) => (
              <>
                <VoteForTx
                  tx={proposedTx}
                  myVotes={myVotes}
                  status={VoteForTxStatus.Voting}
                />
                <br />
              </>
            ))}
        </Tab>
        <Tab eventKey="ended" title="Ended" style={{ marginTop: "1rem" }}>
          {proposedTxs
            .filter((proposedTx) => proposedTx.end.lt(timestamp))
            .map((proposedTx) => (
              <>
                <VoteForTx
                  tx={proposedTx}
                  myVotes={myVotes}
                  status={VoteForTxStatus.Ended}
                />
                <br />
              </>
            ))}
        </Tab>
        <Tab eventKey="pending" title="Pending" style={{ marginTop: "1rem" }}>
          {proposedTxs
            .filter((proposedTx) => proposedTx.start.gt(timestamp))
            .map((proposedTx) => (
              <>
                <VoteForTx
                  tx={proposedTx}
                  myVotes={myVotes}
                  status={VoteForTxStatus.Pending}
                />
                <br />
              </>
            ))}
        </Tab>
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
