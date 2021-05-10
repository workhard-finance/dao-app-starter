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

export interface ProjectProps {
  projId: BigNumberish;
  active: boolean;
}

export const ProjectBox: React.FC<ProjectProps> = ({ projId, active }) => {
  const { account, library, chainId } = useWeb3React();
  const contracts = useWorkhardContracts();

  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [fund, setFund] = useState<BigNumber>();
  const [budgetOwner, setBudgetOwner] = useState("");

  useEffect(() => {
    if (!!account && !!library && !!chainId && !!contracts) {
      let stale = false;
      const { project, stableReserve: stableReserve } = contracts;
      project
        .titles(projId)
        .then((t: string) => {
          if (!stale) setTitle(t);
        })
        .catch(() => {
          if (!stale) setTitle("Unknown");
        });
      project
        .jobDescription(projId)
        .then((desc: string) => {
          if (!stale) setDescription(desc);
        })
        .catch(() => {
          if (!stale) setDescription("Unknown");
        });
      project
        .ownerOf(projId)
        .then((owner: string) => {
          if (!stale) setBudgetOwner(getAddress(owner));
        })
        .catch(() => {
          if (!stale) setBudgetOwner("");
        });
      stableReserve
        .projectFund(projId)
        .then((fund: BigNumber) => {
          if (!stale) setFund(fund);
        })
        .catch(() => {
          if (!stale) setFund(undefined);
        });

      return () => {
        stale = true;
        setDescription("Disconnected");
        setTitle("Disconnected");
        setFund(undefined);
      };
    }
  }, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <Card>
      <Card.Header as="h5">{title}</Card.Header>
      <Card.Body>
        <Card.Title>Fund</Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>
          {formatEther(fund || 0)} $COMMIT {/*TODO compute in USD ($163710)*/}
        </Card.Text>
        <Card.Title>Details</Card.Title>
        <Card.Text>{ReactHtmlParser(wrapUrl(description))}</Card.Text>
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
