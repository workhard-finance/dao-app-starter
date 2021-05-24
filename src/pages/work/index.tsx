import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Image } from "react-bootstrap";
import { useWorkhard } from "../../providers/WorkhardProvider";
import WorkTabs from "./tabs";
import { BigNumber } from "ethers";
import { useParams } from "react-router-dom";

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
      {/* <blockquote className="blockquote" style={{ textAlign: "right" }}>
        <p className="mb-0">
          All men must work, even the rich, because to work was the will of God
        </p>
        <footer className="blockquote-footer">John Calvin</footer>
      </blockquote>
      <hr /> */}
      <WorkTabs />
    </Page>
  );
};

export default Work;
