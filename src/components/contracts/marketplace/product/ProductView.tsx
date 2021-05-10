import React, { useState, useEffect } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { OverlayTooltip } from "../../../OverlayTooltip";
import { BigNumber } from "@ethersproject/bignumber";
import { formatEther } from "ethers/lib/utils";
import { useIPFS } from "../../../../providers/IPFSProvider";
import { Link } from "react-router-dom";
import { IPFS } from "ipfs-core/src";
import { useWeb3React } from "@web3-react/core";

export interface ProductMetadata {
  name: string;
  description: string;
  image: string;
}

export interface ProductData {
  manufacturer: string;
  totalSupply: BigNumber;
  maxSupply: BigNumber;
  price: BigNumber;
  profitRate: BigNumber;
  uri: string;
  id?: string;
  metadata?: ProductMetadata;
}

export interface ProductViewProps {
  product: ProductData;
  onClick?: (amount: number) => void;
  buttonText?: string;
  preview?: ProductMetadata;
}

export const ProductView: React.FC<ProductViewProps> = ({
  product,
  onClick,
  buttonText,
  preview,
}) => {
  const { account } = useWeb3React();
  const { ipfs } = useIPFS();
  const [amount, setAmount] = useState<number>(1);
  const [metadata, setMetadata] = useState<ProductMetadata>({
    name: "...fetching",
    description: "...fetching",
    image: "",
  });
  const _profitRate = Math.floor(
    (100 * 80 * product.profitRate.toNumber()) / 10000
  );
  const _burnRate = 80 - _profitRate;

  useEffect(() => {
    if (product.uri && ipfs) {
      fetchMetadataFromIPFS(ipfs, product.uri).then(setMetadata);
    } else if (preview) {
      setMetadata({
        name: preview.name,
        description: preview.description,
        image: preview.image,
      });
    }
  }, [ipfs]); // ensures refresh if referential identity of library doesn't change across chainIds

  const gateway = "ipfs.io";
  const stock = product.maxSupply.sub(product.totalSupply);

  return (
    <Card>
      <Card.Img
        style={{ borderRadius: 0 }}
        src={`https://${gateway}/ipfs/${metadata.image}`}
      />
      <Card.Body>
        <Card.Title>{metadata.name}</Card.Title>
        <Card.Text>
          Price: {parseFloat(formatEther(product.price)).toFixed(2)}{" "}
          <a
            className="text-info"
            href={`https://etherscan.io/address/${product.manufacturer}`}
            target="_blank"
          >
            $COMMIT
          </a>
          <br />
          Stock: {stock.toNumber()}
          <br />
          Manufacturer:{" "}
          <a
            className="text-info"
            href={`https://etherscan.io/address/${product.manufacturer}`}
            target="_blank"
          >{`${product.manufacturer.slice(
            0,
            10
          )}...${product.manufacturer.slice(-8)}`}</a>
          <br />
          Profit rate:{" "}
          <OverlayTooltip
            tip={
              <span>
                20% goes to Dividend Pool
                <br />
                {_burnRate}% goes to the Stable Reserve
                <br />
                {_profitRate}% goes to the manufacturer
              </span>
            }
          >
            20/ {_burnRate} / {_profitRate}
          </OverlayTooltip>
          <br />
          Sold: {product.totalSupply.toNumber()}
          {product.maxSupply.gt(0) &&
            ` / ${product.maxSupply.toNumber()}(Limited Edition)`}
        </Card.Text>
        <Card.Text>
          {product.metadata?.description || preview?.description}
        </Card.Text>
        <Row>
          <Col sm="4">
            <Form.Control
              type="number"
              onChange={({ target: { value } }) => setAmount(parseInt(value))}
              value={stock.gt(0) ? amount : 0}
              min={stock.gt(0) ? 1 : 0}
              max={stock.toNumber()}
              step={1}
            />
          </Col>
          <Col sm="8">
            <Button
              variant="primary"
              block
              disabled={stock.eq(0)}
              onClick={() => {
                if (amount && !!onClick) {
                  onClick(amount);
                }
              }}
            >
              {stock.gt(0) ? buttonText || "Buy" : "Sold out"}
            </Button>
          </Col>
        </Row>
        {!preview && !!account && account === product.manufacturer && (
          <>
            <br />
            <Button
              as={Link}
              to={`/product/${product.id}`}
              variant="warning"
              block
              disabled={stock.eq(0)}
              onClick={() => {
                if (amount && !!onClick) {
                  onClick(amount);
                }
              }}
            >
              Go to Manufaturer menu
            </Button>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

async function fetchMetadataFromIPFS(
  _ipfs: IPFS,
  cid: string
): Promise<ProductMetadata> {
  let result = "";
  for await (const chunk of _ipfs.cat(cid)) {
    result += chunk;
  }
  const metadata = JSON.parse(result);
  return metadata as ProductMetadata;
}
