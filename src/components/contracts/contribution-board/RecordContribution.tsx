import React, { FormEventHandler, useState } from "react";
import { BigNumberish } from "ethers";
import { Form, FormControl, FormLabel } from "react-bootstrap";
import { isAddress } from "@ethersproject/address";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";
import { handleTransaction, TxStatus } from "../../../utils/utils";
import { useToasts } from "react-toast-notifications";

export interface RecordContributionProps {
  projId: BigNumberish;
  budgetOwner: string;
}

export const RecordContribution: React.FC<RecordContributionProps> = ({
  projId,
  budgetOwner,
}) => {
  const { account, library } = useWeb3React();
  const { dao } = useWorkhard() || {};
  const { addToast } = useToasts();
  const [contributor, setContributor] = useState("");
  const [contributionAmount, setContributionAmount] = useState<number>();
  const [txStatus, setTxStatus] = useState<TxStatus>();

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const contributionBoard = dao?.contributionBoard;
    if (!contributionBoard) {
      alert("Not connected");
      return;
    }
    const contributionAmountInWei = parseEther(
      contributionAmount?.toString() || "0"
    );
    if (!isAddress(contributor)) {
      alert("Invalid address");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      contributionBoard
        .connect(signer)
        .recordContribution(contributor, projId, contributionAmountInWei),
      setTxStatus,
      addToast,
      "Record contribution complete!"
    );
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <FormLabel>Contributor address</FormLabel>
        <FormControl
          placeholder="0xABCDEF0123456789ABCDEF0123456789ABCDEF"
          value={contributor}
          onChange={(event) => setContributor(event.target.value)}
        />
      </Form.Group>
      <Form.Group>
        <FormLabel>Amount</FormLabel>
        <FormControl
          placeholder="3214.23"
          type="number"
          value={contributionAmount}
          onChange={(event) =>
            setContributionAmount(parseFloat(event.target.value))
          }
        />
      </Form.Group>
      <ConditionalButton
        variant="primary"
        type="submit"
        enabledWhen={account === budgetOwner ? true : undefined}
        whyDisabled={`Only budget owner can call this function.`}
        children={`Record contribution`}
      />
    </Form>
  );
};
