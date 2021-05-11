import React, { useEffect, useState } from "react";
import Page from "../../../layouts/Page";
import { Button, Col, Image, Nav, Row, Tab, Tabs } from "react-bootstrap";
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
              {activeProjects.map((id) => (
                <div key={id.toString()}>
                  <ProjectBox projId={id} active={true} />
                  <br />
                </div>
              ))}
            </Tab.Pane>
            <Tab.Pane eventKey="inactiveProjects">
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
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};
