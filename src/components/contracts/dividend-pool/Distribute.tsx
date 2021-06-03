import React, { useEffect, useState } from "react";
import { BigNumber, BigNumberish, constants } from "ethers";
import { Button, Card, Form } from "react-bootstrap";
import { isAddress } from "@ethersproject/address";
import { useWorkhard, WorkhardCtx } from "../../../providers/WorkhardProvider";
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

export const Distribute: React.FC = () => {
  const { account, chainId, library } = useWeb3React();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [acceptableTokens, setAcceptableTokens] = useState<
    { symbol: string; address: string }[]
  >();
  const [token, setToken] = useState<string>();
  const [custom, setCustom] = useState<boolean>(false);
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
    const { dao } = workhardCtx || {};
    if (!!account && !!dao && !!token && isAddress(token)) {
      const erc20 = IERC20__factory.connect(token, library);
      erc20.balanceOf(account).then(setBalance).catch(errorHandler(addToast));
      erc20
        .allowance(account, dao.dividendPool.address)
        .then(setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, token, txStatus]);

  const distribute = () => {
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
          .approve(workhardCtx.dao.dividendPool.address, constants.MaxUint256),
        setTxStatus,
        addToast,
        "Approved DividendPool"
      );
      return;
    }
    const amountInWei = parseEther(amount);
    if (!isAddress(token)) {
      alert("Invalid address");
      return;
    }
    if (amountInWei.gt(balance || 0)) {
      alert(`Not enough amount of ${workhardCtx.metadata.commitSymbol} tokens`);
      return;
    }

    handleTransaction(
      workhardCtx.dao.dividendPool
        .connect(signer)
        .distribute(token, amountInWei),
      setTxStatus,
      addToast,
      "Successfully scheduled transaction."
    );
  };
  return (
    <Card>
      <Card.Body>
        <Form>
          <Form.Group>
            <Form.Label>Token to distribute</Form.Label>
            <Form.Control
              as="select"
              required
              type="text"
              value={custom ? "custom" : token}
              onChange={({ target: { value } }) => {
                if (value === "custom") {
                  setCustom(true);
                  setToken(undefined);
                } else {
                  setCustom(false);
                  setToken(value);
                }
              }}
            >
              {acceptableTokens?.map((t) => (
                <option value={t.address}>{`${t.symbol}: ${t.address}`}</option>
              ))}
              <option value={"custom"}>Custom</option>
            </Form.Control>
          </Form.Group>
          {custom && (
            <Form.Group>
              <Form.Label>Custom Token Address</Form.Label>
              <Form.Control
                required
                type="text"
                onChange={({ target: { value } }) => setToken(value)}
                value={token}
              />
            </Form.Group>
          )}
          <Form.Group>
            <Form.Label>
              Amount - (balance:{" "}
              {balance ? formatEther(balance.toString()) : "?"})
            </Form.Label>
            <Form.Control
              required
              type="text"
              onChange={({ target: { value } }) => setAmount(value)}
              value={amount}
            />
          </Form.Group>
          <ConditionalButton
            onClick={distribute}
            enabledWhen={isAddress(token || "")}
            whyDisabled="Not a valid token address"
            children={
              isApproved(allowance, amount)
                ? "Distribute"
                : "Approve token usage"
            }
          />
        </Form>
      </Card.Body>
    </Card>
  );
};
