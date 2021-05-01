import React, { useEffect, useState } from "react";
import Page from "../layouts/Page";

import { Row, Col, Tab, Nav, Card, Button, Form } from "react-bootstrap";
import ReactHtmlParser from "react-html-parser";
import { useWorkhardContracts } from "../providers/WorkhardContractProvider";
import { BigNumber, ContractTransaction } from "ethers";
import { useParams } from "react-router";
import { useWeb3React } from "@web3-react/core";
import { getAddress, parseEther } from "ethers/lib/utils";
import { useHistory } from "react-router-dom";
import { wrapUrl } from "../utils/utils";
import { ExecuteBudget } from "../components/contracts/crypto-job-board/ExecuteBudget";
import { ConditionalButton } from "../components/ConditionalButton";
import { ProductView } from "../components/contracts/product/ProductView";
import { useIPFS } from "../providers/IPFSProvider";

const Manufacture: React.FC = () => {
  const { account, library, chainId } = useWeb3React();
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
          setBaseURI(baseURIResult.cid.toString());
          setDescriptionURI(descResult.cid.toString());
          setUploaded(true);
          setUploading(undefined);
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
      name == undefined ||
      symbol == undefined ||
      baseURI == undefined ||
      descriptionURI == undefined ||
      price == undefined ||
      profitRate == undefined ||
      initialSupply == undefined
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
                <Form.Group controlId="name">
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="eg) Workhard Discord Ticket"
                    onChange={({ target: { value } }) => setName(value)}
                    value={name}
                  />
                </Form.Group>
                <Form.Group controlId="symbol">
                  <Form.Label>Product Symbol</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="eg) WDT"
                    onChange={({ target: { value } }) => setSymbol(value)}
                    value={symbol}
                  />
                </Form.Group>
                <Form.Group controlId="uri">
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
                <Form.Group controlId="name">
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
                <Form.Group controlId="price">
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
                <Form.Group controlId="profit-rate">
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
                    commitment fund, and {profitRate}% goes to the manufacturer.
                  </Form.Text>
                </Form.Group>
                <Form.Group controlId="initial-supply">
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
            address={"TBD"}
            manufacturer={account || ""}
            name={name || "Your token name"}
            symbol={symbol || "SYM"}
            description={
              descriptionURI ||
              description ||
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
            }
            sold={BigNumber.from(0)}
            price={BigNumber.from(price)}
            profitRate={BigNumber.from(profitRate)}
            stock={BigNumber.from(initialSupply)}
            uri={baseURI || "QmNmA284uLXBPHtRrdBLwFq6D6jpqKjbj26qCRuD25C6DC"}
            maxSupply={
              limitedEdition ? BigNumber.from(initialSupply) : BigNumber.from(0)
            }
          />
        </Col>
      </Row>
    </Page>
  );
};

export default Manufacture;
