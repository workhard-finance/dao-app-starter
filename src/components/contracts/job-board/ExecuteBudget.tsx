import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, BigNumberish, constants } from "ethers";
import { Card, Form } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { useToasts } from "react-toast-notifications";
import { ConditionalButton } from "../../ConditionalButton";
import {
  getTokenSymbol,
  handleTransaction,
  TxStatus,
} from "../../../utils/utils";

export interface ExecuteBudgetProps {
  projId: BigNumberish;
  budgetIndex: number;
  budgetOwner: string;
  currency: string;
  amount: BigNumber;
  transferred: boolean;
}

export const ExecuteBudget: React.FC<ExecuteBudgetProps> = ({
  projId,
  budgetIndex,
  budgetOwner,
  currency,
  amount,
  transferred,
}) => {
  const { account, library } = useWeb3React();
  const [executed, setExecuted] = useState<boolean>();
  const contracts = useWorkhardContracts();
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();

  const executeBudget = () => {
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const jobBoard = contracts.jobBoard;
    handleTransaction(
      jobBoard.connect(signer).executeBudget(projId, budgetIndex, "0x"),
      setTxStatus,
      addToast,
      "Budget executed."
    );
  };

  return (
    <Card>
      <Card.Header as="h5"># {budgetIndex}</Card.Header>
      <Card.Body>
        <Card.Text>
          Currency: {getTokenSymbol(currency)}({currency})
        </Card.Text>
        <Card.Text>Amount: {formatEther(amount)}</Card.Text>
        <Card.Text>Executed: {transferred ? "True" : "False"}</Card.Text>
        {!transferred && !executed && (
          <ConditionalButton
            variant="primary"
            type="submit"
            enabledWhen={account === budgetOwner}
            whyDisabled="Only budget owner can call this function"
            children="Execute"
            onClick={executeBudget}
          />
        )}
      </Card.Body>
    </Card>
  );
};
