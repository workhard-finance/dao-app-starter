import React from "react";
import { Button, Col, Nav, Row, Tab, Tabs } from "react-bootstrap";
import { BuyCommit } from "../../components/contracts/stable-reserve/BuyCommit";
import { RedeemCommit } from "../../components/contracts/stable-reserve/RedeemCommit";

const StableReserve: React.FC = () => {
  return (
    <Tab.Container defaultActiveKey="redeem">
      <Row>
        <Col sm={3}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="redeem">Redeem</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="buy">Buy $COMMIT</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="faq">FAQ</Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane eventKey="redeem">
              <RedeemCommit />
            </Tab.Pane>
            <Tab.Pane eventKey="buy">
              <BuyCommit />
              <br />
              <Button variant={"info"} children="Trade $COMMIT on Uniswap" />
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};

export default StableReserve;
