import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, BigNumberish, constants } from "ethers";
import { Card, Form } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";
import { getTokenSymbol } from "../../../utils/utils";

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

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const cryptoJobBoard = contracts.cryptoJobBoard;
    cryptoJobBoard
      .connect(signer)
      .executeBudget(projId, budgetIndex, "0x")
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            setExecuted(true);
            alert(`${receipt.transactionHash} submitted.`);
          })
          .catch((rejected) => {
            alert(`Rejected: ${rejected}.`);
          });
        // TODO wait spinner
        // TODO UI update w/stale
      })
      .catch((reason) => {
        // TODO UI update w/stale
        alert(`Failed: ${reason}`);
      });
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
          <Form onSubmit={handleSubmit}>
            <ConditionalButton
              variant="primary"
              type="submit"
              enabledWhen={account === budgetOwner}
              whyDisabled="Only budget owner can call this function"
              children="Execute"
            />
          </Form>
        )}
      </Card.Body>
    </Card>
  );
};
