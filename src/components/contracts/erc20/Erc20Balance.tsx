import React, { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { Card } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { bigNumToFixed, errorHandler } from "../../../utils/utils";
import { OverlayTooltip } from "../../OverlayTooltip";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { ERC20Mock__factory } from "@workhard/protocol";
import { useToasts } from "react-toast-notifications";

export interface Erc20BalanceProps {
  address?: string;
  description?: string;
  symbolAlt?: string;
}

export const Erc20Balance: React.FC<Erc20BalanceProps> = ({
  address,
  description,
  symbolAlt,
}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const [balance, setBalance] = useState<BigNumber>();
  const [symbol, setSymbol] = useState<string>();
  const { addToast } = useToasts();

  useEffect(() => {
    if (!!account && !!library && !!address) {
      ERC20Mock__factory.connect(address, library)
        .balanceOf(account)
        .then(setBalance)
        .catch(errorHandler(addToast));
      ERC20Mock__factory.connect(address, library).symbol().then(setSymbol);
    }
  }, [account, address, library, blockNumber]);

  return (
    <Card>
      <Card.Body>
        <Card.Title>
          Your current ${symbol}
          {description && <OverlayTooltip tip={description} text={`❔`} />}
        </Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>
          {bigNumToFixed(balance || 0)}
          <span style={{ fontSize: "1rem" }}> {symbolAlt || `$${symbol}`}</span>
        </Card.Text>
      </Card.Body>
    </Card>
  );
};
