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
import { StableReserveStore } from "../../../store/stableReserveStore";
import { observer } from "mobx-react";
import { useStores } from "../../../hooks/user-stores";

export const RedeemCommit: React.FC = observer(() => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const workhardCtx = useWorkhard();
  const [redeemAmount, setRedeemAmount] = useState<string>();
  const [approveTxStatus, setApproveTxStatus] = useState<TxStatus>();
  const [redeemTxStatus, setRedeemTxStatus] = useState<TxStatus>();
  const { stableReserveStore: store } = useStores();

  const getMaxRedeem = () => formatEther(store.commitBalance || "0");

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
    if (store.commitBalance && redeemAmountInWei.gt(store.commitBalance)) {
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
      const commitToken = workhardCtx.dao.commit;
      commitToken
        .balanceOf(account)
        .then(store.setCommitBalance)
        .catch(errorHandler(addToast));
      commitToken
        .allowance(account, workhardCtx.dao.stableReserve.address)
        .then(store.setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, workhardCtx, blockNumber]);
  return (
    <Card border={"primary"}>
      <Card.Header className="text-primary border-primary bg-white">
        Redeem
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={7}>
            <Card.Title>
              {workhardCtx?.metadata.commitSymbol || `$COMMIT`} balance
            </Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>
                {parseFloat(formatEther(store.commitBalance)).toFixed(2)}
              </span>{" "}
              {workhardCtx?.metadata.commitSymbol || `$COMMIT`}
            </Card.Text>
          </Col>
          <Col md={5}>
            <Card.Title>Rate</Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>1</span>{" "}
              {workhardCtx?.metadata.baseCurrencySymbol || `DAI`} per{" "}
              {workhardCtx?.metadata.commitSymbol || `COMMIT`}
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
            variant={"outline-success"}
            className={"text-success"}
            onClick={
              isApproved(store.allowance, redeemAmount)
                ? redeem
                : approveAndRedeem
            }
            enabledWhen={
              redeemTxStatus !== TxStatus.PENDING &&
              approveTxStatus !== TxStatus.PENDING
            }
            whyDisabled={
              isApproved(store.allowance, redeemAmount)
                ? "Approving contract"
                : "Redeeming..."
            }
            children={
              approveTxStatus === TxStatus.PENDING
                ? "Approving..."
                : isApproved(store.allowance, redeemAmount)
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
});
