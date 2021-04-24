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

export interface RedeemCommitmentProps {}

export const RedeemCommitment: React.FC<RedeemCommitmentProps> = ({}) => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  const [daiBalance, setDaiBalance] = useState<BigNumber>();
  const [commitmentBalance, setCommitmentBalance] = useState<BigNumber>();
  const [tokenAllowance, setTokenAllowance] = useState<BigNumber>();
  const [approved, setApproved] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState<string>();
  const [lastTx, setLastTx] = useState<string>();

  const getMaxRedeem = () => formatEther(commitmentBalance || "0");

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    if (!approved) {
      contracts.commitmentToken
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
    const redeemAmountInWei = parseEther(redeemAmount || "0");
    if (!daiBalance) {
      alert("Fetching balance..");
      return;
    } else if (commitmentBalance && redeemAmountInWei.gt(commitmentBalance)) {
      alert("Not enough amount of commitment balance");
      return;
    }
    commitmentFund
      .connect(signer)
      .redeem(redeemAmountInWei)
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
      commitmentToken
        .allowance(account, contracts.commitmentFund.address)
        .then((allowance) => {
          if (!stale) {
            setTokenAllowance(allowance);
            if (allowance.gt(redeemAmount || 0)) setApproved(true);
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
      <Card.Header as="h5">Redeem $COMMITMENT for $DAI</Card.Header>
      <Card.Body>
        <Card.Title>
          $COMMITMENT per $DAI
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
        <Card.Text style={{ fontSize: "3rem" }}>1 COMMITMENT TOKEN</Card.Text>
        <Card.Title>Your balance:</Card.Title>
        <Card.Text>
          $DAI: {formatEther(daiBalance || "0")} / $COMMITMENT:{" "}
          {formatEther(commitmentBalance || "0")}
        </Card.Text>
        {/* <Card.Title>Stake & lock to dispatch farmers</Card.Title> */}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="buy">
            <Card.Title>Redeem</Card.Title>
            {/* <Form.Label>Staking</Form.Label> */}
            <InputGroup className="mb-2">
              <InputGroup.Prepend>
                <InputGroup.Text>$COMMITMENT</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                id="base-currency-amount"
                value={redeemAmount}
                onChange={({ target: { value } }) => setRedeemAmount(value)}
                placeholder={getMaxRedeem()}
              />
              <InputGroup.Append
                style={{ cursor: "pointer" }}
                onClick={() => setRedeemAmount(getMaxRedeem())}
              >
                <InputGroup.Text>MAX</InputGroup.Text>
              </InputGroup.Append>
            </InputGroup>
          </Form.Group>
          <Form.Text>
            Redeem {formatEther(parseEther(redeemAmount || "0"))} $COMMITMENT
            with {formatEther(parseEther(redeemAmount || "0"))} $DAI
          </Form.Text>
          <br />
          <Button variant="primary" type="submit">
            {approved ? "Redeem for $DAI" : "Approve"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};
