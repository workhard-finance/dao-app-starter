import React, { FormEventHandler, useEffect, useState } from "react";
import {
  BigNumber,
  Contract,
  ContractTransaction,
  providers,
  Signer,
  Transaction,
} from "ethers";
import { Accordion, Button, Card, Form } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";
import { formatEther, solidityKeccak256 } from "ethers/lib/utils";
import { DecodedTxData, decodeTxDetails, flatten } from "../../../utils/utils";

export interface TimelockTxProps {
  id: string;
  blockNumber: number;
  tx: Transaction;
  index: number;
}

enum TimelockTxStatus {
  PENDING,
  READY,
  DONE,
}

enum TxProposer {
  DEV = "developers",
  WORKERS_UNION = "Workers Union",
  UNKNOWN = "Unknown",
}

interface ScheduledTx {
  target: string | string[];
  value: BigNumber | BigNumber[];
  data: string | string[];
  predecessor: string;
  salt: string;
  delay: BigNumber;
  proposer: TxProposer;
  forced?: boolean;
}

// Timelock Version
export const TimelockTx: React.FC<TimelockTxProps> = ({
  id,
  tx,
  blockNumber,
  index,
}) => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const contracts = useWorkhardContracts();
  const [scheduledTx, setScheduledTx] = useState<ScheduledTx>();
  const [decodedTxData, setDecodedTxData] = useState<DecodedTxData[]>();
  const [hasExecutorRole, setHasExecutorRole] = useState<boolean>(false);
  const [timestamp, setTimestamp] = useState<number>(0);
  const [timelockTxStatus, setTimelockTxStatus] = useState<TimelockTxStatus>(
    TimelockTxStatus.PENDING
  );
  const [lastTx, setLastTx] = useState<ContractTransaction>();
  useEffect(() => {
    if (!!contracts && !!library) {
      let stale = false;
      const timeLockGovernance = contracts.timelockedGovernance;
      const workersUnion = contracts.workersUnion;
      library
        .getBlock(blockNumber)
        .then((block) => {
          setTimestamp(block.timestamp);
        })
        .catch(handleException);
      if (tx.to) {
        const txDetails = decodeTxDetails(contracts, tx.to, tx.data, tx.value);
        const { result } = txDetails;
        let proposer: TxProposer | undefined;
        let forced: boolean | undefined;
        if (tx.to === timeLockGovernance.address) {
          proposer = TxProposer.DEV;
          if (
            tx.data.startsWith(
              timeLockGovernance.interface.getSighash(
                timeLockGovernance.interface.functions[
                  "forceSchedule(address,uint256,bytes,bytes32,bytes32,uint256)"
                ]
              )
            )
          ) {
            forced = true;
          }
        } else if (tx.to === workersUnion.address) {
          proposer = TxProposer.WORKERS_UNION;
        } else {
          proposer = TxProposer.UNKNOWN;
        }
        setScheduledTx({
          target: result.target,
          value: result.value,
          data: result.data,
          predecessor: result.predecessor,
          salt: result.salt,
          delay: result.delay || 86400,
          forced: forced,
          proposer,
        });
      }
      return () => {
        stale = true;
        setScheduledTx(undefined);
      };
    }
  }, [library, contracts, lastTx]);

  useEffect(() => {
    if (!!contracts && !!scheduledTx) {
      const { target, data, value } = scheduledTx;
      if (
        Array.isArray(target) &&
        Array.isArray(data) &&
        Array.isArray(value)
      ) {
        setDecodedTxData(
          target.map((_target: string, i: number) =>
            decodeTxDetails(contracts, _target, data[i], value[i])
          )
        );
      } else if (
        !Array.isArray(target) &&
        !Array.isArray(data) &&
        !Array.isArray(value)
      ) {
        setDecodedTxData([decodeTxDetails(contracts, target, data, value)]);
      } else {
        throw Error("decoding error");
      }
    }
  }, [contracts, scheduledTx]);

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts || !library || !scheduledTx) {
      alert("Not connected");
      return;
    }

    const signer: Signer = library.getSigner(account);
    const timeLockGovernance = contracts.timelockedGovernance;

    switch (timelockTxStatus) {
      case TimelockTxStatus.PENDING:
        alert("Should wait the timelock");
        break;
      case TimelockTxStatus.DONE:
        alert("Already executed");
        break;
      case TimelockTxStatus.READY:
        const { target, value, data, predecessor, salt } = scheduledTx;
        if (
          !Array.isArray(target) &&
          !Array.isArray(value) &&
          !Array.isArray(data)
        ) {
          timeLockGovernance
            .connect(signer)
            .execute(target, value, data, predecessor, salt)
            .then((tx) => {
              setLastTx(tx);
              txWait(tx);
            })
            .catch(handleException);
        } else if (
          Array.isArray(target) &&
          Array.isArray(value) &&
          Array.isArray(data)
        ) {
          timeLockGovernance
            .connect(signer)
            .executeBatch(target, value, data, predecessor, salt)
            .then((tx) => {
              setLastTx(tx);
              txWait(tx);
            })
            .catch(handleException);
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const timeLockGovernance = contracts.timelockedGovernance;
      timeLockGovernance
        .hasRole(solidityKeccak256(["string"], ["EXECUTOR_ROLE"]), account)
        .then(setHasExecutorRole)
        .catch(handleException);

      timeLockGovernance.isOperationDone(id).then(async (done) => {
        if (done) {
          setTimelockTxStatus(TimelockTxStatus.DONE);
        } else {
          const ready = await timeLockGovernance.isOperationReady(id);
          if (ready) {
            setTimelockTxStatus(TimelockTxStatus.READY);
            return;
          }
          const pending = await timeLockGovernance.isOperationPending(id);
          if (pending) {
            setTimelockTxStatus(TimelockTxStatus.PENDING);
            return;
          }
        }
      });
      return () => {
        stale = true;
        setHasExecutorRole(false);
        setTimelockTxStatus(TimelockTxStatus.PENDING);
      };
    }
  }, [account, contracts, scheduledTx, lastTx]);

  const buttonText = (status: TimelockTxStatus) => {
    switch (status) {
      case TimelockTxStatus.PENDING:
        return "Waiting timelock";
      case TimelockTxStatus.READY:
        return "Execute";
      case TimelockTxStatus.DONE:
        return "Already executed";
    }
  };
  // TODO: decode data to method name & args
  const remaining =
    timestamp +
    (scheduledTx?.delay.toNumber() || 0) -
    Math.floor(new Date().getTime() / 1000);
  return (
    <Card>
      <Card.Header>
        #{index} - tx id: {id}
      </Card.Header>
      <Card.Body>
        <Card.Text>Schedule:</Card.Text>
        <ul>
          <li key={`${index}-${id}-scheduled-at`}>
            Scheduled at: {new Date(timestamp * 1000).toLocaleString()}( block
            number: {blockNumber})
          </li>
          <li key={`${index}-${id}-remaining`}>
            Remaining: {remaining} seconds (= ~{(remaining / 86400).toFixed(1)}{" "}
            days)
          </li>
          <li key={`${index}-${id}-tx-hash`}>
            txHash:{" "}
            <a target="_blank" href={`https://etherscan.io/tx/${tx.hash}`}>
              {tx.hash?.toString()}
            </a>
          </li>
          <li key={`${index}-${id}-predecessor`}>
            predecessor: {scheduledTx?.predecessor}
          </li>
          <li key={`${index}-${id}-salt`}>
            salt: {scheduledTx?.salt.toString()}
          </li>
        </ul>
        <Card.Text>Transaction:</Card.Text>
        <Accordion>
          {decodedTxData?.map((decoded, i) => (
            <Card key={`timelock-tx-${i}`}>
              <Card.Header>
                <Accordion.Toggle as={Button} variant="link" eventKey={`${i}`}>
                  {decoded.contractName} - {decoded.methodName}
                </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey={`${i}`}>
                <Card.Body>
                  Contract: {decoded.address}
                  <br />
                  Value: {formatEther(decoded.value)} ETH
                  <br />
                  {Object.getOwnPropertyNames(decoded.args).length > 0 && (
                    <>
                      Params
                      <ul>
                        {Object.getOwnPropertyNames(decoded.args).map((key) => (
                          <li key={key}>
                            <strong>{key}</strong>: {flatten(decoded.args[key])}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          ))}
        </Accordion>
        <br />
        <Form onSubmit={handleSubmit}>
          <ConditionalButton
            variant="primary"
            type="submit"
            enabledWhen={
              hasExecutorRole && timelockTxStatus === TimelockTxStatus.READY
            }
            whyDisabled="Only the timelock admin can call this function for now. Open an issue on Github and ping the admin via Discord. This permission will be moved to WorkersUnion."
            children={buttonText(timelockTxStatus)}
          />
        </Form>
      </Card.Body>
    </Card>
  );
};

function txWait(tx: ContractTransaction) {
  tx.wait()
    .then((receipt) => {
      alert(`${receipt.transactionHash} submitted.`);
    })
    .catch((rejected) => {
      alert(`Rejected: ${rejected}.`);
    });
  // TODO wait spinner
  // TODO UI update w/stale
}

function handleException(reason: any) {
  // TODO UI update w/stale
  alert(`Failed: ${reason.data.message}`);
}
