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

const featured: BigNumber[] = [];
const Store: React.FC = () => {
  const { library } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const { dao } = useWorkhard() || {};
  const [allProducts, setAllProducts] = useState<BigNumber[]>([]);
  const [fetchedBlock, setFetchedBlock] = useState<number>(0);
  const history = useHistory();
  const { tab } = useParams<{ tab?: string }>();

  useEffect(() => {
    if (!library || !dao || !blockNumber) {
      return;
    }
    const { marketplace } = dao;
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
  }, [dao, blockNumber]);

  useEffect(() => {
    if (!library || !dao || !blockNumber) {
      return;
    }
    const { marketplace } = dao;
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
  }, [dao, blockNumber]);

  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/nfts.jpg"}
        style={{ width: "100%", padding: "0px", borderWidth: "5px" }}
      />
      <Tabs defaultActiveKey={tab || "featured"}>
        <Tab
          eventKey="featured"
          title="Featured"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push("/nfts/featured")}
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
          onEnter={() => history.push("/nfts/all")}
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
        <Tab
          eventKey="faq"
          title="FAQ"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push("/nfts/faq")}
        >
          <h5>
            <strong>How can I buy NFTs?</strong>
          </h5>
          <p>
            You can buy NFT products here using $COMMIT. You can earn $COMMIT by
            working or buy them via Sushiswap and the Stable Reserve.
          </p>
          <Button variant="info">Go to Sushiswap</Button>{" "}
          <Button variant="warning">Go to the Stable Reserve</Button>
          <br />
          <br />
          <h5>
            <strong>Who are making these NFTs?</strong>
          </h5>
          <p>
            Anyone who wants to contribute to the protocol can sell NFTs here in
            the form of ERC1155 and share the revenue with RIGHT(veVISION)
            holders. If you're a VISION holder, try to be a manufacturer and
            make the intrinsic value to the protocol.
          </p>
          <Button as={Link} to={`/manufacturer/new`} variant="outline-primary">
            Be a manufacturer
          </Button>
          <br />
          <br />
          <h5>
            <strong>What are the supported token types?</strong>
          </h5>
          <p>
            Currently, it mints NFTs on a single ERC1155 contract. In the
            future, we'll support more various types of NFTs (obviously ERC721)
            and sales types like auctions.
            <br />
            For your information, you can consider ERC1155 as a limited edition
            of Nike Sneakers while ERC721 is a unique artwork.
          </p>
          <h5>
            <strong>How does it determine the token ID?</strong>
          </h5>
          <p>
            If you launch a product here, you will have a product metadata that
            includes the information about the name, description, and image uri.
            The token id is determined by the hash of the metadata uri and
            manufacturer's address.
          </p>
          <h5>
            <strong>Where does the deployed assets stored?</strong>
          </h5>
          <p>
            It stores the image and metadata on the IPFS which is a
            decentralized storage network that does not depend on any
            centralized cloud services. And, as IPFS does not guarantee its
            permanency, we are permanently pinning it using Arweave network.
          </p>
        </Tab>
      </Tabs>
    </Page>
  );
};

export default Store;
