import React from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import Page from "../../layouts/Page";
import { useWorkhard } from "../../providers/WorkhardProvider";
import DAOs from "./tabs/DAOs";

const DAO: React.FC = () => {
  const workhardCtx = useWorkhard();
  const { daoId } = workhardCtx || { daoId: 0 };
  return (
    <Page id="hi" style={{ minHeight: "90vh" }}>
      <Button as={Link} to={`/dao/new`} variant="info">
        Fork and launch your DAO
      </Button>
      <br />
      <br />
      <DAOs />
    </Page>
  );
};

export default DAO;
