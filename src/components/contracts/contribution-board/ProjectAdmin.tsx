import React, { useState } from "react";
import { BigNumberish } from "ethers";
import { Button, Card, Container, Form } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../ConditionalButton";
import { handleTransaction, TxStatus } from "../../../utils/utils";
import { useToasts } from "react-toast-notifications";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { RecordContribution } from "./RecordContribution";
import { Link } from "react-router-dom";

export interface ProjectAdminProps {
  projId: BigNumberish;
  owner: string;
  fundable: boolean;
  ownedByMultisig: boolean;
  hasAdminPermission: boolean;
}

export const ProjectAdmin: React.FC<ProjectAdminProps> = ({
  projId,
  owner,
  fundable,
  ownedByMultisig,
  hasAdminPermission,
}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [transferTo, setTransferTo] = useState<string>();
  const [minimumShare, setMinimumShare] = useState<number>(500);

  const transferOwnership = async () => {
    if (!workhardCtx || !account || !library || owner === "") {
      alert("Not connected.");
      return;
    }
    if (!transferTo) {
      alert("Set recipient");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      workhardCtx.workhard
        .connect(signer)
        ["safeTransferFrom(address,address,uint256)"](
          owner,
          transferTo,
          projId
        ),
      setTxStatus,
      addToast,
      "Successfully transferred"
    );
  };

  const startInitialContributorProgram = async () => {
    if (!workhardCtx || !account || !library) {
      alert("Not connected.");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      workhardCtx.dao.contributionBoard
        .connect(signer)
        .enableFunding(projId, minimumShare),
      setTxStatus,
      addToast,
      "Successfully started initial contribution sharing program"
    );
  };

  const getSharePercent = () => {
    if (minimumShare && minimumShare > 0) {
      return ((minimumShare / (minimumShare + 10000)) * 100).toFixed(2);
    } else {
      return 0;
    }
  };
  return (
    <Container>
      {!fundable && (
        <>
          <Card>
            <Card.Body>
              <Card.Title>Set up initial contributor share program</Card.Title>
              <Card.Text>
                If you upgrade this project as a DAO,{" "}
                <span style={{ fontSize: "2rem" }}>{getSharePercent()}</span>%
                of the emission will be shared with the initial contributors.
                Please note that you won't be able to record contributions
                manually once you start this program.
              </Card.Text>
              <Form>
                <Form.Group>
                  <Form.Text></Form.Text>
                  <Form.Control
                    type="range"
                    min={100}
                    max={3000}
                    step={100}
                    value={minimumShare}
                    onChange={(event) =>
                      setMinimumShare(parseInt(event.target.value))
                    }
                  />
                </Form.Group>
              </Form>
              <Button onClick={startInitialContributorProgram}>
                Start initial contributor program
              </Button>
            </Card.Body>
          </Card>
          <br />
        </>
      )}
      {!ownedByMultisig && (
        <>
          <Card>
            <Card.Body>
              <Card.Title>Transfer to a multisig wallet</Card.Title>
              <Card.Text>
                If you started the initial contributor share program, we
                recommend you to transfer the ownership to a Gnosis multisig
                wallet.
              </Card.Text>
              <Form>
                <Form.Group>
                  <Form.Control
                    placeholder="(multisig address) 0xABCDEF0123456789ABCDEF0123456789ABCDEF"
                    value={transferTo}
                    onChange={(event) => setTransferTo(event.target.value)}
                  />
                </Form.Group>
              </Form>
              <Button onClick={transferOwnership}>Transfer</Button>
            </Card.Body>
          </Card>
          <br />
        </>
      )}
      {!fundable && (
        <>
          <Card>
            <Card.Body>
              <Card.Title>Record contribution</Card.Title>
              <RecordContribution projId={projId} budgetOwner={owner} />
            </Card.Body>
          </Card>
          <br />
        </>
      )}
      {/* <Card>
        <Card.Body>
          <Card.Title>Grants (multisig & governance)</Card.Title>
          <Grant projId={projId} />
        </Card.Body>
      </Card>
      <br /> */}
      <ConditionalButton
        as={hasAdminPermission ? Link : Button}
        to={`/dao/upgrade/${projId}`}
        variant={"warning"}
        enabledWhen={hasAdminPermission}
        whyDisabled={"Only multisig or project owner can call this function."}
        children={"Upgrade to DAO"}
      />{" "}
    </Container>
  );
};
