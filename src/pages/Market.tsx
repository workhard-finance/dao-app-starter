import React, { useEffect, useState } from "react";
import Page from "../layouts/Page";
import { Alert, Button, Card, Col, Row, Tab, Tabs } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../providers/BlockNumberProvider";
import { useWorkhardContracts } from "../providers/WorkhardContractProvider";
import { providers } from "ethers";
import { Link } from "react-router-dom";
import { OverlayTooltip } from "../components/OverlayTooltip";
import { Product } from "../components/contracts/product/Product";

const featured: string[] = [];
const Market: React.FC = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [allProducts, setAllProducts] = useState<string[]>([]);
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
        marketplace.filters.ProductLaunched(null, null),
        fetchedBlock + 1,
        blockNumber
      )
      .then((events) => {
        if (blockNumber) setFetchedBlock(blockNumber);
        setAllProducts([
          ...allProducts,
          ...events.map((event) => event.args.product),
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
            Marketplace
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
            My Balance: 4012 $COMMITMENT
          </Card.Text>
          <OverlayTooltip tip="Go to crypto job board and work to get $COMMITMENT">
            <Button variant="outline-success">Work</Button>{" "}
          </OverlayTooltip>
          <OverlayTooltip tip="Go to Uniswap to trade $COMMITMENT">
            <Button variant="outline-info">Trade</Button>{" "}
          </OverlayTooltip>
          <OverlayTooltip tip="If $COMMITMENT is too expensive in Uniswap, you can simply purchase them per $2">
            <Button variant="outline-warning">Buy</Button>
          </OverlayTooltip>
        </Card.Body>
      </Card>
      <br />
      <Tabs defaultActiveKey="featured">
        <Tab eventKey="featured" title="Featured" style={{ marginTop: "1rem" }}>
          <Row>
            {allProducts
              .filter((address) => featured.includes(address))
              .map((address) => (
                <Col key={`featured-${address}`} md={4}>
                  <Product address={address} />
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
            {allProducts.map((address) => (
              <Col key={`all-${address}`} md={4}>
                <Product address={address} />
                <br />
              </Col>
            ))}
          </Row>
        </Tab>
      </Tabs>
    </Page>
  );
};

export default Market;
