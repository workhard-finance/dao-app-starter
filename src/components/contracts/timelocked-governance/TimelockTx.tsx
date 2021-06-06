import React, { useEffect, useState } from "react";
import {
  BigNumber,
  ContractTransaction,
  PopulatedTransaction,
  providers,
  Signer,
  Transaction,
} from "ethers";
import { Accordion, Button, Card, Modal } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";
import { formatEther, getAddress, Result } from "ethers/lib/utils";
import {
  compareAddress,
  DecodedTxData,
  decodeTxDetails,
  errorHandler,
  flatten,
  getGnosisAPI,
  safeTxHandler,
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
  CANCELED,
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
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const workhardCtx = useWorkhard();
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
    if (!!workhardCtx && !!library) {
      try {
        const timelock = workhardCtx.dao.timelock;
        const workersUnion = workhardCtx.dao.workersUnion;
        library
          .getBlock(blockNumber)
          .then((block) => {
            setTimestamp(block.timestamp);
          })
          .catch(errorHandler(addToast));
        if (tx.to) {
          let proposer: TxProposer | undefined;
          let forced: boolean | undefined;
          if (tx.to === timelock.address) {
            proposer = TxProposer.DEV;
            if (
              tx.data.startsWith(
                timelock.interface.getSighash(
                  timelock.interface.functions[
                    "forceSchedule(address,uint256,bytes,bytes32,bytes32,uint256)"
                  ]
                )
              )
            ) {
              forced = true;
            }
          } else if (tx.to === workersUnion.address) {
            proposer = TxProposer.WORKERS_UNION;
          } else if (tx.to === workhardCtx.dao.multisig.address) {
            proposer = TxProposer.DEV;
          } else {
            proposer = TxProposer.UNKNOWN;
          }

          let result: Result;
          if (tx.to === workhardCtx.dao.multisig.address) {
            const txDetails = decodeTxDetails(
              workhardCtx,
              tx.to,
              tx.data,
              tx.value
            );
            const decodedGnosisSafeTx = decodeTxDetails(
              workhardCtx,
              txDetails.result.to,
              txDetails.result.data,
              txDetails.result.value
            );
            result = decodedGnosisSafeTx.result;
          } else {
            const txDetails = decodeTxDetails(
              workhardCtx,
              tx.to,
              tx.data,
              tx.value
            );
            result = txDetails.result;
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
            ? timelock.populateTransaction.executeBatch
            : timelock.populateTransaction.execute;
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
      } catch (_err) {
        /// invalid tx. falied to decode
      }
    }
  }, [library, workhardCtx, lastTx]);

  useEffect(() => {
    if (!!workhardCtx && !!scheduledTx) {
      try {
        const { target, data, value } = scheduledTx;
        if (
          Array.isArray(target) &&
          Array.isArray(data) &&
          Array.isArray(value)
        ) {
          setDecodedTxData(
            target.map((_target: string, i: number) => {
              return decodeTxDetails(workhardCtx, _target, data[i], value[i]);
            })
          );
        } else if (
          !Array.isArray(target) &&
          !Array.isArray(data) &&
          !Array.isArray(value)
        ) {
          setDecodedTxData([decodeTxDetails(workhardCtx, target, data, value)]);
        } else {
          throw Error("decoding error");
        }
      } catch (_err) {
        /// invalid tx. falied to decode
      }
    }
  }, [workhardCtx, scheduledTx]);

  useEffect(() => {
    if (!!workhardCtx && !!account && !!chainId) {
      const safe = workhardCtx.dao.multisig.address;
      if (compareAddress(account, safe)) {
        setHasExecutorRole(true);
      } else {
        const gnosisAPI = getGnosisAPI(chainId);
        if (gnosisAPI) {
          fetch(gnosisAPI + `safes/${safe}/`)
            .then(async (response) => {
              const result = await response.json();
              if (
                (result.owners as string[])
                  .map(getAddress)
                  .includes(getAddress(account))
              ) {
                setHasExecutorRole(true);
              }
            })
            .catch((_) => {
              setHasExecutorRole(false);
            });
        }
      }
    }
  }, [workhardCtx, account, chainId]);
  const execute = async () => {
    if (!account || !workhardCtx || !library || !scheduledTx || !chainId) {
      alert("Not connected");
      return;
    }

    const signer: Signer = library.getSigner(account);
    const timeLockGovernance = workhardCtx.dao.timelock;

    switch (timelockTxStatus) {
      case TimelockTxStatus.PENDING:
        alert("Should wait the timelock");
        break;
      case TimelockTxStatus.DONE:
        alert("Already executed");
        break;
      case TimelockTxStatus.READY:
        const { target, value, data, predecessor, salt } = scheduledTx;
        let tx: PopulatedTransaction | undefined = undefined;
        if (
          !Array.isArray(target) &&
          !Array.isArray(value) &&
          !Array.isArray(data)
        ) {
          tx = await timeLockGovernance.populateTransaction.execute(
            target,
            value,
            data,
            predecessor,
            salt
          );
        } else if (
          Array.isArray(target) &&
          Array.isArray(value) &&
          Array.isArray(data)
        ) {
          tx = await timeLockGovernance.populateTransaction.executeBatch(
            target,
            value,
            data,
            predecessor,
            salt
          );
        }
        if (tx) {
          safeTxHandler(
            chainId,
            workhardCtx.dao.multisig.address,
            tx,
            signer,
            setTxStatus,
            addToast,
            "Executed transaction",
            (receipt) => {
              if (receipt) {
              } else {
                alert("Created Multisig Tx. Go to Gnosis wallet and confirm.");
              }
              setTxStatus(undefined);
            }
          );
        }
        break;
      default:
        break;
    }
  };

  const cancel = async () => {
    if (!account || !workhardCtx || !library || !scheduledTx || !chainId) {
      alert("Not connected");
      return;
    }

    const signer: Signer = library.getSigner(account);

    if (timelockTxStatus === TimelockTxStatus.DONE) {
      alert("Already executed");
      return;
    }

    const { target, value, data, predecessor, salt } = scheduledTx;
    const tx = await workhardCtx.dao.timelock.populateTransaction.cancel(id);
    safeTxHandler(
      chainId,
      workhardCtx.dao.multisig.address,
      tx,
      signer,
      setTxStatus,
      addToast,
      "Executed transaction",
      (receipt) => {
        if (receipt) {
        } else {
          alert("Created Multisig Tx. Go to Gnosis wallet and confirm.");
        }
        setTxStatus(undefined);
      }
    );
  };
  useEffect(() => {
    if (!!account && !!workhardCtx) {
      const { timelock } = workhardCtx.dao;
      timelock
        .isOperationDone(id)
        .then(async (done) => {
          if (done) {
            setTimelockTxStatus(TimelockTxStatus.DONE);
          } else {
            const ready = await timelock.isOperationReady(id);
            if (ready) {
              setTimelockTxStatus(TimelockTxStatus.READY);
              return;
            }
            const pending = await timelock.isOperationPending(id);
            if (pending) {
              setTimelockTxStatus(TimelockTxStatus.PENDING);
              return;
            } else {
              setTimelockTxStatus(TimelockTxStatus.CANCELED);
              return;
            }
          }
        })
        .catch(errorHandler(addToast));
    }
  }, [account, workhardCtx, scheduledTx, lastTx]);

  const buttonText = (status: TimelockTxStatus) => {
    switch (status) {
      case TimelockTxStatus.PENDING:
        return "Waiting timelock";
      case TimelockTxStatus.READY:
        return "Execute";
      case TimelockTxStatus.DONE:
        return "Already executed";
      case TimelockTxStatus.CANCELED:
        return "Canceled";
    }
  };
  // TODO: decode data to method name & args
  const delay = parseInt(scheduledTx?.delay.toString() || "0");
  const remaining = Math.max(
    0,
    timestamp + delay - Math.floor(new Date().getTime() / 1000)
  );
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
          <li key={`${index}-${id}-salt`}>salt: {scheduledTx?.salt}</li>
        </ul>
        <Card.Text>Transaction:</Card.Text>
        {!decodedTxData && <p>Invalid transaction. Failed to decode.</p>}
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
          enabledWhen={
            hasExecutorRole && timelockTxStatus === TimelockTxStatus.READY
          }
          onClick={execute}
          whyDisabled="Only the timelock admin can call this function for now. Open an issue on Github and ping the admin via Discord. This permission will be moved to WorkersUnion."
          children={buttonText(timelockTxStatus)}
        />{" "}
        {(timelockTxStatus === TimelockTxStatus.PENDING ||
          timelockTxStatus === TimelockTxStatus.READY) && (
          <ConditionalButton
            variant="outline-danger"
            enabledWhen={hasExecutorRole}
            onClick={cancel}
            whyDisabled={
              "Only multisig owners or workers union can cancel this transaction."
            }
            children={"cancel"}
          />
        )}
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
