import React, { FormEventHandler, useEffect, useState } from "react";
import { BigNumber, BigNumberish, constants } from "ethers";
import {
  Card,
  Button,
  Form,
  FormControl,
  FormLabel,
  InputGroup,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import { isAddress } from "@ethersproject/address";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import devDeploy from "@workhard/protocol/deployed.dev.json";
import { ERC20Mock__factory } from "@workhard/protocol";

export interface AddBudgetProps {
  projId: BigNumberish;
  fund: BigNumberish;
  budgetOwner: string;
}

const acceptableTokenList = [
  {
    symbol: "DAI",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  {
    symbol: "BASECURRENCY-TEST",
    address: devDeploy.localhost.BaseCurrency,
  },
];

export const AddBudget: React.FC<AddBudgetProps> = ({
  projId,
  budgetOwner,
}) => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  const [token, setToken] = useState("");
  const [balance, setBalance] = useState<BigNumber>();
  const [amount, setAmount] = useState("0");
  const [tokenAllowance, setTokenAllowance] = useState<BigNumber>();
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const erc20 = ERC20Mock__factory.connect(token, library); // todo use ERC20__factory instead
      erc20
        .balanceOf(account)
        .then((bal) => {
          if (!stale) setBalance(bal);
        })
        .catch(() => {
          if (!stale) setBalance(undefined);
        });
      erc20
        .allowance(account, contracts.cryptoJobBoard.address)
        .then((allowance) => {
          if (!stale) {
            setTokenAllowance(allowance);
            console.log('allowed', allowance)
            if (allowance.gt(amount || 0)) setApproved(true);
            else setApproved(false);
          }
        })
        .catch(() => {
          if (!stale) setTokenAllowance(undefined);
        });
      return () => {
        stale = true;
        setBalance(undefined);
        setTokenAllowance(undefined);
      };
    }
  }, [account, token]);

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    if (!approved) {
      const erc20 = ERC20Mock__factory.connect(token, library); // todo use ERC20__factory instead
      erc20
        .connect(signer)
        .approve(contracts.cryptoJobBoard.address, constants.MaxUint256)
        .then((tx) => {
          tx.wait()
            .then((_) => {
              setTokenAllowance(constants.MaxUint256);
              setApproved(true);
            })
            .catch((rejected) => alert(`Rejected with ${rejected}`));
        })
        .catch(() => {
          setBalance(undefined);
        });
      return;
    }
    const cryptoJobBoard = contracts?.cryptoJobBoard;
    if (!cryptoJobBoard) {
      alert("Not connected");
      return;
    }
    const amountInWei = parseEther(amount);
    if (!isAddress(token)) {
      alert("Invalid address");
      return;
    }
    if (amountInWei.gt(balance || 0)) {
      alert("Not enough amount of $COMMITMENT tokens");
      return;
    }
    console.log(projId);
    console.log(token);
    console.log(amountInWei);
    cryptoJobBoard
      .connect(signer)
      .addBudget(projId, token, amountInWei)
      .then((tx) => {
        tx.wait()
          .then((receipt) => {
            alert(`${receipt.transactionHash} submitted.`);
          })
          .catch((rejected) => {
            alert(`Rejected: ${rejected}.`);
          });
        // TODO wait spinner
        // TODO UI update w/stale
      })
      .catch((reason) => {
        // TODO UI update w/stale
        alert(`Failed: ${reason}`);
      });
  };
  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="add-budget-token">
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
      <Form.Group controlId="add-budget-amount">
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

      <OverlayTrigger
        show={account === budgetOwner ? false : undefined}
        overlay={
          <Tooltip id={`tooltip-budgetowner`}>
            Only the project owner can call this function.
          </Tooltip>
        }
      >
        <Button
          variant="primary"
          type="submit"
          disabled={account !== budgetOwner}
        >
          {approved ? "Add" : "Approve token usage"}
        </Button>
      </OverlayTrigger>
    </Form>
  );
};
