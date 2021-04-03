import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumberish } from "ethers";
import {
  Card,
  Button,
  Form,
  FormControl,
  FormLabel,
  InputGroup,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import { isAddress } from "@ethersproject/address";
import { useWorkhardContracts } from "../../providers/WorkhardContractProvider";
import { parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";

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

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const cryptoJobBoard = contracts?.cryptoJobBoard;
    if (!cryptoJobBoard) {
      alert("Not connected");
      return;
    }
    const payAmountInWei = parseEther(payAmount?.toString() || "0");
    if (!isAddress(payTo)) {
      alert("Invalid address");
      return;
    }
    if (payAmountInWei.gt(fund)) {
      alert("Not enough amount of $COMMITMENT tokens");
      return;
    }
    const signer = library.getSigner(account);
    cryptoJobBoard
      .connect(signer)
      .compensate(projId, payTo, payAmountInWei)
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
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
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="compensate">
        <FormLabel>Contributor address</FormLabel>
        <FormControl
          id="inlineFormInputGroup"
          placeholder="0xABCDEF0123456789ABCDEF0123456789ABCDEF"
          value={payTo}
          onChange={(event) => setPayTo(event.target.value)}
        />
      </Form.Group>
      <Form.Group controlId="compensate">
        <FormLabel>Amount</FormLabel>
        <FormControl
          id="inlineFormInputGroup"
          placeholder="3214.23"
          type="number"
          value={payAmount}
          onChange={(event) => setPayAmount(parseFloat(event.target.value))}
        />
      </Form.Group>
      <OverlayTrigger
        show={account === budgetOwner ? false : undefined}
        overlay={
          <Tooltip id={`tooltip-budgetowner`}>
            Only budget owner can call this function.
          </Tooltip>
        }
      >
        <Button
          variant="primary"
          type="submit"
          disabled={account !== budgetOwner}
        >
          Pay
        </Button>
      </OverlayTrigger>
    </Form>
  );
};
