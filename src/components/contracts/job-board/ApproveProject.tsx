import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, BigNumberish, ContractTransaction } from "ethers";
import { Form } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers/lib.esm";
import { ConditionalButton } from "../../ConditionalButton";
import { solidityKeccak256 } from "ethers/lib/utils";
import { useToasts } from "react-toast-notifications";
import {
  errorHandler,
  handleTransaction,
  TxStatus,
} from "../../../utils/utils";

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
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [timelock, setTimelock] = useState<string>("86400");
  const [hasProposerRole, setHasProposerRole] = useState<boolean>(false);
  const [hasExecutorRole, setHasExecutorRole] = useState<boolean>(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(
    ApprovalStatus.NOT_SCHEDULED
  );

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }

    const signer = library.getSigner(account);
    const jobBoard = contracts.jobBoard;
    const timeLockGovernance = contracts.timelockedGovernance;

    const tx = await jobBoard.populateTransaction.approveProject(projId);
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
        handleTransaction(
          timeLockGovernance
            .connect(signer)
            .schedule(
              contracts.jobBoard.address,
              0,
              data,
              ethers.constants.HashZero,
              ethers.constants.HashZero,
              BigNumber.from(timelock)
            ),
          setTxStatus,
          addToast,
          "Created VotingEscrowLock"
        );
        break;
      case ApprovalStatus.READY:
        handleTransaction(
          timeLockGovernance
            .connect(signer)
            .execute(
              contracts.jobBoard.address,
              0,
              data,
              ethers.constants.HashZero,
              ethers.constants.HashZero
            ),
          setTxStatus,
          addToast,
          "Created VotingEscrowLock"
        );
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!!account && !!contracts) {
      const timeLockGovernance = contracts.timelockedGovernance;
      const jobBoard = contracts.jobBoard;
      timeLockGovernance
        .hasRole(solidityKeccak256(["string"], ["PROPOSER_ROLE"]), account)
        .then(setHasProposerRole)
        .catch(errorHandler(addToast));
      timeLockGovernance
        .hasRole(solidityKeccak256(["string"], ["EXECUTOR_ROLE"]), account)
        .then(setHasExecutorRole)
        .catch(errorHandler(addToast));
      jobBoard.populateTransaction.approveProject(projId).then(async (tx) => {
        if (tx.data) {
          const txId = await timeLockGovernance.hashOperation(
            jobBoard.address,
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
    }
  }, [account, contracts, projId, txStatus]);

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
      <Form.Group>
        <Form.Label>
          Approve project by the timelocked admin (will be replaced with
          WorkersUnion.sol soon)
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
        whyDisabled="Only the timelock admin can call this function for now. Open an issue on Github and ping the admin via Discord. This permission will be moved to WorkersUnion."
        children={buttonText(approvalStatus)}
      />
    </Form>
  );
};
