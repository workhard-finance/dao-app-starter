import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, BigNumberish, ContractTransaction } from "ethers";
import { Card, Form, InputGroup } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther, randomBytes } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";

export interface ProposeTxProps {}

export const ProposeTx: React.FC<ProposeTxProps> = ({}) => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  const [daiBalance, setDaiBalance] = useState<BigNumber>();
  /** Proposal */
  const [msgTo, setMsgTo] = useState<string>();
  const [msgValue, setMsgValue] = useState<string>();
  const [msgData, setMsgData] = useState<string>();
  const [predecessor, setPredecessor] = useState<string>();
  const [salt, setSalt] = useState<string>();
  const [proposalDetails, setProposalDetails] = useState<string>();
  const [startsIn, setStartsIn] = useState<number>();
  const [votingPeriod, setVotingPeriod] = useState<number>();
  const [lastTx, setLastTx] = useState<ContractTransaction>();

  /** Memorandom */
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
    if (!!account && !!contracts) {
      let stale = false;
      const farmersUnion = contracts.farmersUnion;
      farmersUnion
        .memorandom()
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
        .catch(() => {
          if (!stale) {
            setMinimumPending(undefined);
            setMaximumPending(undefined);
            setMinimumVotingPeriod(undefined);
            setMaximumVotingPeriod(undefined);
            setMinimumVotesForProposal(undefined);
          }
        });
      farmersUnion
        .getVotes(account)
        .then((votes: any) => {
          setMyVotes(votes);
        })
        .catch(() => {
          if (!stale) setMyVotes(undefined);
        });
    }
  }, [account, contracts, lastTx]);

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts) {
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
    contracts.farmersUnion
      .connect(signer)
      .proposeTx(
        msgTo,
        msgValue,
        msgData,
        predecessor,
        salt,
        startsIn,
        votingPeriod
      )
      .then((tx) => {
        setLastTx(tx);
      });
  };

  return (
    <Card>
      <Card.Header as="h5">Submit a new proposal (manual)</Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              id="propose-tx-details"
              value={proposalDetails}
              onChange={({ target: { value } }) => setProposalDetails(value)}
              placeholder="Describe your proposal"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>To</Form.Label>
            <Form.Control
              id="propose-tx-to"
              value={msgTo}
              onChange={({ target: { value } }) => setMsgTo(value)}
              placeholder="0xABCDEF0123456789ABCDEF0123456789ABCDEF01"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Data</Form.Label>
            <Form.Control
              id="propose-tx-data"
              value={msgData}
              onChange={({ target: { value } }) => setMsgData(value)}
              placeholder="0x"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Predecessor</Form.Label>
            <Form.Control
              id="propose-tx-predecessor"
              value={msgData}
              onChange={({ target: { value } }) => setPredecessor(value)}
              defaultValue="0"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Value</Form.Label>
            <Form.Control
              id="propose-tx-value"
              value={msgValue}
              onChange={({ target: { value } }) => setMsgValue(value)}
              defaultValue="0"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Salt</Form.Label>
            <InputGroup className="mb-2">
              <Form.Control
                id="propose-tx-salt"
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
              id="propose-tx-starts-in"
              type="number"
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
              id="propose-tx-voting-period"
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
