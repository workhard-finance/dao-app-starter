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
          Welcome to <strong>WORK HARD</strong> finance.
        </h1>
        <p>
          WORK HARD finance provides a "work booster" by $VISION token and
          $COMMITMENT token. Lorem ipsum dolor sit amet, consectetur adipiscing
          elit, sed do eiusmod tempor incididunt ut labore et dolore magna
          aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
          laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
          in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <Button as={Link} to={`/work`} variant="primary">
          Go to work
        </Button>{" "}
        <Button variant="secondary">Docs</Button>
      </Container>
    </Page>
  );
};

export default Home;
