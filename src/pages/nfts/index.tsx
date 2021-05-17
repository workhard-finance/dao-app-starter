import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Alert, Button, Col, Row, Tab, Tabs, Image } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../../providers/BlockNumberProvider";
import { useWorkhardContracts } from "../../providers/WorkhardContractProvider";
import { BigNumber, providers } from "ethers";
import { Link } from "react-router-dom";
import { Product } from "../../components/contracts/marketplace/product/Product";

const featured: BigNumber[] = [];
const Store: React.FC = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [allProducts, setAllProducts] = useState<BigNumber[]>([]);
  // const [page, setPage] = useState(0);
  // const [projIdToVote, setProjIdToVote] = useState();
  const [fetchedBlock, setFetchedBlock] = useState<number>(0);
  const [timestamp, setTimestamp] = useState<number>(0);

  useEffect(() => {
    if (!library || !contracts || !blockNumber) {
      return;
    }
    const { marketplace } = contracts;
    marketplace
      .queryFilter(
        marketplace.filters.NewProduct(null, null, null),
        fetchedBlock + 1,
        blockNumber
      )
      .then((events) => {
        if (blockNumber) setFetchedBlock(blockNumber);
        setAllProducts([
          ...allProducts,
          ...events.map((event) => event.args.id),
        ]);
      });
    library
      .getBlock(blockNumber)
      .then((block) => setTimestamp(block.timestamp));
  }, [contracts, blockNumber]);

  useEffect(() => {
    if (!library || !contracts || !blockNumber) {
      return;
    }
    const { marketplace } = contracts;
    marketplace
      .queryFilter(
        marketplace.filters.NewProduct(null, null, null),
        fetchedBlock + 1,
        blockNumber
      )
      .then((events) => {
        if (blockNumber) setFetchedBlock(blockNumber);
        setAllProducts([
          ...allProducts,
          ...events.map((event) => event.args.id),
        ]);
      });
    library
      .getBlock(blockNumber)
      .then((block) => setTimestamp(block.timestamp));
  }, [contracts, blockNumber]);

  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/nfts.jpg"}
        style={{ width: "100%", padding: "0px", borderWidth: "5px" }}
      />
      <Tabs defaultActiveKey="featured">
        <Tab eventKey="featured" title="Featured" style={{ marginTop: "1rem" }}>
          {featured.length === 0 && (
            <p>Coming soon :) We won't let you wait too long.</p>
          )}
          <Row>
            {allProducts
              .filter((tokenId) => featured.includes(tokenId))
              .map((tokenId) => (
                <Col key={`featured-${tokenId}`} md={4}>
                  <Product tokenId={tokenId} />
                  <br />
                </Col>
              ))}
          </Row>
        </Tab>
        <Tab eventKey="all" title="All" style={{ marginTop: "1rem" }}>
          <Alert variant="warning">
            This is a permisionless marketplace. Please DYOR for each product
            registered here.
          </Alert>
          {allProducts.length === 0 && (
            <p>Coming soon :) We won't let you wait too long.</p>
          )}
          <Row>
            {allProducts.map((tokenId) => (
              <Col key={`all-${tokenId}`} md={4}>
                <Product tokenId={tokenId} />
                <br />
              </Col>
            ))}
          </Row>
        </Tab>
        <Tab eventKey="faq" title="FAQ" style={{ marginTop: "1rem" }}></Tab>
      </Tabs>
      <hr />
      <Button as={Link} to={`/manufacturer/new`} variant="outline-primary">
        Be a manufacturer
      </Button>
    </Page>
  );
};

export default Store;
