import React, { useState } from "react";
import Page from "../../../layouts/Page";

import { Row, Col, Card, Button, Form } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { BigNumber, ContractTransaction } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { parseEther } from "ethers/lib/utils";
import { useHistory } from "react-router-dom";
import { ConditionalButton } from "../../../components/ConditionalButton";
import { ProductView } from "../../../components/contracts/marketplace/product/ProductView";
import { useIPFS } from "../../../providers/IPFSProvider";
import { permaPinToArweave } from "../../../utils/utils";

export const Manufacture: React.FC = () => {
  const { account, library } = useWeb3React();
  const history = useHistory();
  const contracts = useWorkhardContracts();
  const { ipfs } = useIPFS();

  const [name, setName] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [file, setFile] = useState<File>();
  const [imageURI, setImageURI] = useState<string>();
  const [imageArweaveId, setImageArweaveId] = useState<string>();
  const [metadataURI, setMetadataURI] = useState<string>();
  const [metadataArweaveId, setMetadataArweaveId] = useState<string>();
  const [price, setPrice] = useState<number>(100);
  const [profitRate, setProfitRate] = useState<number>(0);
  const [maxSupply, setMaxSupply] = useState<number>(10);
  const [limitedEdition, setLimitedEdition] = useState<boolean>(false);
  const [uploaded, setUploaded] = useState<boolean>();
  const [uploading, setUploading] = useState<boolean>();
  const [launchTx, setLaunchTx] = useState<ContractTransaction>();
  const [previewURL, setPreviewURL] = useState<string>();

  const uploadImageToIPFS = async (file: File): Promise<string> => {
    if (!ipfs) {
      throw "IPFS is not connected.";
    }
    const result = await ipfs.add(file);
    const cid = result.cid.toString();
    setImageURI(cid);
    const arweaveId = await permaPinToArweave(cid);
    setImageArweaveId(arweaveId);
    return cid;
  };

  const uploadMetadataToIPFS = async (
    name: string,
    description: string,
    image: string
  ): Promise<string> => {
    if (!ipfs) {
      throw "IPFS is not connected.";
    }
    const obj = { name, description, image };
    const result = await ipfs.add(JSON.stringify(obj));
    const cid = result.cid.toString();
    const arweaveId = await permaPinToArweave(cid);
    setMetadataArweaveId(arweaveId);
    return cid;
  };

  function upload() {
    if (name === undefined || description === undefined || file === undefined) {
      alert("Fill out the form.");
      return;
    }
    setUploading(true);
    uploadImageToIPFS(file)
      .then((imageURI) => {
        uploadMetadataToIPFS(name, description, imageURI)
          .then((uri) => {
            setUploaded(true);
            setUploading(undefined);
            setMetadataURI(uri);
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
  }

  function submitTx() {
    if (!contracts) {
      alert("Web3 is not connected.");
      return;
    }
    if (
      metadataURI === undefined ||
      price === undefined ||
      profitRate === undefined
    ) {
      alert("Fill out the form.");
      return;
    }
    let submission: Promise<ContractTransaction>;
    const marketplace = contracts?.marketplace;
    if (!marketplace) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    if (limitedEdition) {
      submission = marketplace
        .connect(signer)
        .manufactureLimitedEdition(
          metadataURI,
          profitRate * 100,
          parseEther(price.toString()),
          maxSupply
        );
    } else {
      submission = marketplace
        .connect(signer)
        .manufacture(
          metadataURI,
          profitRate * 100,
          parseEther(price.toString())
        );
    }
    submission.then((tx) => {
      setLaunchTx(tx);
      tx.wait()
        .then((_receipt) => {
          setLaunchTx(undefined);
          setName(undefined);
          setFile(undefined);
          setDescription(undefined);
          setMetadataURI(undefined);
          setProfitRate(0);
          setPrice(10);
          setMaxSupply(10);
          setLimitedEdition(false);
        })
        .catch((rejected) => {
          setLaunchTx(undefined);
          alert(`rejected: ${rejected}`);
        });
    });
  }

  return (
    <Page>
      <Row>
        <Col md={4}>
          <h1>Product Factory</h1>
        </Col>
        <Col md={{ span: 4, offset: 4 }} style={{ textAlign: "end" }}>
          <Button
            variant="outline-primary"
            onClick={() => history.goBack()}
            children={"Go back"}
          />
        </Col>
      </Row>
      <hr />
      <Row>
        <Col>
          <h4>Launch a product</h4>
          <Card>
            <Card.Body>
              <Form>
                <Form.Group>
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="eg) Workhard Discord Ticket"
                    onChange={({ target: { value } }) => setName(value)}
                    value={name}
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
                        let reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === "string") {
                            setPreviewURL(reader.result);
                          }
                        };
                        reader.readAsDataURL(fileToUpload);
                      }
                    }}
                  />
                  <Form.Text>
                    {imageURI && (
                      <span>
                        Image IPFS CID: {imageURI}
                        <br />
                        Arweave Id: {imageArweaveId}
                      </span>
                    )}
                  </Form.Text>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="eg) You can enter private Discord channels."
                    onChange={({ target: { value } }) => setDescription(value)}
                    value={description}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Price (in $COMMIT)</Form.Label>
                  <Form.Control
                    type="number"
                    onChange={({ target: { value } }) =>
                      setPrice(parseInt(value))
                    }
                    value={price}
                    min={0}
                    max={100000000}
                    step={10}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Profit Rate</Form.Label>
                  <Form.Control
                    type="range"
                    onChange={({ target: { value } }) =>
                      setProfitRate(parseInt(value))
                    }
                    value={profitRate}
                    min={0}
                    max={100}
                    step={1}
                  />
                  <Form.Text>
                    {100 - profitRate}% of the post tax revenue goes to the
                    stable reserve, and {profitRate}% goes to the manufacturer.
                  </Form.Text>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <br />
                  <Form.Check
                    type="radio"
                    onChange={(_) => {
                      setLimitedEdition(false);
                    }}
                    inline
                    checked={!limitedEdition}
                    label={"Basic type"}
                  />
                  <Form.Check
                    type="radio"
                    inline
                    onChange={(_) => {
                      setLimitedEdition(true);
                    }}
                    checked={limitedEdition}
                    label={"Limited Edition"}
                  />
                </Form.Group>
                {limitedEdition && (
                  <Form.Group>
                    <Form.Label>Max Supply</Form.Label>
                    <Form.Control
                      type="number"
                      onChange={({ target: { value } }) =>
                        setMaxSupply(parseInt(value))
                      }
                      value={maxSupply}
                      min={1}
                      step={1}
                    />
                  </Form.Group>
                )}
                {/** TODO: IPFS & NFT */}
                <Form.Text>
                  {metadataURI ? (
                    <span>
                      Metadata IPFS CID: {metadataURI}
                      <br />
                      Arweave Id: {metadataArweaveId}
                    </span>
                  ) : (
                    `You are uploading a file to the decentralized permanent file storage IPFS. Please be aware of that uploading a file is almost irreversible.`
                  )}
                </Form.Text>
                <br />
                <Button variant="primary" onClick={upload}>
                  {uploading
                    ? "Uploading..."
                    : uploaded
                    ? "Upload again"
                    : "Upload"}
                </Button>{" "}
                {uploaded && (
                  <ConditionalButton
                    variant="secondary"
                    onClick={submitTx}
                    enabledWhen={launchTx === undefined}
                    whyDisabled={"Transaction is in pending."}
                    children={launchTx ? "Manufacturing..." : "Manufacture"}
                  />
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <h4>Preview</h4>
          <ProductView
            product={{
              manufacturer: account || "",
              price: parseEther(price.toString()),
              profitRate: BigNumber.from(profitRate),
              totalSupply: BigNumber.from(0),
              maxSupply: limitedEdition
                ? BigNumber.from(maxSupply)
                : BigNumber.from(0),
              uri: metadataURI || "",
            }}
            preview={{
              name: name || "NAME",
              description: description || "Your product description",
              image:
                imageURI ||
                previewURL ||
                "QmUob9cf3KuhESGg1x4cr1SGVxH1Tg5mXxpbhWXX7FrQ4n",
            }}
          />
        </Col>
      </Row>
    </Page>
  );
};
