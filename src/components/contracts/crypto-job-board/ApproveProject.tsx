import React, { FormEventHandler, useState } from "react";
import { BigNumber, BigNumberish, ContractTransaction } from "ethers";
import { Button, Form, Tooltip, OverlayTrigger } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers/lib.esm";

export interface AddBudgetProps {
  projId: BigNumberish;
  fund: BigNumberish;
  budgetOwner: string;
}

export const ApproveProject: React.FC<AddBudgetProps> = ({
  projId,
  budgetOwner,
}) => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  const [timelock, setTimelock] = useState<string>("86400");

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const cryptoJobBoard = contracts?.cryptoJobBoard;
    const timeLockGovernance = contracts?.timeLockGovernance;
    if (!cryptoJobBoard) {
      alert("Not connected");
      return;
    }
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
      <OverlayTrigger
        show={account === budgetOwner ? false : undefined}
        overlay={
          <Tooltip id={`tooltip-budgetowner`}>
            Only the project owner can call this function.
          </Tooltip>
        }
      >
        <Button
          variant="primary"
          type="submit"
          disabled={account !== budgetOwner}
        >
          Approve Project(Admin Only)
        </Button>
      </OverlayTrigger>
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
