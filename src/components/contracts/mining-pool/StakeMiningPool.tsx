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
import {
  errorHandler,
  getVariantForProgressBar,
  handleTransaction,
  isApproved,
  TxStatus,
} from "../../../utils/utils";
import {
  CoingeckoTokenDetails,
  getPriceFromCoingecko,
  getTokenDetailsFromCoingecko,
} from "../../../utils/coingecko";
import { useToasts } from "react-toast-notifications";
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
  const { addToast } = useToasts();

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
  const [stakeOrWithdraw, toggleStakeOrWithdraw] = useState<boolean>(true);
  const [stakePercent, setStakePercent] = useState<number>();
  const [allowance, setAllowance] = useState<BigNumber>();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [amount, setAmount] = useState<string>();
  const [mined, setMined] = useState<BigNumber>();
  const [apy, setAPY] = useState<number>();

  const getMaxAmount = () =>
    stakeOrWithdraw
      ? formatEther(tokenBalance || "0")
      : formatEther(stakedAmount || "0");

  useEffect(() => {
    if (!!account && !!contracts) {
      MiningPool__factory.connect(poolAddress, library)
        .baseToken()
        .then(setTokenAddress)
        .catch(errorHandler(addToast));
      contracts.visionEmitter
        .getPoolWeight(poolIdx)
        .then(setWeight)
        .catch(errorHandler(addToast));
    }
  }, [account, contracts]);

  useEffect(() => {
    if (!!account && !!contracts && !!tokenAddress) {
      const token = IERC20__factory.connect(tokenAddress, library);
      token
        .balanceOf(account)
        .then(setTokenBalance)
        .catch(errorHandler(addToast));
      getPriceFromCoingecko(tokenAddress)
        .then(setTokenPrice)
        .catch(errorHandler(addToast));
      getTokenDetailsFromCoingecko(tokenAddress)
        .then(setTokenDetails)
        .catch(errorHandler(addToast));
      const pool = StakeMining__factory.connect(poolAddress, library);
      pool
        .dispatchedMiners(account)
        .then(setStakedAmount)
        .catch(errorHandler(addToast));
      pool.totalMiners().then(setTotalStake).catch(errorHandler(addToast));
      pool.mined(account).then(setMined).catch(errorHandler(addToast));
      IERC20__factory.connect(tokenAddress, library)
        .allowance(account, poolAddress)
        .then(setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, contracts, tokenAddress, txStatus, blockNumber]);

  useEffect(() => {
    if (stakedAmount && tokenBalance) {
      const sum = stakedAmount.add(tokenBalance);
      const percent = sum.eq(0) ? 0 : stakedAmount.mul(100).div(sum).toNumber();
      setStakePercent(percent);
    }
  }, [stakedAmount, tokenBalance, txStatus]);

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
  }, [weight, tokenPrice, totalStake, txStatus]);

  const approve = () => {
    if (!account || !contracts || !tokenAddress) {
      alert("Not connected");
      return;
    }
    if (isApproved(allowance, amount)) {
      alert("Already approved");
      return;
    }
    const signer = library.getSigner(account);
    const token = IERC20__factory.connect(tokenAddress, library);
    handleTransaction(
      token.connect(signer).approve(poolAddress, constants.MaxUint256),
      setTxStatus,
      addToast,
      `Approved MiningPool ${poolAddress}`
    );
    return;
  };

  const stake = () => {
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    if (!isApproved(allowance, amount)) {
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
    handleTransaction(
      stakeMining.connect(signer).stake(amountToStakeInWei),
      setTxStatus,
      addToast,
      `Successfully staked!`
    );
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
    if (!stakedAmount) {
      alert("Fetching balance..");
      return;
    } else if (stakedAmount && amountToWithdrawInWei.gt(stakedAmount)) {
      alert("Not enough amount.");
      return;
    }
    handleTransaction(
      stakeMining.connect(signer).withdraw(amountToWithdrawInWei),
      setTxStatus,
      addToast,
      `Successfully withdrew!`
    );
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
    handleTransaction(
      stakeMining.connect(signer).mine(),
      setTxStatus,
      addToast,
      `Successfully mined!`
    );
  };

  const exit = () => {
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
    handleTransaction(
      stakeMining.connect(signer).exit(),
      setTxStatus,
      addToast,
      `Successfully exited!`
    );
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
          onClick={
            stakeOrWithdraw
              ? isApproved(allowance, amount)
                ? stake
                : approve
              : withdraw
          }
        >
          {stakeOrWithdraw
            ? isApproved(allowance, amount)
              ? "Stake"
              : "Approve"
            : "Withdraw"}
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
        {(!collapsible || !collapsed) && collapsedDetails()}
      </Card.Body>
    </Card>
  );
};
