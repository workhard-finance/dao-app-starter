import React, { useEffect } from "react";
import Page from "../layouts/Page";
import { Button, Container, Image, Toast } from "react-bootstrap";
import { Link } from "react-router-dom";
const Home = () => {
  return (
    <Page>
      <Image
        src={process.env.PUBLIC_URL + "/images/daily-life.jpeg"}
        style={{ maxWidth: "100%" }}
      />
      <br />
      <br />
      <h1>
        Welcome to <strong>Work Hard</strong> Finance.
      </h1>
      <p>
        Work Hard Finance (WHF) empowers contributors with the choice to be
        compensated now, in stablecoins, or in the future via liquid stock
        options. We introduce a novel “Commit Mining” framework for
        organizations to fairly compensate its contributors by tokenizing any
        revenue stream. It's a collision of recent innovations in programmable
        money, open source development, and decentralized governance to
        reimagine an alternate future of work.
      </p>
      <Button as={Link} to={`/work`} variant="primary">
        Go to work
      </Button>{" "}
      <Button as={Link} to={`/mine`} variant="secondary">
        Go to mine
      </Button>{" "}
      <Button
        as={Link}
        to={`/gov`}
        variant="secondary"
        style={{ backgroundColor: "#6c6c6c", borderColor: "#6c6c6c" }}
      >
        Go to claim
      </Button>{" "}
      <br />
      <br />
      <h3>COMMIT</h3>
      <h3>VISION</h3>
      <h3>RIGHT</h3>
      <h3>Join the community now!</h3>
    </Page>
  );
};

export default Home;
