import React, { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import { formatEther } from "ethers/lib/utils";
import ReactHtmlParser from "react-html-parser";
import { Card, Button, Row, Col, Image } from "react-bootstrap";
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

export interface ProjectProps {
  projId: BigNumber;
  active: boolean;
}

export const ProjectBox: React.FC<ProjectProps> = ({ projId, active }) => {
  const { account, library, chainId } = useWeb3React();
  const { daoId } = useParams<{ daoId?: string }>();
  const { ipfs } = useIPFS();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();

  const [fund, setFund] = useState<BigNumber>();
  const [budgetOwner, setBudgetOwner] = useState<string>();
  const [metadata, setMeatadata] = useState<ProjectMetadata>();

  useEffect(() => {
    if (!!account && !!library && !!chainId && !!workhardCtx && !!ipfs) {
      const { contributionBoard } = workhardCtx.dao;
      workhardCtx.workhard
        .ownerOf(projId)
        .then(setBudgetOwner)
        .catch(errorHandler(addToast));
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
            <Card.Text style={{ fontSize: "3rem" }}>
              {formatEther(fund || 0)}{" "}
              {workhardCtx?.metadata.commitSymbol || `$COMMIT`}{" "}
              {/*TODO compute in USD ($163710)*/}
            </Card.Text>
            <Card.Title>Details</Card.Title>
            <Card.Text>
              {ReactHtmlParser(wrapUrl(metadata?.description || ""))}
            </Card.Text>
            <Card.Title>Budget owner</Card.Title>
            <Card.Text>
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://etherscan.com/address/${budgetOwner}`}
              >
                {budgetOwner}
              </a>
            </Card.Text>
            <Button
              as={Link}
              to={prefix(daoId, `/proj/${projId}`)}
              variant={"primary"}
              children={"Go to budget tool"}
            />{" "}
            <ConditionalButton
              as={budgetOwner === account ? Link : Button}
              to={`/dao/upgrade/${projId}`}
              variant={"warning"}
              enabledWhen={account === budgetOwner ? false : undefined}
              whyDisabled={"Please log in with budget owner account."}
              children={"Upgrade to DAO"}
            />{" "}
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
