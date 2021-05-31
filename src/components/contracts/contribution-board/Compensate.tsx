import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, BigNumberish } from "ethers";
import { Card, Form, FormControl, FormLabel } from "react-bootstrap";
import { isAddress } from "@ethersproject/address";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";
import {
  errorHandler,
  handleTransaction,
  TxStatus,
} from "../../../utils/utils";
import { useToasts } from "react-toast-notifications";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";

export interface CompensateProps {
  projId: BigNumberish;
  fund: BigNumberish;
  budgetOwner: string;
}

export const Compensate: React.FC<CompensateProps> = ({
  projId,
  budgetOwner,
  fund,
}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { dao } = useWorkhard() || {};
  const { addToast } = useToasts();
  const [payTo, setPayTo] = useState("");
  const [payAmount, setPayAmount] = useState<number>();
  const [balance, setBalance] = useState<BigNumberish>(fund);
  const [txStatus, setTxStatus] = useState<TxStatus>();

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const contributionBoard = dao?.contributionBoard;
    if (!contributionBoard) {
      alert("Not connected");
      return;
    }
    const payAmountInWei = parseEther(payAmount?.toString() || "0");
    if (!isAddress(payTo)) {
      alert("Invalid address");
      return;
    }
    if (payAmountInWei.gt(balance)) {
      alert("Not enough amount of $COMMIT tokens");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      contributionBoard
        .connect(signer)
        .compensate(projId, payTo, payAmountInWei),
      setTxStatus,
      addToast,
      "Compensation complete!"
    );
  };

  useEffect(() => {
    if (!!account && !!library && !!dao) {
      const { contributionBoard } = dao;
      contributionBoard
        .projectFund(projId)
        .then(setBalance)
        .catch(errorHandler(addToast));
    }
  }, [txStatus, blockNumber]);

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Budget</Form.Label>
        <Card.Text style={{ fontSize: "1.5rem" }}>
          {formatEther(balance || "0")} $COMMIT
        </Card.Text>
      </Form.Group>
      <Form.Group>
        <FormLabel>Pay to</FormLabel>
        <FormControl
          placeholder="0xABCDEF0123456789ABCDEF0123456789ABCDEF"
          value={payTo}
          onChange={(event) => setPayTo(event.target.value)}
        />
      </Form.Group>
      <Form.Group>
        <FormLabel>Amount</FormLabel>
        <FormControl
          placeholder="3214.23"
          type="number"
          value={payAmount}
          onChange={(event) => setPayAmount(parseFloat(event.target.value))}
        />
      </Form.Group>
      <ConditionalButton
        variant="primary"
        type="submit"
        enabledWhen={account === budgetOwner ? true : undefined}
        whyDisabled={`Only budget owner can call this function.`}
        children={`Compensate`}
      />
    </Form>
  );
};
