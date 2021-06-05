import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Image,
  Button,
  Card,
  Badge,
} from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { UpdateDAO } from "../../../components/contracts/workhard/UpdateDAO";
import { Immortalize } from "../../../components/contracts/workhard/Immortalize";
import { useIPFS } from "../../../providers/IPFSProvider";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import {
  errorHandler,
  fetchProjectMetadataFromIPFS,
  ProjectMetadata,
  uriToURL,
} from "../../../utils/utils";

export const ProjectDetails: React.FC = () => {
  const { ipfs } = useIPFS();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();
  const { daoId } = workhardCtx || { daoId: 0 };
  const [metadata, setMetadata] = useState<ProjectMetadata>();
  const [immortalized, setImmortalized] = useState<boolean>();
  const [projectOwner, setProjectOwner] = useState<string>();

  useEffect(() => {
    if (!!workhardCtx && !!ipfs) {
      const projId = daoId || 0;
      workhardCtx.workhard
        .immortalized(projId)
        .then(setImmortalized)
        .catch(errorHandler(addToast));

      workhardCtx.workhard
        .tokenURI(projId)
        .then(async (uri) => {
          setMetadata(await fetchProjectMetadataFromIPFS(ipfs, uri));
        })
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, daoId, ipfs]);

  useEffect(() => {
    if (workhardCtx) {
      workhardCtx.workhard
        .ownerOf(daoId)
        .then(setProjectOwner)
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx]);
  return (
    <Container>
      <Card>
        <Card.Body>
          <Card.Title>Preview</Card.Title>
          <Row>
            <Col md={5}>
              <Image
                src={
                  metadata
                    ? uriToURL(metadata.image)
                    : process.env.PUBLIC_URL + "/images/daily-life.jpeg"
                }
                style={{ maxWidth: "100%" }}
              />
            </Col>
            <Col md={7}>
              <h2>
                What is <b>{metadata?.name}?</b>
              </h2>
              <p>{metadata?.description}</p>
              {immortalized && <Badge variant={`success`}>immortalized</Badge>}
              <br />
              {(daoId || 0) !== 0 && metadata?.url && (
                <Button
                  as={"a"}
                  href={metadata.url}
                  target="_blank"
                  variant="info"
                >
                  Go to app
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <br />
      {!immortalized && (
        <Card>
          <Card.Body>
            <Card.Title>Owner</Card.Title>
            <Card.Text>{projectOwner}</Card.Text>
            <br />
            <Card.Title>Immortalize URI</Card.Title>
            <Immortalize />
            <br />
            <Card.Title>Update URI</Card.Title>
            <UpdateDAO />
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};
