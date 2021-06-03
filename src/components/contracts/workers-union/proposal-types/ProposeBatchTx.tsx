import React, { FormEventHandler, useEffect, useState } from "react";
import { providers, BigNumber, BigNumberish } from "ethers";
import { Button, Card, Form, InputGroup } from "react-bootstrap";
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

interface ProposeTx {
  msgTo: string;
  msgValue: string;
  msgData: string;
}

export const ProposeBatchTx: React.FC = ({}) => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const { dao } = useWorkhard() || {};
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const [timestamp, setTimestamp] = useState<number>(0);
  /** Proposal */
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

  /** array of proposals **/
  const [indexes, setIndexes] = React.useState<number[]>([]);
  const [counter, setCounter] = React.useState(0);
  const [proposalProperties, setProposalProperties] = React.useState<{
    [key: number]: ProposeTx;
  }>({});

  useEffect(() => {
    if (!!account && !!dao && !!library && !!blockNumber) {
      const workersUnion = dao.workersUnion;
      workersUnion
        .votingRule()
        .then((result) => {
          const [
            _minimumPending,
            _maximumPending,
            _minimumVotingPeriod,
            _maximumVotingPeriod,
            _minimumVotesForProposal,
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
    if (!!account && !!dao) {
      dao.right
        .balanceOf(account)
        .then(setMyVotes)
        .catch(errorHandler(addToast));
    }
  }, [blockNumber]);

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !dao || !library) {
      alert("Not connected");
      return;
    }
    if (Object.values(proposalProperties).length == 0)
      return alert("properties are not set");
    if (!predecessor) return alert("Predecessor is not set");
    if (!salt) return alert("Salt is not set");
    if (!startsIn) return alert("Starts In is not set");
    if (!votingPeriod) return alert("Voting Period is not set");

    const signer = library.getSigner(account);
    handleTransaction(
      dao.workersUnion.connect(signer).proposeBatchTx(
        Object.values(proposalProperties).map((prop) => prop.msgTo),
        Object.values(proposalProperties).map((prop) => prop.msgValue),
        Object.values(proposalProperties).map((prop) => prop.msgData),
        predecessor,
        salt,
        startsIn,
        votingPeriod
      ),
      setTxStatus,
      addToast,
      "Successfully proposed batch transaction."
    );
  };

  const addPropose = () => {
    setIndexes((prevIndexes) => [...prevIndexes, counter]);
    setProposalProperties((prevState) => {
      return {
        ...prevState,
        [counter]: {
          msgTo: "",
          msgData: "",
          msgValue: "",
        },
      };
    });
    setCounter((prevCounter) => prevCounter + 1);
  };

  const removePropose = (index: any) => () => {
    setIndexes((prevIndexes) => [
      ...prevIndexes.filter((item) => item !== index),
    ]);
    setProposalProperties((prevState) => {
      delete prevState[index];
      return prevState;
    });
  };

  return (
    <Card>
      <Card.Header>Submit a new proposal Batch manner (manual)</Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {indexes.map((index) => {
            return (
              <Card>
                <h3>proposal</h3>
                <Form.Group>
                  <Form.Label>To</Form.Label>
                  <Form.Control
                    value={proposalProperties[index].msgTo}
                    onChange={({ target: { value } }) =>
                      setProposalProperties((prevState) => {
                        return {
                          ...prevState,
                          [index]: {
                            ...prevState[index],
                            msgTo: value,
                          },
                        };
                      })
                    }
                    placeholder="0xABCDEF0123456789ABCDEF0123456789ABCDEF01"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Data</Form.Label>
                  <Form.Control
                    value={proposalProperties[index].msgData}
                    onChange={({ target: { value } }) =>
                      setProposalProperties((prevState) => {
                        return {
                          ...prevState,
                          [index]: {
                            ...prevState[index],
                            msgData: value,
                          },
                        };
                      })
                    }
                    placeholder="0x"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Value</Form.Label>
                  <Form.Control
                    value={proposalProperties[index].msgValue}
                    onChange={({ target: { value } }) =>
                      setProposalProperties((prevState) => {
                        return {
                          ...prevState,
                          [index]: {
                            ...prevState[index],
                            msgValue: value,
                          },
                        };
                      })
                    }
                    defaultValue="0"
                  />
                </Form.Group>

                <button type="button" onClick={removePropose(index)}>
                  Remove
                </button>
              </Card>
            );
          })}
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              value={proposalDetails}
              onChange={({ target: { value } }) => setProposalDetails(value)}
              placeholder="Describe your proposal"
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Predecessor</Form.Label>
            <Form.Control
              value={predecessor}
              onChange={({ target: { value } }) => setPredecessor(value)}
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
          <Button onClick={addPropose}>add propose</Button>
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
