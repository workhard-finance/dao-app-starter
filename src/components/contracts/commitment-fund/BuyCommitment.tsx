import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import {
  Card,
  Button,
  Form,
  Tooltip,
  OverlayTrigger,
  InputGroup,
} from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { ERC20Mock__factory } from "@workhard/protocol";

export interface BuyCommitmentProps {}

export const BuyCommitment: React.FC<BuyCommitmentProps> = ({}) => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  const [daiBalance, setDaiBalance] = useState<BigNumber>();
  const [commitmentBalance, setCommitmentBalance] = useState<BigNumber>();
  const [tokenAllowance, setTokenAllowance] = useState<BigNumber>();
  const [approved, setApproved] = useState(false);
  const [buyAmount, setBuyAmount] = useState<string>();
  const [lastTx, setLastTx] = useState<string>();

  const getMaxBuy = () => formatEther(daiBalance?.div(2) || "0");

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    if (!approved) {
      contracts.baseCurrency
        .connect(signer)
        .approve(contracts.commitmentFund.address, constants.MaxUint256)
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
    }
    const commitmentFund = contracts?.commitmentFund;
    const buyAmountInWei = parseEther(buyAmount || "0");
    if (!daiBalance) {
      alert("Fetching balance..");
      return;
    } else if (daiBalance && buyAmountInWei.gt(daiBalance)) {
      alert("Not enough amount of base currency");
      return;
    }
    commitmentFund
      .connect(signer)
      .payInsteadOfWorking(buyAmountInWei)
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            setLastTx(receipt.transactionHash);
          })
          .catch((rejected) => {
            alert(`Rejected: ${rejected}.`);
          });
        // TODO wait spinner
        // TODO UI update w/stale
      })
      .catch((reason) => {
        // TODO UI update w/stale
        alert(`Failed: ${reason}`);
      });
  };

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const baseCurrency = contracts.baseCurrency;
      const commitmentToken = contracts.commitmentToken;
      baseCurrency
        .balanceOf(account)
        .then((bal) => {
          if (!stale) setDaiBalance(bal);
        })
        .catch(() => {
          if (!stale) setDaiBalance(undefined);
        });
      commitmentToken
        .balanceOf(account)
        .then((bal) => {
          if (!stale) setCommitmentBalance(bal);
        })
        .catch(() => {
          if (!stale) setCommitmentBalance(undefined);
        });
      baseCurrency
        .allowance(account, contracts.commitmentFund.address)
        .then((allowance) => {
          if (!stale) {
            setTokenAllowance(allowance);
            if (allowance.gt(buyAmount || 0)) setApproved(true);
            else setApproved(false);
          }
        })
        .catch(() => {
          if (!stale) setTokenAllowance(undefined);
        });
      return () => {
        stale = true;
        setDaiBalance(undefined);
        setTokenAllowance(undefined);
      };
    }
  }, [account, contracts, lastTx]);
  return (
    <Card>
      <Card.Header as="h5">
        I'll pay instead of working to get $COMMITMENT
      </Card.Header>
      <Card.Body>
        <Card.Title>
          DAI per $COMMITMENT
          <OverlayTrigger
            // key={placement}
            // placement={placement}
            overlay={
              <Tooltip id={`tooltip-dispatchable-farmers`}>
                Annual Percentage Yield by Burning $Commitment token = (Revenue
                - Burn) / Year
              </Tooltip>
            }
          >
            <span style={{ fontSynthesis: "o" }}>❔</span>
          </OverlayTrigger>
        </Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>2 DAI</Card.Text>
        <Card.Title>Your balance:</Card.Title>
        <Card.Text>$DAI: {formatEther(daiBalance || "0")} </Card.Text>
        <Card.Text>
          $COMMITMENT: {formatEther(commitmentBalance || "0")}
        </Card.Text>
        {/* <Card.Title>Stake & lock to dispatch farmers</Card.Title> */}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="buy">
            <Card.Title>Buy</Card.Title>
            {/* <Form.Label>Staking</Form.Label> */}
            <InputGroup className="mb-2">
              <InputGroup.Prepend onClick={() => setBuyAmount(getMaxBuy())}>
                <InputGroup.Text>MAX</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                id="base-currency-amount"
                value={buyAmount}
                onChange={({ target: { value } }) => setBuyAmount(value)}
                placeholder={getMaxBuy()}
              />
            </InputGroup>
          </Form.Group>
          <Form.Text>
            Buying {formatEther(parseEther(buyAmount || "0"))} $COMMITMENT with{" "}
            {formatEther(parseEther(buyAmount || "0").mul(2))} $DAI
          </Form.Text>
          <br />
          <Button variant="primary" type="submit">
            {approved ? "Get $COMMITMENT" : "Approve"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};
