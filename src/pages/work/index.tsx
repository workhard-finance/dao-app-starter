import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Image, Tab, Tabs } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { useWorkhardContracts } from "../../providers/WorkhardContractProvider";
import { Erc20Balance } from "../../components/contracts/erc20/Erc20Balance";
import { BigNumber } from "ethers";
import { JobBoard } from "./tabs/JobBoard";
import StableReserve from "./StableReserve";
import { useParams } from "react-router-dom";

const Work: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const history = useHistory();
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
      <Tabs defaultActiveKey={tab || "commit"}>
        <Tab
          eventKey="commit"
          title="$COMMIT"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push("/work/commit")}
        >
          <Erc20Balance
            address={contracts?.commit.address}
            symbolAlt={"COMMIT"}
          />
        </Tab>
        <Tab
          eventKey="job"
          title="Job Board"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push("/work/job")}
        >
          <JobBoard />
          {/* <Compensate projId={id} fund={fund} budgetOwner={budgetOwner} /> */}
        </Tab>
        <Tab
          eventKey="reserve"
          title="Stable Reserve"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push("/work/reserve")}
        >
          <StableReserve />
        </Tab>
      </Tabs>
    </Page>
  );
};

export default Work;
