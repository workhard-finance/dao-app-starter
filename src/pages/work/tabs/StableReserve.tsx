import React, { useState, useEffect } from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { constants, Contract, ethers } from "ethers";
import { BuyCommit } from "../../../components/contracts/stable-reserve/BuyCommit";
import { RedeemCommit } from "../../../components/contracts/stable-reserve/RedeemCommit";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { errorHandler } from "../../../utils/utils";
import { getPool, getPoolAddress, getPoolContract } from "../../../utils/uniV3";

const StableReserve: React.FC = () => {
  const workhardCtx = useWorkhard();
  const [commitPrice, setCommitPrice] = useState<number>();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const [uniV3Pool, setUniV3Pool] = useState<Contract | undefined>();

  useEffect(() => {
    if (!!workhardCtx && workhardCtx.web3.chainId === 1) {
      Promise.all(
        [10000, 3000, 500].map((fee) =>
          getPoolAddress(
            workhardCtx.web3.library,
            workhardCtx.dao.baseCurrency.address,
            workhardCtx.dao.commit.address,
            fee
          )
        )
      ).then(async (pools) => {
        const poolAddress = pools.find((p) => p !== constants.AddressZero);
        if (poolAddress) {
          const pool = await getPoolContract(
            poolAddress,
            workhardCtx.web3.library
          );
          setUniV3Pool(pool);
        }
      });
    } else {
      setUniV3Pool(undefined);
    }
  }, [workhardCtx, workhardCtx?.web3.chainId]);

  useEffect(() => {
    if (!!uniV3Pool) {
      getPool(uniV3Pool)
        .then(async (pool) => {
          setCommitPrice(parseFloat(pool.token1Price.toFixed()));
        })
        .catch(errorHandler(addToast));
    }
  }, [uniV3Pool, blockNumber]);

  return (
    <Row>
      <Col md={5} style={{ marginTop: "1rem" }}>
        <RedeemCommit />
      </Col>
      <Col md={2} style={{ marginTop: "1rem", height: "inherit" }}>
        <Card style={{ height: "100%" }} border={`warning`}>
          <Card.Header className={"bg-warning text-white"}>
            Market Price
          </Card.Header>
          <Card.Body>
            <Card.Title>Market Price</Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>{commitPrice || `???`}</span>
              <br />
              {workhardCtx?.metadata.baseCurrencySymbol || `DAI`} per{" "}
              {workhardCtx?.metadata.commitSymbol || `COMMIT`}
            </Card.Text>
            <br />
            <br />
            <Button
              as={`a`}
              variant={"warning"}
              children={`Go to Uniswap`}
              style={{
                position: "absolute",
                bottom: "1rem",
              }}
              href={`https://app.uniswap.org/#/swap?inputCurrency=${workhardCtx?.dao.baseCurrency.address}&outputCurrency=${workhardCtx?.dao.commit.address}&use=V3`}
              target="_blank"
            />
          </Card.Body>
        </Card>
      </Col>
      <Col md={5} style={{ marginTop: "1rem", height: "inherit" }}>
        <BuyCommit style={{ height: "100%" }} />
      </Col>
    </Row>
  );
};

export default StableReserve;
