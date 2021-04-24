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
import {
  useWorkhardContracts,
  WorkhardContracts,
} from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";
import { getAddress, Result, solidityKeccak256 } from "ethers/lib/utils";
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

interface ScheduledTx {
  target: string;
  value: BigNumber;
  data: string;
  predecessor: string;
  salt: string;
  delay: BigNumber;
  forced?: boolean;
}

interface BatchScheduledTx {
  targets: string[];
  values: BigNumber[];
  datas: string[];
  predecessor: string;
  salt: string;
  delay: BigNumber;
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
  const [scheduledTx, setScheduledTx] = useState<
    ScheduledTx | BatchScheduledTx
  >();
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
      library
        .getBlock(blockNumber)
        .then((block) => {
          setTimestamp(block.timestamp);
        })
        .catch(handleException);
      try {
        const decoded = timeLockGovernance.interface.decodeFunctionData(
          timeLockGovernance.interface.functions[
            "schedule(address,uint256,bytes,bytes32,bytes32,uint256)"
          ],
          tx.data
        );
        setScheduledTx({
          target: decoded.target,
          value: decoded.value,
          data: decoded.data,
          predecessor: decoded.predecessor,
          salt: decoded.salt,
          delay: decoded.delay,
        });
      } catch (err) {}
      try {
        const decoded = timeLockGovernance.interface.decodeFunctionData(
          timeLockGovernance.interface.functions[
            "forceSchedule(address,uint256,bytes,bytes32,bytes32,uint256)"
          ],
          tx.data
        );
        setScheduledTx({
          target: decoded.target,
          value: decoded.value,
          data: decoded.data,
          predecessor: decoded.predecessor,
          salt: decoded.salt,
          delay: decoded.delay,
          forced: true,
        });
      } catch (err) {}
      try {
        const decoded = timeLockGovernance.interface.decodeFunctionData(
          timeLockGovernance.interface.functions[
            "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)"
          ],
          tx.data
        );
        // TODO handle batchScheduled arg "values"
        setScheduledTx({
          targets: decoded.targets,
          values: decoded["values()"],
          datas: decoded.datas,
          predecessor: decoded.predecessor,
          salt: decoded.salt,
          delay: decoded.delay,
        });
      } catch (err) {}
      return () => {
        stale = true;
        setScheduledTx(undefined);
      };
    }
  }, [library, contracts, lastTx]);

  useEffect(() => {
    if (!!contracts && !!scheduledTx) {
      const _tx: ScheduledTx | undefined = (scheduledTx as ScheduledTx).target
        ? (scheduledTx as ScheduledTx)
        : undefined;
      const _batchTx:
        | BatchScheduledTx
        | undefined = (scheduledTx as BatchScheduledTx).targets
        ? (scheduledTx as BatchScheduledTx)
        : undefined;
      if (_tx) {
        setDecodedTxData([decodeTxDetails(contracts, _tx.target, _tx.data)]);
      } else if (_batchTx) {
        setDecodedTxData(
          _batchTx.targets.map((target: string, i: number) =>
            decodeTxDetails(contracts, target, _batchTx.datas[i])
          )
        );
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
        if ("target" in scheduledTx) {
          timeLockGovernance
            .connect(signer)
            .execute(
              scheduledTx.target,
              scheduledTx.value,
              scheduledTx.data,
              scheduledTx.predecessor,
              scheduledTx.salt
            )
            .then((tx) => {
              setLastTx(tx);
              txWait(tx);
            })
            .catch(handleException);
        } else {
          timeLockGovernance
            .connect(signer)
            .executeBatch(
              scheduledTx.targets,
              scheduledTx.values,
              scheduledTx.datas,
              scheduledTx.predecessor,
              scheduledTx.salt
            )
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
  let target: string | string[] | undefined;
  let value: BigNumber | BigNumber[] | undefined;
  let data: string | string[] | undefined;
  let predecessor: string | undefined;
  let salt: string | undefined;
  let delay: BigNumber | undefined;
  if (scheduledTx) {
    target = "target" in scheduledTx ? scheduledTx.target : scheduledTx.targets;
    value = "value" in scheduledTx ? scheduledTx.value : scheduledTx.values;
    data = "data" in scheduledTx ? scheduledTx.data : scheduledTx.datas;
    predecessor = scheduledTx.predecessor;
    salt = scheduledTx.salt;
    delay = scheduledTx.delay;
  }
  return (
    <Card>
      <Card.Header>
        #{index} - tx id: {id}
      </Card.Header>
      <Card.Body>
        <Card.Text>
          Scheduled at: {new Date(timestamp * 1000).toLocaleString()}(
          {blockNumber})
        </Card.Text>
        <Card.Text>
          Remaining: {remaining} seconds (= ~{(remaining / 86400).toFixed(1)}{" "}
          days)
        </Card.Text>
        <Card.Text>
          txHash:{" "}
          <a target="_blank" href={`https://etherscan.io/tx/${tx.hash}`}>
            {tx.hash?.toString()}
          </a>
        </Card.Text>
        <Card.Text>predecessor: {predecessor}</Card.Text>
        <Card.Text>salt: {salt?.toString()}</Card.Text>
        <Card.Text>Transactions:</Card.Text>
        <Accordion>
          {decodedTxData?.map((decoded, i) => (
            <Card>
              <Card.Header>
                <Accordion.Toggle as={Button} variant="link" eventKey={`${i}`}>
                  {decoded.contractName} - {decoded.methodName}
                </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey={`${i}`}>
                <Card.Body>
                  <Card.Text>Contract: {decoded.address}</Card.Text>
                  {Object.getOwnPropertyNames(decoded.args).length > 0 && (
                    <>
                      <Card.Text>Params</Card.Text>
                      <ul>
                        {Object.getOwnPropertyNames(decoded.args).map((key) => (
                          <li>
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
            whyDisabled="Only the timelock admin can call this function for now. Open an issue on Github and ping the admin via Discord. This permission will be moved to FarmersUnion."
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

function parseValueToSolidityForm(
  value: BigNumber | BigNumber[] | undefined,
  i: number
): string {
  if (!value) return "";
  let v;
  if (Array.isArray(value)) {
    v = value[i].toString();
  } else {
    v = value.toString();
  }
  if (v === "0") return "";
  else return `{value: ${v}}`;
}
