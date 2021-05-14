import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, BigNumberish, constants } from "ethers";
import { Form } from "react-bootstrap";
import { isAddress } from "@ethersproject/address";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { ERC20Mock__factory } from "@workhard/protocol";
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
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [token, setToken] = useState("");
  const [balance, setBalance] = useState<BigNumber>();
  const [amount, setAmount] = useState("0");
  const [allowance, setAllowance] = useState<BigNumber>();
  const [projectApproved, setProjectApproved] = useState(false);

  useEffect(() => {
    if (!!account && !!contracts) {
      const erc20 = ERC20Mock__factory.connect(token, library); // todo use ERC20__factory instead
      erc20.balanceOf(account).then(setBalance).catch(errorHandler(addToast));
      erc20
        .allowance(account, contracts.jobBoard.address)
        .then(setAllowance)
        .catch(errorHandler(addToast));
      contracts.jobBoard
        .approvedProjects(projId)
        .then(setProjectApproved)
        .catch(errorHandler(addToast));
    }
  }, [account, token, txStatus]);

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    if (!isApproved(allowance, amount)) {
      const erc20 = ERC20Mock__factory.connect(token, library); // todo use ERC20__factory instead
      handleTransaction(
        erc20
          .connect(signer)
          .approve(contracts.jobBoard.address, constants.MaxUint256),
        setTxStatus,
        addToast,
        "Approved JobBoard to use $COMMIT"
      );
      return;
    }
    const jobBoard = contracts?.jobBoard;
    if (!jobBoard) {
      alert("Not connected");
      return;
    }
    const amountInWei = parseEther(amount);
    if (!isAddress(token)) {
      alert("Invalid address");
      return;
    }
    if (amountInWei.gt(balance || 0)) {
      alert("Not enough amount of $COMMIT tokens");
      return;
    }
    const txPromise = projectApproved
      ? jobBoard
          .connect(signer)
          .addAndExecuteBudget(projId, token, amountInWei, "0x")
      : jobBoard.connect(signer).addBudget(projId, token, amountInWei);

    handleTransaction(
      txPromise,
      setTxStatus,
      addToast,
      "Successfully scheduled transaction."
    );
  };
  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Token</Form.Label>
        <Form.Control
          as="select"
          required
          type="text"
          value={token}
          onChange={({ target: { value } }) => setToken(value)}
        >
          {acceptableTokenList.map((t) => (
            <option value={t.address}>{`${t.symbol}: ${t.address}`}</option>
          ))}
        </Form.Control>
      </Form.Group>
      <Form.Group>
        <Form.Label>
          Amount - (balance: {balance ? formatEther(balance.toString()) : "?"})
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
        type="submit"
        enabledWhen={account === budgetOwner ? true : undefined}
        whyDisabled={`Only the project owner can call this function.`}
        children={
          !isApproved(allowance, amount)
            ? projectApproved
              ? "Add and execute"
              : "Add"
            : "Approve token usage"
        }
      />
    </Form>
  );
};
