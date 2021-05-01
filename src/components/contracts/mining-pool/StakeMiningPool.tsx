import React, { useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import { Card, Button, Form, InputGroup, ProgressBar } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import {
  StakeMining__factory,
  IERC20__factory,
  MiningPool__factory,
} from "@workhard/protocol";
import { getVariantForProgressBar } from "../../../utils/utils";
import {
  CoingeckoTokenDetails,
  getPriceFromCoingecko,
  getTokenDetailsFromCoingecko,
} from "../../../utils/coingecko";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";

export enum StakeMiningPoolType {
  STAKE_MINING_POOL,
  BURN_MINING_POOL,
}

export interface StakeMiningPoolProps {
  poolIdx: number;
  title: string;
  tokenName?: string;
  poolAddress: string;
  tokenEmission: BigNumber;
  visionPrice: number;
  collapsible?: boolean;
}

export const StakeMiningPool: React.FC<StakeMiningPoolProps> = ({
  poolIdx,
  title,
  tokenName,
  poolAddress,
  tokenEmission,
  visionPrice,
  collapsible,
}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [collapsed, setCollapsed] = useState<boolean>(
    collapsible ? true : false
  );
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [tokenBalance, setTokenBalance] = useState<BigNumber>();
  const [stakedAmount, setStakedAmount] = useState<BigNumber>();
  const [totalStake, setTotalStake] = useState<BigNumber>();
  const [tokenPrice, setTokenPrice] = useState<number>();
  const [tokenDetails, setTokenDetails] = useState<CoingeckoTokenDetails>();
  const [weight, setWeight] = useState<BigNumber>();
  const [tokenAllowance, setTokenAllowance] = useState<BigNumber>();
  const [stakeOrWithdraw, toggleStakeOrWithdraw] = useState<boolean>(true);
  const [stakePercent, setStakePercent] = useState<number>();
  const [approved, setApproved] = useState(false);
  const [amount, setAmount] = useState<string>();
  const [mined, setMined] = useState<BigNumber>();
  const [lastTx, setLastTx] = useState<string>();
  const [apy, setAPY] = useState<number>();

  const getMaxAmount = () =>
    stakeOrWithdraw
      ? formatEther(tokenBalance || "0")
      : formatEther(stakedAmount || "0");

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      MiningPool__factory.connect(poolAddress, library)
        .baseToken()
        .then(setTokenAddress);
      contracts.visionTokenEmitter.getPoolWeight(poolIdx).then(setWeight);
      return () => {
        stale = true;
        setTokenAddress(undefined);
      };
    }
  }, [account, contracts]);

  useEffect(() => {
    if (!!account && !!contracts && !!tokenAddress) {
      let stale = false;
      const token = IERC20__factory.connect(tokenAddress, library);
      token.balanceOf(account).then(setTokenBalance);
      getPriceFromCoingecko(tokenAddress).then(setTokenPrice);
      getTokenDetailsFromCoingecko(tokenAddress).then(setTokenDetails);
      const pool = StakeMining__factory.connect(poolAddress, library);
      pool.dispatchedMiners(account).then(setStakedAmount);
      pool.totalMiners().then(setTotalStake);
      pool.mined(account).then(setMined);
      IERC20__factory.connect(tokenAddress, library)
        .allowance(account, poolAddress)
        .then(setTokenAllowance);
      return () => {
        stale = true;
        setTokenAddress(undefined);
        setStakedAmount(undefined);
        setTotalStake(undefined);
        setMined(undefined);
      };
    }
  }, [account, contracts, tokenAddress, lastTx, blockNumber]);

  useEffect(() => {
    const amountInWei = parseEther(amount || "0");
    if (tokenAllowance?.gte(amountInWei)) setApproved(true);
    else setApproved(false);
  }, [tokenAllowance, amount]);

  useEffect(() => {
    if (stakedAmount && tokenBalance) {
      const sum = stakedAmount.add(tokenBalance);
      const percent = sum.eq(0) ? 0 : stakedAmount.mul(100).div(sum).toNumber();
      setStakePercent(percent);
    }
  }, [stakedAmount, tokenBalance, lastTx]);

  useEffect(() => {
    if (weight && tokenPrice && totalStake) {
      const visionPerWeek = parseFloat(
        formatEther(tokenEmission.mul(weight).div(10000))
      );
      const totalStakedToken = parseFloat(formatEther(totalStake));
      setAPY(
        (visionPerWeek * visionPrice * 52) / (totalStakedToken * tokenPrice)
      );
    } else {
      setAPY(0);
    }
  }, [weight, tokenPrice, totalStake, lastTx]);

  const approve = () => {
    if (!account || !contracts || !tokenAddress) {
      alert("Not connected");
      return;
    }
    if (approved) {
      alert("Already approved");
      return;
    }
    const signer = library.getSigner(account);
    const token = IERC20__factory.connect(tokenAddress, library);
    token
      .connect(signer)
      .approve(poolAddress, constants.MaxUint256)
      .then((tx: any) => {
        tx.wait()
          .then((_: any) => {
            setTokenAllowance(constants.MaxUint256);
            setApproved(true);
          })
          .catch(alert);
      })
      .catch(() => {
        setApproved(false);
      });
    return;
  };

  const stake = () => {
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    if (!approved) {
      alert("Not approved");
      return;
    }
    const signer = library.getSigner(account);
    const stakeMining = StakeMining__factory.connect(poolAddress, library);
    const amountToStakeInWei = parseEther(amount || "0");
    if (!tokenBalance) {
      alert("Fetching balance..");
      return;
    } else if (tokenBalance && amountToStakeInWei.gt(tokenBalance)) {
      alert("Not enough amount.");
      return;
    }
    stakeMining
      .connect(signer)
      .stake(amountToStakeInWei)
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            setLastTx(receipt.transactionHash);
          })
          .catch(alert);
      })
      .catch(alert);
  };

  const withdraw = () => {
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const stakeMining = StakeMining__factory.connect(poolAddress, library);
    // const stakingToken =
    const amountToWithdrawInWei = parseEther(amount || "0");
    if (!tokenBalance) {
      alert("Fetching balance..");
      return;
    } else if (tokenBalance && amountToWithdrawInWei.gt(tokenBalance)) {
      alert("Not enough amount.");
      return;
    }
    stakeMining
      .connect(signer)
      .withdraw(amountToWithdrawInWei)
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            setLastTx(receipt.transactionHash);
          })
          .catch(alert);
      })
      .catch(alert);
  };

  const mine = () => {
    if (!account || !library) {
      alert("Not connected");
      return;
    }
    if (!mined || mined.eq(0)) {
      alert("No $VISION mined");
      return;
    }
    const signer = library.getSigner(account);
    const stakeMining = StakeMining__factory.connect(poolAddress, library);
    // const stakingToken =
    stakeMining
      .connect(signer)
      .mine()
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            setLastTx(receipt.transactionHash);
          })
          .catch(alert);
      })
      .catch(alert);
  };

  const exit = () => {
    if (!account || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const stakeMining = StakeMining__factory.connect(poolAddress, library);
    // const stakingToken =
    stakeMining
      .connect(signer)
      .exit()
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            setLastTx(receipt.transactionHash);
          })
          .catch(alert);
      })
      .catch(alert);
  };

  const collapsedDetails = () => (
    <>
      <hr />
      <Card.Title>Staking ${tokenDetails?.name || tokenName}</Card.Title>
      <Form>
        <Form.Group>
          <InputGroup className="mb-2">
            <InputGroup.Prepend>
              <InputGroup.Text>
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
                  Withdraw
                </span>
              </InputGroup.Text>
            </InputGroup.Prepend>
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
          variant={getVariantForProgressBar(stakePercent || 0)}
          animated
          now={stakePercent}
        />
        <Card.Text>
          {formatEther(stakedAmount || 0)} /
          {formatEther(stakedAmount?.add(tokenBalance || 0) || 0)} of your{" "}
          {tokenName || tokenDetails?.name} token is staked.
        </Card.Text>
        <Button
          variant="primary"
          onClick={stakeOrWithdraw ? (approved ? stake : approve) : withdraw}
        >
          {stakeOrWithdraw ? (approved ? "Stake" : "Approve") : "Withdraw"}
        </Button>
      </Form>
      <hr />
      <Card.Title>Mine</Card.Title>
      <Card.Text>You mined {formatEther(mined || "0")} $VISION</Card.Text>
      <Button variant="primary" onClick={mine}>
        Mine
      </Button>{" "}
      <Button variant="primary" onClick={exit}>
        Mine & Exit
      </Button>
    </>
  );

  return (
    <Card border="success">
      <Card.Header as="h5">{title}</Card.Header>
      <Card.Body>
        <Card.Title>APY</Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>{apy}%</Card.Text>
        {collapsible && (
          <Button
            variant="outline-primary"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "▼ view more" : "▲ close details"}
          </Button>
        )}
        {(!collapsible || collapsed) && collapsedDetails()}
      </Card.Body>
    </Card>
  );
};
