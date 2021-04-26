import { useState, FormEventHandler, useEffect } from "react";
import { Card, Button, Form } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { parseLog } from "../../../utils/utils";
import { ContractTransaction } from "@ethersproject/contracts";
import { ConditionalButton } from "../../ConditionalButton";

export const PostAJobBox: React.FC = () => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();

  const [description, setDescription] = useState<string>();
  const [title, setTitle] = useState<string>();
  const [lastTx, setLastTx] = useState<ContractTransaction>();
  // const [uri, setURI] = useState<string | undefined>(); // TODO

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const cryptoJobBoard = contracts?.cryptoJobBoard;
    if (!cryptoJobBoard) {
      alert("Not connected");
      return;
    }
    if (!title) {
      alert("Title is empty.");
      return;
    }
    if (!description) {
      alert("Description is empty.");
      return;
    }
    const signer = library.getSigner(account);
    cryptoJobBoard
      .connect(signer)
      .createProject(title, description, "")
      .then((tx) => {
        setLastTx(tx);
      })
      .catch((e) => alert(`tx response error ${e.message}`));
  };

  useEffect(() => {
    if (contracts && lastTx) {
      lastTx
        .wait()
        .then((receipt) => {
          const parsed = parseLog(
            contracts.cryptoJobBoard,
            receipt.logs,
            "ProjectPosted(uint256)"
          );
          const log = parsed[0];
          alert(`You created a new project. The NFT id is ${log.args.projId}`);
          setLastTx(undefined);
          setTitle("");
          setDescription("");
        })
        .catch((rejected) => {
          alert(`rejected: ${rejected}`);
        });
    }
  }, [contracts, lastTx]);

  return (
    <Card>
      <Card.Header as="h5">Post a crypto job</Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="NewProjectTitle">
            <Form.Label>Project title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Workhard Core Dev"
              onChange={({ target: { value } }) => setTitle(value)}
              value={title}
            />
          </Form.Group>
          <Form.Group controlId="NewProjectTitle">
            <Form.Label>Description</Form.Label>
            <Form.Control
              type="text"
              placeholder="eg) https://hackmd.io/samplejobpost"
              onChange={({ target: { value } }) => setDescription(value)}
              value={description}
            />
          </Form.Group>
          {/** TODO: IPFS & NFT */}
          <ConditionalButton
            variant="primary"
            type="submit"
            enabledWhen={lastTx === undefined}
            whyDisabled={"Submitted transaction is in pending"}
            children={lastTx ? "Pending" : "Submit"}
          />
        </Form>
      </Card.Body>
    </Card>
  );
};
