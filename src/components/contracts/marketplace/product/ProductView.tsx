import React, { useState, useEffect } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { OverlayTooltip } from "../../../OverlayTooltip";
import { BigNumber } from "@ethersproject/bignumber";
import { formatEther } from "ethers/lib/utils";
import { useIPFS } from "../../../../providers/IPFSProvider";
import { Link, useParams } from "react-router-dom";
import { CID, IPFS } from "ipfs-core/src";
import { useWeb3React } from "@web3-react/core";
import { uriToURL } from "../../../../utils/utils";
import { useWorkhard } from "../../../../providers/WorkhardProvider";

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
  onAmountChange?: (amount: number) => void;
  onClick?: () => void;
  buttonText?: string;
  preview?: ProductMetadata;
}

export const ProductView: React.FC<ProductViewProps> = ({
  product,
  onClick,
  onAmountChange,
  buttonText,
  preview,
}) => {
  const { account } = useWeb3React();
  const { ipfs } = useIPFS();
  const workhardCtx = useWorkhard();
  const { daoId } = workhardCtx || { daoId: 0 };
  const [amount, setAmount] = useState<number>(1);
  const [metadata, setMetadata] = useState<ProductMetadata>();
  const _profitRate = Math.floor(
    (100 * 80 * product.profitRate.toNumber()) / 10000
  );
  const _burnRate = 80 - _profitRate;

  useEffect(() => {
    if (onAmountChange) onAmountChange(amount);
  }, [amount]);

  useEffect(() => {
    if (ipfs) {
      fetchMetadataFromIPFS(ipfs, product.uri).then(setMetadata);
    } else if (preview) {
      setMetadata({
        name: preview.name,
        description: preview.description,
        image: preview.image,
      });
    }
  }, [ipfs, product.uri]); // ensures refresh if referential identity of library doesn't change across chainIds

  const gateway = "ipfs.io";
  const stock = product.maxSupply.sub(product.totalSupply);

  return (
    <Card>
      <Card.Img
        style={{ borderRadius: 0 }}
        src={getImagePath(metadata, preview)}
      />
      <Card.Body>
        <Card.Title>{metadata?.name || preview?.name || "..."}</Card.Title>
        <Card.Text>
          Price: {parseFloat(formatEther(product.price)).toFixed(2)}{" "}
          <a
            className="text-info"
            href={`https://etherscan.io/address/${product.manufacturer}`}
            target="_blank"
          >
            {workhardCtx?.metadata.commitSymbol || `$COMMIT`}
          </a>
          <br />
          Stock: {product.maxSupply.eq(0) ? "Unlimited" : stock.toNumber()}
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
              value={product.maxSupply.eq(0) || stock.gt(0) ? amount : 0}
              min={stock.gt(0) ? 1 : 0}
              max={product.maxSupply.eq(0) ? undefined : stock.toNumber()}
              step={1}
            />
          </Col>
          <Col sm="8">
            <Button
              variant="primary"
              block
              disabled={product.maxSupply.gt(0) && stock.eq(0)}
              onClick={onClick}
            >
              {product.maxSupply.eq(0) || stock.gt(0)
                ? buttonText || "Buy"
                : "Sold out"}
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
              onClick={onClick}
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
  _uri: string
): Promise<ProductMetadata | undefined> {
  let result = "";
  const cid = _uri.replace("ipfs://", "");
  if (cid === "") return undefined;
  // return {
  //   name: "Fetching...",
  //   description: "Fetching...",
  //   image: "QmPPRQC49kZPrMAZBw4he3DXDw4P4czrDZbFAhfnydKAQK",
  // };

  for await (const chunk of _ipfs.cat(cid)) {
    result += chunk;
  }
  const metadata = JSON.parse(result);
  return metadata as ProductMetadata;
}

const getImagePath = (
  metadata?: ProductMetadata,
  preview?: ProductMetadata
) => {
  const path =
    metadata?.image ||
    preview?.image ||
    "QmUob9cf3KuhESGg1x4cr1SGVxH1Tg5mXxpbhWXX7FrQ4n";
  try {
    const cid = new CID(path);
    return uriToURL(path);
  } catch (_) {
    return path;
  }
};
