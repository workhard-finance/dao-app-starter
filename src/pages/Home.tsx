import React from "react";
import Page from "../layouts/Page";
import { Button, Image } from "react-bootstrap";
import { Link, useHistory, useParams } from "react-router-dom";
const Home = () => {
  const { daoId } = useParams<{ tab?: string; daoId?: string }>();
  const history = useHistory();
  if (daoId) {
    history.push(`/${daoId}/nfts`);
  }
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
      <h1>
        Create a <strong>Project</strong>.
      </h1>
      <h1>
        Get <strong>grants</strong>.
      </h1>
      <h1>
        Upgrade to <strong>DAO</strong> and fork out!
      </h1>
      <h1>
        The <strong>trinity</strong>
      </h1>
      <h4>
        <strong>COMMIT</strong>
      </h4>
      <h4>
        <strong>VISION</strong>
      </h4>
      <h4>
        <strong>RIGHT</strong>
      </h4>
      <h1>
        Find out projects and <strong>COMMIT</strong> at the early stages.
      </h1>
      <h3>Join the community now!</h3>
    </Page>
  );
};

export default Home;
