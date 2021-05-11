import React, { useEffect, useState } from "react";
import Page from "../../../layouts/Page";
import { Image, Row, Col, Nav, Tab, Tabs } from "react-bootstrap";
import { TimelockTxs } from "../../../components/contracts/timelocked-governance/TimelockTxs";
import { Propose } from "../../../components/contracts/workers-union/Propose";
import {
  VoteForTx,
  ProposedTx,
  VoteForTxStatus,
} from "../../../components/contracts/workers-union/VoteForTx";
import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
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
    const workersUnion = contracts.workersUnion;
    workersUnion
      .getVotesAt(
        account,
        Math.floor(parseInt(new Date().toTimeString()) / 1000)
      )
      .then((vote) => {
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
    const workersUnion = contracts.workersUnion;
    workersUnion
      .queryFilter(
        workersUnion.filters.TxProposed(
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
    <Tab.Container defaultActiveKey="voting">
      <Row>
        <Col sm={3}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="voting">Voting</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="ended">Ended</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="pending">Pending</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="faq">FAQ</Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane
              eventKey="voting"
              title="Voting"
              style={{ marginTop: "1rem" }}
            >
              {proposedTxs
                .filter(
                  (proposedTx) =>
                    proposedTx.start.lt(timestamp) &&
                    proposedTx.end.gt(timestamp)
                )
                .map((proposedTx, i) => (
                  <div key={`voting-${i}`}>
                    <VoteForTx
                      tx={proposedTx}
                      myVotes={myVotes}
                      status={VoteForTxStatus.Voting}
                    />
                    <br />
                  </div>
                ))}
            </Tab.Pane>
            <Tab.Pane
              eventKey="ended"
              title="Ended"
              style={{ marginTop: "1rem" }}
            >
              {proposedTxs
                .filter((proposedTx) => proposedTx.end.lt(timestamp))
                .map((proposedTx, i) => (
                  <div key={`ended-${i}`}>
                    <VoteForTx
                      tx={proposedTx}
                      myVotes={myVotes}
                      status={VoteForTxStatus.Ended}
                    />
                    <br />
                  </div>
                ))}
            </Tab.Pane>
            <Tab.Pane
              eventKey="pending"
              title="Pending"
              style={{ marginTop: "1rem" }}
            >
              {proposedTxs
                .filter((proposedTx) => proposedTx.start.gt(timestamp))
                .map((proposedTx, i) => (
                  <div key={`pending-${i}`}>
                    <VoteForTx
                      tx={proposedTx}
                      myVotes={myVotes}
                      status={VoteForTxStatus.Pending}
                    />
                    <br />
                  </div>
                ))}
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};

export default Vote;
