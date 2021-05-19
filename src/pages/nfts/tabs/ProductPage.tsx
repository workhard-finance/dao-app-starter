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

export const ProductPage: React.FC = () => {
  const { account, library } = useWeb3React();
  const history = useHistory();
  const contracts = useWorkhardContracts();
  const { ipfs } = useIPFS();

  const [description, setDescription] = useState<string>();
  const [file, setFile] = useState<File>();
  const [descriptionURI, setDescriptionURI] = useState<string>();
  const [baseURI, setBaseURI] = useState<string>();
  const [price, setPrice] = useState<number>(100);
  const [profitRate, setProfitRate] = useState<number>(0);
  const [initialSupply, setInitialSupply] = useState<number>(10);
  const [limitedEdition, setLimitedEdition] = useState<boolean>(false);
  const [name, setName] = useState<string>();
  const [symbol, setSymbol] = useState<string>();
  const [uploaded, setUploaded] = useState<boolean>();
  const [uploading, setUploading] = useState<boolean>();
  const [launchTx, setLaunchTx] = useState<ContractTransaction>();

  function upload() {
    if (!ipfs) {
      alert("IPFS is not connected.");
      return;
    }
    if (file && description) {
      setUploading(true);
      Promise.all([ipfs.add(file), ipfs.add({ content: description })]).then(
        ([baseURIResult, descResult]) => {
          alert(`Successfully uploaded to the decentralized file storage.`);
          const _baseURI = baseURIResult.cid.toString();
          const _descURI = descResult.cid.toString();
          setBaseURI(_baseURI);
          setDescriptionURI(_descURI);
          const permaPin = window.confirm(
            "We recommend you store the data permanently on Arweave too. Shall we do that?"
          );
          if (permaPin) {
            Promise.all([
              fetch(`https://ipfs2arweave.com/permapin/${_baseURI}`),
              fetch(`https://ipfs2arweave.com/permapin/${_descURI}`),
            ]).then(([res1, res2]) => {
              if (res1.ok && res2.ok) {
                Promise.all([res1.json(), res2.json()]).then(
                  ([baseURIArweaveResult, descArweaveResult]) => {
                    alert(
                      `Successfully stored them permanently. The arweave ids for baseURI & description are: ${baseURIArweaveResult.arweaveId} & ${descArweaveResult.arweaveId}`
                    );
                    setUploaded(true);
                    setUploading(undefined);
                  }
                );
              } else {
                alert(
                  "Failed to store them permanently. Please consider to Pinnata by yourself or get in touch with the team via Discord."
                );
                res1.json().then(console.error);
                res2.json().then(console.error);
                setUploaded(false);
                setUploading(undefined);
              }
            });
          } else {
            setUploaded(true);
            setUploading(undefined);
          }
        }
      );
    } else {
      alert("Select file & write description.");
    }
  }

  function launch() {
    if (!contracts) {
      alert("Web3 is not connected.");
      return;
    }
    if (
      name === undefined ||
      symbol === undefined ||
      baseURI === undefined ||
      descriptionURI === undefined ||
      price === undefined ||
      profitRate === undefined ||
      initialSupply === undefined
    ) {
      alert("Fill out the form.");
      return;
    }
    let submission: Promise<ContractTransaction>;
    const signer = library.getSigner(account);
    if (limitedEdition) {
      submission = contracts.marketplace
        .connect(signer)
        .launchNewProductWithMaxSupply(
          name,
          symbol,
          baseURI,
          descriptionURI,
          profitRate * 100,
          parseEther(price.toString()),
          initialSupply,
          initialSupply
        );
    } else {
      submission = contracts.marketplace
        .connect(signer)
        .launchNewProduct(
          name,
          symbol,
          baseURI,
          descriptionURI,
          profitRate * 100,
          parseEther(price.toString()),
          initialSupply
        );
    }
    submission.then((tx) => {
      setLaunchTx(tx);
      tx.wait()
        .then((_receipt) => {
          setLaunchTx(undefined);
          setName(undefined);
          setSymbol(undefined);
          setFile(undefined);
          setBaseURI(undefined);
          setDescription(undefined);
          setDescriptionURI(undefined);
          setProfitRate(0);
          setPrice(10);
          setInitialSupply(10);
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
        <Col md={8}>
          <h1>Manage your product</h1>
        </Col>
        <Col md={{ span: 4 }} style={{ textAlign: "end" }}>
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
          <h4>Engrave</h4>
          <Card>
            <Card.Body>
              <Form>
                <Form.Group>
                  <Form.Label>Product ID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="eg) Workhard Discord Ticket"
                    onChange={({ target: { value } }) => setName(value)}
                    value={name}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Product Symbol</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="eg) WDT"
                    onChange={({ target: { value } }) => setSymbol(value)}
                    value={symbol}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>URI</Form.Label>
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
                  <Form.Text></Form.Text>
                  <Form.Text>
                    {baseURI
                      ? `IPFS cid: ${baseURI}`
                      : `You are uploading a file to the decentralized permanent file storage IPFS. Please be aware of that uploading a file is almost irreversible.`}
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
                  <Form.Text>
                    {descriptionURI
                      ? `IPFS cid: ${descriptionURI}`
                      : `You are uploading a file to the decentralized permanent file storage IPFS. Please be aware of that uploading a file is almost irreversible.`}
                  </Form.Text>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Price</Form.Label>
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
                  <Form.Label>Initial Supply</Form.Label>
                  <Form.Control
                    type="number"
                    onChange={({ target: { value } }) =>
                      setInitialSupply(parseInt(value))
                    }
                    value={initialSupply}
                    min={1}
                    step={1}
                  />
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
                {/** TODO: IPFS & NFT */}
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
                    onClick={launch}
                    enabledWhen={launchTx === undefined}
                    whyDisabled={"Transaction is in pending."}
                    children={launchTx ? "Manufacturing..." : "ProductPage"}
                  />
                )}
              </Form>
            </Card.Body>
          </Card>
          <br />
          <h4>Set Max Supply</h4>
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
                  <Form.Label>Product Symbol</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="eg) WDT"
                    onChange={({ target: { value } }) => setSymbol(value)}
                    value={symbol}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>URI</Form.Label>
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
                  <Form.Text></Form.Text>
                  <Form.Text>
                    {baseURI
                      ? `IPFS cid: ${baseURI}`
                      : `You are uploading a file to the decentralized permanent file storage IPFS. Please be aware of that uploading a file is almost irreversible.`}
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
                  <Form.Text>
                    {descriptionURI
                      ? `IPFS cid: ${descriptionURI}`
                      : `You are uploading a file to the decentralized permanent file storage IPFS. Please be aware of that uploading a file is almost irreversible.`}
                  </Form.Text>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Price</Form.Label>
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
                  <Form.Label>Initial Supply</Form.Label>
                  <Form.Control
                    type="number"
                    onChange={({ target: { value } }) =>
                      setInitialSupply(parseInt(value))
                    }
                    value={initialSupply}
                    min={1}
                    step={1}
                  />
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
                {/** TODO: IPFS & NFT */}
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
                    onClick={launch}
                    enabledWhen={launchTx === undefined}
                    whyDisabled={"Transaction is in pending."}
                    children={launchTx ? "Manufacturing..." : "ProductPage"}
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
              totalSupply: BigNumber.from(0),
              price: BigNumber.from(price),
              profitRate: BigNumber.from(profitRate),
              maxSupply: limitedEdition
                ? BigNumber.from(initialSupply)
                : BigNumber.from(0),
              uri: "",
            }}
            preview={{
              name: name || "Your token name",
              description:
                descriptionURI ||
                description ||
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
              image: "QmNmA284uLXBPHtRrdBLwFq6D6jpqKjbj26qCRuD25C6DC",
            }}
          />
        </Col>
      </Row>
    </Page>
  );
};
