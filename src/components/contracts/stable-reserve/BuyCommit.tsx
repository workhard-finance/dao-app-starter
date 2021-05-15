import React, { useEffect, useState } from "react";
import { BigNumber, constants, ContractTransaction } from "ethers";
import { Card, Form, InputGroup } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
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
  const { addToast } = useToasts();
  const contracts = useWorkhardContracts();
  const [daiBalance, setDaiBalance] = useState<BigNumber>();
  const [commitBalance, setCommitBalance] = useState<BigNumber>();
  const [allowance, setAllowance] = useState<BigNumber>();
  const [spendingDai, setSpendingDai] = useState<string>();
  const [approveTxStatus, setApproveTxStatus] = useState<TxStatus>();
  const [buyTxStatus, setBuyTxStatus] = useState<TxStatus>();

  const getMaxSpending = () => formatEther(daiBalance || "0");

  const approveAndBuy = () => {
    if (!account || !contracts || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      contracts.baseCurrency
        .connect(signer)
        .approve(contracts.stableReserve.address, constants.MaxUint256),
      setApproveTxStatus,
      addToast,
      "Approved StableReserve.",
      buyCommit
    );
  };

  const buyCommit = () => {
    if (!account || !contracts || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const stableReserve = contracts?.stableReserve;
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
      baseCurrency
        .allowance(account, contracts.stableReserve.address)
        .then(setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, contracts, approveTxStatus]);

  return (
    <Card>
      <Card.Header as="h5">
        I'll pay instead of working to get $COMMIT
      </Card.Header>
      <Card.Body>
        <Card.Title>
          DAI per $COMMIT
          <OverlayTooltip
            tip=" Annual Percentage Yield by Burning $Commit token = (Revenue
                - Burn) / Year"
            text="❔"
          />
        </Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>2 DAI</Card.Text>
        <Card.Title>Your balance:</Card.Title>
        <Card.Text>
          $DAI: {formatEther(daiBalance || "0")} / $COMMIT:{" "}
          {formatEther(commitBalance || "0")}
        </Card.Text>
        <Form>
          <Form.Group>
            <Card.Title>Buy</Card.Title>
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
          <br />
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
