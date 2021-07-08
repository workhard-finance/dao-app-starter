import React, { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import ReactHtmlParser from "react-html-parser";
import { Card, Row, Col, Image, Badge } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import {
  bigNumToFixed,
  errorHandler,
  fetchProjectMetadataFromIPFS,
  ProjectMetadata,
  uriToURL,
  wrapUrl,
} from "../../../utils/utils";
import { useIPFS } from "../../../providers/IPFSProvider";
import { useToasts } from "react-toast-notifications";
import { getNetworkName } from "@workhard/protocol";
import { OverlayTooltip } from "../../OverlayTooltip";

export interface ProjectProps {
  projId: BigNumber;
  active: boolean;
}

export const ProjectBox: React.FC<ProjectProps> = ({ projId, active }) => {
  const { account, library, chainId } = useWeb3React();
  const { ipfs } = useIPFS();
  const workhardCtx = useWorkhard();
  const { daoId } = workhardCtx || { daoId: 0 };
  const { addToast } = useToasts();

  const [fund, setFund] = useState<BigNumber>();
  const [budgetOwner, setBudgetOwner] = useState<string>();
  const [metadata, setMeatadata] = useState<ProjectMetadata>();
  const [minimumShare, setMinimumShare] = useState<BigNumber>();
  const [ownedByMultisig, setOwnedByMultisig] = useState<boolean>();

  useEffect(() => {
    if (!!account && !!library && !!chainId && !!workhardCtx && !!ipfs) {
      const { contributionBoard } = workhardCtx.dao;
      workhardCtx.project
        .tokenURI(projId)
        .then(async (uri) => {
          setMeatadata(await fetchProjectMetadataFromIPFS(ipfs, uri));
        })
        .catch(errorHandler(addToast));
      contributionBoard
        .projectFund(projId)
        .then(setFund)
        .catch(errorHandler(addToast));

      contributionBoard
        .minimumShare(projId)
        .then(setMinimumShare)
        .catch(errorHandler(addToast));
      workhardCtx.project.ownerOf(projId).then((owner) => {
        setBudgetOwner(owner);
        const network = getNetworkName(chainId);
        const gnosisAPI =
          network === "mainnet"
            ? `https://safe-transaction.gnosis.io/api/v1/`
            : network === "rinkeby"
            ? `https://safe-transaction.rinkeby.gnosis.io/api/v1/`
            : undefined;

        if (gnosisAPI) {
          fetch(gnosisAPI + `safes/${owner}/`)
            .then(async (response) => {
              const result = await response.json();
              if ((result.owners as string[]).length > 0) {
                setOwnedByMultisig(true);
              }
            })
            .catch((_) => {
              setOwnedByMultisig(false);
            });
        } else {
          setOwnedByMultisig(false);
        }
      });
    }
  }, [account, library, chainId, workhardCtx]); // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <Card style={{ height: "22.5rem" }}>
      <Card.Header>
        #{projId.toNumber()} {metadata?.name}
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={12} style={{ marginBottom: "1rem" }}>
            <Card.Title>Fund</Card.Title>
            <Card.Text>
              <span style={{ fontSize: "1.4rem" }}>
                {bigNumToFixed(fund || 0)}
              </span>{" "}
              {workhardCtx?.metadata.commitSymbol || `$COMMIT`}{" "}
              {/*TODO compute in USD ($163710)*/}
            </Card.Text>
          </Col>
          <Card
            style={{
              position: "absolute",
              right: "1rem",
              top: "4rem",
              width: "5rem",
            }}
          >
            <Image
              src={uriToURL(
                metadata?.image ||
                  "QmZ6WAhrUArQPQHQZFJBaQnHDcu5MhcrnfyfX4uwLHWMj1"
              )}
            />
          </Card>
          <Col md={12} style={{ marginBottom: "1rem" }}>
            <Card.Title>Details</Card.Title>
            <Card.Text style={{ overflow: "auto", height: "5rem" }}>
              {ReactHtmlParser(wrapUrl(metadata?.description || ""))}
            </Card.Text>
            {minimumShare && minimumShare.gt(0) && (
              <OverlayTooltip
                tip={`This project will share its emission with who contributed or funded.`}
              >
                <Badge variant={`success`} style={{ marginBottom: "0.2rem" }}>
                  initial contributor program
                </Badge>
              </OverlayTooltip>
            )}
            {"  "}
            <Badge variant={ownedByMultisig ? `success` : "danger"}>
              {ownedByMultisig ? `managed by multisig` : "managed by EOA"}
            </Badge>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};
