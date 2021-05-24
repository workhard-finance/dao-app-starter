import React from "react";
import { Button } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import Page from "../../layouts/Page";
import { prefix } from "../../utils/utils";
import DAOs from "./tabs/DAOs";

const Fork: React.FC = () => {
  const { daoId } = useParams<{ daoId?: string }>();
  return (
    <Page id="hi" style={{ minHeight: "90vh" }}>
      <Button as={Link} to={prefix(daoId, `/fork/new`)} variant="info">
        Fork and launch your DAO
      </Button>
      <br />
      <br />
      <DAOs />
    </Page>
  );
};

export default Fork;
