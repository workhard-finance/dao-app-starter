import React, { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { Card } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { useWeb3React } from "@web3-react/core";
import { bigNumToFixed, errorHandler } from "../../../utils/utils";
import { OverlayTooltip } from "../../OverlayTooltip";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { useToasts } from "react-toast-notifications";

export interface RightBalanceProps {}

export const RightBalance: React.FC<RightBalanceProps> = ({}) => {
  const { account } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const { dao } = useWorkhard() || {};
  const [rightBalance, setRightBalance] = useState<BigNumber>();

  useEffect(() => {
    if (!!account && !!dao) {
      const { right } = dao;
      right
        .balanceOf(account)
        .then(setRightBalance)
        .catch(errorHandler(addToast));
    }
  }, [account, dao, blockNumber]);

  return (
    <Card>
      <Card.Body>
        <Card.Title>
          Your current $RIGHT
          <OverlayTooltip
            tip={`= staked amount x locking period`}
            text={`❔`}
          />
        </Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>
          {bigNumToFixed(rightBalance || 0)}
          <span style={{ fontSize: "1rem" }}> $veVISION(a.k.a. $RIGHT)</span>
        </Card.Text>
      </Card.Body>
    </Card>
  );
};
