import React, { useEffect, useState } from "react";
import { BigNumberish } from "ethers";
import { Button, Form } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";

export interface CloseProjectProps {
  projId: BigNumberish;
  budgetOwner: string;
}

// TODO
export const CloseProject: React.FC<CloseProjectProps> = ({
  projId,
  budgetOwner,
}) => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();

  const [approved, setApproved] = useState<boolean>();

  const closeProject = () => {
    if (!account || !contracts) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
  };

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const { jobBoard, workersUnion } = contracts;
      jobBoard.approvedProjects(projId).then((result) => {
        if (!stale) {
          setApproved(result);
        }
      });
      return () => {
        stale = true;
        setApproved(undefined);
      };
    }
  }, [account, contracts]);
  return (
    <>
      <Form>
        <Form.Label>
          Do you want to close this project? Please keep in mind that you cannot
          revert this action.
        </Form.Label>
        <br />
        <Button variant={"danger"} children="close" onClick={closeProject} />
      </Form>
    </>
  );
};
