import React, { useEffect } from "react";
import Page from "../layouts/Page";
import { Button, Container, Image } from "react-bootstrap";
import { Link } from "react-router-dom";
const Home = () => {
  return (
    <Page>
      <Container className="jumbotron">
        <Image
          src={process.env.PUBLIC_URL + "/images/daily-life.jpeg"}
          style={{ maxWidth: "100%" }}
        />
        <hr />
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
      </Container>
    </Page>
  );
};

export default Home;
