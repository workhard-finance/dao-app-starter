import React, { FormEventHandler, useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { BigNumber, ContractTransaction, Contract } from "ethers";
import { Card, Form, InputGroup } from "react-bootstrap";
import { randomBytes, solidityKeccak256 } from "ethers/lib/utils";
import { ConditionalButton } from "../../ConditionalButton";

export enum PARAM_TYPE {
  STRING = "string",
  BOOLEAN = "boolean",
  NUMBER = "number",
}
export interface Param {
  name: string;
  type: PARAM_TYPE;
}
export interface TimelockPresetProposalProps {
  paramArray: Param[];
  methodName: string;
  contract?: Contract;
  contractName: string;
}

export const TimelockPresetProposal: React.FC<TimelockPresetProposalProps> = ({
  paramArray,
  methodName,
  contract,
}) => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  /** Proposal */
  const [predecessor, setPredecessor] = useState<string>();
  const [salt, setSalt] = useState<string>();
  const [delay, setDelay] = useState<number>();
  const [lastTx, setLastTx] = useState<ContractTransaction>();

  /** arguments **/
  const [args, setArgs] = useState<{ [key: string]: string }>({});

  /** Timelock permission */
  const [hasProposerRole, setHasProposerRole] = useState<boolean>();
  const [minDelay, setMinDaly] = useState<number>();

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const { timeLockGovernance } = contracts;
      timeLockGovernance
        .hasRole(solidityKeccak256(["string"], ["PROPOSER_ROLE"]), account)
        .then(setHasProposerRole)
        .catch(() => {
          if (!stale) setHasProposerRole(undefined);
        });
      timeLockGovernance
        .getMinDelay()
        .then((_delay) => {
          setDelay(_delay.toNumber());
        })
        .catch(() => {
          if (!stale) setDelay(undefined);
        });
    }
  }, [account, contracts, lastTx]);

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !contracts || !contract) {
      alert("Not connected");
      return;
    }
    const getType = (valueName: string) => {
      const argInfo: Param = paramArray.filter((x) => x.name == valueName)[0];
      return argInfo.type;
    };
    const convertType = (type: PARAM_TYPE, value: string) => {
      switch (type) {
        case PARAM_TYPE.STRING:
          return value;
        case PARAM_TYPE.BOOLEAN:
          return value == "true";
        case PARAM_TYPE.NUMBER:
          return Number(value);
        default:
          return value;
      }
    };
    const params = Object.entries(args).map((x) =>
      convertType(getType(x[0]), x[1])
    );
    const { data } = await contract.populateTransaction[methodName](...params);
    if (!predecessor) return alert("Predecessor is not set");
    if (!data) return alert("data is not set");
    if (!salt) return alert("Salt is not set");
    if (!delay) return alert("Starts In is not set");
    const signer = library.getSigner(account);
    contracts.timeLockGovernance
      .connect(signer)
      .schedule(contract.address, 0, data, predecessor, salt, delay)
      .then((tx) => {
        setLastTx(tx);
      });
  };
  return (
    <Card>
      <Card.Header as="h5">preset proposal(timelock): {methodName}</Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {paramArray.map((arg) => {
            return (
              <Form.Group>
                <Form.Label>{arg.name}</Form.Label>
                <Form.Control
                  id={arg.name}
                  value={args[arg.name]}
                  onChange={({ target: { value } }) =>
                    setArgs({
                      ...args,
                      [arg.name]: value,
                    })
                  }
                  placeholder={arg.name}
                />
              </Form.Group>
            );
          })}

          <Form.Group>
            <Form.Label>Predecessor</Form.Label>
            <Form.Control
              id="propose-tx-predecessor"
              value={predecessor}
              onChange={({ target: { value } }) => setPredecessor(value)}
              defaultValue="0"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Salt</Form.Label>
            <InputGroup className="mb-2">
              <Form.Control
                id="propose-tx-salt"
                value={salt}
                onChange={({ target: { value } }) => setSalt(value)}
                defaultValue={BigNumber.from(randomBytes(32)).toString()}
              />
              <InputGroup.Append
                onClick={() =>
                  setSalt(BigNumber.from(randomBytes(32)).toString())
                }
              >
                <InputGroup.Text>RAND</InputGroup.Text>
              </InputGroup.Append>
            </InputGroup>
          </Form.Group>
          <Form.Group>
            <Form.Label>
              Delay: {((delay || 0) / 86400).toFixed(1)} day(s) (= {delay || 0}{" "}
              seconds)
            </Form.Label>
            <Form.Control
              id="propose-tx-starts-in"
              type="number"
              value={delay}
              min={BigNumber.from(minDelay || 0).toNumber()}
              step={86400}
              onChange={({ target: { value } }) => setDelay(parseInt(value))}
              placeholder={(minDelay || 86400).toString()}
            />
          </Form.Group>
          <ConditionalButton
            variant="primary"
            type="submit"
            children="Submit"
            enabledWhen={hasProposerRole}
            whyDisabled={"You don't have the proposer role."}
          />
        </Form>
      </Card.Body>
    </Card>
  );
};
