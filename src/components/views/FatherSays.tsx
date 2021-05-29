import React from "react";
import { Image, Container } from "react-bootstrap";

export interface FatherSaysProps {
  say: string;
}

export const FatherSays: React.FC<FatherSaysProps> = ({ say }) => {
  return (
    <Container style={{ position: "relative" }}>
      <Image
        src={process.env.PUBLIC_URL + "/images/father-says.png"}
        style={{ width: "50%", padding: "0px", marginTop: "120px" }}
      />
      <Container
        style={{
          position: "absolute",
          top: "148px",
          left: "54px",
          fontSize: "16px",
          width: "120px",
          lineHeight: "20px",
        }}
      >
        <p>{say}</p>
      </Container>
    </Container>
  );
};
