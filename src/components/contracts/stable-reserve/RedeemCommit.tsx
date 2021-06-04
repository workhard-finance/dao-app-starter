import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, constants, ContractTransaction } from "ethers";
import { Card, Button, Form, InputGroup, Row, Col } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
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
  const workhardCtx = useWorkhard();
  const [daiBalance, setDaiBalance] = useState<BigNumber>();
  const [commitBalance, setCommitBalance] = useState<BigNumber>();
  const [allowance, setAllowance] = useState<BigNumber>();
  const [redeemAmount, setRedeemAmount] = useState<string>();
  const [approveTxStatus, setApproveTxStatus] = useState<TxStatus>();
  const [redeemTxStatus, setRedeemTxStatus] = useState<TxStatus>();

  const getMaxRedeem = () => formatEther(commitBalance || "0");

  const approveAndRedeem = () => {
    if (!account || !workhardCtx || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      workhardCtx.dao.commit
        .connect(signer)
        .approve(workhardCtx.dao.stableReserve.address, constants.MaxUint256),
      setApproveTxStatus,
      addToast,
      "Approved StableReserve.",
      redeem
    );
  };

  const redeem = () => {
    if (!account || !workhardCtx || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const stableReserve = workhardCtx.dao.stableReserve;
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
      `Successfully bought ${workhardCtx.metadata.commitSymbol}`,
      () => {
        setRedeemAmount("");
      }
    );
  };

  useEffect(() => {
    if (!!account && !!workhardCtx) {
      const baseCurrency = workhardCtx.dao.baseCurrency;
      const commitToken = workhardCtx.dao.commit;
      baseCurrency
        .balanceOf(account)
        .then(setDaiBalance)
        .catch(errorHandler(addToast));
      commitToken
        .balanceOf(account)
        .then(setCommitBalance)
        .catch(errorHandler(addToast));
      commitToken
        .allowance(account, workhardCtx.dao.stableReserve.address)
        .then(setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, workhardCtx, blockNumber]);
  return (
    <Card border={"success"}>
      <Card.Body>
        <Row>
          <Col md={5}>
            <Card.Title>
              {workhardCtx?.metadata.commitSymbol || `$COMMIT`} balance
            </Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>
                {formatEther(commitBalance || 0)}
              </span>{" "}
              {workhardCtx?.metadata.commitSymbol || `$COMMIT`}
            </Card.Text>
          </Col>
          <Col md={7}>
            <Card.Title>Redeem rate</Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>
                1 {workhardCtx?.metadata.baseCurrencySymbol || `DAI`}
              </span>{" "}
              per {workhardCtx?.metadata.commitSymbol || `COMMIT`}
            </Card.Text>
          </Col>
        </Row>
        <br />
        <Form>
          <Form.Group>
            <InputGroup className="mb-2">
              <InputGroup.Prepend>
                <InputGroup.Text>
                  {workhardCtx?.metadata.commitSymbol || "$COMMIT"}
                </InputGroup.Text>
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
          <ConditionalButton
            variant="success"
            onClick={
              isApproved(allowance, redeemAmount) ? redeem : approveAndRedeem
            }
            enabledWhen={
              redeemTxStatus !== TxStatus.PENDING &&
              approveTxStatus !== TxStatus.PENDING
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
                  : `Redeem ${
                      workhardCtx?.metadata.commitSymbol || "$COMMIT"
                    } for $DAI`
                : "Approve"
            }
          />
        </Form>
      </Card.Body>
    </Card>
  );
};
