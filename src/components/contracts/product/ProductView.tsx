import React, { useState, useEffect } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { OverlayTooltip } from "../../OverlayTooltip";
import { BigNumber } from "@ethersproject/bignumber";
import { formatEther } from "ethers/lib/utils";
import { useIPFS } from "../../../providers/IPFSProvider";
import CID from "cids";
import { IPFS } from "ipfs-core/src";

export interface ProductViewProps {
  address: string;
  manufacturer: string;
  name: string;
  symbol: string;
  description: string;
  maxSupply: BigNumber;
  sold: BigNumber;
  price: BigNumber;
  profitRate: BigNumber;
  stock: BigNumber;
  uri: string;
  onClick?: (amount: number) => void;
  buttonText?: string;
}

export const ProductView: React.FC<ProductViewProps> = ({
  address,
  manufacturer,
  name,
  symbol,
  description,
  sold,
  maxSupply,
  profitRate,
  stock,
  price,
  uri,
  onClick,
  buttonText,
}) => {
  const { ipfs } = useIPFS();
  const [amount, setAmount] = useState<number>(1);
  const [_description, setDescription] = useState<string>();
  const _profitRate = Math.floor((100 * 80 * profitRate.toNumber()) / 10000);
  const _burnRate = 80 - _profitRate;

  useEffect(() => {
    try {
      const cid = new CID(description);
      if (CID.isCID(cid) && ipfs) {
        fetchDescFromIPFS(ipfs, description).then((result) => {
          setDescription(result);
        });
      } else {
        setDescription(description);
      }
    } catch (_) {
      setDescription(description);
    }
  }, [ipfs, description]); // ensures refresh if referential identity of library doesn't change across chainIds

  const gateway = "ipfs.io";

  return (
    <Card>
      <Card.Img
        style={{ borderRadius: 0 }}
        src={`https://${gateway}/ipfs/${uri}`}
      />
      <Card.Body>
        <Card.Title>
          <a href={`https://etherscan.io/address/${address}`} target="_blank">
            {symbol}: {name}
          </a>
        </Card.Title>
        <Card.Text>
          Price: {parseFloat(formatEther(price)).toFixed(2)}{" "}
          <a
            className="text-info"
            href={`https://etherscan.io/address/${manufacturer}`}
            target="_blank"
          >
            $COMMITMENT
          </a>
          <br />
          Stock: {stock.toNumber()}
          <br />
          Manufacturer:{" "}
          <a
            className="text-info"
            href={`https://etherscan.io/address/${manufacturer}`}
            target="_blank"
          >{`${manufacturer.slice(0, 10)}...${manufacturer.slice(-8)}`}</a>
          <br />
          Profit rate:{" "}
          <OverlayTooltip
            tip={
              <span>
                20% goes to Vision Farm
                <br />
                {_burnRate}% goes to the Commitment Fund
                <br />
                {_profitRate}% goes to the manufacturer
              </span>
            }
          >
            20/ {_burnRate} / {_profitRate}
          </OverlayTooltip>
          <br />
          Sold: {sold.toNumber()}
          {maxSupply.gt(0) && ` / ${maxSupply.toNumber()}(Limited Edition)`}
        </Card.Text>
        <Card.Text>{_description}</Card.Text>
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
      </Card.Body>
    </Card>
  );
};

async function fetchDescFromIPFS(_ipfs: IPFS, cid: string): Promise<string> {
  let result = "";
  for await (const chunk of _ipfs.cat(cid)) {
    result += chunk;
  }
  return result;
}
