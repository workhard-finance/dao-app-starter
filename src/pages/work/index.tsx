import React from "react";
import Page from "../../layouts/Page";
import { Image } from "react-bootstrap";
import StableReserve from "./tabs/StableReserve";
import { ContributionBoard } from "./tabs/ContributionBoard";
import { SerHelpPlz } from "../../components/views/HelpSer";
import { TitleButSer } from "../../components/views/TitleButSer";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { OverlayTooltip } from "../../components/OverlayTooltip";

const Work: React.FC = () => {
  const workhardCtx = useWorkhard();

  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/work.jpg"}
        style={{
          width: "100%",
          padding: "0px",
          borderWidth: "5px",
        }}
      />
      <p></p>
      <hr />
      <TitleButSer link="#todo">
        Projects
        <OverlayTooltip
          tip={`Put your back into it fellow Worker! Earn some honest ${
            workhardCtx && workhardCtx.daoId !== 0
              ? `${workhardCtx.metadata.commitName}(COMMIT)`
              : `$COMMIT`
          } wages from a JOB`}
          text="❔"
        />
      </TitleButSer>
      <br />
      <ContributionBoard />
      <hr />
      <TitleButSer link="#todo">
        Stable Reserve
        <OverlayTooltip
          tip={
            "Monetize your commitment here! You can exchange your commitment to a stable coin or buy them at a premium instead of working!"
          }
          text="❔"
        />
      </TitleButSer>
      <StableReserve />
      <hr />
      <SerHelpPlz>
        <p>
          Employers <a href="#">post jobs</a> on the JOB BOARD and Workers get
          paid in{" "}
          <a href="#">{workhardCtx?.metadata.commitSymbol || `$COMMIT`}</a>{" "}
          tokens for completing jobs from the JOB BOARD.
        </p>
        <p>
          The <a href="#">STABLE RESERVE</a> is a vault that allows anyone to
          redeem hard-earned {workhardCtx?.metadata.commitSymbol || `$COMMIT`}{" "}
          for $DAI at a 1:1 exchange or buy{" "}
          {workhardCtx?.metadata.commitSymbol || `$COMMIT`} directly for{" "}
          {workhardCtx?.metadata.baseCurrencySymbol || `$DAI`} at a premium.
        </p>
        <p>
          Workers can burn their hard earned{" "}
          {workhardCtx?.metadata.commitSymbol || `$COMMIT`} by{" "}
          <a href="#">mine</a>{" "}
          <a href="#">{workhardCtx?.metadata.visionSymbol || `$VISION`}</a>
        </p>
      </SerHelpPlz>
    </Page>
  );
};

export default Work;
