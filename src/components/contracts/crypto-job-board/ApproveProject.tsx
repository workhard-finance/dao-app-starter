import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, BigNumberish, ContractTransaction } from "ethers";
import { Form } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers/lib.esm";
import { ConditionalButton } from "../../ConditionalButton";
import { solidityKeccak256 } from "ethers/lib/utils";

export interface ApproveProjectProps {
  projId: BigNumberish;
  fund: BigNumberish;
  budgetOwner: string;
}

enum ApprovalStatus {
  NOT_SCHEDULED,
  PENDING,
  READY,
  DONE,
}

// Timelock Version
export const ApproveProject: React.FC<ApproveProjectProps> = ({
  projId,
  budgetOwner,
}) => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  const [timelock, setTimelock] = useState<string>("86400");
  const [hasProposerRole, setHasProposerRole] = useState<boolean>(false);
  const [hasExecutorRole, setHasExecutorRole] = useState<boolean>(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(
    ApprovalStatus.NOT_SCHEDULED
  );
  const [lastTx, setLastTx] = useState<ContractTransaction>();

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }

    const signer = library.getSigner(account);
    const cryptoJobBoard = contracts.cryptoJobBoard;
    const timeLockGovernance = contracts.timelockedGovernance;

    const tx = await cryptoJobBoard.populateTransaction.approveProject(projId);
    const data = tx?.data;
    if (data == undefined) {
      alert("invalid data");
      return;
    }
    switch (approvalStatus) {
      case ApprovalStatus.PENDING:
        alert("Should wait the timelock");
        break;
      case ApprovalStatus.DONE:
        alert("Already executed");
        break;
      case ApprovalStatus.NOT_SCHEDULED:
        timeLockGovernance
          .connect(signer)
          .schedule(
            contracts.cryptoJobBoard.address,
            0,
            data,
            ethers.constants.HashZero,
            ethers.constants.HashZero,
            BigNumber.from(timelock)
          )
          .then((tx) => {
            setLastTx(tx);
            txWait(tx);
          })
          .catch(handleException);
        break;
      case ApprovalStatus.READY:
        timeLockGovernance
          .connect(signer)
          .execute(
            contracts.cryptoJobBoard.address,
            0,
            data,
            ethers.constants.HashZero,
            ethers.constants.HashZero
          )
          .then((tx) => {
            setLastTx(tx);
            txWait(tx);
          })
          .catch(handleException);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const timeLockGovernance = contracts.timelockedGovernance;
      const cryptoJobBoard = contracts.cryptoJobBoard;
      timeLockGovernance
        .hasRole(solidityKeccak256(["string"], ["PROPOSER_ROLE"]), account)
        .then(setHasProposerRole)
        .catch(handleException);
      timeLockGovernance
        .hasRole(solidityKeccak256(["string"], ["EXECUTOR_ROLE"]), account)
        .then(setHasExecutorRole)
        .catch(handleException);
      cryptoJobBoard.populateTransaction
        .approveProject(projId)
        .then(async (tx) => {
          if (tx.data) {
            const txId = await timeLockGovernance.hashOperation(
              cryptoJobBoard.address,
              0,
              tx.data,
              ethers.constants.HashZero,
              ethers.constants.HashZero
            );
            const scheduled = await timeLockGovernance.isOperation(txId);
            if (!scheduled) {
              setApprovalStatus(ApprovalStatus.NOT_SCHEDULED);
              return;
            }
            const ready = await timeLockGovernance.isOperationReady(txId);
            if (ready) {
              setApprovalStatus(ApprovalStatus.READY);
              return;
            }
            const done = await timeLockGovernance.isOperationDone(txId);
            if (done) {
              setApprovalStatus(ApprovalStatus.DONE);
              return;
            }
            const pending = await timeLockGovernance.isOperationPending(txId);
            if (pending) {
              setApprovalStatus(ApprovalStatus.PENDING);
              return;
            }
          }
        });
      return () => {
        stale = true;
        setTimelock("86400");
        setHasProposerRole(false);
        setHasExecutorRole(false);
        setApprovalStatus(ApprovalStatus.NOT_SCHEDULED);
      };
    }
  }, [account, contracts, projId, lastTx]);

  const buttonText = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.NOT_SCHEDULED:
        return "Schedule transaction";
      case ApprovalStatus.PENDING:
        return "Waiting timelock";
      case ApprovalStatus.READY:
        return "Execute approval";
      case ApprovalStatus.DONE:
        return "Already approved";
    }
  };
  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="time-lock">
        <Form.Label>
          Approve project by the timelocked admin (will be replaced with
          FarmersUnion.sol soon)
        </Form.Label>
        {approvalStatus === ApprovalStatus.NOT_SCHEDULED && (
          <Form.Control
            required
            type="text"
            onChange={({ target: { value } }) => setTimelock(value)}
            value={timelock}
          />
        )}
      </Form.Group>
      <ConditionalButton
        variant="primary"
        type="submit"
        enabledWhen={
          (hasProposerRole &&
            approvalStatus === ApprovalStatus.NOT_SCHEDULED) ||
          (hasExecutorRole && approvalStatus === ApprovalStatus.READY)
        }
        whyDisabled="Only the timelock admin can call this function for now. Open an issue on Github and ping the admin via Discord. This permission will be moved to FarmersUnion."
        children={buttonText(approvalStatus)}
      />
    </Form>
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
