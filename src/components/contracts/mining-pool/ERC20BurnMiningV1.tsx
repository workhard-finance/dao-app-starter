import React, { useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import {
  Card,
  Button,
  Form,
  InputGroup,
  Image,
  ProgressBar,
  Row,
  Col,
} from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import {
  ERC20BurnMiningV1__factory,
  ERC20__factory,
  MiningPool__factory,
} from "@workhard/protocol";
import {
  errorHandler,
  getTokenLogo,
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
import { OverlayTooltip } from "../../OverlayTooltip";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { useToasts } from "react-toast-notifications";

export interface ERC20BurnMiningV1Props {
  poolIdx: number;
  title: string;
  tokenName?: string;
  poolAddress: string;
  totalEmission: BigNumber;
  visionPrice: number;
  emissionWeightSum: BigNumber;
  description?: string;
  collapsible?: boolean;
  link?: string;
  logos?: string[];
}

export const ERC20BurnMiningV1: React.FC<ERC20BurnMiningV1Props> = ({
  poolIdx,
  title,
  tokenName,
  poolAddress,
  totalEmission,
  visionPrice,
  description,
  collapsible,
  emissionWeightSum,
  link,
  logos,
}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();

  const [collapsed, setCollapsed] = useState<boolean>(
    collapsible ? true : false
  );
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [tokenBalance, setTokenBalance] = useState<BigNumber>();
  const [symbol, setSymbol] = useState<string>();
  const [burnedAmount, setBurnedAmount] = useState<BigNumber>();
  const [totalBurn, setTotalBurn] = useState<BigNumber>();
  const [tokenPrice, setTokenPrice] = useState<number>();
  const [tokenDetails, setTokenDetails] = useState<CoingeckoTokenDetails>();
  const [weight, setWeight] = useState<BigNumber>();
  const [allocatedVISION, setAllocatedVISION] = useState<BigNumber>(
    constants.Zero
  );
  const [allowance, setAllowance] = useState<BigNumber>();
  const [burnPercent, setBurnPercent] = useState<number>();
  const [amount, setAmount] = useState<string>();
  const [mined, setMined] = useState<BigNumber>();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [annualRevenue, setAnnualRevenue] = useState<number>();

  const getMaxAmount = () => formatEther(tokenBalance || "0");

  useEffect(() => {
    if (!!account && !!workhardCtx) {
      MiningPool__factory.connect(poolAddress, library)
        .baseToken()
        .then(setTokenAddress)
        .catch(errorHandler(addToast));
      workhardCtx.dao.visionEmitter
        .getPoolWeight(poolIdx)
        .then(setWeight)
        .catch(errorHandler(addToast));
    }
  }, [account, workhardCtx]);
  useEffect(() => {
    if (weight) {
      if (emissionWeightSum.eq(0)) {
        setAllocatedVISION(BigNumber.from(0));
      } else {
        setAllocatedVISION(totalEmission.mul(weight).div(emissionWeightSum));
      }
    }
  }, [weight]);
  useEffect(() => {
    if (!!account && !!tokenAddress) {
      const token = ERC20__factory.connect(tokenAddress, library);
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
      const pool = ERC20BurnMiningV1__factory.connect(poolAddress, library);
      pool
        .dispatchedMiners(account)
        .then(setBurnedAmount)
        .catch(errorHandler(addToast));
      pool.totalMiners().then(setTotalBurn).catch(errorHandler(addToast));
      pool.mined(account).then(setMined).catch(errorHandler(addToast));
      ERC20__factory.connect(tokenAddress, library)
        .allowance(account, poolAddress)
        .then(setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, tokenAddress, txStatus, blockNumber]);

  useEffect(() => {
    if (!!tokenAddress) {
      ERC20__factory.connect(tokenAddress, library)
        .symbol()
        .then(setSymbol)
        .catch(errorHandler(addToast));
    }
  }, [tokenAddress, library]);

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
        formatEther(totalEmission.mul(weight).div(emissionWeightSum))
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
    if (!account || !tokenAddress) {
      alert("Not connected");
      return;
    }
    if (isApproved(allowance, amount)) {
      alert("Already approved");
      return;
    }
    const signer = library.getSigner(account);
    const token = ERC20__factory.connect(tokenAddress, library);
    handleTransaction(
      token.connect(signer).approve(poolAddress, constants.MaxUint256),
      setTxStatus,
      addToast,
      `Approved MiningPool ${poolAddress}`
    );
    return;
  };

  const burn = () => {
    if (!account) {
      alert("Not connected");
      return;
    }
    if (!isApproved(allowance, amount)) {
      alert("Not approved");
      return;
    }
    const signer = library.getSigner(account);
    const erc20BurnMiningV1 = ERC20BurnMiningV1__factory.connect(
      poolAddress,
      library
    );
    const amountToBurnInWei = parseEther(amount || "0");
    if (!tokenBalance) {
      alert("Fetching balance..");
      return;
    } else if (tokenBalance && amountToBurnInWei.gt(tokenBalance)) {
      alert("Not enough amount.");
      return;
    }
    handleTransaction(
      erc20BurnMiningV1.connect(signer).burn(amountToBurnInWei),
      setTxStatus,
      addToast,
      "Successfully burned!"
    );
  };

  const exit = () => {
    if (!account) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const erc20BurnMiningV1 = ERC20BurnMiningV1__factory.connect(
      poolAddress,
      library
    );

    handleTransaction(
      erc20BurnMiningV1.connect(signer).exit(),
      setTxStatus,
      addToast,
      "Successfully exited!"
    );
  };

  const collapsedDetails = () => (
    <>
      {collapsible && (
        <>
          <hr />
          <Card.Title>Weekly allocation</Card.Title>
          <Card.Text style={{ fontSize: "1.5rem" }}>
            {parseFloat(formatEther(allocatedVISION)).toFixed(2)}{" "}
            <span style={{ fontSize: "0.75rem" }}>
              {workhardCtx?.metadata.visionSymbol || "VISION"}
            </span>
          </Card.Text>
        </>
      )}
      <hr />
      <Card.Title>
        Burn{" "}
        <a href={link} target="_blank">
          ${tokenName || symbol}
        </a>
      </Card.Title>
      <Form>
        <Form.Group>
          <InputGroup className="mb-2">
            <InputGroup.Prepend>
              <InputGroup.Text>Burn</InputGroup.Text>
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
          variant={getVariantForProgressBar(burnPercent || 0)}
          animated
          now={burnPercent}
        />
        <Card.Text>
          Burned: {formatEther(burnedAmount || 0)} / Balance:{" "}
          {formatEther(
            BigNumber.from(tokenBalance || 0).add(burnedAmount || 0)
          )}
        </Card.Text>
        <Row>
          <Col>
            <Button variant="outline-danger" onClick={exit}>
              Stop mining and withdraw rewards
            </Button>
          </Col>
          <Col style={{ textAlign: "end" }}>
            <Button
              variant="danger"
              onClick={isApproved(allowance, amount) ? burn : approve}
            >
              {isApproved(allowance, amount) ? "Burn" : "Approve"}
            </Button>
          </Col>
        </Row>
      </Form>
    </>
  );

  return (
    <Card border="danger">
      <Card.Header className="bg-danger text-white">
        {title}{" "}
        {logos &&
          logos.map((logo) => (
            <>
              {" "}
              <Image style={{ height: "1.5rem" }} src={logo} alt={""} />
            </>
          ))}
      </Card.Header>

      <Card.Body>
        {description && (
          <>
            <p style={{ height: "3rem" }}>{description}</p>
            <hr />
          </>
        )}
        <Row>
          <Col style={{ marginBottom: "1rem" }}>
            <Card.Title>
              ARR
              <OverlayTooltip
                tip={
                  "Annual Revenue Run Rate = (earned vision - burned commit) * 12 months / burned commit"
                }
                text="❔"
              />
            </Card.Title>
            <Card.Text>
              <span style={{ fontSize: "1.5rem" }}>{annualRevenue}</span> %
            </Card.Text>
          </Col>
          <Col style={{ marginBottom: "1rem", minWidth: "12rem" }}>
            <Card.Title>Mined</Card.Title>
            <Card.Text style={{ fontSize: "1.5rem" }}>
              {parseFloat(formatEther(mined || 0)).toFixed(2)}{" "}
              <span style={{ fontSize: "0.75rem" }}>
                {workhardCtx?.metadata.visionSymbol || "VISION"}
              </span>
            </Card.Text>
          </Col>
          {!collapsible && (
            <Col style={{ marginBottom: "1rem", minWidth: "14rem" }}>
              <Card.Title>Weekly allocation</Card.Title>
              <Card.Text style={{ fontSize: "1.5rem" }}>
                {parseFloat(formatEther(allocatedVISION)).toFixed(2)}{" "}
                <span style={{ fontSize: "0.75rem" }}>
                  {workhardCtx?.metadata.visionSymbol || "VISION"}
                </span>
              </Card.Text>
            </Col>
          )}
        </Row>
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
