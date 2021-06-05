import { isAddress } from "@ethersproject/address";
import { useWeb3React } from "@web3-react/core";
import {
  ERC1155__factory,
  ERC20__factory,
  ERC721__factory,
} from "@workhard/protocol";
import { providers } from "ethers";
import React, { useEffect, useState } from "react";
import {
  Col,
  Row,
  Nav,
  Tab,
  Container,
  Card,
  Form,
  Button,
} from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom";
import { useToasts } from "react-toast-notifications";
import { ERC165, PoolType } from "../../utils/ERC165Interfaces";
import { errorHandler, getTokenType, TokenType } from "../../utils/utils";

export const PoolWeight: React.FC<{
  preset?: {
    baseToken: string;
    poolType: string;
    weight: number;
    name?: string;
  };
  onChange?: ({
    baseToken,
    poolType,
    weight,
    name,
  }: {
    baseToken: string;
    poolType: string;
    weight: number;
    name?: string;
  }) => void;
}> = ({ preset, onChange }) => {
  const { library } = useWeb3React<providers.Web3Provider>();
  const { addToast } = useToasts();

  const [tokenType, setTokenType] = useState<TokenType>();
  const [baseToken, setBaseToken] = useState<string | undefined>(
    preset?.baseToken
  );
  const [poolType, setPoolType] = useState<string | undefined>(
    preset?.poolType
  );
  const [weight, setWeight] = useState<number | undefined>(preset?.weight);
  const [title, setTitle] = useState<string | undefined>(preset?.name);

  useEffect(() => {
    if (baseToken && library && isAddress(baseToken)) {
      getTokenType(baseToken, library)
        .then(setTokenType)
        .catch(errorHandler(addToast));
    }
  }, [baseToken]);

  useEffect(() => {
    if (baseToken && library && isAddress(baseToken) && tokenType) {
      if (tokenType === TokenType.ERC20) {
        if (!poolType) setPoolType(PoolType.ERC20StakeV1);
        ERC20__factory.connect(baseToken, library)
          .symbol()
          .then(setTitle)
          .catch(errorHandler(addToast));
      } else if (tokenType === TokenType.ERC721) {
        if (!poolType) setPoolType(PoolType.ERC721StakeV1);
        ERC721__factory.connect(baseToken, library)
          .symbol()
          .then(setTitle)
          .catch(errorHandler(addToast));
      } else if (tokenType === TokenType.ERC1155) {
        if (!poolType) setPoolType(PoolType.ERC1155StakeV1);
        setTitle(`ERC1155 ${baseToken.slice(0, 6)}...${baseToken.slice(0, 4)}`);
      } else {
        setTitle(
          `Unknown Type ${baseToken.slice(0, 6)}...${baseToken.slice(0, 4)}`
        );
      }
    }
  }, [baseToken, tokenType]);

  useEffect(() => {
    if (baseToken && poolType && weight && onChange) {
      onChange({ baseToken, poolType, weight, name: title });
    }
  }, [baseToken, poolType, weight, title]);

  const getButton = (_typeName: string, _poolTypeSig: string) => (
    <Button
      variant={poolType === _poolTypeSig ? "primary" : "outline-primary"}
      style={{ margin: "0.2rem" }}
      onClick={() => setPoolType(_poolTypeSig)}
    >
      {_typeName}
    </Button>
  );

  const getTitle = () => {
    if (preset && preset.name) {
      return preset.name;
    } else {
      return title;
    }
  };
  return (
    <Form>
      <Form.Group>
        <Form.Label>Token Address{getTitle() && `: ${getTitle()}`}</Form.Label>
        <Form.Control
          placeholder="0xABCDEF0123456789ABCDEF0123456789ABCDEF"
          value={baseToken}
          onChange={({ target: { value } }) => setBaseToken(value)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Type</Form.Label>
        <br />
        {!tokenType && <p>Put token address first.</p>}
        {tokenType === TokenType.ERC20 && (
          <>
            {getButton(`ERC20 Stake`, PoolType.ERC20StakeV1)}
            {getButton(`ERC20 Burn`, PoolType.ERC20BurnV1)}
          </>
        )}
        {tokenType === TokenType.ERC721 &&
          getButton(`ERC721 Stake`, PoolType.ERC721StakeV1)}
        {tokenType === TokenType.ERC1155 && (
          <>
            {getButton(`ERC1155 Stake`, PoolType.ERC1155StakeV1)}
            {getButton(`ERC1155 Burn`, PoolType.ERC1155BurnV1)}
          </>
        )}
      </Form.Group>
      <Form.Group>
        <Form.Label>Weight</Form.Label>
        <Row>
          <Col md={8}>
            <Form.Control
              type="range"
              min={0}
              max={9999}
              step={10}
              value={isAddress(baseToken || "") ? weight : 0}
              onChange={(event) => {
                if (isAddress(baseToken || "")) {
                  setWeight(parseInt(event.target.value));
                }
              }}
            />
          </Col>
          <Col md={4}>
            <Form.Control
              type="number"
              min={0}
              max={9999}
              step={10}
              placeholder="100"
              value={isAddress(baseToken || "") ? weight : 0}
              onChange={(event) => {
                if (isAddress(baseToken || "")) {
                  setWeight(parseInt(event.target.value));
                }
              }}
            />
          </Col>
        </Row>
      </Form.Group>
    </Form>
  );
};
