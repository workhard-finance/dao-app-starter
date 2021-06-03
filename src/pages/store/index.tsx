import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Alert, Button, Col, Row, Tab, Tabs, Image } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../../providers/BlockNumberProvider";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { BigNumber, providers } from "ethers";
import { Link } from "react-router-dom";
import { Product } from "../../components/contracts/marketplace/product/Product";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import { prefix } from "../../utils/utils";
import { SerHelpPlz } from "../../components/views/HelpSer";
import { TitleButSer } from "../../components/views/TitleButSer";

const featured: BigNumber[] = [];
const Store: React.FC = () => {
  const { library } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const workhardCtx = useWorkhard();
  const [allProducts, setAllProducts] = useState<BigNumber[]>([]);
  const [fetchedBlock, setFetchedBlock] = useState<number>(0);
  const history = useHistory();
  const { tab, daoId } = useParams<{ tab?: string; daoId?: string }>();

  useEffect(() => {
    if (!library || !workhardCtx || !blockNumber) {
      return;
    }
    const { marketplace } = workhardCtx.dao;
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
  }, [workhardCtx, blockNumber]);

  useEffect(() => {
    if (!library || !workhardCtx || !blockNumber) {
      return;
    }
    const { marketplace } = workhardCtx.dao;
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
  }, [workhardCtx, blockNumber]);

  return (
    <Page>
      {!daoId && (
        <Image
          className="jumbotron"
          src={process.env.PUBLIC_URL + "/images/nfts.jpg"}
          style={{ width: "100%", padding: "0px", borderWidth: "5px" }}
        />
      )}
      <TitleButSer link="#todo" />
      <Tabs defaultActiveKey={tab || "featured"}>
        <Tab
          eventKey="featured"
          title="Featured"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push(prefix(daoId, "/store/featured"))}
        >
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
        <Tab
          eventKey="all"
          title="All"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push(prefix(daoId, "/store/all"))}
        >
          {allProducts.length === 0 && (
            <p>Coming soon :) We won't let you wait too long.</p>
          )}
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
      <br />
      <SerHelpPlz>
        <p>
          Buy NFTs with {workhardCtx?.metadata.commitSymbol || `$COMMIT`}. Earn{" "}
          {workhardCtx?.metadata.commitSymbol || `$COMMIT`} by working or buying
          on Sushiswap.
        </p>
        <Button variant="success">Go Work Hard</Button>{" "}
        <Button variant="danger">Go to Sushiswap</Button>
        <br />
        <br />
        <p>
          Revenues from NFTs sold are shared with{" "}
          <a href="#" className="text-info">
            $RIGHT
          </a>{" "}
          holders. NFTs in the store are{" "}
          <a
            href="https://eips.ethereum.org/EIPS/eip-1155"
            target="_blank"
            className="text-info"
          >
            ERC-1155
          </a>{" "}
          and are stored on{" "}
          <a href="https://ipfs.io" target="_blank" className="text-info">
            IPFS
          </a>{" "}
          and{" "}
          <a href="https://arweave.org" target="_blank" className="text-info">
            Arweave.
          </a>
        </p>
      </SerHelpPlz>
    </Page>
  );
};

export default Store;
