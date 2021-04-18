import React, { useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import { Card, Button, Form, InputGroup, ProgressBar } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import {
  BurnMining__factory,
  IERC20__factory,
  MiningPool__factory,
} from "@workhard/protocol";
import { getVariantForProgressBar } from "../../../utils/utils";
import {
  CoingeckoTokenDetails,
  getPriceFromCoingecko,
  getTokenDetailsFromCoingecko,
} from "../../../utils/coingecko";
import { OverlayTooltip } from "../../OverlayTooltip";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";

export enum BurnMiningPoolType {
  STAKE_MINING_POOL,
  BURN_MINING_POOL,
}

export interface BurnMiningPoolProps {
  poolIdx: number;
  title: string;
  tokenName?: string;
  poolAddress: string;
  tokenEmission: BigNumber;
  visionPrice: number;
  collapsible?: boolean;
}

export const BurnMiningPool: React.FC<BurnMiningPoolProps> = ({
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
  const [burnedAmount, setBurnedAmount] = useState<BigNumber>();
  const [totalBurn, setTotalBurn] = useState<BigNumber>();
  const [tokenPrice, setTokenPrice] = useState<number>();
  const [tokenDetails, setTokenDetails] = useState<CoingeckoTokenDetails>();
  const [weight, setWeight] = useState<BigNumber>();
  const [tokenAllowance, setTokenAllowance] = useState<BigNumber>();
  const [burnPercent, setBurnPercent] = useState<number>();
  const [approved, setApproved] = useState(false);
  const [amount, setAmount] = useState<string>();
  const [mined, setMined] = useState<BigNumber>();
  const [lastTx, setLastTx] = useState<string>();
  const [annualRevenue, setAnnualRevenue] = useState<number>();

  const getMaxAmount = () => formatEther(tokenBalance || "0");

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
      console.log("blocknum", blockNumber);
      let stale = false;
      const token = IERC20__factory.connect(tokenAddress, library);
      token.balanceOf(account).then(setTokenBalance);
      getPriceFromCoingecko(tokenAddress).then(setTokenPrice);
      getTokenDetailsFromCoingecko(tokenAddress).then(setTokenDetails);
      const pool = BurnMining__factory.connect(poolAddress, library);
      pool.dispatchedMiners(account).then(setBurnedAmount);
      pool.totalMiners().then(setTotalBurn);
      pool.mined(account).then(setMined);
      IERC20__factory.connect(tokenAddress, library)
        .allowance(account, poolAddress)
        .then(setTokenAllowance);
      return () => {
        stale = true;
        setTokenAddress(undefined);
        setBurnedAmount(undefined);
        setTotalBurn(undefined);
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
    if (burnedAmount && tokenBalance) {
      const sum = burnedAmount.add(tokenBalance);
      const percent = sum.eq(0) ? 0 : burnedAmount.mul(100).div(sum).toNumber();
      setBurnPercent(percent);
    }
  }, [burnedAmount, tokenBalance]);

  useEffect(() => {
    if (weight && tokenPrice && totalBurn) {
      const visionPerWeek = parseFloat(
        formatEther(tokenEmission.mul(weight).div(10000))
      );
      const totalBurnedToken = parseFloat(formatEther(totalBurn));
      setAnnualRevenue(
        100 *
          ((visionPerWeek * visionPrice * 52) /
            (totalBurnedToken * tokenPrice) -
            1)
      );
    } else {
      setAnnualRevenue(NaN);
    }
  }, [weight, tokenPrice, totalBurn]);

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
      .then((tx) => {
        tx.wait()
          .then((_) => {
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

  const burn = () => {
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    if (!approved) {
      alert("Not approved");
      return;
    }
    const signer = library.getSigner(account);
    const burnMining = BurnMining__factory.connect(poolAddress, library);
    const amountToBurnInWei = parseEther(amount || "0");
    if (!tokenBalance) {
      alert("Fetching balance..");
      return;
    } else if (tokenBalance && amountToBurnInWei.gt(tokenBalance)) {
      alert("Not enough amount.");
      return;
    }
    burnMining
      .connect(signer)
      .burn(amountToBurnInWei)
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
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const burnMining = BurnMining__factory.connect(poolAddress, library);
    burnMining
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
      <Card.Title>Burning ${tokenDetails?.name || tokenName}</Card.Title>
      <Form>
        <Form.Group controlId="staking">
          <InputGroup className="mb-2">
            <InputGroup.Prepend>
              <InputGroup.Text>Burn</InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
              id="burn-amount"
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
          variant={getVariantForProgressBar(burnPercent || 0)}
          animated
          now={burnPercent}
        />
        <Card.Text>
          Burned: {formatEther(burnedAmount || 0)} / Balance:{" "}
          {formatEther(tokenBalance || 0)}
        </Card.Text>
        <Button variant="primary" onClick={approved ? burn : approve}>
          {approved ? "Burn" : "Approve"}
        </Button>
      </Form>
      <hr />
      <Card.Title>Mine</Card.Title>
      <Card.Text>You mined {formatEther(mined || "0")} $VISION</Card.Text>
      <Button variant="primary" onClick={exit}>
        Stop mining and withdraw rewards
      </Button>
    </>
  );

  return (
    <Card border="danger">
      <Card.Header as="h5">{title}</Card.Header>
      <Card.Body>
        <Card.Title>
          Annual Revenue
          <OverlayTooltip tip={""} children={"?"} />
        </Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>{annualRevenue}%</Card.Text>
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
