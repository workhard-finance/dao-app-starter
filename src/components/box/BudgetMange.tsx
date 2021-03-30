import { useState } from "react";
import { BigNumberish } from "ethers";
import {
  Card,
  Button,
  Form,
  FormControl,
  FormLabel,
  InputGroup,
} from "react-bootstrap";
import { isAddress } from "@ethersproject/address";
import { useWorkhardContracts } from "../../providers/WorkhardContractProvider";
import { parseEther } from "ethers/lib/utils";

export interface ProjectProps {
  projId: BigNumberish;
  fund: BigNumberish;
}

export const BudgetManage: React.FC<ProjectProps> = ({ projId, fund }) => {
  const contracts = useWorkhardContracts();

  const [payTo, setPayTo] = useState("");
  const [payAmount, setPayAmount] = useState("0");
  const pay = () => {
    const payAmountInWei = parseEther(payAmount);
    if (!isAddress(payTo)) {
      alert("Invalid address");
      return;
    }
    if (payAmountInWei.gt(fund)) {
      alert("Not enough amount of $COMMITMENT tokens");
      return;
    }
    if (!contracts) {
      alert("Contract is not ready.");
      return;
    }
    contracts.cryptoJobBoard
      .compensate(projId, payTo, payAmountInWei)
      .then((onFulfilled) => {
        // TODO wait spinner
        // TODO UI update w/stale
        alert(`${onFulfilled.hash} submitted.`)
      })
      .catch((reason) => {
        // TODO UI update w/stale
        alert(`Failed: ${reason}`)
      });
  };
  return (
    <Form onSubmit={pay}>
      <Form.Group controlId="compensate">
        <Card.Title>Pay wages</Card.Title>
        {/* <Form.Label>Lock</Form.Label> */}
        <FormLabel>Contributor address</FormLabel>
        <InputGroup className="mb-2">
          <FormControl
            id="inlineFormInputGroup"
            placeholder="0xABCDEF0123456789ABCDEF0123456789ABCDEF"
            value={payTo}
            onChange={(event) => setPayTo(event.target.value)}
          />
        </InputGroup>
        <FormLabel>Amount</FormLabel>
        <InputGroup className="mb-2">
          <FormControl
            id="inlineFormInputGroup"
            placeholder="3214.23"
            value={payAmount}
            onChange={(event) => setPayAmount(event.target.value)}
          />
        </InputGroup>
      </Form.Group>
      <Button variant="primary" type="submit">
        Pay
      </Button>
    </Form>
  );
};
