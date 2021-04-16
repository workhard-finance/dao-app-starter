import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, BigNumberish, ContractTransaction } from "ethers";
import { Button, Form, Tooltip, OverlayTrigger } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers/lib.esm";
import { ConditionalButton } from "../../ConditionalButton";
import { solidityKeccak256 } from "ethers/lib/utils";

export interface AddBudgetProps {
  projId: BigNumberish;
  fund: BigNumberish;
  budgetOwner: string;
}

// Timelock Version
export const ApproveProject: React.FC<AddBudgetProps> = ({
  projId,
  budgetOwner,
}) => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  const [timelock, setTimelock] = useState<string>("86400");
  const [hasProposerRole, setHasProposerRole] = useState<boolean>(false);
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
    const timeLockGovernance = contracts.timeLockGovernance;

    const tx = await cryptoJobBoard.populateTransaction.approveProject(projId);
    const data = tx?.data;
    if (data == undefined) {
      alert("invalid data");
      return;
    }

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
      .then(txWait)
      .catch(handleException);

    timeLockGovernance
      .connect(signer)
      .execute(
        contracts.cryptoJobBoard.address,
        0,
        data,
        ethers.constants.HashZero,
        ethers.constants.HashZero
      )
      .then(txWait)
      .catch(handleException);
  };

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const timeLockGovernance = contracts.timeLockGovernance;
      timeLockGovernance
        .hasRole(solidityKeccak256(["string"], ["PROPOSER_ROLE"]), account)
        .then(setHasProposerRole)
        .catch(handleException);
      return () => {
        stale = true;
        setTimelock("86400");
        setHasProposerRole(false);
      };
    }
  }, [account, contracts]);
  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="time-lock">
        <Form.Label>
          Approve project by the timelocked admin (will be replaced with
          FarmersUnion.sol soon)
        </Form.Label>
        <Form.Control
          required
          type="text"
          onChange={({ target: { value } }) => setTimelock(value)}
          value={timelock}
        />
      </Form.Group>
      <ConditionalButton
        variant="primary"
        type="submit"
        enabledWhen={hasProposerRole}
        whyDisabled="Only the timelock admin can call this function for now. This permission will be moved to FarmersUnion."
        children="Approve Project(admin only)"
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
