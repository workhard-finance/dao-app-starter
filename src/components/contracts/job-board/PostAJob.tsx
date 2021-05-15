import { useState } from "react";
import { Card, Form } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import {
  parseLog,
  permaPinToArweave,
  TxStatus,
  handleTransaction,
} from "../../../utils/utils";
import { ConditionalButton } from "../../ConditionalButton";
import { useIPFS } from "../../../providers/IPFSProvider";
import { useToasts } from "react-toast-notifications";

export const PostAJobBox: React.FC = () => {
  const { account, library } = useWeb3React();
  const { ipfs } = useIPFS();
  const contracts = useWorkhardContracts();
  const { addToast } = useToasts();

  const [description, setDescription] = useState<string>();
  const [file, setFile] = useState<File>();
  const [title, setTitle] = useState<string>();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [url, setURL] = useState<string | undefined>(); // TODO
  const [uri, setURI] = useState<string>(); // TODO
  const [uploaded, setUploaded] = useState<boolean>();
  const [uploading, setUploading] = useState<boolean>();

  const uploadImageToIPFS = async (file: File): Promise<string> => {
    if (!ipfs) {
      throw "IPFS is not connected.";
    }
    const result = await ipfs.add(file);
    const cid = result.cid.toString();
    await permaPinToArweave(cid);
    return cid;
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
    const cid = result.cid.toString();
    await permaPinToArweave(cid);
    return cid;
  };

  const post = async () => {
    if (!title || !description || !file) {
      alert("Fill out the form.");
      return;
    }
    setUploading(true);
    uploadImageToIPFS(file)
      .then((imageURI) => {
        uploadMetadataToIPFS(title, description, imageURI, url)
          .then((uri) => {
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
    handleTransaction(
      jobBoard.connect(signer).createProject(uri),
      setTxStatus,
      addToast,
      "Posted a new job",
      (receipt) => {
        const parsed = parseLog(
          jobBoard,
          receipt.logs,
          "ProjectPosted(uint256)"
        );
        const log = parsed[0];
        alert(`You created a new project. The NFT id is ${log.args.projId}`);
        setTxStatus(undefined);
        setTitle("");
        setURL("");
        setDescription("");
        setFile(undefined);
      }
    );
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
            enabledWhen={txStatus === undefined && !uploading}
            whyDisabled={
              uploading
                ? "Uploading Metadata to IPFS"
                : "Submitted transaction is in pending"
            }
            children={
              txStatus
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
