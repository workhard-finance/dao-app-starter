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
import { Card, Button } from "react-bootstrap";

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
  const history = useHistory();
  const { addToast } = useToasts();
  const { ipfs } = useIPFS();
  const [daoMetadata, setDAOMetadata] = useState<DAOMetadata | undefined>(
    metadata
  );
  const [imageURI, setImageURI] = useState<string>();

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
        })
        .catch(errorHandler(addToast));
    }
  }, [ipfs, daoMetadata]);

  return (
    <Card onClick={onClick} style={{ cursor: onClick ? "pointer" : undefined }}>
      <Card.Img
        style={{ borderRadius: 0 }}
        src={uriToURL(
          imageURI || "QmZ6WAhrUArQPQHQZFJBaQnHDcu5MhcrnfyfX4uwLHWMj1"
        )}
      />
      <Card.Footer>
        {daoMetadata?.name}({daoMetadata?.symbol})
      </Card.Footer>
    </Card>
  );
};
