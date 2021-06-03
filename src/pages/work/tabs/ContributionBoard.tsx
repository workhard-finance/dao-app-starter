import React, { useEffect, useState } from "react";
import { Card, Col, Nav, Row, Tab } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import { BigNumber } from "ethers";
import { ProjectBox } from "../../../components/contracts/contribution-board/ProjectBox";
import { CreateProject } from "../../../components/contracts/workhard/CreateProject";
import { prefix } from "../../../utils/utils";

export const ContributionBoard: React.FC = () => {
  const workhardCtx = useWorkhard();
  const history = useHistory();
  const { subtab, daoId } = useParams<{ subtab?: string; daoId?: string }>();
  // const { account, library, chainId } = useWeb3React();

  const [projects, setProjects] = useState<BigNumber[]>();

  const [lastFetched, setLastFetched] = useState<number>(0);
  const [lastCreated, setLastCreated] = useState<BigNumber>();
  const [tabKey, setTabKey] = useState<string>(subtab || "projects");

  // TODO listen ContributionBoard events and add dependency to useEffect()

  useEffect(() => {
    if (workhardCtx) {
      const { daoId, workhard } = workhardCtx;
      let stale = false;
      workhard
        .projectsOf(daoId)
        .then((n: BigNumber) => {
          if (n.eq(0)) {
            setTabKey("post");
          } else if (!stale) {
            for (let idx = lastFetched; idx < n.toNumber(); idx++) {
              workhard.projectsOfDAOByIndex(daoId, idx).then((projId) => {
                if (!projects?.find((v) => v.eq(projId))) {
                  setProjects([...(projects || []), projId]);
                }
              });
            }
            setLastFetched(n.toNumber());
          }
        })
        .catch(() => {
          if (!stale) {
            setProjects([]);
          }
        });

      return () => {
        stale = true;
        setProjects([]);
      };
    }
  }, [workhardCtx, lastCreated]); // ensures refresh if referential identity of library doesn't change across chainIds
  return (
    <Tab.Container activeKey={tabKey} onSelect={(k) => k && setTabKey(k)}>
      <Row>
        <Col sm={3}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="projects">Projects</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="post">Post a job</Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane
              eventKey="projects"
              onEnter={() => {
                history.push(prefix(daoId, "/work/job/projects"));
              }}
            >
              {projects ? (
                projects.length === 0 ? (
                  <p>No project exists! Post a new one :)</p>
                ) : (
                  projects.map((id) => (
                    <div key={id.toString()}>
                      <ProjectBox projId={id} active={true} />
                      <br />
                    </div>
                  ))
                )
              ) : (
                <p>Fetching...</p>
              )}
            </Tab.Pane>
            <Tab.Pane
              eventKey="post"
              onEnter={() => history.push(prefix(daoId, "/work/job/post"))}
            >
              <Card>
                <Card.Body>
                  <CreateProject onCreated={setLastCreated} />
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};
