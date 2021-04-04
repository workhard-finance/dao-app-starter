import { useState, FormEventHandler } from "react";
import { Card, Button, Form } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { parseLog } from "../../../utils/utils";

export const PostAJobBox: React.FC = () => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();

  const [description, setDescription] = useState<string | undefined>();
  const [title, setTitle] = useState<string | undefined>();
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
        tx.wait()
          .then((receipt) => {
            const parsed = parseLog(
              cryptoJobBoard,
              receipt.logs,
              "ProjectPosted(uint256)"
            );
            const log = parsed[0];
            alert(
              `You created a new project. The NFT id is ${log.args.projId}`
            );
          })
          .catch((rejected) => {
            alert(`rejected: ${rejected}`);
          });
      })
      .catch((e) => alert(`tx repsonse error ${e.message}`));
  };

  return (
    <Card>
      <Card.Header as="h5">Post a crypto job</Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="NewProjectTitle">
            <Form.Label>Project title</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="Workhard Core Dev"
              onChange={({ target: { value } }) => setTitle(value)}
              value={title}
            />
          </Form.Group>
          <Form.Group controlId="NewProjectTitle">
            <Form.Label>Description</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="eg) https://hackmd.io/samplejobpost"
              onChange={({ target: { value } }) => setDescription(value)}
              value={description}
            />
          </Form.Group>
          {/** TODO: IPFS & NFT */}
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};
