import React, { useEffect, useState } from "react";
import { Row, Col, Nav, Tab } from "react-bootstrap";
import {
  VoteForTx,
  ProposedTx,
  VoteForTxStatus,
} from "../../../components/contracts/workers-union/VoteForTx";
import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { BigNumber, providers } from "ethers";
import { altWhenEmptyList } from "../../../utils/utils";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";

const Vote: React.FC = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [proposedTxs, setProposedTxs] = useState<ProposedTx[]>([]);
  const [myVotes, setMyVotes] = useState<BigNumber>();
  const [fetchedBlock, setFetchedBlock] = useState<number>(0);
  const [timestamp, setTimestamp] = useState<number>(0);
  const [quorum, setQuorum] = useState<BigNumber>();
  const history = useHistory();
  const { subtab } = useParams<{ subtab?: string }>();

  useEffect(() => {
    if (!library || !chainId || !contracts) {
      return;
    }
    const workersUnion = contracts.workersUnion;
    workersUnion.votingRule().then((rule) => {
      setQuorum(rule.minimumVotes);
    });
  }, [library, chainId, timestamp, contracts]);

  useEffect(() => {
    if (!account || !library || !chainId || !contracts) {
      return;
    }
    const workersUnion = contracts.workersUnion;
    workersUnion.getVotesAt(account, timestamp).then((vote) => {
      setMyVotes(vote);
    });
  }, [account, library, chainId, timestamp, contracts]);

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
    <Tab.Container defaultActiveKey={subtab || "voting"}>
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
              style={{ marginTop: "1rem" }}
              onEnter={() => history.push("/gov/vote/voting")}
            >
              {altWhenEmptyList(
                <p>No proposal is in voting.</p>,
                quorum &&
                  proposedTxs
                    .filter(
                      (proposedTx) =>
                        proposedTx.start.lte(timestamp) &&
                        proposedTx.end.gt(timestamp)
                    )
                    .map((proposedTx, i) => (
                      <div key={`voting-${i}`}>
                        <VoteForTx
                          tx={proposedTx}
                          myVotes={myVotes}
                          status={VoteForTxStatus.Voting}
                          quorum={quorum}
                        />
                        <br />
                      </div>
                    ))
              )}
            </Tab.Pane>
            <Tab.Pane
              eventKey="ended"
              style={{ marginTop: "1rem" }}
              onEnter={() => history.push("/gov/vote/ended")}
            >
              {altWhenEmptyList(
                <p>No ended proposal exists.</p>,
                quorum &&
                  proposedTxs
                    .filter((proposedTx) => proposedTx.end.lt(timestamp))
                    .map((proposedTx, i) => (
                      <div key={`ended-${i}`}>
                        <VoteForTx
                          tx={proposedTx}
                          myVotes={myVotes}
                          status={VoteForTxStatus.Ended}
                          quorum={quorum}
                        />
                        <br />
                      </div>
                    ))
              )}
            </Tab.Pane>
            <Tab.Pane
              eventKey="pending"
              style={{ marginTop: "1rem" }}
              onEnter={() => history.push("/gov/vote/pending")}
            >
              {altWhenEmptyList(
                <p>No pending proposal exists.</p>,
                quorum &&
                  proposedTxs
                    .filter((proposedTx) => proposedTx.start.gt(timestamp))
                    .map((proposedTx, i) => (
                      <div key={`pending-${i}`}>
                        <VoteForTx
                          tx={proposedTx}
                          myVotes={myVotes}
                          status={VoteForTxStatus.Pending}
                          quorum={quorum}
                        />
                        <br />
                      </div>
                    ))
              )}
            </Tab.Pane>
            <Tab.Pane
              eventKey="faq"
              style={{ marginTop: "1rem" }}
              onEnter={() => history.push("/gov/vote/faq")}
            >
              <h5>
                <strong>What can I propose via Workers' Union?</strong>
              </h5>
              <p>
                You can propose any transaction from Workers' Union contract. So
                you can consider Workers' Union as a huge multisig wallet that
                works by voting. By the way, Workers' Union is the manager of
                timelock governance that is governing Workers' Union itself,
                VisionEmitter, DividendPool, Marketplace, JobBoard, and etc.
                Therefore, in most cases, we will propose the governance
                transaction to schedule and execute them. The governance
                transactions are prepared in the proposal tab with the forms.
              </p>
              <h5>
                <strong>
                  Should we have voting every time we need update?
                </strong>
              </h5>
              <p>
                No we don't. To avoid the onchain voting as much as possible,
                dev's multisig wallet is also one of the timelock contract'
                proposer and executor. But we force scheduled the revoke of
                multisig's permission from the timelock. So if the community
                wants to remove multisig, we can simply run the revoke
                transaction by voting!
              </p>
              <h5>
                <strong>Okay.. then what's the governance structure?</strong>
              </h5>
              <p>
                Timelock contract is the governor! It can change some
                configurations of these contracts:
                <ul>
                  <li>
                    VisionEmitter: decides the emission rates and weights.
                  </li>
                  <li>DividendPool: decides the allowed token list</li>
                  <li>
                    StableReserve: allow minter list that can reserve DAI and
                    mint COMMIT
                  </li>
                  <li>JobBoard: approve / disapprove / tax rate</li>
                  <li>Marketplace: tax rate</li>
                </ul>
                And the timelock transactions are scheduled and executed by
                <ul>
                  <li>Workers' Union</li>
                  <li>Devs' Multisig(can be revoked by Workers' Union)</li>
                </ul>
                As we're trying to display whole governance transactions as
                transparent as possible via the transaction tab, we hope we can
                keep the multisig operations & snapshot voting instead of the
                onchain voting.
              </p>
              <h5>
                <strong>How much RIGHT do I need to start a new vote?</strong>
              </h5>
              <p>
                You should have more than 1 $RIGHT to start a vote. Governance
                will increase or decrease this value by voting.
              </p>
              <h5>
                <strong>What is the quorum?</strong>
              </h5>
              <p>
                To pass a proposal, Workers' Union needs square root of 100
                RIGHT for its quorum.
              </p>
              <h5>
                <strong>What happens if a proposal passed?</strong>
              </h5>
              <p>Once a proposal passed,</p>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};

export default Vote;
