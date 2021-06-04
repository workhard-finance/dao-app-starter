import React, { useEffect, useRef, useState } from "react";
import { Image, Container, Col, Row } from "react-bootstrap";

export interface FatherSaysProps {
  say: string;
}

export const FatherSays: React.FC<FatherSaysProps> = ({ say }) => {
  const col = useRef<HTMLDivElement>(null);
  const imageCol = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<string>("100%");
  useEffect(() => {
    if (!!col.current && !!imageCol.current) {
      col.current.addEventListener("resize", (ev) => {});
      const size = `${Math.floor(
        (50 * col.current.offsetWidth) / imageCol.current.offsetWidth
      )}%`;
      setFontSize(size);
    }
  }, [col.current?.offsetWidth, imageCol.current?.offsetWidth]);
  return (
    <Container style={{ position: "relative" }}>
      <Row>
        <Col ref={col} md={12} style={{ height: "10vh" }}></Col>
        <Col ref={imageCol} md={6}>
          <Image
            src={process.env.PUBLIC_URL + "/images/father-says.png"}
            style={{ width: "100%", padding: "0px" }}
          />
          <Container
            style={{
              position: "absolute",
              top: "5%",
              left: "10%",
              width: "20%",
              fontSize,
              lineHeight: "100%",
            }}
          >
            <p>{say}</p>
          </Container>
        </Col>
      </Row>
    </Container>
  );
};
