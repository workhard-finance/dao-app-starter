import React, { useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import {
  Button,
  Card,
  Col,
  Form,
  InputGroup,
  ProgressBar,
  Row,
} from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import {
  ContributionBoard__factory,
  ERC20BurnMiningV1__factory,
  InitialContributorShare__factory,
  MiningPool__factory,
} from "@workhard/protocol";
import {
  errorHandler,
  getVariantForProgressBar,
  handleTransaction,
  TxStatus,
} from "../../../utils/utils";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { useToasts } from "react-toast-notifications";
import { ConditionalButton } from "../../ConditionalButton";

export interface InitialContributorSharePoolProps {
  poolAddress: string;
  totalEmission: BigNumber;
  emissionWeightSum: BigNumber;
  apy: number;
}

export const InitialContributorSharePool: React.FC<InitialContributorSharePoolProps> = ({
  poolAddress,
  totalEmission,
  emissionWeightSum,
  apy,
}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();

  const [tokenAddress, setTokenAddress] = useState<string>();
  const [tokenBalance, setTokenBalance] = useState<BigNumber>();
  const [burnedAmount, setBurnedAmount] = useState<BigNumber>();
  const [totalBurn, setTotalBurn] = useState<BigNumber>();
  const [weight, setWeight] = useState<BigNumber>();
  const [allocatedVISION, setAllocatedVISION] = useState<BigNumber>(
    constants.Zero
  );
  const [isApprovedForAll, setIsApprovedForAll] = useState<boolean>();
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
        .emissionWeight()
        .then((emissions) => {
          setWeight(emissions.dev);
        })
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
    if (!!account && !!workhardCtx && !!tokenAddress) {
      const token = ContributionBoard__factory.connect(tokenAddress, library);
      token
        .balanceOf(account, workhardCtx.daoId)
        .then(setTokenBalance)
        .catch(errorHandler(addToast));
      const pool = InitialContributorShare__factory.connect(
        poolAddress,
        library
      );
      pool
        .dispatchedMiners(account)
        .then(setBurnedAmount)
        .catch(errorHandler(addToast));
      pool.totalMiners().then(setTotalBurn).catch(errorHandler(addToast));
      pool.mined(account).then(setMined).catch(errorHandler(addToast));
      ContributionBoard__factory.connect(tokenAddress, library)
        .isApprovedForAll(account, poolAddress)
        .then(setIsApprovedForAll)
        .catch(errorHandler(addToast));
    }
  }, [account, workhardCtx, tokenAddress, txStatus, blockNumber]);

  useEffect(() => {
    if (burnedAmount && tokenBalance) {
      const sum = burnedAmount.add(tokenBalance);
      const percent = sum.eq(0) ? 0 : burnedAmount.mul(100).div(sum).toNumber();
      setBurnPercent(percent);
    }
  }, [burnedAmount, tokenBalance]);

  const approve = () => {
    if (!account || !workhardCtx || !tokenAddress) {
      alert("Not connected");
      return;
    }
    if (isApprovedForAll) {
      alert("Already approved");
      return;
    }
    const signer = library.getSigner(account);
    const token = ContributionBoard__factory.connect(tokenAddress, library);
    handleTransaction(
      token.connect(signer).setApprovalForAll(poolAddress, true),
      setTxStatus,
      addToast,
      `Approved MiningPool ${poolAddress}`
    );
    return;
  };

  const burn = () => {
    if (!account || !workhardCtx) {
      alert("Not connected");
      return;
    }
    if (!isApprovedForAll) {
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
    if (!account || !workhardCtx) {
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

  return (
    <Card border="warning">
      <Card.Header className="bg-warning text-white" onClick={() => {}}>
        Early Stage Contributor Share Pool
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={4}>
            <Card.Title>APY</Card.Title>
            <Card.Text style={{ fontSize: "1.5rem" }}>
              {apy.toFixed(0)}%
            </Card.Text>
          </Col>
          <Col md={4}>
            <Card.Title>Mined</Card.Title>
            <Card.Text style={{ fontSize: "1.5rem" }}>
              {parseFloat(formatEther(mined || 0)).toFixed(2)}{" "}
              <span style={{ fontSize: "0.75rem" }}>
                {workhardCtx?.metadata.visionSymbol || "VISION"}
              </span>
            </Card.Text>
          </Col>
          <Col md={4}>
            <Card.Title>Weekly allocation</Card.Title>
            <Card.Text style={{ fontSize: "1.5rem" }}>
              {parseFloat(formatEther(allocatedVISION)).toFixed(2)}{" "}
              <span style={{ fontSize: "0.75rem" }}>
                {workhardCtx?.metadata.visionSymbol || "VISION"}
              </span>
            </Card.Text>
          </Col>
        </Row>
        <hr />
        <Card.Title>Burn your contribution proof</Card.Title>
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
              <Button variant="outline-warning" onClick={exit}>
                Stop mining and withdraw rewards
              </Button>
            </Col>
            <Col style={{ textAlign: "end" }}>
              <ConditionalButton
                variant="warning"
                onClick={isApprovedForAll ? burn : approve}
                enabledWhen={txStatus !== TxStatus.PENDING}
                whyDisabled={"pending"}
              >
                {isApprovedForAll ? "Burn" : "Approve"}
              </ConditionalButton>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
};
