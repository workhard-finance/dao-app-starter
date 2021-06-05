import React, { FormEventHandler, useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useWorkhard } from "../../../../providers/WorkhardProvider";
import {
  providers,
  BigNumber,
  BigNumberish,
  ContractTransaction,
  constants,
} from "ethers";
import { Card, Form, InputGroup } from "react-bootstrap";
import { randomBytes } from "ethers/lib/utils";
import { ConditionalButton } from "../../../ConditionalButton";
import { Param, Preset, convertType } from "../../../../utils/preset";
import { useBlockNumber } from "../../../../providers/BlockNumberProvider";
import {
  errorHandler,
  handleTransaction,
  TxStatus,
} from "../../../../utils/utils";
import { useToasts } from "react-toast-notifications";

export const PresetProposal: React.FC<Preset> = ({
  paramArray,
  methodName,
  contractName,
  contract,
  handler,
}) => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const { dao } = useWorkhard() || {};
  const { addToast } = useToasts();
  const { blockNumber } = useBlockNumber();
  const [timestamp, setTimestamp] = useState<number>(0);
  /** Proposal */
  const [predecessor, setPredecessor] = useState<string>(constants.HashZero);
  const [salt, setSalt] = useState<string>(
    BigNumber.from(randomBytes(32)).toHexString()
  );
  const [startsIn, setStartsIn] = useState<number>();
  const [votingPeriod, setVotingPeriod] = useState<number>();
  const [txStatus, setTxStatus] = useState<TxStatus>();

  const [advancedMode, setAdvancedMode] = useState<boolean>(false);

  /** arguments **/
  const [args, setArgs] = useState<{ [key: string]: string }>({});

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
      const workersUnion = dao.workersUnion;
      workersUnion
        .votingRule()
        .then((result: any) => {
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
        .then((block) => setTimestamp(block.timestamp))
        .catch(errorHandler(addToast));
    }
  }, [account, dao, txStatus]);
  useEffect(() => {
    if (!!account && !!dao && !!timestamp) {
      const { workersUnion } = dao;
      workersUnion
        .getVotesAt(account, timestamp)
        .then(setMyVotes)
        .catch(errorHandler(addToast));
    }
  }, [blockNumber, timestamp]);
  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !dao || !contract || !library) {
      alert("Not connected");
      return;
    }
    const getType = (valueName: string) => {
      const argInfo: Param = paramArray.filter((x) => x.name == valueName)[0];
      return argInfo.type;
    };

    const params = Object.entries(args).map((x) =>
      convertType(getType(x[0]), x[1])
    );
    const popTx = handler
      ? await handler(params)
      : await contract.populateTransaction[methodName](...params);
    const { data } = popTx;
    if (!predecessor) return alert("Predecessor is not set");
    if (!data) return alert("data is not set");
    if (!salt) return alert("Salt is not set");
    if (!startsIn) return alert("Starts In is not set");
    if (!votingPeriod) return alert("Voting Period is not set");
    const signer = library.getSigner(account);
    handleTransaction(
      dao.workersUnion
        .connect(signer)
        .proposeTx(
          contract.address,
          0,
          data,
          predecessor,
          salt,
          startsIn,
          votingPeriod
        ),
      setTxStatus,
      addToast,
      "Successfully proposed."
    );
  };
  return (
    <Card>
      <Card.Header>
        {contractName}.{methodName}()
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {paramArray.map((arg, i) => (
            <Form.Group key={`preset-form-input-${i}`}>
              <Form.Label>{arg.name}</Form.Label>
              <Form.Control
                value={args[arg.name]}
                onChange={({ target: { value } }) =>
                  setArgs({
                    ...args,
                    [arg.name]: value,
                  })
                }
                placeholder={arg.name}
              />
            </Form.Group>
          ))}

          <a
            className="text-warning"
            style={{ cursor: "pointer" }}
            onClick={() => setAdvancedMode(!advancedMode)}
          >
            Advanced
          </a>
          <br />
          <br />
          <div hidden={!advancedMode}>
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
                  defaultValue={BigNumber.from(randomBytes(32)).toHexString()}
                />
                <InputGroup.Append
                  onClick={() =>
                    setSalt(BigNumber.from(randomBytes(32)).toHexString())
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
                onChange={({ target: { value } }) =>
                  setStartsIn(parseInt(value))
                }
                placeholder={BigNumber.from(minimumPending || 0).toString()}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>
                Voting period {((votingPeriod || 0) / 86400).toFixed(1)} day(s)
                (= {votingPeriod || 0} seconds)
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
                placeholder={BigNumber.from(
                  minimumVotingPeriod || 0
                ).toString()}
              />
            </Form.Group>
          </div>
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
