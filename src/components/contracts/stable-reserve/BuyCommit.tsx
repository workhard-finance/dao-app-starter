import React, { useEffect, useState } from "react";
import { BigNumber, constants, ContractTransaction } from "ethers";
import { Card, Col, Form, InputGroup, Row } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { OverlayTooltip } from "../../OverlayTooltip";
import { ConditionalButton } from "../../ConditionalButton";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import {
  approveAndRun,
  errorHandler,
  handleTransaction,
  isApproved,
  TxStatus,
} from "../../../utils/utils";
import { useToasts } from "react-toast-notifications";
import { StableReserveStore } from "../../../store/stableReserveStore";
import { observer } from "mobx-react";
import { useStores } from "../../../hooks/user-stores";

export interface BuyCommitProps {
  style?: React.CSSProperties;
}

export const BuyCommit: React.FC<BuyCommitProps> = observer(({ style }) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const workhardCtx = useWorkhard();
  const [spendingDai, setSpendingDai] = useState<string>();
  const [approveTxStatus, setApproveTxStatus] = useState<TxStatus>();
  const [buyTxStatus, setBuyTxStatus] = useState<TxStatus>();
  const { stableReserveStore: store } = useStores();

  const getMaxSpending = () => formatEther(store.daiBalance || "0");

  const approveAndBuy = () => {
    if (!account || !workhardCtx || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      workhardCtx.dao.baseCurrency
        .connect(signer)
        .approve(workhardCtx.dao.stableReserve.address, constants.MaxUint256),
      setApproveTxStatus,
      addToast,
      "Approved StableReserve.",
      buyCommit
    );
  };

  const buyCommit = () => {
    if (!account || !workhardCtx || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const stableReserve = workhardCtx.dao.stableReserve;
    const buyAmountInWei = parseEther(spendingDai || "0").div(2);
    if (!store.daiBalance) {
      alert("Fetching balance..");
      return;
    } else if (
      store.daiBalance &&
      parseEther(spendingDai || "0").gt(store.daiBalance)
    ) {
      alert("Not enough amount of base currency");
      return;
    }
    handleTransaction(
      stableReserve.connect(signer).payInsteadOfWorking(buyAmountInWei),
      setBuyTxStatus,
      addToast,
      `Successfully bought ${workhardCtx.metadata.commitSymbol}`,
      () => {
        workhardCtx.dao.commit.balanceOf(account).then(store.setCommitBalance);
        setSpendingDai("");
      }
    );
  };

  useEffect(() => {
    if (!!account && !!workhardCtx) {
      const baseCurrency = workhardCtx.dao.baseCurrency;
      baseCurrency
        .balanceOf(account)
        .then(store.setDaiBalance)
        .catch(errorHandler(addToast));
      baseCurrency
        .allowance(account, workhardCtx.dao.stableReserve.address)
        .then(store.setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, workhardCtx, approveTxStatus, blockNumber]);

  return (
    <Card border={"danger"} style={style}>
      <Card.Header className="bg-danger text-white">Buy</Card.Header>
      <Card.Body>
        <Row>
          <Col md={7}>
            <Card.Title>Stable balance</Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>
                {parseFloat(formatEther(store.daiBalance)).toFixed(2)}
              </span>{" "}
              {workhardCtx?.metadata.baseCurrencySymbol || `$DAI`}
            </Card.Text>
          </Col>
          <Col md={5}>
            <Card.Title>Rate</Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>2</span>{" "}
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
                <InputGroup.Text>$DAI</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
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
            {`= ${formatEther(parseEther(spendingDai || "0").div(2))} ${
              workhardCtx?.metadata.commitSymbol || `$COMMIT`
            }`}
          </Card.Text>
          <ConditionalButton
            variant="danger"
            onClick={
              isApproved(store.allowance, spendingDai)
                ? buyCommit
                : approveAndBuy
            }
            enabledWhen={
              buyTxStatus !== TxStatus.PENDING &&
              approveTxStatus !== TxStatus.PENDING
            }
            whyDisabled={
              isApproved(store.allowance, spendingDai)
                ? "Approving contract"
                : "Buying"
            }
            children={
              approveTxStatus === TxStatus.PENDING
                ? "Approving..."
                : isApproved(store.allowance, spendingDai)
                ? buyTxStatus === TxStatus.PENDING
                  ? "Buying..."
                  : `Buy ${
                      workhardCtx?.metadata.commitSymbol || `$COMMIT`
                    } at a premium`
                : "Approve"
            }
          />
        </Form>
      </Card.Body>
    </Card>
  );
});
