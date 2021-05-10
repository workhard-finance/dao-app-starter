import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, BigNumberish } from "ethers";
import { Form, FormControl, FormLabel } from "react-bootstrap";
import { isAddress } from "@ethersproject/address";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";

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
  const contracts = useWorkhardContracts();
  const [payTo, setPayTo] = useState("");
  const [payAmount, setPayAmount] = useState<number>();
  const [balance, setBalance] = useState<BigNumberish>(fund);
  const [lastTx, setLastTx] = useState<string>();

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const jobBoard = contracts?.jobBoard;
    if (!jobBoard) {
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
    jobBoard
      .connect(signer)
      .compensate(projId, payTo, payAmountInWei)
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            setLastTx(receipt.transactionHash);
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

  useEffect(() => {
    if (!!account && !!library && !!contracts) {
      let stale = false;
      const { jobBoard } = contracts;
      jobBoard.projectFund(projId).then((bal: BigNumber) => {
        if (!stale) setBalance(bal);
      });
    }
  }, [lastTx]);
  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Budget</Form.Label>
        <Form.Text>{formatEther(balance || "0")} $COMMIT</Form.Text>
      </Form.Group>
      <Form.Group>
        <FormLabel>Contributor address</FormLabel>
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
      />
    </Form>
  );
};
