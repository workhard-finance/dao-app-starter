import React, { FormEventHandler, useEffect, useState } from "react";
import {
  BigNumber,
  ContractTransaction,
  providers,
  Signer,
  Transaction,
} from "ethers";
import { Card, Form } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";
import { solidityKeccak256 } from "ethers/lib/utils";

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
  const [hasExecutorRole, setHasExecutorRole] = useState<boolean>(false);
  const [timestamp, setTimestamp] = useState<number>(0);
  const [timelockTxStatus, setTimelockTxStatus] = useState<TimelockTxStatus>(
    TimelockTxStatus.PENDING
  );
  const [lastTx, setLastTx] = useState<ContractTransaction>();
  useEffect(() => {
    if (!!contracts && !!library) {
      let stale = false;
      const timeLockGovernance = contracts.timeLockGovernance;
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

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts || !library || !scheduledTx) {
      alert("Not connected");
      return;
    }

    const signer: Signer = library.getSigner(account);
    const timeLockGovernance = contracts.timeLockGovernance;

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
      const timeLockGovernance = contracts.timeLockGovernance;
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
        <Card.Text>target: {target?.toString()}</Card.Text>
        <Card.Text>value: {value?.toString()}</Card.Text>
        <Card.Text>data: {data}</Card.Text>
        <Card.Text>predecessor: {predecessor}</Card.Text>
        <Card.Text>salt: {salt?.toString()}</Card.Text>
        <Card.Text>delay: {delay?.toString()}</Card.Text>
        <Card.Text>
          txHash:{" "}
          <a target="_blank" href={`https://etherscan.io/tx/${tx.hash}`}>
            {tx.hash?.toString()}
          </a>
        </Card.Text>
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
