import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Image } from "react-bootstrap";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { BigNumber } from "ethers";
import { useParams } from "react-router-dom";
import StableReserve from "./tabs/StableReserve";
import { JobBoard } from "./tabs/JobBoard";
import { SerHelpPlz } from "../../components/views/HelpSer";

const Work: React.FC = () => {
  const { daoId } = useParams<{ tab?: string; daoId?: string }>();
  const { workhard, dao } = useWorkhard() || {};

  const [activeProjects, setActiveProjects] = useState<string[]>(
    [] as string[]
  );
  const [inactiveProjects, setInactiveProjects] = useState<string[]>(
    [] as string[]
  );

  // TODO listen JobBoard events and add dependency to useEffect()

  useEffect(() => {
    if (!!dao && !!workhard) {
      let stale = false;
      const { jobBoard } = dao;
      workhard
        .totalSupply()
        .then((n: BigNumber) => {
          if (!stale) {
            Array(n.toNumber())
              .fill(undefined)
              .map((_, i) => i.toString())
              .forEach((projId) => {
                jobBoard.approvedProjects(projId).then((approved) => {
                  if (approved) {
                    activeProjects.push(projId);
                    setActiveProjects([...new Set(activeProjects)]);
                  } else {
                    inactiveProjects.push(projId);
                    setInactiveProjects([...new Set(inactiveProjects)]);
                  }
                });
              });
          }
        })
        .catch(() => {
          if (!stale) {
            setActiveProjects([]);
            setInactiveProjects([]);
          }
        });

      return () => {
        stale = true;
        setActiveProjects([]);
        setInactiveProjects([]);
      };
    }
  }, [dao]); // ensures refresh if referential identity of library doesn't change across chainIds
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
      <h2>
        <b>Job Board</b>
      </h2>
      <br />
      <JobBoard />
      {/* <blockquote className="blockquote" style={{ textAlign: "right" }}>
        <p className="mb-0">
          All men must work, even the rich, because to work was the will of God
        </p>
        <footer className="blockquote-footer">John Calvin</footer>
      </blockquote>
      <hr /> */}
      {/* <WorkTabs /> */}
      <hr />
      <h2>
        <b>Stable Reserve</b>
      </h2>
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
