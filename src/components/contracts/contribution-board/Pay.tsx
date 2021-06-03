import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, BigNumberish } from "ethers";
import {
  ButtonGroup,
  Card,
  Form,
  FormControl,
  FormLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "react-bootstrap";
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

export interface PayProps {
  projId: BigNumberish;
  fund: BigNumberish;
  budgetOwner: string;
}

export const Pay: React.FC<PayProps> = ({ projId, budgetOwner, fund }) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { dao } = useWorkhard() || {};
  const { addToast } = useToasts();
  const [payTo, setPayTo] = useState("");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [balance, setBalance] = useState<BigNumberish>(fund);
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [moneyStreaming, setMoneyStreaming] = useState<boolean>(true);
  const [streamingPeriod, setStreamingPeriod] = useState<number>(86400 * 28);

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
    setPayAmount(
      parseFloat(
        formatEther(payAmountInWei.div(streamingPeriod).mul(streamingPeriod))
      )
    );
    const signer = library.getSigner(account);
    const tx = moneyStreaming
      ? contributionBoard
          .connect(signer)
          .compensateInStream(
            projId,
            payTo,
            payAmountInWei.div(streamingPeriod).mul(streamingPeriod),
            streamingPeriod
          )
      : contributionBoard
          .connect(signer)
          .compensate(projId, payTo, payAmountInWei);
    handleTransaction(tx, setTxStatus, addToast, "Paid successfully!");
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
          onChange={(event) => {
            setPayAmount(parseFloat(event.target.value));
          }}
        />
      </Form.Group>
      <ButtonGroup toggle>
        <ToggleButton
          type="radio"
          variant="outline-primary"
          checked={moneyStreaming}
          value={0}
          onClick={() => {
            setMoneyStreaming(true);
          }}
        >
          Streaming
        </ToggleButton>
        <ToggleButton
          type="radio"
          variant="outline-primary"
          checked={!moneyStreaming}
          value={1}
          onClick={() => setMoneyStreaming(false)}
        >
          Pay at once
        </ToggleButton>
      </ButtonGroup>
      <br />
      {moneyStreaming && (
        <>
          <br />
          <Form.Group>
            <Form.Label>Streaming Period</Form.Label>
            <Form.Control
              type="range"
              min={86400}
              max={86400 * 365}
              value={streamingPeriod}
              step={86400}
              onChange={({ target: { value } }) => {
                const period = parseInt(value);
                setStreamingPeriod(period);
              }}
            />
            <Form.Text>{(streamingPeriod / 86400).toFixed(0)} day(s)</Form.Text>
          </Form.Group>
        </>
      )}

      <br />
      <ConditionalButton
        variant="primary"
        type="submit"
        enabledWhen={account === budgetOwner ? true : undefined}
        whyDisabled={`Only budget owner can call this function.`}
        children={`Pay`}
      />
    </Form>
  );
};
