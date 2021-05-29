import React from "react";
import { Image, Card, Col, Row } from "react-bootstrap";

export const SerHelpPlz: React.FC = ({ children }) => {
  return (
    <Card>
      <Card.Body>
        <Row>
          <Col md={2} className={"sm-hidden"}>
            <Image
              src={process.env.PUBLIC_URL + "/images/puritan-father.png"}
              style={{ width: "100%", padding: "0px" }}
            />
          </Col>
          <Col md={10}>{children}</Col>
        </Row>
      </Card.Body>
    </Card>
  );
};
