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

export interface BuyCommitProps {
  style?: React.CSSProperties;
}

export const BuyCommit: React.FC<BuyCommitProps> = ({ style }) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const workhardCtx = useWorkhard();
  const [daiBalance, setDaiBalance] = useState<BigNumber>();
  const [commitBalance, setCommitBalance] = useState<BigNumber>();
  const [allowance, setAllowance] = useState<BigNumber>();
  const [spendingDai, setSpendingDai] = useState<string>();
  const [approveTxStatus, setApproveTxStatus] = useState<TxStatus>();
  const [buyTxStatus, setBuyTxStatus] = useState<TxStatus>();

  const getMaxSpending = () => formatEther(daiBalance || "0");

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
    if (!daiBalance) {
      alert("Fetching balance..");
      return;
    } else if (daiBalance && parseEther(spendingDai || "0").gt(daiBalance)) {
      alert("Not enough amount of base currency");
      return;
    }
    handleTransaction(
      stableReserve.connect(signer).payInsteadOfWorking(buyAmountInWei),
      setBuyTxStatus,
      addToast,
      `Successfully bought ${workhardCtx.metadata.commitSymbol}`,
      () => {
        setSpendingDai("");
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
      baseCurrency
        .allowance(account, workhardCtx.dao.stableReserve.address)
        .then(setAllowance)
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
                {parseFloat(formatEther(daiBalance || 0)).toFixed(2)}
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
              isApproved(allowance, spendingDai) ? buyCommit : approveAndBuy
            }
            enabledWhen={
              buyTxStatus !== TxStatus.PENDING &&
              approveTxStatus !== TxStatus.PENDING
            }
            whyDisabled={
              isApproved(allowance, spendingDai)
                ? "Approving contract"
                : "Buying"
            }
            children={
              approveTxStatus === TxStatus.PENDING
                ? "Approving..."
                : isApproved(allowance, spendingDai)
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
};
