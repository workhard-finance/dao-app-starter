import { useState, FormEventHandler, useEffect } from "react";
import { Card, Button, Form } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { parseLog, permaPinToArweave } from "../../../utils/utils";
import { ContractTransaction } from "@ethersproject/contracts";
import { ConditionalButton } from "../../ConditionalButton";
import { useIPFS } from "../../../providers/IPFSProvider";

export const PostAJobBox: React.FC = () => {
  const { account, library } = useWeb3React();
  const { ipfs } = useIPFS();
  const contracts = useWorkhardContracts();

  const [description, setDescription] = useState<string>();
  const [file, setFile] = useState<File>();
  const [title, setTitle] = useState<string>();
  const [lastTx, setLastTx] = useState<ContractTransaction>();
  const [url, setURL] = useState<string | undefined>(); // TODO
  const [uri, setURI] = useState<string>(); // TODO
  const [uploaded, setUploaded] = useState<boolean>();
  const [uploading, setUploading] = useState<boolean>();

  const uploadImageToIPFS = async (file: File): Promise<string> => {
    if (!ipfs) {
      throw "IPFS is not connected.";
    }
    const result = await ipfs.add(file);
    await permaPinToArweave(result.cid.toString());
    return result.cid.toString();
  };

  const uploadMetadataToIPFS = async (
    name: string,
    description: string,
    image: string,
    url?: string
  ): Promise<string> => {
    if (!ipfs) {
      throw "IPFS is not connected.";
    }
    const obj = url
      ? {
          name,
          description,
          image,
          url,
        }
      : { name, description, image };
    const result = await ipfs.add(JSON.stringify(obj));
    await permaPinToArweave(result.cid.toString());
    return result.cid.toString();
  };

  const post = async () => {
    if (!title || !description || !file) {
      alert("Fill out the form.");
      return;
    }
    setUploading(true);
    uploadImageToIPFS(file)
      .then((imageURI) => {
        console.log("hi");
        uploadMetadataToIPFS(title, description, imageURI, url)
          .then((uri) => {
            console.log("hello");
            setUploaded(true);
            setUploading(undefined);
            setURI(uri);
            createProject(uri);
          })
          .catch((_) => {
            setUploaded(false);
            setUploading(undefined);
          });
      })
      .catch((_) => {
        setUploaded(false);
        setUploading(undefined);
      });
  };

  const createProject = async (uri: string) => {
    const jobBoard = contracts?.jobBoard;
    if (!jobBoard) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    jobBoard
      .connect(signer)
      .createProject(uri)
      .then((tx) => {
        setLastTx(tx);
        tx.wait()
          .then((receipt) => {
            const parsed = parseLog(
              jobBoard,
              receipt.logs,
              "ProjectPosted(uint256)"
            );
            const log = parsed[0];
            alert(
              `You created a new project. The NFT id is ${log.args.projId}`
            );
            setLastTx(undefined);
            setTitle("");
            setURL("");
            setDescription("");
            setFile(undefined);
          })
          .catch((rejected) => {
            setLastTx(undefined);
            alert(`rejected: ${rejected}`);
          });
      })
      .catch((e) => alert(`tx response error ${e.message}`));
  };

  return (
    <Card>
      <Card.Header as="h5">Post a crypto job</Card.Header>
      <Card.Body>
        <Form>
          <Form.Group>
            <Form.Label>Project title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Workhard Core Dev"
              onChange={({ target: { value } }) => setTitle(value)}
              value={title}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              type="text"
              as="textarea"
              placeholder="describe the job here."
              onChange={({ target: { value } }) => setDescription(value)}
              value={description}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>URL(optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="eg) https://hackmd.io/samplejobpost"
              onChange={({ target: { value } }) => setURL(value)}
              value={url}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Image</Form.Label>
            <Form.File
              onChange={(e: { target: HTMLInputElement }) => {
                if (!ipfs) {
                  alert("IPFS client is not set");
                } else if (e.target.files) {
                  const [fileToUpload] = e.target.files;
                  setFile(fileToUpload);
                }
              }}
            />
          </Form.Group>
          <Form.Text>{uri && `URI: ${uri}`}</Form.Text>
          <br />
          {/** TODO: IPFS & NFT */}
          <ConditionalButton
            variant="primary"
            onClick={post}
            enabledWhen={lastTx === undefined && !uploading}
            whyDisabled={
              uploading
                ? "Uploading Metadata to IPFS"
                : "Submitted transaction is in pending"
            }
            children={
              lastTx
                ? "Pending"
                : uploading
                ? "Uploading..."
                : uploaded
                ? "Submit"
                : "Upload"
            }
          />
        </Form>
      </Card.Body>
    </Card>
  );
};
