import React, { useEffect, useState } from "react";
import { Button, Col, Nav, Row, Tab } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { BigNumber } from "ethers";
import { ProjectBox } from "../../../components/contracts/job-board/ProjectBox";
import { PostAJobBox } from "../../../components/contracts/job-board/PostAJob";
import { BuyCommit } from "../../../components/contracts/stable-reserve/BuyCommit";
import { RedeemCommit } from "../../../components/contracts/stable-reserve/RedeemCommit";

export const JobBoard: React.FC = () => {
  const contracts = useWorkhardContracts();
  // const { account, library, chainId } = useWeb3React();

  const [activeProjects, setActiveProjects] = useState<BigNumber[]>(
    [] as BigNumber[]
  );
  const [inactiveProjects, setInactiveProjects] = useState<BigNumber[]>(
    [] as BigNumber[]
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
              .forEach((_, index) => {
                project.tokenByIndex(index).then((projId) => {
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
  }, [contracts]); // ensures refresh if referential identity of library doesn't change across chainIds
  return (
    <Tab.Container defaultActiveKey="activeProjects">
      <Row>
        <Col sm={3}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="activeProjects">Active projects</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="inactiveProjects">
                Inactive/pending projects
              </Nav.Link>
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
            <Tab.Pane eventKey="activeProjects">
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
            <Tab.Pane eventKey="inactiveProjects">
              {inactiveProjects.length === 0 && <p>Empty!</p>}
              {inactiveProjects.map((id) => (
                <div key={id.toString()}>
                  <ProjectBox projId={id} active={false} />
                  <br />
                </div>
              ))}
            </Tab.Pane>
            <Tab.Pane eventKey="post">
              <PostAJobBox />
            </Tab.Pane>
            <Tab.Pane
              eventKey="commit-token"
              title="$COMMIT"
              style={{ marginTop: "1rem" }}
            >
              <Row>
                <Col>
                  <BuyCommit />
                </Col>
                <Col>
                  <RedeemCommit />
                </Col>
              </Row>
              <br />
              <Button variant={"info"} children="Trade $COMMIT on Uniswap" />
            </Tab.Pane>
            <Tab.Pane eventKey="faq">
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
