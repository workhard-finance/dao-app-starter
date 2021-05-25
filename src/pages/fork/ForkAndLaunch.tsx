import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";

import { Row, Col, Card, Button, Accordion, Container } from "react-bootstrap";
import { Link, useHistory, useParams } from "react-router-dom";
import { CreateProject } from "../../components/contracts/workhard/CreateProject";
import { LaunchDAO } from "../../components/contracts/workhard/LaunchDAO";
import { UpgradeToDAO } from "../../components/contracts/workhard/UpgradeToDAO";
import { DevGuide } from "./DevGuide";
import { useWorkhard } from "../../providers/WorkhardProvider";

export const ForkAndLaunch: React.FC = () => {
  const history = useHistory();
  const { step, projId } = useParams<{ step: string; projId?: string }>();
  const workhardCtx = useWorkhard();
  const [id, setId] = useState<string>();

  useEffect(() => {
    if (workhardCtx && projId && !Number.isNaN(parseInt(projId))) {
      const { workhard } = workhardCtx;
      workhard
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
                  to={`/fork/new/${id || ""}`}
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
                    onCreated={(id) =>
                      history.push(`/fork/upgrade/${id.toNumber()}`)
                    }
                  />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Card.Header>
                <Accordion.Toggle
                  as={Link}
                  to={`/fork/upgrade/${id || ""}`}
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
                    onUpgraded={() => history.push(`/fork/launch/${id || ""}`)}
                  />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Card.Header>
                <Accordion.Toggle
                  as={Link}
                  to={`/fork/launch/${id || ""}`}
                  eventKey={`launch`}
                  className={step === "launch" ? "text-primary" : "text-muted"}
                >
                  Step3. Setup emission and launch.
                </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey={`launch`}>
                <Card.Body>
                  <LaunchDAO id={id} onLaunched={() => history.push(`/fork`)} />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Card.Header>
                <Accordion.Toggle
                  as={Link}
                  to={`/fork/connect/${id || ""}`}
                  eventKey={`connect`}
                  className={step === "connect" ? "text-primary" : "text-muted"}
                >
                  Step4. Connnect your revenue stream!
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
