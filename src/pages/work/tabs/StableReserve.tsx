import React from "react";
import { Button, Col, Row } from "react-bootstrap";
import { BuyCommit } from "../../../components/contracts/stable-reserve/BuyCommit";
import { RedeemCommit } from "../../../components/contracts/stable-reserve/RedeemCommit";
import { useWorkhard } from "../../../providers/WorkhardProvider";

const StableReserve: React.FC = () => {
  const workhardCtx = useWorkhard();
  return (
    <Row>
      <Col md={6}>
        <br />
        <BuyCommit />
      </Col>
      <Col md={6}>
        <br />
        <RedeemCommit />
      </Col>
      <Col>
        <br />
        <Button
          variant={"info"}
          children={`Trade ${
            workhardCtx?.metadata.commitSymbol || `$COMMIT`
          } on Uniswap`}
        />
      </Col>
    </Row>
  );
};

export default StableReserve;
