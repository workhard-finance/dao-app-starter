import React, { useState, useEffect } from "react";
import { BigNumber, BigNumberish } from "ethers";
import { formatEther } from "ethers/lib/utils";
import ReactHtmlParser from "react-html-parser";
import { Card, Button } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { getAddress } from "@ethersproject/address";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { Link } from "react-router-dom";
import {
  errorHandler,
  fetchProjectMetadataFromIPFS,
  ProjectMetadata,
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
  const { ipfs } = useIPFS();
  const contracts = useWorkhardContracts();
  const { addToast } = useToasts();

  const [fund, setFund] = useState<BigNumber>();
  const [budgetOwner, setBudgetOwner] = useState<string>();
  const [metadata, setMeatadata] = useState<ProjectMetadata>();

  useEffect(() => {
    if (!!account && !!library && !!chainId && !!contracts && !!ipfs) {
      const { project, jobBoard } = contracts;
      project
        .ownerOf(projId)
        .then(setBudgetOwner)
        .catch(errorHandler(addToast));
      project
        .tokenURI(projId)
        .then(async (uri) => {
          setMeatadata(await fetchProjectMetadataFromIPFS(ipfs, uri));
        })
        .catch(errorHandler(addToast));
      jobBoard.projectFund(projId).then(setFund).catch(errorHandler(addToast));
    }
  }, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <Card>
      <Card.Header as="h5">{metadata?.name}</Card.Header>
      <Card.Body>
        <Card.Title>Project ID</Card.Title>
        <Card.Text>{projId.toHexString()}</Card.Text>
        <Card.Title>Fund</Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>
          {formatEther(fund || 0)} $COMMIT {/*TODO compute in USD ($163710)*/}
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
        <ConditionalButton
          as={budgetOwner === account ? Link : Button}
          to={`/proj/${projId}`}
          variant={"primary"}
          enabledWhen={account === budgetOwner ? false : undefined}
          whyDisabled={"Please log in with budget owner account."}
          children={"Go to admin tool"}
        />
      </Card.Body>
    </Card>
  );
};
