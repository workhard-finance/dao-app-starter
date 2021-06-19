import React, { useEffect, useState } from "react";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { errorHandler } from "../../../utils/utils";
import { useToasts } from "react-toast-notifications";
import { BigNumberish } from "ethers";
import { ContributorChart } from "../../views/ContributorChart";
import { RecordContribution } from "../contribution-board/RecordContribution";
import { Button } from "react-bootstrap";

export const InitialContribution: React.FC<{
  id?: BigNumberish;
  onSetup?: () => void;
}> = ({ id, onSetup }) => {
  const projId = id || 0;
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();

  const [projectOwner, setProjectOwner] = useState<string>();

  useEffect(() => {
    if (workhardCtx) {
      const { project } = workhardCtx;
      project
        .ownerOf(projId)
        .then(setProjectOwner)
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, projId]);

  return (
    <div>
      <ContributorChart id={projId} />
      {!!projectOwner && (
        <RecordContribution projId={projId} budgetOwner={projectOwner} />
      )}
      <br />
      <Button onClick={onSetup}>Go to next</Button>
    </div>
  );
};
