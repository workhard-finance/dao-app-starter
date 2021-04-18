import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, BigNumberish, ContractTransaction } from "ethers";
import { Form, InputGroup } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers/lib.esm";
import { ConditionalButton } from "../../ConditionalButton";
import { formatEther, parseEther, solidityKeccak256 } from "ethers/lib/utils";

export interface GrantProps {
  projId: BigNumberish;
}

// Timelock Version
export const Grant: React.FC<GrantProps> = ({ projId }) => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  const [timelock, setTimelock] = useState<string>("86400");
  const [grantAmount, setGrantAmount] = useState<string>();
  const [mintable, setMintable] = useState<BigNumber>();
  const [hasProposerRole, setHasProposerRole] = useState<boolean>(false);
  const [lastTx, setLastTx] = useState<ContractTransaction>();

  const getMaxGrant = () => formatEther(mintable || "0");

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }

    const signer = library.getSigner(account);
    const cryptoJobBoard = contracts.cryptoJobBoard;
    const timeLockGovernance = contracts.timelockedGovernance;

    const grantAmountInWei = parseEther(grantAmount || "0");
    const tx = await cryptoJobBoard.populateTransaction.grant(
      projId,
      grantAmountInWei
    );
    const data = tx?.data;
    if (data == undefined) {
      alert("invalid data");
      return;
    }
    timeLockGovernance
      .connect(signer)
      .schedule(
        contracts.cryptoJobBoard.address,
        0,
        data,
        ethers.constants.HashZero,
        ethers.utils.randomBytes(32),
        BigNumber.from(timelock)
      )
      .then((tx) => {
        setLastTx(tx);
        txWait(tx);
      })
      .catch(handleException);
  };

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const {
        timelockedGovernance: timeLockGovernance,
        cryptoJobBoard,
        commitmentFund,
      } = contracts;
      timeLockGovernance
        .hasRole(solidityKeccak256(["string"], ["PROPOSER_ROLE"]), account)
        .then(setHasProposerRole)
        .catch(handleException);
      commitmentFund
        .remainingBudget()
        .then((val) => {
          if (!stale) setMintable(val);
        })
        .catch(() => {
          if (!stale) setMintable(undefined);
        });
      return () => {
        stale = true;
        setTimelock("86400");
        setHasProposerRole(false);
      };
    }
  }, [account, contracts, projId, lastTx]);
  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="time-lock">
        <Form.Label>Grant $COMMITMENT to this project.</Form.Label>
        <InputGroup className="mb-2">
          <InputGroup.Prepend>
            <InputGroup.Text>$COMMITMENT</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            id="base-currency-amount"
            value={grantAmount}
            onChange={({ target: { value } }) => setGrantAmount(value)}
            placeholder={getMaxGrant()}
          />
          <InputGroup.Append
            style={{ cursor: "pointer" }}
            onClick={() => setGrantAmount(getMaxGrant())}
          >
            <InputGroup.Text>MAX</InputGroup.Text>
          </InputGroup.Append>
        </InputGroup>
        <Form.Control
          required
          type="text"
          onChange={({ target: { value } }) => setTimelock(value)}
          value={timelock}
        />
      </Form.Group>
      <ConditionalButton
        variant="primary"
        type="submit"
        enabledWhen={hasProposerRole}
        whyDisabled="Only the timelock admin can call this function for now. Open an issue on Github and ping the admin via Discord. This permission will be moved to FarmersUnion."
        children="Schedule grant"
      />
    </Form>
  );
};

function txWait(tx: ContractTransaction) {
  tx.wait()
    .then((receipt) => {
      alert(`${receipt.transactionHash} submitted.`);
    })
    .catch((rejected) => {
      alert(`Rejected: ${rejected}.`);
    });
  // TODO wait spinner
  // TODO UI update w/stale
}

function handleException(reason: any) {
  // TODO UI update w/stale
  alert(`Failed: ${reason.data.message}`);
}
