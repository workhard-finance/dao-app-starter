import React from "react";
import { Col, Row } from "react-bootstrap";

export interface TitleButSerProps {
  link?: string;
}

export const TitleButSer: React.FC<TitleButSerProps> = ({ children, link }) => {
  return (
    <Row>
      <Col md={8}>
        <h2>
          <b>{children}</b>
        </h2>
      </Col>
      <Col md={4} style={{ textAlign: "end" }}>
        {link && (
          <a href={link} target="_blank">
            But Ser..?
          </a>
        )}
      </Col>
    </Row>
  );
};
