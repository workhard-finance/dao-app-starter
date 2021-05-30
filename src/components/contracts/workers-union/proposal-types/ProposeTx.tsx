import React, { FormEventHandler, useEffect, useState } from "react";
import { providers, BigNumber, BigNumberish } from "ethers";
import { Card, Form, InputGroup } from "react-bootstrap";
import { useWorkhard } from "../../../../providers/WorkhardProvider";
import { randomBytes } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../../ConditionalButton";
import { useBlockNumber } from "../../../../providers/BlockNumberProvider";
import {
  errorHandler,
  handleTransaction,
  TxStatus,
} from "../../../../utils/utils";
import { useToasts } from "react-toast-notifications";

export interface ProposeTxProps {}

export const ProposeTx: React.FC<ProposeTxProps> = ({}) => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const { dao } = useWorkhard() || {};
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const [timestamp, setTimestamp] = useState<number>(0);
  /** Proposal */
  const [msgTo, setMsgTo] = useState<string>();
  const [msgValue, setMsgValue] = useState<string>();
  const [msgData, setMsgData] = useState<string>();
  const [predecessor, setPredecessor] = useState<string>();
  const [salt, setSalt] = useState<string>();
  const [proposalDetails, setProposalDetails] = useState<string>();
  const [startsIn, setStartsIn] = useState<number>();
  const [votingPeriod, setVotingPeriod] = useState<number>();
  const [txStatus, setTxStatus] = useState<TxStatus>();

  /** VotingRule */
  const [myVotes, setMyVotes] = useState<BigNumber>();
  const [minimumPending, setMinimumPending] = useState<BigNumberish>();
  const [maximumPending, setMaximumPending] = useState<BigNumberish>();
  const [
    minimumVotingPeriod,
    setMinimumVotingPeriod,
  ] = useState<BigNumberish>();
  const [
    maximumVotingPeriod,
    setMaximumVotingPeriod,
  ] = useState<BigNumberish>();
  const [
    minimumVotesForProposal,
    setMinimumVotesForProposal,
  ] = useState<BigNumberish>();

  useEffect(() => {
    if (!!account && !!dao && !!library && !!blockNumber) {
      const { workersUnion } = dao;
      workersUnion
        .votingRule()
        .then((result) => {
          const [
            _minimumPending,
            _maximumPending,
            _minimumVotingPeriod,
            _maximumVotingPeriod,
            _minimumVotesForProposal,
            _minimumVotesForPassing,
          ] = result;
          setMinimumPending(_minimumPending);
          setMaximumPending(_maximumPending);
          setMinimumVotingPeriod(_minimumVotingPeriod);
          setMaximumVotingPeriod(_maximumVotingPeriod);
          setMinimumVotesForProposal(_minimumVotesForProposal);
          setStartsIn(BigNumber.from(_minimumPending || 0).toNumber());
          setVotingPeriod(BigNumber.from(_minimumVotingPeriod || 0).toNumber());
        })
        .catch(errorHandler(addToast));
      library
        .getBlock(blockNumber)
        .then((block) => setTimestamp(block.timestamp));
    }
  }, [account, dao, txStatus, blockNumber]);
  useEffect(() => {
    if (!!account && !!dao && !!timestamp) {
      const { workersUnion } = dao;
      workersUnion
        .getVotesAt(account, timestamp)
        .then(setMyVotes)
        .catch(errorHandler(addToast));
    }
  }, [timestamp]);

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !dao || !library) {
      alert("Not connected");
      return;
    }
    if (!msgTo) return alert("To is not set");
    if (!msgValue) return alert("Value is not set");
    if (!msgData) return alert("Data is not set");
    if (!predecessor) return alert("Predecessor is not set");
    if (!salt) return alert("Salt is not set");
    if (!startsIn) return alert("Starts In is not set");
    if (!votingPeriod) return alert("Voting Period is not set");

    const signer = library.getSigner(account);
    handleTransaction(
      dao.workersUnion
        .connect(signer)
        .proposeTx(
          msgTo,
          msgValue,
          msgData,
          predecessor,
          salt,
          startsIn,
          votingPeriod
        ),
      setTxStatus,
      addToast,
      "Successfully proposed transaction."
    );
  };

  return (
    <Card>
      <Card.Header>Submit a new proposal (manual)</Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              value={proposalDetails}
              onChange={({ target: { value } }) => setProposalDetails(value)}
              placeholder="Describe your proposal"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>To</Form.Label>
            <Form.Control
              value={msgTo}
              onChange={({ target: { value } }) => setMsgTo(value)}
              placeholder="0xABCDEF0123456789ABCDEF0123456789ABCDEF01"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Data</Form.Label>
            <Form.Control
              value={msgData}
              onChange={({ target: { value } }) => setMsgData(value)}
              placeholder="0x"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Predecessor</Form.Label>
            <Form.Control
              value={msgData}
              onChange={({ target: { value } }) => setPredecessor(value)}
              defaultValue="0"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Value</Form.Label>
            <Form.Control
              value={msgValue}
              onChange={({ target: { value } }) => setMsgValue(value)}
              defaultValue="0"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Salt</Form.Label>
            <InputGroup className="mb-2">
              <Form.Control
                value={salt}
                onChange={({ target: { value } }) => setSalt(value)}
                defaultValue={BigNumber.from(randomBytes(32)).toString()}
              />
              <InputGroup.Append
                onClick={() =>
                  setSalt(BigNumber.from(randomBytes(32)).toString())
                }
              >
                <InputGroup.Text>RAND</InputGroup.Text>
              </InputGroup.Append>
            </InputGroup>
          </Form.Group>
          <Form.Group>
            <Form.Label>
              Starts in {((startsIn || 0) / 86400).toFixed(1)} day(s) (={" "}
              {startsIn || 0} seconds)
            </Form.Label>
            <Form.Control
              type="jumber"
              value={startsIn}
              min={BigNumber.from(minimumPending || 0).toNumber()}
              max={BigNumber.from(maximumPending || 0).toNumber()}
              step={86400}
              onChange={({ target: { value } }) => setStartsIn(parseInt(value))}
              placeholder={BigNumber.from(minimumPending || 0).toString()}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>
              Voting period {((votingPeriod || 0) / 86400).toFixed(1)} day(s) (={" "}
              {votingPeriod || 0} seconds)
            </Form.Label>
            <Form.Control
              type="number"
              value={votingPeriod}
              min={BigNumber.from(minimumVotingPeriod || 0).toNumber()}
              max={BigNumber.from(maximumVotingPeriod || 0).toNumber()}
              step={86400}
              onChange={({ target: { value } }) =>
                setVotingPeriod(parseInt(value))
              }
              placeholder={BigNumber.from(minimumVotingPeriod || 0).toString()}
            />
          </Form.Group>
          <ConditionalButton
            variant="primary"
            type="submit"
            children="Submit"
            enabledWhen={myVotes?.gt(minimumVotesForProposal || 0)}
            whyDisabled={
              "You don't have enough voting power to propose a transaction"
            }
          />
        </Form>
      </Card.Body>
    </Card>
  );
};
