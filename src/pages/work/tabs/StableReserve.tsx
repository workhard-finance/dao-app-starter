import React from "react";
import { Button, Col, Nav, Row, Tab } from "react-bootstrap";
import { BuyCommit } from "../../../components/contracts/stable-reserve/BuyCommit";
import { RedeemCommit } from "../../../components/contracts/stable-reserve/RedeemCommit";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import { prefix } from "../../../utils/utils";

const StableReserve: React.FC = () => {
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
        <Button variant={"info"} children="Trade $COMMIT on Uniswap" />
      </Col>
    </Row>
  );
};

export default StableReserve;
