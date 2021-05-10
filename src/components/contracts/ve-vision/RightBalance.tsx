import React, { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { Card } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { bigNumToFixed } from "../../../utils/utils";
import { OverlayTooltip } from "../../OverlayTooltip";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";

export interface RightBalanceProps {}

export const RightBalance: React.FC<RightBalanceProps> = ({}) => {
  const { account } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [rightBalance, setRightBalance] = useState<BigNumber>();

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const { vision, right } = contracts;
      right.balanceOf(account).then(setRightBalance);
      return () => {
        stale = true;
        setRightBalance(undefined);
      };
    }
  }, [account, contracts, blockNumber]);

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
