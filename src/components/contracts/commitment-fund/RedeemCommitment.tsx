import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, constants, ContractTransaction } from "ethers";
import { Card, Button, Form, InputGroup } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { OverlayTooltip } from "../../OverlayTooltip";
import { approveAndRun } from "../../../utils/utils";
import { ConditionalButton } from "../../ConditionalButton";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";

export interface RedeemCommitmentProps {}

export const RedeemCommitment: React.FC<RedeemCommitmentProps> = ({}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [daiBalance, setDaiBalance] = useState<BigNumber>();
  const [commitmentBalance, setCommitmentBalance] = useState<BigNumber>();
  const [approved, setApproved] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState<string>();
  const [approveTx, setApproveTx] = useState<ContractTransaction>();
  const [redeemTx, setRedeemTx] = useState<ContractTransaction>();

  const getMaxRedeem = () => formatEther(commitmentBalance || "0");

  const approveAndRedeem = () => {
    if (!account || !contracts || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    approveAndRun(
      signer,
      contracts.commitmentToken.address,
      contracts.commitmentFund.address,
      setApproveTx,
      setApproved,
      redeem
    );
  };

  const redeem = () => {
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
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
        setRedeemTx(tx);
        tx.wait()
          .then((_receipt) => {
            setRedeemTx(undefined);
            setRedeemAmount("");
          })
          .catch((rejected) => {
            setRedeemTx(undefined);
            alert(`Rejected: ${rejected}.`);
          });
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
            if (allowance.gt(redeemAmount || 0)) setApproved(true);
            else setApproved(false);
          }
        });
      return () => {
        stale = true;
        setDaiBalance(undefined);
      };
    }
  }, [account, contracts, blockNumber]);
  return (
    <Card>
      <Card.Header as="h5">Redeem $COMMITMENT for $DAI</Card.Header>
      <Card.Body>
        <Card.Title>
          $DAI per $COMMITMENT
          <OverlayTooltip
            tip="You can redeem 1 $COMMITMENT for 1 $DAI."
            text="❔"
          />
        </Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>1 COMMITMENT TOKEN</Card.Text>
        <Card.Title>Your balance:</Card.Title>
        <Card.Text>
          $DAI: {formatEther(daiBalance || "0")} / $COMMITMENT:{" "}
          {formatEther(commitmentBalance || "0")}
        </Card.Text>
        {/* <Card.Title>Stake & lock to dispatch farmers</Card.Title> */}
        <Form>
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
          <Card.Text>
            {`= ${formatEther(parseEther(redeemAmount || "0"))} $DAI`}
          </Card.Text>
          <br />
          <ConditionalButton
            variant="primary"
            onClick={approved ? redeem : approveAndRedeem}
            enabledWhen={approveTx === undefined && redeemTx === undefined}
            whyDisabled={approved ? "Approving contract" : "Redeeming..."}
            children={
              approveTx
                ? "Approving..."
                : approved
                ? redeemTx
                  ? "Redeeming..."
                  : "Redeem"
                : "Approve"
            }
          />
        </Form>
      </Card.Body>
    </Card>
  );
};
