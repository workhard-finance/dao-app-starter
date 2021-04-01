import { useState, useEffect } from "react";
import { BigNumber, BigNumberish } from "ethers";
import {
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { formatEther } from "@ethersproject/units";
import { getAddress } from "@ethersproject/address";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { BudgetManage } from "../../../components/box/BudgetMange";

export interface ProjectProps {
  projId: BigNumberish;
}

export const ProjectBox: React.FC<ProjectProps> = ({ projId }) => {
  const { account, library, chainId } = useWeb3React();
  const contracts = useWorkhardContracts();

  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [fund, setFund] = useState("");
  const [budgetOwner, setBudgetOwner] = useState("");
  const [admin, toggleAdmin] = useState(false);
  useEffect(() => {
    if (!!account && !!library && !!chainId && !!contracts) {
      let stale = false;
      const { project, cryptoJobBoard } = contracts;
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
      cryptoJobBoard
        .projectFund(projId)
        .then((fund: BigNumber) => {
          if (!stale) setFund(formatEther(fund));
        })
        .catch(() => {
          if (!stale) setFund("Unknown");
        });

      return () => {
        stale = true;
        setDescription("Disconnected");
        setTitle("Disconnected");
        setFund("Disconnected");
      };
    }
  }, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <Card>
      <Card.Header as="h5">{title}</Card.Header>
      <Card.Body>
        <Card.Title>Fund</Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>
          {fund} $COMMITMENT {/*TODO compute in USD ($163710)*/}
        </Card.Text>
        <Card.Title>Details</Card.Title>
        <Card.Text>{description}</Card.Text>
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
        <hr />
        <OverlayTrigger
          // key={placement}
          // placement={placement}
          show={!admin}
          overlay={
            <Tooltip id={`tooltip-dispatchable-farmers`}>
              Only budget owner can call this function.
            </Tooltip>
          }
        >
          <Button
            variant={"outline-primary"}
            disabled={!admin}
            onClick={() => toggleAdmin(!admin)}
          >
            {admin ? "▲ Close" : "▼ Open"} budget owner tool
          </Button>
        </OverlayTrigger>
        {!!account && getAddress(account) === budgetOwner ? (
          <BudgetManage projId={projId} fund={fund} />
        ) : null}
      </Card.Body>
    </Card>
  );
};
