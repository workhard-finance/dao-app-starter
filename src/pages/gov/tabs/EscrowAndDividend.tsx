import React from "react";
import { Button, Col, Nav, Row, Tab } from "react-bootstrap";
import { BuyCommit } from "../../../components/contracts/stable-reserve/BuyCommit";

export const EscrowAndDividend: React.FC = () => {
  return (
    <Tab.Container defaultActiveKey="balance">
      <Row>
        <Col sm={3}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="locks">Voting Escrows</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="dividend-pool">Dividend Pool</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="faq">FAQ</Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane eventKey="locks">
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
