import React, { useEffect, useState } from "react";
import { Card, Col, Nav, Row, Tab } from "react-bootstrap";
import { useWorkhard, WorkhardCtx } from "../../../providers/WorkhardProvider";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import { BigNumber } from "ethers";
import { ProjectBox } from "../../../components/contracts/job-board/ProjectBox";
import { CreateProject } from "../../../components/contracts/workhard/CreateProject";

export const JobBoard: React.FC = () => {
  const workhardCtx = useWorkhard();
  const history = useHistory();
  const { subtab } = useParams<{ subtab?: string; daoId?: string }>();
  // const { account, library, chainId } = useWeb3React();

  const [activeProjects, setActiveProjects] = useState<BigNumber[]>(
    [] as BigNumber[]
  );
  const [inactiveProjects, setInactiveProjects] = useState<BigNumber[]>(
    [] as BigNumber[]
  );

  // TODO listen JobBoard events and add dependency to useEffect()

  useEffect(() => {
    if (workhardCtx) {
      const { daoId, workhard, dao } = workhardCtx;
      let stale = false;
      const { jobBoard } = dao;
      workhard
        .projectsOf(daoId)
        .then((n: BigNumber) => {
          if (!stale) {
            Array(n.toNumber())
              .fill(undefined)
              .forEach((_, index) => {
                workhard.projectsOfDAOByIndex(daoId, index).then((projId) => {
                  jobBoard.approvedProjects(projId).then((approved) => {
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
            <Nav.Item>
              <Nav.Link eventKey="faq">FAQ</Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane
              eventKey="active"
              onEnter={() => history.push("/work/job/active")}
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
              onEnter={() => history.push("/work/job/pending")}
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
              onEnter={() => history.push("/work/job/post")}
            >
              <Card>
                <Card.Header as="h5">Post a crypto job</Card.Header>
                <Card.Body>
                  <CreateProject />
                </Card.Body>
              </Card>
            </Tab.Pane>
            <Tab.Pane
              eventKey="faq"
              onEnter={() => history.push("/work/job/faq")}
            >
              <h5>
                <strong>How can I work?</strong>
              </h5>
              <p>
                You can get in touch with the budget owner via the url on the
                job post. Or, visit Workhard's official discord channel to get
                more information.
              </p>
              <h5>
                <strong>How can I post a job?</strong>
              </h5>
              <p>
                An approved project's budget owner has an ability to mint
                $COMMIT tokens by reserving stable coins. To manage the abusing
                usage of the job board, governance(Workers Union) can approve or
                disapprove project. Therefore, to get whitelisted, visit
                Workhard discord channel and explain your plan to people first.
              </p>
              <h5>
                <strong>How can my posted job get approved?</strong>
              </h5>
              <p>
                For the first 4 weeks after the launch date, dev's multisig
                wallet has the control for the approval and disapproval of a
                post. After 4 weeks, Workers Union decides it via onchain
                voting.
              </p>
              <h5>
                <strong>How to use this job board?</strong>
              </h5>
              <p>
                App shows "project admin tool" menu to the budget owner. In the
                admin tool, you can compensate people with $COMMIT and the
                contributors can use $COMMIT to redeem for $DAI or burn to get
                $VISION.
              </p>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};
