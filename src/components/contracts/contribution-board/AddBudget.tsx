import React, { useEffect, useState } from "react";
import { BigNumber, BigNumberish, constants } from "ethers";
import { Form } from "react-bootstrap";
import { isAddress } from "@ethersproject/address";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { IERC20__factory } from "@workhard/protocol";
import {
  acceptableTokenList,
  errorHandler,
  handleTransaction,
  isApproved,
  TxStatus,
} from "../../../utils/utils";
import { ConditionalButton } from "../../ConditionalButton";
import { useToasts } from "react-toast-notifications";

export interface AddBudgetProps {
  projId: BigNumberish;
  fund: BigNumberish;
  budgetOwner: string;
}

export const AddBudget: React.FC<AddBudgetProps> = ({
  projId,
  budgetOwner,
}) => {
  const { account, chainId, library } = useWeb3React();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [balance, setBalance] = useState<BigNumber>();
  const [amount, setAmount] = useState("0");
  const [allowance, setAllowance] = useState<BigNumber>();
  const [projectApproved, setProjectApproved] = useState(false);

  useEffect(() => {
    if (!!account && !!workhardCtx) {
      workhardCtx.dao.commit
        .balanceOf(account)
        .then(setBalance)
        .catch(errorHandler(addToast));
      workhardCtx.dao.commit
        .allowance(account, workhardCtx.dao.contributionBoard.address)
        .then(setAllowance)
        .catch(errorHandler(addToast));
      workhardCtx.dao.contributionBoard
        .approvedProjects(projId)
        .then(setProjectApproved)
        .catch(errorHandler(addToast));
    }
  }, [account, workhardCtx, txStatus]);

  const addBudgetWithCommit = () => {
    if (!account || !workhardCtx) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    if (!isApproved(allowance, amount)) {
      handleTransaction(
        workhardCtx.dao.commit
          .connect(signer)
          .approve(
            workhardCtx.dao.contributionBoard.address,
            constants.MaxUint256
          ),
        setTxStatus,
        addToast,
        `Approved ContributionBoard to use ${
          workhardCtx?.metadata.commitSymbol || `$COMMIT`
        }`
      );
      return;
    }
    const contributionBoard = workhardCtx.dao.contributionBoard;
    if (!contributionBoard) {
      alert("Not connected");
      return;
    }
    const amountInWei = parseEther(amount);
    if (amountInWei.gt(balance || 0)) {
      alert(
        `Not enough amount of ${
          workhardCtx?.metadata.commitSymbol || `$COMMIT`
        } tokens`
      );
      return;
    }
    const txPromise = contributionBoard
      .connect(signer)
      .addProjectFund(projId, amountInWei);

    handleTransaction(
      txPromise,
      setTxStatus,
      addToast,
      "Successfully funded project."
    );
  };
  return (
    <Form>
      <Form.Group>
        <Form.Label>
          Amount - (balance:{" "}
          {balance
            ? `${formatEther(balance.toString())} ${
                workhardCtx?.metadata.commitSymbol || `$COMMIT`
              }`
            : "?"}
          )
        </Form.Label>
        <Form.Control
          required
          type="text"
          onChange={({ target: { value } }) => setAmount(value)}
          value={amount}
        />
      </Form.Group>
      <ConditionalButton
        variant="primary"
        enabledWhen={account === budgetOwner ? true : undefined}
        whyDisabled={`Only the project owner can call this function.`}
        onClick={addBudgetWithCommit}
        children={
          isApproved(allowance, amount)
            ? projectApproved
              ? "Add and execute"
              : "Add"
            : "Approve token usage"
        }
      />
    </Form>
  );
};
