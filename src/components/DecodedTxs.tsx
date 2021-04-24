import React from "react";
import { BigNumber } from "ethers";
import { Accordion, Button, Card } from "react-bootstrap";
import { formatEther } from "ethers/lib/utils";
import { DecodedTxData, flatten } from "../utils/utils";

export interface DecodedTxProps {
  txs: DecodedTxData[];
  values: BigNumber | BigNumber[];
}

// Timelock Version
export const DecodedTxs: React.FC<DecodedTxProps> = ({ txs, values }) => {
  return (
    <Accordion>
      {txs.map((decoded, i) => (
        <Card>
          <Card.Header>
            <Accordion.Toggle as={Button} variant="link" eventKey={`${i}`}>
              {decoded.contractName} - {decoded.methodName}
            </Accordion.Toggle>
          </Card.Header>
          <Accordion.Collapse eventKey={`${i}`}>
            <Card.Body>
              Contract: {decoded.address}
              <br />
              Value: {formatEther(
                Array.isArray(values) ? values[i] : values
              )}{" "}
              ETH
              <br />
              {Object.getOwnPropertyNames(decoded.args).length > 0 && (
                <>
                  Params
                  <ul>
                    {Object.getOwnPropertyNames(decoded.args).map((key) => (
                      <li>
                        <strong>{key}</strong>: {flatten(decoded.args[key])}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      ))}
    </Accordion>
  );
};
