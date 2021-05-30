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

  const [activeProjects, setActiveProjects] = useState<BigNumber[]>(
    [] as BigNumber[]
  );
  const [inactiveProjects, setInactiveProjects] = useState<BigNumber[]>(
    [] as BigNumber[]
  );

  // TODO listen ContributionBoard events and add dependency to useEffect()

  useEffect(() => {
    if (workhardCtx) {
      const { daoId, workhard, dao } = workhardCtx;
      let stale = false;
      const { contributionBoard } = dao;
      workhard
        .projectsOf(daoId)
        .then((n: BigNumber) => {
          if (!stale) {
            Array(n.toNumber())
              .fill(undefined)
              .forEach((_, index) => {
                workhard.projectsOfDAOByIndex(daoId, index).then((projId) => {
                  contributionBoard
                    .approvedProjects(projId)
                    .then((approved) => {
                      if (approved) {
                        if (!activeProjects.find((v) => v.eq(projId))) {
                          activeProjects.push(projId);
                          setActiveProjects(activeProjects);
                          setInactiveProjects(
                            inactiveProjects.filter((v) => !v.eq(projId))
                          );
                        }
                      } else {
                        if (!inactiveProjects.find((v) => v.eq(projId))) {
                          inactiveProjects.push(projId);
                          setInactiveProjects(inactiveProjects);
                          setActiveProjects(
                            activeProjects.filter((v) => !v.eq(projId))
                          );
                        }
                      }
                    });
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
    <Tab.Container defaultActiveKey={subtab || "active"}>
      <Row>
        <Col sm={3}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="active">Active projects</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="pending">Inactive/pending projects</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="post">Post a job</Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane
              eventKey="active"
              onEnter={() => history.push(prefix(daoId, "/work/job/active"))}
            >
              {activeProjects.length === 0 && (
                <p>
                  No active project exists! Post a new one or approve the
                  pending projects.
                </p>
              )}
              {activeProjects.map((id) => (
                <div key={id.toString()}>
                  <ProjectBox projId={id} active={true} />
                  <br />
                </div>
              ))}
            </Tab.Pane>
            <Tab.Pane
              eventKey="pending"
              onEnter={() => history.push(prefix(daoId, "/work/job/pending"))}
            >
              {inactiveProjects.length === 0 && <p>Empty!</p>}
              {inactiveProjects.map((id) => (
                <div key={id.toString()}>
                  <ProjectBox projId={id} active={false} />
                  <br />
                </div>
              ))}
            </Tab.Pane>
            <Tab.Pane
              eventKey="post"
              onEnter={() => history.push(prefix(daoId, "/work/job/post"))}
            >
              <Card>
                <Card.Body>
                  <CreateProject />
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};
