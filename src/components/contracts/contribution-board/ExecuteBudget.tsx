import React, { useState } from "react";
import { BigNumber, BigNumberish } from "ethers";
import { Card } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { formatEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { useToasts } from "react-toast-notifications";
import { ConditionalButton } from "../../ConditionalButton";
import { handleTransaction, TxStatus } from "../../../utils/utils";

export interface ExecuteBudgetProps {
  projId: BigNumberish;
  budgetIndex: number;
  budgetOwner: string;
  amount: BigNumber;
  transferred: boolean;
}

export const ExecuteBudget: React.FC<ExecuteBudgetProps> = ({
  projId,
  budgetIndex,
  budgetOwner,
  amount,
  transferred,
}) => {
  const { account, chainId, library } = useWeb3React();
  const { dao } = useWorkhard() || {};
  const { addToast } = useToasts();
  const [_, setTxStatus] = useState<TxStatus>();

  const executeBudget = () => {
    if (!account || !dao) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const contributionBoard = dao.contributionBoard;
    handleTransaction(
      contributionBoard.connect(signer).executeBudget(projId, budgetIndex),
      setTxStatus,
      addToast,
      "Budget executed."
    );
  };

  return (
    <Card>
      <Card.Header># {budgetIndex}</Card.Header>
      <Card.Body>
        <Card.Text>Amount: {formatEther(amount)}</Card.Text>
        <Card.Text>Executed: {transferred ? "True" : "False"}</Card.Text>
        {!transferred && (
          <ConditionalButton
            variant="primary"
            type="submit"
            enabledWhen={account === budgetOwner && !transferred}
            whyDisabled="Only budget owner can call this function"
            children={transferred ? "Already executed" : "Execute"}
            onClick={executeBudget}
          />
        )}
      </Card.Body>
    </Card>
  );
};
