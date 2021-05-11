import React, { FormEventHandler, useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { BigNumber, ContractTransaction, Contract, constants } from "ethers";
import { Card, Form, InputGroup } from "react-bootstrap";
import { randomBytes, solidityKeccak256 } from "ethers/lib/utils";
import { ConditionalButton } from "../../ConditionalButton";
import { convertType, Param, Preset } from "../../../utils/preset";

export const TimelockPresetProposal: React.FC<Preset> = ({
  paramArray,
  methodName,
  contract,
}) => {
  const { account, library } = useWeb3React();
  const contracts = useWorkhardContracts();
  /** Proposal */
  const [predecessor, setPredecessor] = useState<string>(constants.HashZero);
  const [salt, setSalt] = useState<string>(
    BigNumber.from(randomBytes(32)).toHexString()
  );
  const [delay, setDelay] = useState<number>(86400);
  const [lastTx, setLastTx] = useState<ContractTransaction>();

  /** arguments **/
  const [args, setArgs] = useState<{ [key: string]: string }>({});

  /** Timelock permission */
  const [hasProposerRole, setHasProposerRole] = useState<boolean>();

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const { timelockedGovernance } = contracts;
      timelockedGovernance
        .hasRole(solidityKeccak256(["string"], ["PROPOSER_ROLE"]), account)
        .then(setHasProposerRole)
        .catch(() => {
          if (!stale) setHasProposerRole(undefined);
        });
      timelockedGovernance
        .getMinDelay()
        .then((_delay) => {
          setDelay(_delay.toNumber());
        })
        .catch(() => {
          if (!stale) setDelay(86400);
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
    const params = Object.entries(args).map((x) =>
      convertType(getType(x[0]), x[1])
    );
    const { data } = await contract.populateTransaction[methodName](...params);
    if (!data) return alert("data is not set");
    const signer = library.getSigner(account);
    console.log("mypredecessor", predecessor);
    contracts.timelockedGovernance
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
          {paramArray.map((arg, i) => (
            <Form.Group key={`preset-form-input-${i}`}>
              <Form.Label>{arg.name}</Form.Label>
              <Form.Control
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
          ))}

          <Form.Group>
            <Form.Label>Predecessor</Form.Label>
            <Form.Control
              value={predecessor}
              onChange={({ target: { value } }) => setPredecessor(value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Salt</Form.Label>
            <InputGroup className="mb-2">
              <Form.Control
                value={salt}
                onChange={({ target: { value } }) => setSalt(value)}
              />
              <InputGroup.Append
                onClick={() =>
                  setSalt(BigNumber.from(randomBytes(32)).toHexString())
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
              type="number"
              value={delay}
              min={BigNumber.from(delay || 0).toNumber()}
              step={86400}
              onChange={({ target: { value } }) => setDelay(parseInt(value))}
              placeholder={(delay || 86400).toString()}
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
