import React, { useState, useEffect } from "react";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { BigNumberish } from "@ethersproject/bignumber";
import { useHistory } from "react-router-dom";
import {
  errorHandler,
  fetchProjectMetadataFromIPFS,
  uriToURL,
} from "../../../utils/utils";
import { useToasts } from "react-toast-notifications";
import { useIPFS } from "../../../providers/IPFSProvider";
import { Card, Button, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";

export interface DAOThumbnailProps {
  daoId?: BigNumberish;
  metadata?: DAOMetadata;
  onClick?: () => void;
}

export interface DAOMetadata {
  name: string;
  symbol: string;
  uri: string;
}

export const DAOThumbnail: React.FC<DAOThumbnailProps> = ({
  daoId,
  metadata,
  onClick,
}) => {
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();
  const { ipfs } = useIPFS();
  const [daoMetadata, setDAOMetadata] = useState<DAOMetadata | undefined>(
    metadata
  );
  const [imageURI, setImageURI] = useState<string>();
  const [description, setDescription] = useState<string>();

  useEffect(() => {
    if (workhardCtx && daoId) {
      const { workhard } = workhardCtx;
      Promise.all([
        workhard.nameOf(daoId),
        workhard.symbolOf(daoId),
        workhard.tokenURI(daoId),
      ])
        .then(([name, symbol, uri]) => {
          setDAOMetadata({
            name,
            symbol,
            uri,
          });
        })
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx]);

  useEffect(() => {
    if (ipfs && daoMetadata) {
      fetchProjectMetadataFromIPFS(ipfs, daoMetadata.uri)
        .then((projectMetadata) => {
          setImageURI(projectMetadata.image);
          setDescription(projectMetadata.description);
        })
        .catch(errorHandler(addToast));
    }
  }, [ipfs, daoMetadata]);

  return (
    <Card onClick={onClick} style={{ cursor: onClick ? "pointer" : undefined }}>
      <Card.Body>
        <Row>
          <Col xs={5}>
            <Card>
              <Card.Img
                style={{ borderRadius: 0 }}
                src={uriToURL(
                  imageURI || "QmZ6WAhrUArQPQHQZFJBaQnHDcu5MhcrnfyfX4uwLHWMj1"
                )}
              />
            </Card>
          </Col>
          <Col xs={7} style={{ height: "5rem" }}>
            <p style={{ overflow: "auto", maxHeight: "100%" }}>{description}</p>
          </Col>
        </Row>
      </Card.Body>

      <Card.Footer>
        {daoMetadata?.name}({daoMetadata?.symbol})
      </Card.Footer>
    </Card>
  );
};
