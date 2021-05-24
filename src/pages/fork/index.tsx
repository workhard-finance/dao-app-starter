import React from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import Page from "../../layouts/Page";
import DAOs from "./tabs/DAOs";

const Fork: React.FC = () => {
  return (
    <Page id="hi" style={{ minHeight: "90vh" }}>
      <Button as={Link} to={`/fork/new`} variant="info">
        Fork and launch your DAO
      </Button>
      <br />
      <br />
      <DAOs />
    </Page>
  );
};

export default Fork;
