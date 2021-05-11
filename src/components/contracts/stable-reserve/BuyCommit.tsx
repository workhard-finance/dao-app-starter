import React, { useEffect, useState } from "react";
import { BigNumber, ContractTransaction } from "ethers";
import { Card, Form, InputGroup } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { OverlayTooltip } from "../../OverlayTooltip";
import { ConditionalButton } from "../../ConditionalButton";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { approveAndRun } from "../../../utils/utils";

export interface BuyCommitProps {}

export const BuyCommit: React.FC<BuyCommitProps> = ({}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [daiBalance, setDaiBalance] = useState<BigNumber>();
  const [commitBalance, setCommitBalance] = useState<BigNumber>();
  const [approved, setApproved] = useState(false);
  const [spendingDai, setSpendingDai] = useState<string>();
  const [approveTx, setApproveTx] = useState<ContractTransaction>();
  const [buyTx, setBuyTx] = useState<ContractTransaction>();

  const getMaxSpending = () => formatEther(daiBalance || "0");

  const approveAndBuy = () => {
    if (!account || !contracts || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    approveAndRun(
      signer,
      contracts.baseCurrency.address,
      contracts.stableReserve.address,
      setApproveTx,
      setApproved,
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
    stableReserve
      .connect(signer)
      .payInsteadOfWorking(buyAmountInWei)
      .then((tx) => {
        setBuyTx(tx);
        tx.wait()
          .then((_receipt) => {
            setBuyTx(undefined);
            setSpendingDai("");
          })
          .catch((rejected) => {
            setBuyTx(undefined);
            alert(`rejected: ${rejected}`);
          });
      });
  };
  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const baseCurrency = contracts.baseCurrency;
      const commitToken = contracts.commit;
      baseCurrency
        .balanceOf(account)
        .then((bal) => {
          if (!stale) setDaiBalance(bal);
        })
        .catch(() => {
          if (!stale) setDaiBalance(undefined);
        });
      commitToken
        .balanceOf(account)
        .then((bal) => {
          if (!stale) setCommitBalance(bal);
        })
        .catch(() => {
          if (!stale) setCommitBalance(undefined);
        });
      baseCurrency
        .allowance(account, contracts.stableReserve.address)
        .then((allowance) => {
          if (!stale) {
            if (allowance.gt(spendingDai || 0)) setApproved(true);
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
            onClick={approved ? buyCommit : approveAndBuy}
            enabledWhen={approveTx === undefined && buyTx === undefined}
            whyDisabled={approved ? "Approving contract" : "Buying"}
            children={
              approveTx
                ? "Approving..."
                : approved
                ? buyTx
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
