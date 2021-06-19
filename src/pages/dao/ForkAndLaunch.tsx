import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";

import { Row, Col, Card, Button, Accordion, Container } from "react-bootstrap";
import { Link, useHistory, useParams } from "react-router-dom";
import { CreateProject } from "../../components/contracts/workhard/CreateProject";
import { LaunchDAO } from "../../components/contracts/workhard/LaunchDAO";
import { UpgradeToDAO } from "../../components/contracts/workhard/UpgradeToDAO";
import { DevGuide } from "./DevGuide";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { InitialContribution } from "../../components/contracts/workhard/InitialContribution";

export const ForkAndLaunch: React.FC = () => {
  const history = useHistory();
  const { step, projId } = useParams<{ step: string; projId?: string }>();
  const workhardCtx = useWorkhard();
  const [id, setId] = useState<string>();

  useEffect(() => {
    if (workhardCtx && projId && !Number.isNaN(parseInt(projId))) {
      const { project } = workhardCtx;
      project
        .ownerOf(projId)
        .then(() => {
          setId(projId);
        })
        .catch((_) => {
          setId(undefined);
        });
    } else {
      setId(undefined);
    }
  }, [workhardCtx, id]);

  return (
    <Page>
      <Row>
        <Col md={8}>
          <h1>
            Start <b>DAO</b> with <b>Commit Mining</b>
          </h1>
        </Col>
        <Col md={{ span: 4 }} style={{ textAlign: "end" }}>
          <Button
            variant="outline-primary"
            onClick={() => history.goBack()}
            children={"Go back"}
          />
        </Col>
      </Row>
      <hr />
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <Accordion activeKey={step}>
            <Card>
              <Card.Header>
                <Accordion.Toggle
                  as={Link}
                  to={`/dao/new/${projId || ""}`}
                  eventKey={"new"}
                  className={step === "new" ? "text-primary" : "text-muted"}
                >
                  Step 1. Create a project.
                </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey={"new"} appear={true}>
                <Card.Body>
                  <p>
                    Do you already have a project?{" "}
                    <Link to={`/work/job`}>Go to project menu</Link> and click
                    upgrade! Or create a new one here!
                  </p>
                  <CreateProject
                    onCreated={(id) => {
                      setId(id.toString());
                      history.push(`/dao/upgrade/${id.toNumber()}`);
                    }}
                  />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Card.Header>
                <Accordion.Toggle
                  as={Link}
                  to={`/dao/upgrade/${projId || ""}`}
                  eventKey={"upgrade"}
                  className={step === "upgrade" ? "text-primary" : "text-muted"}
                >
                  Step2. Upgrade it to a DAO.
                </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey={`upgrade`}>
                <Card.Body>
                  <UpgradeToDAO
                    id={id}
                    onUpgraded={() =>
                      history.push(`/dao/initial-contribution/${id || ""}`)
                    }
                  />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Card.Header>
                <Accordion.Toggle
                  as={Link}
                  to={`/dao/initial-contribution/${projId || ""}`}
                  eventKey={"initial-contribution"}
                  className={
                    step === "initial-contribution"
                      ? "text-primary"
                      : "text-muted"
                  }
                >
                  Step3. Setup shares for initial contributors.
                </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey={"initial-contribution"}>
                <Card.Body>
                  <InitialContribution
                    id={id}
                    onSetup={() => history.push(`/dao/launch/${projId || ""}`)}
                  />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Card.Header>
                <Accordion.Toggle
                  as={Link}
                  to={`/dao/launch/${projId || ""}`}
                  eventKey={`launch`}
                  className={step === "launch" ? "text-primary" : "text-muted"}
                >
                  Step4. Allocate emissions and launch.
                </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey={`launch`}>
                <Card.Body>
                  <LaunchDAO id={id} onLaunched={() => history.push(`/dao`)} />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Card.Header>
                <Accordion.Toggle
                  as={Link}
                  to={`/dao/connect/${projId || ""}`}
                  eventKey={`connect`}
                  className={step === "connect" ? "text-primary" : "text-muted"}
                >
                  Step5. Connnect your revenue stream!
                </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey={`connect`}>
                <Card.Body>
                  <DevGuide />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          </Accordion>
        </Col>
      </Row>
    </Page>
  );
};
