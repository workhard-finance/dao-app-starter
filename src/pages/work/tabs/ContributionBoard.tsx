import React, { useEffect, useState } from "react";
import { Button, Card, Col, Nav, Row, Tab } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { Link, useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import { BigNumber } from "ethers";
import { ProjectBox } from "../../../components/contracts/contribution-board/ProjectBox";
import { CreateProject } from "../../../components/contracts/workhard/CreateProject";
import { prefix } from "../../../utils/utils";
import config from "../../../config.json";

export const ContributionBoard: React.FC = () => {
  const workhardCtx = useWorkhard();
  const history = useHistory();
  const { subtab } = useParams<{ subtab?: string }>();
  const { daoId } = workhardCtx || { daoId: 0 };
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
            setProjects([]);
            setTabKey("post");
          } else if (!stale) {
            const last = lastFetched;
            Promise.all(
              Array(n.toNumber() - last)
                .fill(undefined)
                .map((_, idx) =>
                  workhard.projectsOfDAOByIndex(daoId, idx + last)
                )
            ).then((fetched) => {
              setProjects([
                ...(projects || []),
                ...fetched.filter(
                  (projId) =>
                    !config.projects.banned.find((v) =>
                      BigNumber.from(v).eq(projId)
                    )
                ),
              ]);
            });
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
              <Nav.Link eventKey="post">Post a project</Nav.Link>
            </Nav.Item>
          </Nav>
          <hr />
          <Button
            variant="outline-info"
            as={"a"}
            href={"https://forum.workhard.finance"}
            target="_blank"
          >
            Do you have a project idea?
            <br />
            Go to workhard forum!
          </Button>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane
              eventKey="projects"
              onEnter={() => {
                history.push(prefix(daoId, "/work/job/projects"));
              }}
            >
              <Row>
                {projects ? (
                  projects.length === 0 ? (
                    <p>No project exists! Post a new one :)</p>
                  ) : (
                    projects.map((id) => (
                      <Col
                        md={4}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          history.push(prefix(daoId, `/proj/${id}`))
                        }
                      >
                        <ProjectBox projId={id} active={true} />
                        <br />
                      </Col>
                    ))
                  )
                ) : (
                  <p>Fetching...</p>
                )}
              </Row>
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
