import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, constants, ContractTransaction } from "ethers";
import { Card, Button, Form, InputGroup } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { OverlayTooltip } from "../../OverlayTooltip";
import {
  approveAndRun,
  errorHandler,
  handleTransaction,
  isApproved,
  TxStatus,
} from "../../../utils/utils";
import { ConditionalButton } from "../../ConditionalButton";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { useToasts } from "react-toast-notifications";

export interface RedeemCommitProps {}

export const RedeemCommit: React.FC<RedeemCommitProps> = ({}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const contracts = useWorkhardContracts();
  const [daiBalance, setDaiBalance] = useState<BigNumber>();
  const [commitBalance, setCommitBalance] = useState<BigNumber>();
  const [allowance, setAllowance] = useState<BigNumber>();
  const [redeemAmount, setRedeemAmount] = useState<string>();
  const [approveTxStatus, setApproveTxStatus] = useState<TxStatus>();
  const [redeemTxStatus, setRedeemTxStatus] = useState<TxStatus>();

  const getMaxRedeem = () => formatEther(commitBalance || "0");

  const approveAndRedeem = () => {
    if (!account || !contracts || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      contracts.commit
        .connect(signer)
        .approve(contracts.stableReserve.address, constants.MaxUint256),
      setApproveTxStatus,
      addToast,
      "Approved StableReserve.",
      redeem
    );
  };

  const redeem = () => {
    if (!account || !contracts || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const stableReserve = contracts?.stableReserve;
    const redeemAmountInWei = parseEther(redeemAmount || "0");
    if (!daiBalance) {
      alert("Fetching balance..");
      return;
    } else if (commitBalance && redeemAmountInWei.gt(commitBalance)) {
      alert("Not enough amount of commit balance");
      return;
    }

    handleTransaction(
      stableReserve.connect(signer).redeem(redeemAmountInWei),
      setRedeemTxStatus,
      addToast,
      "Successfully bought $COMMIT",
      () => {
        setRedeemAmount("");
      }
    );
  };

  useEffect(() => {
    if (!!account && !!contracts) {
      const baseCurrency = contracts.baseCurrency;
      const commitToken = contracts.commit;
      baseCurrency
        .balanceOf(account)
        .then(setDaiBalance)
        .catch(errorHandler(addToast));
      commitToken
        .balanceOf(account)
        .then(setCommitBalance)
        .catch(errorHandler(addToast));
      commitToken
        .allowance(account, contracts.stableReserve.address)
        .then(setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, contracts, blockNumber]);
  return (
    <Card>
      <Card.Header as="h5">Redeem $COMMIT for $DAI</Card.Header>
      <Card.Body>
        <Card.Title>
          $DAI per $COMMIT
          <OverlayTooltip
            tip="You can redeem 1 $COMMIT for 1 $DAI."
            text="❔"
          />
        </Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>1 COMMIT TOKEN</Card.Text>
        <Card.Title>Your balance:</Card.Title>
        <Card.Text>
          $DAI: {formatEther(daiBalance || "0")} / $COMMIT:{" "}
          {formatEther(commitBalance || "0")}
        </Card.Text>
        <Form>
          <Form.Group>
            <Card.Title>Redeem</Card.Title>
            <InputGroup className="mb-2">
              <InputGroup.Prepend>
                <InputGroup.Text>$COMMIT</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
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
            onClick={
              isApproved(allowance, redeemAmount) ? redeem : approveAndRedeem
            }
            enabledWhen={
              isApproved(allowance, redeemAmount) === undefined &&
              redeemTxStatus !== TxStatus.PENDING
            }
            whyDisabled={
              isApproved(allowance, redeemAmount)
                ? "Approving contract"
                : "Redeeming..."
            }
            children={
              approveTxStatus === TxStatus.PENDING
                ? "Approving..."
                : isApproved(allowance, redeemAmount)
                ? redeemTxStatus === TxStatus.PENDING
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
