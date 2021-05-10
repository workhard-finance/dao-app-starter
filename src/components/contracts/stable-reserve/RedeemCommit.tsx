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

export interface RedeemCommitProps {}

export const RedeemCommit: React.FC<RedeemCommitProps> = ({}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [daiBalance, setDaiBalance] = useState<BigNumber>();
  const [commitBalance, setCommitBalance] = useState<BigNumber>();
  const [approved, setApproved] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState<string>();
  const [approveTx, setApproveTx] = useState<ContractTransaction>();
  const [redeemTx, setRedeemTx] = useState<ContractTransaction>();

  const getMaxRedeem = () => formatEther(commitBalance || "0");

  const approveAndRedeem = () => {
    if (!account || !contracts || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    approveAndRun(
      signer,
      contracts.stableReserve.address,
      contracts.stableReserve.address,
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
    const stableReserve = contracts?.stableReserve;
    const redeemAmountInWei = parseEther(redeemAmount || "0");
    if (!daiBalance) {
      alert("Fetching balance..");
      return;
    } else if (commitBalance && redeemAmountInWei.gt(commitBalance)) {
      alert("Not enough amount of commit balance");
      return;
    }
    stableReserve
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
      commitToken
        .allowance(account, contracts.stableReserve.address)
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
        {/* <Card.Title>Stake & lock to dispatch farmers</Card.Title> */}
        <Form>
          <Form.Group>
            <Card.Title>Redeem</Card.Title>
            {/* <Form.Label>Staking</Form.Label> */}
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
