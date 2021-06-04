import React, { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import { formatEther, getIcapAddress } from "ethers/lib/utils";
import ReactHtmlParser from "react-html-parser";
import { Card, Button, Row, Col, Image, Badge } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { Link, useParams } from "react-router-dom";
import {
  errorHandler,
  fetchProjectMetadataFromIPFS,
  prefix,
  ProjectMetadata,
  uriToURL,
  wrapUrl,
} from "../../../utils/utils";
import { ConditionalButton } from "../../ConditionalButton";
import { useIPFS } from "../../../providers/IPFSProvider";
import { useToasts } from "react-toast-notifications";
import { getNetworkName } from "@workhard/protocol";

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
      workhardCtx.workhard
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
      workhardCtx.workhard.ownerOf(projId).then((owner) => {
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
    <Card>
      <Card.Header>
        #{projId.toNumber()} {metadata?.name}
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={8}>
            <Card.Title>Fund</Card.Title>
            <Card.Text style={{ fontSize: "2rem" }}>
              {formatEther(fund || 0)}{" "}
              {workhardCtx?.metadata.commitSymbol || `$COMMIT`}{" "}
              {/*TODO compute in USD ($163710)*/}
            </Card.Text>
            <Card.Title>Details</Card.Title>
            <Card.Text>
              {ReactHtmlParser(wrapUrl(metadata?.description || ""))}
            </Card.Text>
            {minimumShare && minimumShare.gt(0) && (
              <Badge variant={`success`}>initial contributor program</Badge>
            )}{" "}
            <Badge variant={ownedByMultisig ? `success` : "danger"}>
              {ownedByMultisig ? `managed by multisig` : "managed by EOA"}
            </Badge>
            <br />
            <br />
            <Button
              as={Link}
              to={prefix(daoId, `/proj/${projId}`)}
              variant={"primary"}
              children={"Go to project"}
            />
          </Col>
          <Col md={4}>
            <Card>
              <Image
                src={uriToURL(
                  metadata?.image ||
                    "QmZ6WAhrUArQPQHQZFJBaQnHDcu5MhcrnfyfX4uwLHWMj1"
                )}
              />
            </Card>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};
