import React, { useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import { Card, Button, Form, InputGroup, ProgressBar } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import {
  errorHandler,
  getVariantForProgressBar,
  handleTransaction,
  isApproved,
  TxStatus,
} from "../../../utils/utils";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { useToasts } from "react-toast-notifications";

export interface CreateLockProps {
  stakedAmount?: BigNumber;
}

const MAX_LOCK_EPOCHS = 208;

export const CreateLock: React.FC<CreateLockProps> = ({ stakedAmount }) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const workhardCtx = useWorkhard();
  const [tokenBalance, setTokenBalance] = useState<BigNumber>();
  const [allowance, setAllowance] = useState<BigNumber>();
  const [amount, setAmount] = useState<string>();
  const [lockPeriod, setLockPeriod] = useState<number>(1);
  const [txStatus, setTxStatus] = useState<TxStatus>();

  const getMaxAmount = () => formatEther(tokenBalance || "0");

  const getStakePercent = () => {
    if (!stakedAmount) return 0;
    const total = stakedAmount.add(tokenBalance || 0);
    if (total.eq(0)) return 0;
    return stakedAmount.mul(100).div(total).toNumber();
  };

  const createLock = () => {
    if (!!workhardCtx && !!library && !!account) {
      if (!amount || !lockPeriod) return;
      const amountInWei = parseEther(amount);
      if (amountInWei.gt(tokenBalance || 0)) {
        alert("Not enough balance");
        return;
      }
      const signer = library.getSigner(account);
      handleTransaction(
        workhardCtx.dao.votingEscrow
          .connect(signer)
          .createLock(amountInWei, lockPeriod || 0),
        setTxStatus,
        addToast,
        "Created VotingEscrowLock"
      );
      return;
    } else {
      alert("Not connected");
    }
  };
  const approve = () => {
    if (!!workhardCtx && !!library && !!account) {
      const signer = library.getSigner(account);
      handleTransaction(
        workhardCtx.dao.vision
          .connect(signer)
          .approve(workhardCtx.dao.votingEscrow.address, constants.MaxUint256),
        setTxStatus,
        addToast,
        "Approved VotingEscrowLock contract."
      );
      return;
    } else {
      alert("Not connected");
    }
  };

  useEffect(() => {
    if (!!account && !!workhardCtx) {
      const { vision, votingEscrow } = workhardCtx.dao;
      vision
        .balanceOf(account)
        .then(setTokenBalance)
        .catch(errorHandler(addToast));
      vision
        .allowance(account, votingEscrow.address)
        .then(setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, workhardCtx, txStatus, blockNumber, addToast]);

  return (
    <Card>
      <Card.Body>
        <Card.Title>Create a new lock</Card.Title>
        <Form>
          <Form.Group>
            <Form.Label>Stake amount</Form.Label>
            <InputGroup className="mb-2">
              <Form.Control
                value={amount}
                onChange={({ target: { value } }) => setAmount(value)}
                placeholder={getMaxAmount()}
              />
              <InputGroup.Append
                style={{ cursor: "pointer" }}
                onClick={() => setAmount(getMaxAmount())}
              >
                <InputGroup.Text>MAX</InputGroup.Text>
              </InputGroup.Append>
            </InputGroup>
            <ProgressBar
              variant={getVariantForProgressBar(getStakePercent())}
              animated
              now={getStakePercent()}
            />
            <Form.Text>
              {formatEther(stakedAmount || 0)} /{" "}
              {formatEther(
                (tokenBalance || BigNumber.from(0)).add(stakedAmount || 0)
              )}{" "}
              of your {workhardCtx?.metadata.visionSymbol || "$VISION"} token is
              staked.
            </Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Lock period</Form.Label>
            <Form.Control
              placeholder={`min: ${1} epoch(s) ~= 1 week / max: 208 epoch(s) ~= 4 years`}
              type="range"
              min={1}
              max={MAX_LOCK_EPOCHS}
              value={lockPeriod}
              step={1}
              onChange={({ target: { value } }) =>
                setLockPeriod(parseInt(value))
              }
            />
            <Form.Text>
              {lockPeriod} weeks({(lockPeriod / 52).toFixed(1)} years) / 4 years
            </Form.Text>
          </Form.Group>
          <Form.Label>Expected</Form.Label>
          <Card.Text style={{ fontSize: "3rem" }}>
            ~={" "}
            {parseFloat(
              formatEther(
                parseEther(amount || "0")
                  .mul(lockPeriod)
                  .div(MAX_LOCK_EPOCHS)
              )
            ).toFixed(0)}
            <span style={{ fontSize: "1rem" }}>
              {" "}
              {workhardCtx?.metadata.rightSymbol || "$RIGHT"}
            </span>
          </Card.Text>
          <Button
            variant="primary"
            onClick={isApproved(allowance, amount) ? createLock : approve}
          >
            {isApproved(allowance, amount)
              ? `Stake and lock ` + (lockPeriod ? `${lockPeriod} epoch(s)` : ``)
              : "approve"}
          </Button>{" "}
        </Form>
      </Card.Body>
    </Card>
  );
};
