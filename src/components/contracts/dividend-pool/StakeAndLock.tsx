import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import { Card, Button, Form, InputGroup, ProgressBar } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { getVariantForProgressBar } from "../../../utils/utils";
import { OverlayTooltip } from "../../OverlayTooltip";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { ConditionalButton } from "../../ConditionalButton";

export interface StakeAndLockProps {}

const MAX_LOCK_EPOCHS = 208;

export const StakeAndLock: React.FC<StakeAndLockProps> = ({}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [tokenBalance, setTokenBalance] = useState<BigNumber>();
  const [stakedAmount, setStakedAmount] = useState<BigNumber>(
    BigNumber.from(0)
  );
  const [lockedAmount, setLockedAmount] = useState<BigNumber>(
    BigNumber.from(0)
  );
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [tokenAllowance, setTokenAllowance] = useState<BigNumber>();
  const [started, setStarted] = useState<BigNumber>();
  const [stakeOrWithdraw, toggleStakeOrWithdraw] = useState<boolean>(true);
  const [approved, setApproved] = useState(false);
  const [amount, setAmount] = useState<string>();
  const [lockPeriod, setLockPeriod] = useState<number>(1);
  const [currentEpoch, setCurrentEpoch] = useState<BigNumber>();
  const [lastTx, setLastTx] = useState<string>();

  const getMaxAmount = () =>
    stakeOrWithdraw
      ? formatEther(tokenBalance || "0")
      : formatEther(stakedAmount || "0");

  const getStakePercent = () => {
    if (!stakedAmount) return 0;
    const total = stakedAmount.add(tokenBalance || 0);
    if (total.eq(0)) return 0;
    return stakedAmount.mul(100).div(total).toNumber();
  };

  const getLockedPeriod = () => {
    if (!lockedUntil) return 0;
    const locked = lockedUntil - (currentEpoch?.toNumber() || 0);
    return locked > 0 ? locked : 0;
  };

  const getLockedPercent = () => {
    return (getLockedPeriod() * 100) / MAX_LOCK_EPOCHS;
  };

  const createLock = () => {
    if (!!contracts && !!library && !!account) {
      if (!amount || !lockPeriod) return;
      const amountInWei = parseEther(amount);
      if (amountInWei.lt(tokenBalance || 0)) {
        alert("Not enough balance");
        return;
      }
      const signer = library.getSigner(account);
      contracts.veLocker
        .connect(signer)
        .createLock(amountInWei, lockPeriod || 0)
        .then((tx) => {
          tx.wait()
            .then((receipt) => {
              setLastTx(receipt.transactionHash);
            })
            .catch((rejected) => alert(`Rejected with ${rejected}`));
        })
        .catch(() => {});
      return;
    } else {
      alert("Not connected");
    }
  };
  const approve = () => {
    if (!!contracts && !!library && !!account) {
      const signer = library.getSigner(account);
      contracts.vision
        .connect(signer)
        .approve(contracts.dividendPool.address, constants.MaxUint256)
        .then((tx) => {
          tx.wait()
            .then((_) => {
              setTokenAllowance(constants.MaxUint256);
              setApproved(true);
            })
            .catch((rejected) => alert(`Rejected with ${rejected}`));
        })
        .catch(() => {
          setApproved(false);
        });
      return;
    } else {
      alert("Not connected");
    }
  };
  const withdraw = () => {
    if (!!contracts && !!library && !!account) {
      if (!amount) return;
      if (BigNumber.from(amount).gt(stakedAmount || 0)) {
        alert("Withdrawing more than you've staked");
        return;
      }
      const signer = library.getSigner(account);
      contracts.veLocker
        .connect(signer)
        .withdraw(parseEther(amount))
        .then((tx) => {
          tx.wait()
            .then((receipt) => {
              setLastTx(receipt.transactionHash);
            })
            .catch((rejected) => alert(`Rejected with ${rejected}`));
        })
        .catch(() => {});
      return;
    } else {
      alert("Not connected");
    }
  };

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const { vision: visionToken, dividendPool, veLocker } = contracts;
      visionToken.balanceOf(account).then(setTokenBalance);
      dividendPool.getCurrentEpoch().then(setCurrentEpoch);
      veLocker.locks(account).then((staking) => {
        setStakedAmount(staking.amount);
        setLockedUntil(staking.end.toNumber());
      });
      visionToken
        .allowance(account, dividendPool.address)
        .then(setTokenAllowance);
      return () => {
        stale = true;
        setTokenBalance(undefined);
        setCurrentEpoch(undefined);
      };
    }
  }, [account, contracts, lastTx, blockNumber]);

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      contracts.vision
        .allowance(account, contracts.dividendPool.address)
        .then((allowance) => {
          if (!stale) {
            setTokenAllowance(allowance);
            if (allowance.gt(amount || 0)) setApproved(true);
            else setApproved(false);
          }
        })
        .catch(() => {
          if (!stale) setTokenAllowance(undefined);
        });
      contracts.dividendPool.genesis().then(setStarted);
    }
  }, [account, contracts, lastTx]);

  return (
    <Card>
      <Card.Body>
        <Form>
          <Form.Group>
            <Card.Title>
              <span
                onClick={() => {
                  toggleStakeOrWithdraw(true);
                  setAmount("");
                }}
                style={{
                  cursor: stakeOrWithdraw ? undefined : "pointer",
                  textDecoration: stakeOrWithdraw ? "underline" : undefined,
                }}
              >
                Stake
              </span>
              /
              <span
                onClick={() => {
                  toggleStakeOrWithdraw(false);
                  setAmount("");
                }}
                style={{
                  cursor: stakeOrWithdraw ? "pointer" : undefined,
                  textDecoration: stakeOrWithdraw ? undefined : "underline",
                }}
              >
                Unstake
              </span>
            </Card.Title>
            {/* <Form.Label>Staking</Form.Label> */}

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
          </Form.Group>
          <ProgressBar
            variant={getVariantForProgressBar(getStakePercent())}
            animated
            now={getStakePercent()}
          />
          <Card.Text>
            {formatEther(stakedAmount || 0)} /{" "}
            {formatEther(
              (tokenBalance || BigNumber.from(0)).add(stakedAmount || 0)
            )}{" "}
            of your $VISION token is staked.
          </Card.Text>
          <Form.Group>
            <Card.Title>Lock</Card.Title>
            {/* <Form.Label>Lock</Form.Label> */}
            <Form.Control
              placeholder={`min: ${
                getLockedPeriod() + 1
              } epoch(s) ~= 4 weeks / max: 50 epoch(s) ~= 4 years`}
              type="range"
              min={getLockedPeriod() + 1}
              max={MAX_LOCK_EPOCHS}
              value={lockPeriod}
              step={1}
              onChange={({ target: { value } }) =>
                setLockPeriod(parseInt(value))
              }
            />
          </Form.Group>
          <Form.Text>{lockPeriod} weeks / 4 years</Form.Text>
          <ProgressBar
            variant={getVariantForProgressBar(getLockedPercent())}
            animated
            now={getLockedPercent()}
          />
          <Card.Text>
            {getLockedPeriod()} / {MAX_LOCK_EPOCHS} epoch(s) locked.{" "}
            {started &&
              `You can withdraw
            ${new Date(
              started.add(getLockedPeriod() * 7 * 24 * 3600).toNumber() * 1000
            ).toUTCString()}`}
            (depends on block.timestamp).
          </Card.Text>
          <Button variant="primary" onClick={approved ? createLock : approve}>
            {approved
              ? `Stake and lock ` + (lockPeriod ? `${lockPeriod} epoch(s)` : ``)
              : "approve"}
          </Button>{" "}
          <ConditionalButton
            onClick={withdraw}
            variant="secondary"
            enabledWhen={getLockedPeriod() == 0 && stakedAmount?.gt(0)}
            whyDisabled={`Should wait ${getLockedPeriod()} week(s)`}
            children="unstake"
          />
        </Form>
      </Card.Body>
    </Card>
  );
};
