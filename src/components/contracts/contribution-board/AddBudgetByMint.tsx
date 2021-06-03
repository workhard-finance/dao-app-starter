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

export interface AddBudgetByMintProps {
  projId: BigNumberish;
  fund: BigNumberish;
  budgetOwner: string;
}

export const AddBudgetByMint: React.FC<AddBudgetByMintProps> = ({
  projId,
  budgetOwner,
}) => {
  const { account, chainId, library } = useWeb3React();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [acceptableTokens, setAcceptableTokens] = useState<
    { symbol: string; address: string }[]
  >();
  const [token, setToken] = useState<string>();
  const [balance, setBalance] = useState<BigNumber>();
  const [amount, setAmount] = useState("0");
  const [allowance, setAllowance] = useState<BigNumber>();
  const [projectApproved, setProjectApproved] = useState(false);

  useEffect(() => {
    const list = acceptableTokenList(chainId);
    setAcceptableTokens(list);
    if (!token && list[0]) {
      setToken(list[0].address);
    }
  }, [chainId]);

  useEffect(() => {
    if (!!account && !!workhardCtx && !!token) {
      const erc20 = IERC20__factory.connect(token, library);
      erc20.balanceOf(account).then(setBalance).catch(errorHandler(addToast));
      erc20
        .allowance(account, workhardCtx.dao.contributionBoard.address)
        .then(setAllowance)
        .catch(errorHandler(addToast));
      workhardCtx.dao.contributionBoard
        .approvedProjects(projId)
        .then(setProjectApproved)
        .catch(errorHandler(addToast));
    }
  }, [account, token, txStatus]);

  const addBudget = () => {
    if (!account || !workhardCtx) {
      alert("Not connected");
      return;
    } else if (!token) {
      alert("Token is not selected");
      return;
    }
    const signer = library.getSigner(account);
    if (!isApproved(allowance, amount)) {
      const erc20 = IERC20__factory.connect(token, library); // todo use ERC20__factory instead
      handleTransaction(
        erc20
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
    if (!isAddress(token)) {
      alert("Invalid address");
      return;
    }
    if (amountInWei.gt(balance || 0)) {
      alert(
        `Not enough amount of ${
          workhardCtx?.metadata.commitSymbol || `$COMMIT`
        } tokens`
      );
      return;
    }
    const txPromise = projectApproved
      ? contributionBoard
          .connect(signer)
          .addAndExecuteBudget(projId, token, amountInWei)
      : contributionBoard.connect(signer).addBudget(projId, token, amountInWei);

    handleTransaction(
      txPromise,
      setTxStatus,
      addToast,
      "Successfully scheduled transaction."
    );
  };
  return (
    <Form>
      <Form.Group>
        <Form.Label>Token</Form.Label>
        <Form.Control
          as="select"
          required
          type="text"
          value={token}
          onChange={({ target: { value } }) => setToken(value)}
        >
          {acceptableTokens?.map((t) => (
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
        enabledWhen={account === budgetOwner ? true : undefined}
        whyDisabled={`Only the project owner can call this function.`}
        onClick={addBudget}
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
