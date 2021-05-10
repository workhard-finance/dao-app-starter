import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Image, Tab, Tabs } from "react-bootstrap";
import { useWorkhardContracts } from "../../providers/WorkhardContractProvider";
import { BigNumber } from "ethers";
import JobBoard from "./JobBoard";
import StableReserve from "./StableReserve";

const Work: React.FC = () => {
  const contracts = useWorkhardContracts();
  // const { account, library, chainId } = useWeb3React();

  const [activeProjects, setActiveProjects] = useState<string[]>(
    [] as string[]
  );
  const [inactiveProjects, setInactiveProjects] = useState<string[]>(
    [] as string[]
  );

  // TODO listen JobBoard events and add dependency to useEffect()

  useEffect(() => {
    if (!!contracts) {
      let stale = false;
      const { project, jobBoard } = contracts;
      project
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
  }, [contracts]); // ensures refresh if referential identity of library doesn't change across chainIds
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
      {/* <blockquote className="blockquote" style={{ textAlign: "right" }}>
        <p className="mb-0">
          All men must work, even the rich, because to work was the will of God
        </p>
        <footer className="blockquote-footer">John Calvin</footer>
      </blockquote>
      <hr /> */}
      <Tabs defaultActiveKey="job-board">
        <Tab
          eventKey="job-board"
          title="Job Board"
          style={{ marginTop: "1rem" }}
        >
          <JobBoard />
          {/* <Compensate projId={id} fund={fund} budgetOwner={budgetOwner} /> */}
        </Tab>
        <Tab
          eventKey="stable-reserve"
          title="Stable Reserve"
          style={{ marginTop: "1rem" }}
        >
          <StableReserve />
        </Tab>
      </Tabs>
    </Page>
  );
};

export default Work;
