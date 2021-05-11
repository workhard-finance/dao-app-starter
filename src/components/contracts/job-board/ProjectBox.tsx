import React, { useState, useEffect } from "react";
import { BigNumber, BigNumberish } from "ethers";
import { formatEther } from "ethers/lib/utils";
import ReactHtmlParser from "react-html-parser";
import { Card, Button } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { getAddress } from "@ethersproject/address";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { Link } from "react-router-dom";
import { wrapUrl } from "../../../utils/utils";
import { ConditionalButton } from "../../ConditionalButton";
import { useIPFS } from "../../../providers/IPFSProvider";

export interface ProjectProps {
  projId: BigNumber;
  active: boolean;
}

export interface ProjectMetadata {
  name: string;
  description: string;
  image: string;
  url?: string;
}

export const ProjectBox: React.FC<ProjectProps> = ({ projId, active }) => {
  const { account, library, chainId } = useWeb3React();
  const { ipfs } = useIPFS();
  const contracts = useWorkhardContracts();

  const [fund, setFund] = useState<BigNumber>();
  const [budgetOwner, setBudgetOwner] = useState<string>();
  const [metadata, setMeatadata] = useState<ProjectMetadata>();

  useEffect(() => {
    if (!!account && !!library && !!chainId && !!contracts && !!ipfs) {
      let stale = false;
      const { project, jobBoard } = contracts;
      project.ownerOf(projId).then(setBudgetOwner);
      project.tokenURI(projId).then(async (uri) => {
        let result = "";
        for await (const chunk of ipfs.cat(uri.replace("ipfs://", ""))) {
          result += chunk;
        }
        const metadata = JSON.parse(result) as ProjectMetadata;
        setMeatadata(metadata);
      });
      jobBoard
        .projectFund(projId)
        .then((fund: BigNumber) => {
          if (!stale) setFund(fund);
        })
        .catch(() => {
          if (!stale) setFund(undefined);
        });

      return () => {
        stale = true;
        setMeatadata(undefined);
        setFund(undefined);
      };
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
