import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import { Card, Button, Form, InputGroup } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { OverlayTooltip } from "../../OverlayTooltip";

export interface BuyCommitmentProps {}

export const BuyCommitment: React.FC<BuyCommitmentProps> = ({}) => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  const [daiBalance, setDaiBalance] = useState<BigNumber>();
  const [commitmentBalance, setCommitmentBalance] = useState<BigNumber>();
  const [tokenAllowance, setTokenAllowance] = useState<BigNumber>();
  const [approved, setApproved] = useState(false);
  const [spendingDai, setSpendingDai] = useState<string>();
  const [lastTx, setLastTx] = useState<string>();

  const getMaxSpending = () => formatEther(daiBalance || "0");

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
    const buyAmountInWei = parseEther(spendingDai || "0").div(2);
    if (!daiBalance) {
      alert("Fetching balance..");
      return;
    } else if (daiBalance && parseEther(spendingDai || "0").gt(daiBalance)) {
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
            if (allowance.gt(spendingDai || 0)) setApproved(true);
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
          <OverlayTooltip
            tip=" Annual Percentage Yield by Burning $Commitment token = (Revenue
                - Burn) / Year"
            text="❔"
          />
        </Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>2 DAI</Card.Text>
        <Card.Title>Your balance:</Card.Title>
        <Card.Text>
          $DAI: {formatEther(daiBalance || "0")} / $COMMITMENT:{" "}
          {formatEther(commitmentBalance || "0")}
        </Card.Text>
        {/* <Card.Title>Stake & lock to dispatch farmers</Card.Title> */}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="buy">
            <Card.Title>Buy</Card.Title>
            {/* <Form.Label>Staking</Form.Label> */}
            <InputGroup className="mb-2">
              <InputGroup.Prepend>
                <InputGroup.Text>$DAI</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                id="base-currency-amount"
                value={spendingDai}
                onChange={({ target: { value } }) => setSpendingDai(value)}
                placeholder={getMaxSpending()}
              />
              <InputGroup.Append
                style={{ cursor: "pointer" }}
                onClick={() => setSpendingDai(getMaxSpending())}
              >
                <InputGroup.Text>MAX</InputGroup.Text>
              </InputGroup.Append>
            </InputGroup>
          </Form.Group>
          <Card.Text>
            {`= ${formatEther(
              parseEther(spendingDai || "0").div(2)
            )} $COMMITMENT`}
          </Card.Text>
          <br />
          <Button variant="primary" type="submit">
            {approved ? "Get $COMMITMENT" : "Approve"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};
