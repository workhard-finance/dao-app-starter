import { hexlify, randomBytes } from "ethers/lib/utils";
import React from "react";
import { Col, OverlayTrigger, Row, Tooltip } from "react-bootstrap";

export interface TitleButSerProps {
  link?: string;
  hint?: string;
  tooltipStyle?: React.CSSProperties;
}

export const TitleButSer: React.FC<TitleButSerProps> = ({
  children,
  link,
  hint,
  tooltipStyle,
}) => {
  return (
    <Row>
      <Col md={8}>
        <h2>
          <b>{children}</b>
        </h2>
      </Col>
      <Col md={4} style={{ textAlign: "end" }}>
        {link && !hint && (
          <a href={link} target="_blank">
            But Ser..?
          </a>
        )}
        {link && hint && (
          <OverlayTrigger
            overlay={
              <Tooltip
                style={tooltipStyle}
                id={`tooltip-${hexlify(randomBytes(8))}`}
              >
                {hint}
              </Tooltip>
            }
          >
            <a href={link} target="_blank">
              But Ser..?
            </a>
          </OverlayTrigger>
        )}
      </Col>
    </Row>
  );
};
