import React, { useEffect, useState } from "react";
import Page from "../../../layouts/Page";
import { Image, Tab, Tabs } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { Erc20Balance } from "../../../components/contracts/erc20/Erc20Balance";
import { BigNumber } from "ethers";
import { ContributionBoard } from "./ContributionBoard";
import StableReserve from "./StableReserve";
import { useParams } from "react-router-dom";
import { prefix } from "../../../utils/utils";

const Work: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const history = useHistory();
  const workhardCtx = useWorkhard();
  const { daoId } = workhardCtx || { daoId: 0 };

  const [activeProjects, setActiveProjects] = useState<string[]>(
    [] as string[]
  );
  const [inactiveProjects, setInactiveProjects] = useState<string[]>(
    [] as string[]
  );

  // TODO listen ContributionBoard events and add dependency to useEffect()

  useEffect(() => {
    if (!!workhardCtx) {
      let stale = false;
      const { contributionBoard } = workhardCtx.dao;
      workhardCtx.workhard
        .totalSupply()
        .then((n: BigNumber) => {
          if (!stale) {
            Array(n.toNumber())
              .fill(undefined)
              .map((_, i) => i.toString())
              .forEach((projId) => {
                contributionBoard.approvedProjects(projId).then((approved) => {
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
  }, [workhardCtx]); // ensures refresh if referential identity of library doesn't change across chainIds
  return (
    <Tabs defaultActiveKey={tab || "job"}>
      <Tab
        eventKey="job"
        title="Job Board"
        style={{ marginTop: "1rem" }}
        onEnter={() => history.push(prefix(daoId, "/work/job"))}
      >
        <ContributionBoard />
        {/* <Compensate projId={id} fund={fund} budgetOwner={budgetOwner} /> */}
      </Tab>
      <Tab
        eventKey="reserve"
        title="Stable Reserve"
        style={{ marginTop: "1rem" }}
        onEnter={() => history.push(prefix(daoId, "/work/reserve"))}
      >
        <StableReserve />
      </Tab>
    </Tabs>
  );
};

export default Work;
