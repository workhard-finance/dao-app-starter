import React, { useState, useEffect } from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { BuyCommit } from "../../../components/contracts/stable-reserve/BuyCommit";
import { RedeemCommit } from "../../../components/contracts/stable-reserve/RedeemCommit";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { getPriceFromCoingecko } from "../../../utils/coingecko";
import { errorHandler } from "../../../utils/utils";

const StableReserve: React.FC = () => {
  const workhardCtx = useWorkhard();
  const [commitPrice, setCommitPrice] = useState<number>();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();

  useEffect(() => {
    if (!!workhardCtx) {
      getPriceFromCoingecko(workhardCtx.dao.commit.address)
        .then(setCommitPrice)
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, blockNumber]);
  return (
    <Row>
      <Col md={5} style={{ marginTop: "1rem" }}>
        <RedeemCommit />
      </Col>
      <Col md={2} style={{ marginTop: "1rem", height: "inherit" }}>
        <Card style={{ height: "100%" }} border={`warning`}>
          <Card.Body>
            {commitPrice && commitPrice !== NaN && (
              <p>
                {commitPrice}{" "}
                {workhardCtx?.metadata.baseCurrencySymbol || "DAI"}/
                {workhardCtx?.metadata.commitSymbol || `$COMMIT`}
              </p>
            )}
            <Card.Title>Market price</Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>
                {commitPrice || `???`}{" "}
                {workhardCtx?.metadata.baseCurrencySymbol || `DAI`}
              </span>{" "}
              per {workhardCtx?.metadata.commitSymbol || `COMMIT`}
            </Card.Text>
            <br />
            <br />
            <Button
              variant={"warning"}
              children={`Go to Uniswap`}
              style={{
                position: "absolute",
                bottom: "1rem",
              }}
            />
          </Card.Body>
        </Card>
      </Col>
      <Col md={5} style={{ marginTop: "1rem" }}>
        <BuyCommit />
      </Col>
    </Row>
  );
};

export default StableReserve;
