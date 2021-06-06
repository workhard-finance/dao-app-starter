import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumberish, providers, ethers } from "ethers";
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
import { formatEther, getAddress, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";
import {
  compareAddress,
  errorHandler,
  getGnosisAPI,
  handleTransaction,
  safeTxHandler,
  TxStatus,
} from "../../../utils/utils";
import { useToasts } from "react-toast-notifications";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";

export interface PayProps {
  projId: BigNumberish;
  fund: BigNumberish;
  projectOwner: string;
}

export const Pay: React.FC<PayProps> = ({ projId, projectOwner, fund }) => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();
  const [payTo, setPayTo] = useState("");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [balance, setBalance] = useState<BigNumberish>(fund);
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [moneyStreaming, setMoneyStreaming] = useState<boolean>(true);
  const [streamingPeriod, setStreamingPeriod] = useState<number>(86400 * 28);
  const [hasAdminPermission, setHasAdminPermission] = useState<boolean>();

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const contributionBoard = workhardCtx?.dao.contributionBoard;
    if (!contributionBoard || !library || !account || !chainId) {
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
    if (moneyStreaming) {
      setPayAmount(
        parseFloat(
          formatEther(payAmountInWei.div(streamingPeriod).mul(streamingPeriod))
        )
      );
    }

    const signer = library.getSigner(account);
    const tx = await (moneyStreaming
      ? contributionBoard.populateTransaction.compensateInStream(
          projId,
          payTo,
          payAmountInWei.div(streamingPeriod).mul(streamingPeriod),
          streamingPeriod
        )
      : contributionBoard.populateTransaction.compensate(
          projId,
          payTo,
          payAmountInWei
        ));

    safeTxHandler(
      chainId,
      projectOwner,
      tx,
      signer,
      setTxStatus,
      addToast,
      "Paid successfully!",
      (receipt) => {
        if (receipt) {
        } else {
          alert("Created Multisig Tx. Go to Gnosis wallet and confirm.");
        }
        setTxStatus(undefined);
        setPayAmount(0);
      }
    );
  };

  useEffect(() => {
    if (!!account && !!library && !!workhardCtx) {
      const { contributionBoard } = workhardCtx.dao;
      contributionBoard
        .projectFund(projId)
        .then(setBalance)
        .catch(errorHandler(addToast));
    }
  }, [txStatus, blockNumber, workhardCtx]);

  useEffect(() => {
    if (!!workhardCtx && !!account && !!projectOwner && !!chainId) {
      if (compareAddress(account, projectOwner)) {
        setHasAdminPermission(true);
      } else {
        const gnosisAPI = getGnosisAPI(chainId);
        if (gnosisAPI) {
          fetch(gnosisAPI + `safes/${projectOwner}/`)
            .then(async (response) => {
              const result = await response.json();
              if (
                (result.owners as string[])
                  .map(getAddress)
                  .includes(getAddress(account))
              ) {
                setHasAdminPermission(true);
              }
            })
            .catch((_) => {
              setHasAdminPermission(false);
            });
        }
      }
    }
  }, [workhardCtx, account, chainId, projectOwner]);

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Budget</Form.Label>
        <Card.Text style={{ fontSize: "1.5rem" }}>
          {formatEther(balance || "0")}{" "}
          {workhardCtx?.metadata.commitSymbol || `$COMMIT`}
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
        enabledWhen={hasAdminPermission}
        whyDisabled={`Only budget owner can call this function.`}
        tooltip={
          compareAddress(projectOwner, account || undefined)
            ? undefined
            : "Create a multisig transaction"
        }
        children={`Pay`}
      />
    </Form>
  );
};
