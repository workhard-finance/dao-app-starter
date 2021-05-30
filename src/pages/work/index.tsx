import React from "react";
import Page from "../../layouts/Page";
import { Image } from "react-bootstrap";
import { useParams } from "react-router-dom";
import StableReserve from "./tabs/StableReserve";
import { ContributionBoard } from "./tabs/ContributionBoard";
import { SerHelpPlz } from "../../components/views/HelpSer";
import { TitleButSer } from "../../components/views/TitleButSer";

const Work: React.FC = () => {
  const { daoId } = useParams<{ tab?: string; daoId?: string }>();

  return (
    <Page>
      {!daoId && (
        <Image
          className="jumbotron"
          src={process.env.PUBLIC_URL + "/images/work.jpg"}
          style={{
            width: "100%",
            padding: "0px",
            borderWidth: "5px",
          }}
        />
      )}
      <TitleButSer link="#todo">Job Board</TitleButSer>
      <br />
      <ContributionBoard />
      <hr />
      <TitleButSer link="#todo">Stable Reserve</TitleButSer>
      <StableReserve />
      <hr />
      <SerHelpPlz>
        <p>
          Employers <a href="#">post jobs</a> on the JOB BOARD and Workers get
          paid in <a href="#">$COMMIT</a> tokens for completing jobs from the
          JOB BOARD.
        </p>
        <p>
          The <a href="#">STABLE RESERVE</a> is a vault that allows anyone to
          redeem hard-earned $COMMIT for $DAI at a 1:1 exchange or buy $COMMIT
          directly for $DAI at a premium.
        </p>
        <p>
          Workers can burn their hard earned $COMMIT by <a href="#">mine</a>{" "}
          <a href="#">VISION</a>
        </p>
      </SerHelpPlz>
    </Page>
  );
};

export default Work;
