import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Alert, Button, Card, Col, Row, Tab, Tabs } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../../providers/BlockNumberProvider";
import { useWorkhardContracts } from "../../providers/WorkhardContractProvider";
import { BigNumber, providers } from "ethers";
import { Link } from "react-router-dom";
import { OverlayTooltip } from "../../components/OverlayTooltip";
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
      <Row>
        <Col md={4}>
          <h1 style={{ display: "flex", justifyContent: "space-between" }}>
            Store
          </h1>
        </Col>
        <Col md={{ span: 4, offset: 4 }} style={{ textAlign: "end" }}>
          <Button as={Link} to={`/manufacturer/new`} variant="outline-primary">
            Be a manufacturer
          </Button>
        </Col>
      </Row>
      <Card>
        <Card.Body>
          <Card.Text style={{ fontSize: "2rem" }}>
            My Balance: 4012 $COMMIT
          </Card.Text>
        </Card.Body>
      </Card>
      <br />
      <Tabs defaultActiveKey="featured">
        <Tab eventKey="featured" title="Featured" style={{ marginTop: "1rem" }}>
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
          <Row>
            {allProducts.map((tokenId) => (
              <Col key={`all-${tokenId}`} md={4}>
                <Product tokenId={tokenId} />
                <br />
              </Col>
            ))}
          </Row>
        </Tab>
      </Tabs>
    </Page>
  );
};

export default Store;
