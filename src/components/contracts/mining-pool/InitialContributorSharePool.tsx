import React, { useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import { Card, Button, Form, InputGroup, ProgressBar } from "react-bootstrap";
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

export interface InitialContributorSharePoolProps {
  poolAddress: string;
  totalEmission: BigNumber;
  emissionWeightSum: BigNumber;
  collapsible?: boolean;
}

export const InitialContributorSharePool: React.FC<InitialContributorSharePoolProps> = ({
  poolAddress,
  totalEmission,
  collapsible,
  emissionWeightSum,
}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const workhard = useWorkhard();
  const { addToast } = useToasts();

  const [collapsed, setCollapsed] = useState<boolean>(
    collapsible ? true : false
  );
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
    if (!!account && !!workhard) {
      MiningPool__factory.connect(poolAddress, library)
        .baseToken()
        .then(setTokenAddress)
        .catch(errorHandler(addToast));
      workhard.dao.visionEmitter
        .emissionWeight()
        .then((emissions) => {
          setWeight(emissions.dev);
        })
        .catch(errorHandler(addToast));
    }
  }, [account, workhard]);
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
    if (!!account && !!workhard && !!tokenAddress) {
      const token = ContributionBoard__factory.connect(tokenAddress, library);
      token
        .balanceOf(account, workhard.daoId)
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
  }, [account, workhard, tokenAddress, txStatus, blockNumber]);

  useEffect(() => {
    if (burnedAmount && tokenBalance) {
      const sum = burnedAmount.add(tokenBalance);
      const percent = sum.eq(0) ? 0 : burnedAmount.mul(100).div(sum).toNumber();
      setBurnPercent(percent);
    }
  }, [burnedAmount, tokenBalance]);

  const approve = () => {
    if (!account || !workhard || !tokenAddress) {
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
    if (!account || !workhard) {
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
    if (!account || !workhard) {
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
      <hr />
      <Card.Title>Burn your initial contribution</Card.Title>
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
        <Button variant="warning" onClick={isApprovedForAll ? burn : approve}>
          {isApprovedForAll ? "Burn" : "Approve"}
        </Button>
      </Form>
      <hr />
      <Card.Title>Mine</Card.Title>
      <Card.Text>You mined {formatEther(mined || "0")} $VISION</Card.Text>
      <Button variant="outline-warning" onClick={exit}>
        Stop mining and withdraw rewards
      </Button>
    </>
  );

  return (
    <Card border="warning">
      <Card.Header className="bg-warning text-white" onClick={() => {}}>
        Initial Contributor Share Pool
      </Card.Header>
      <Card.Body>
        <Card.Text>
          You are one of the initial Contributor! Thanks for your hard
          commitment for this project's early stages. Enjoy this special
          rewards!
        </Card.Text>
        <Card.Text>
          {parseFloat(formatEther(allocatedVISION)).toFixed(2)} VISION allocated
          for initial contributors this week.
        </Card.Text>
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
