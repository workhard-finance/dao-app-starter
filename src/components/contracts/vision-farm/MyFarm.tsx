import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import { Card, Button, Form, InputGroup, ProgressBar } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { bigNumToFixed, getVariantForProgressBar } from "../../../utils/utils";
import { OverlayTooltip } from "../../OverlayTooltip";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { ConditionalButton } from "../../ConditionalButton";
import { StakeAndLock } from "./StakeAndLock";
import { WithdrawHarvested } from "./WithdrawHarvested";

export interface MyFarmProps {}

export const MyFarm: React.FC<MyFarmProps> = ({}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [tokenBalance, setTokenBalance] = useState<BigNumber>();
  const [stakedAmount, setStakedAmount] = useState<BigNumber>(
    BigNumber.from(0)
  );
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [tokenAllowance, setTokenAllowance] = useState<BigNumber>();
  const [started, setStarted] = useState<BigNumber>();
  const [stakeOrWithdraw, toggleStakeOrWithdraw] = useState<boolean>(true);
  const [approved, setApproved] = useState(false);
  const [amount, setAmount] = useState<string>();
  const [lockPeriod, setLockPeriod] = useState<number>();
  const [currentEpoch, setCurrentEpoch] = useState<BigNumber>();
  const [dispatchableFarmers, setDispatchableFarmers] = useState<BigNumber>();
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
    const locked = lockedUntil + 1 - (currentEpoch?.toNumber() || 0);
    return locked > 0 ? locked : 0;
  };

  const getLockedPercent = () => {
    return (getLockedPeriod() * 100) / 200;
  };

  const stakeAndLock = () => {
    if (!!contracts && !!library && !!account) {
      if (!amount || !lockPeriod) return;
      if (BigNumber.from(amount).lt(tokenBalance || 0)) {
        alert("Not enough balance");
        return;
      }
      const signer = library.getSigner(account);
      contracts.visionFarm
        .connect(signer)
        .stakeAndLock(parseEther(amount), lockPeriod || 0)
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
      contracts.visionToken
        .connect(signer)
        .approve(contracts.visionFarm.address, constants.MaxUint256)
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
  const unstake = () => {
    if (!!contracts && !!library && !!account) {
      if (!amount) return;
      if (BigNumber.from(amount).gt(stakedAmount || 0)) {
        alert("Withdrawing more than you've staked");
        return;
      }
      const signer = library.getSigner(account);
      contracts.visionFarm
        .connect(signer)
        .unstake(parseEther(amount))
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
  const withdrawAll = () => {
    if (!!contracts && !!library && !!account) {
      if (!amount) return;
      if (BigNumber.from(amount).gt(stakedAmount || 0)) {
        alert("Withdrawing more than you've staked");
        return;
      }
      const signer = library.getSigner(account);
      contracts.visionFarm
        .connect(signer)
        .unstake(parseEther(amount))
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
      const { visionToken, visionFarm } = contracts;
      visionToken.balanceOf(account).then(setTokenBalance);
      visionFarm.getCurrentEpoch().then(setCurrentEpoch);
      visionFarm.stakings(account).then((staking) => {
        setStakedAmount(staking.amount);
        setLockedUntil(staking.locked.toNumber());
      });
      visionToken
        .allowance(account, visionFarm.address)
        .then(setTokenAllowance);
      return () => {
        stale = true;
        setTokenBalance(undefined);
        setCurrentEpoch(undefined);
      };
    }
  }, [account, contracts, lastTx, blockNumber]);

  useEffect(() => {
    if (!!account && !!contracts && !!currentEpoch) {
      let stale = false;
      contracts.visionFarm
        .dispatchableFarmers(account, currentEpoch.add(1))
        .then(setDispatchableFarmers);
      return () => {
        stale = true;
        setDispatchableFarmers(undefined);
      };
    }
  }, [account, contracts, lastTx, blockNumber, currentEpoch]);

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      contracts.visionToken
        .allowance(account, contracts.visionFarm.address)
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
      contracts.visionFarm.genesis().then(setStarted);
    }
  }, [account, contracts, lastTx]);

  return (
    <Card>
      {/* <Card.Header as="h5">Featured</Card.Header> */}
      <Card.Body>
        <Card.Title>
          Current dispatchable farmers
          <OverlayTooltip
            tip={`= staked amount x locking period`}
            children={`❔`}
          />
        </Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>
          {bigNumToFixed(stakedAmount)}
          <span style={{ fontSize: "1rem" }}> $VISION</span> x{" "}
          {getLockedPeriod()}
          <span style={{ fontSize: "1rem" }}> epoch(s)</span> ={" "}
          {bigNumToFixed(dispatchableFarmers || 0)}
          <span style={{ fontSize: "1rem" }}> Farmers</span>
        </Card.Text>
        <hr />
        <StakeAndLock />
        <hr />
        <WithdrawHarvested />
      </Card.Body>
    </Card>
  );
};
