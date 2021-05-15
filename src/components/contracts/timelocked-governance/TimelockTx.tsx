import React, { FormEventHandler, useEffect, useState } from "react";
import {
  BigNumber,
  Contract,
  ContractTransaction,
  PopulatedTransaction,
  providers,
  Signer,
  Transaction,
} from "ethers";
import { Accordion, Button, Card, Modal, Row, Col } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";
import { formatEther, solidityKeccak256 } from "ethers/lib/utils";
import {
  DecodedTxData,
  decodeTxDetails,
  errorHandler,
  flatten,
  handleTransaction,
  TxStatus,
} from "../../../utils/utils";
import { OverlayTooltip } from "../../OverlayTooltip";
import { useToasts } from "react-toast-notifications";

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
  const { addToast } = useToasts();
  const [scheduledTx, setScheduledTx] = useState<ScheduledTx>();
  const [decodedTxData, setDecodedTxData] = useState<DecodedTxData[]>();
  const [hasExecutorRole, setHasExecutorRole] = useState<boolean>(false);
  const [timestamp, setTimestamp] = useState<number>(0);
  const [timelockTxStatus, setTimelockTxStatus] = useState<TimelockTxStatus>(
    TimelockTxStatus.PENDING
  );
  const [lastTx, setLastTx] = useState<ContractTransaction>();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [executionTx, setExecutionTx] = useState<PopulatedTransaction>();
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    if (!!contracts && !!library) {
      const timeLockGovernance = contracts.timelockedGovernance;
      const workersUnion = contracts.workersUnion;
      library
        .getBlock(blockNumber)
        .then((block) => {
          setTimestamp(block.timestamp);
        })
        .catch(errorHandler(addToast));
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
        const fn = Array.isArray(result.target)
          ? timeLockGovernance.populateTransaction.executeBatch
          : timeLockGovernance.populateTransaction.execute;
        fn(
          result.target,
          result.value,
          result.data,
          result.predecessor,
          result.salt
        ).then((populated) => {
          setExecutionTx(populated);
        });
      }
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

  const execute = async () => {
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
          handleTransaction(
            timeLockGovernance
              .connect(signer)
              .execute(target, value, data, predecessor, salt),
            setTxStatus,
            addToast,
            "Executed transaction"
          );
        } else if (
          Array.isArray(target) &&
          Array.isArray(value) &&
          Array.isArray(data)
        ) {
          handleTransaction(
            timeLockGovernance
              .connect(signer)
              .executeBatch(target, value, data, predecessor, salt),
            setTxStatus,
            addToast,
            "Executed batch transaction"
          );
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!!account && !!contracts) {
      const { timelockedGovernance } = contracts;
      timelockedGovernance
        .hasRole(solidityKeccak256(["string"], ["EXECUTOR_ROLE"]), account)
        .then(setHasExecutorRole)
        .catch(errorHandler(addToast));

      timelockedGovernance
        .isOperationDone(id)
        .then(async (done) => {
          if (done) {
            setTimelockTxStatus(TimelockTxStatus.DONE);
          } else {
            const ready = await timelockedGovernance.isOperationReady(id);
            if (ready) {
              setTimelockTxStatus(TimelockTxStatus.READY);
              return;
            }
            const pending = await timelockedGovernance.isOperationPending(id);
            if (pending) {
              setTimelockTxStatus(TimelockTxStatus.PENDING);
              return;
            }
          }
        })
        .catch(errorHandler(addToast));
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
  const delay = parseInt(scheduledTx?.delay.toString() || "0");
  const remaining = timestamp + delay - Math.floor(new Date().getTime() / 1000);
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
        <ConditionalButton
          variant="primary"
          type="submit"
          enabledWhen={
            hasExecutorRole && timelockTxStatus === TimelockTxStatus.READY
          }
          onClick={execute}
          whyDisabled="Only the timelock admin can call this function for now. Open an issue on Github and ping the admin via Discord. This permission will be moved to WorkersUnion."
          children={buttonText(timelockTxStatus)}
        />{" "}
        <OverlayTooltip tip={`Data for Gnosis Safe Multisig Wallet.`}>
          <Button variant="outline" onClick={handleShow}>
            ABI?
          </Button>
        </OverlayTooltip>
      </Card.Body>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Here's the custom data for gnosis safe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Address:</h5>
          <code style={{ color: "black", fontFamily: "Neucha" }}>
            {executionTx?.to}
          </code>
          <br />
          <br />
          <h5>Value:</h5>
          <code style={{ color: "black", fontFamily: "Neucha" }}>
            {executionTx?.value || 0}
          </code>
          <br />
          <br />
          <h5>Data:</h5>
          <code style={{ color: "black", fontFamily: "Neucha" }}>
            {executionTx?.data}
          </code>
        </Modal.Body>
      </Modal>
    </Card>
  );
};
