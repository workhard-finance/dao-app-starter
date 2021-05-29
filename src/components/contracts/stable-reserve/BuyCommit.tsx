import React, { useEffect, useState } from "react";
import { BigNumber, constants, ContractTransaction } from "ethers";
import { Card, Form, InputGroup } from "react-bootstrap";
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

export interface BuyCommitProps {}

export const BuyCommit: React.FC<BuyCommitProps> = ({}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const { dao } = useWorkhard() || {};
  const [daiBalance, setDaiBalance] = useState<BigNumber>();
  const [commitBalance, setCommitBalance] = useState<BigNumber>();
  const [allowance, setAllowance] = useState<BigNumber>();
  const [spendingDai, setSpendingDai] = useState<string>();
  const [approveTxStatus, setApproveTxStatus] = useState<TxStatus>();
  const [buyTxStatus, setBuyTxStatus] = useState<TxStatus>();

  const getMaxSpending = () => formatEther(daiBalance || "0");

  const approveAndBuy = () => {
    if (!account || !dao || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      dao.baseCurrency
        .connect(signer)
        .approve(dao.stableReserve.address, constants.MaxUint256),
      setApproveTxStatus,
      addToast,
      "Approved StableReserve.",
      buyCommit
    );
  };

  const buyCommit = () => {
    if (!account || !dao || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const stableReserve = dao?.stableReserve;
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
      "Successfully bought $COMMIT",
      () => {
        setSpendingDai("");
      }
    );
  };

  useEffect(() => {
    if (!!account && !!dao) {
      const baseCurrency = dao.baseCurrency;
      const commitToken = dao.commit;
      baseCurrency
        .balanceOf(account)
        .then(setDaiBalance)
        .catch(errorHandler(addToast));
      commitToken
        .balanceOf(account)
        .then(setCommitBalance)
        .catch(errorHandler(addToast));
      baseCurrency
        .allowance(account, dao.stableReserve.address)
        .then(setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, dao, approveTxStatus, blockNumber]);

  return (
    <Card>
      <Card.Header as="h5">Buy $COMMIT at a premium</Card.Header>
      <Card.Body>
        <Card.Text>
          <span style={{ fontSize: "2rem" }}>2 DAI</span> per $COMMIT
        </Card.Text>
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
            {`= ${formatEther(parseEther(spendingDai || "0").div(2))} $COMMIT`}
          </Card.Text>
          <ConditionalButton
            variant="primary"
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
                  : "Buy"
                : "Approve"
            }
          />
        </Form>
      </Card.Body>
    </Card>
  );
};
