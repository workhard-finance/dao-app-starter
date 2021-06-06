import React, { FormEventHandler, useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { BigNumber, constants } from "ethers";
import { Card, Form, InputGroup } from "react-bootstrap";
import { getAddress, randomBytes } from "ethers/lib/utils";
import { ConditionalButton } from "../../ConditionalButton";
import { convertType, Param, Preset } from "../../../utils/preset";
import { useToasts } from "react-toast-notifications";
import { errorHandler, safeTxHandler, TxStatus } from "../../../utils/utils";
import { getNetworkName } from "@workhard/protocol";

export const TimelockPresetProposal: React.FC<Preset> = ({
  paramArray,
  methodName,
  contractName,
  contract,
  handler,
}) => {
  const { account, chainId, library } = useWeb3React();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();
  /** Proposal */
  const [predecessor, setPredecessor] = useState<string>(constants.HashZero);
  const [salt, setSalt] = useState<string>(
    BigNumber.from(randomBytes(32)).toHexString()
  );
  const [delay, setDelay] = useState<number>(86400);
  const [txStatus, setTxStatus] = useState<TxStatus>();

  const [advancedMode, setAdvancedMode] = useState<boolean>(false);

  /** arguments **/
  const [args, setArgs] = useState<{ [key: string]: string }>({});

  /** Timelock permission */
  const [multisigOwner, setMultisigOwner] = useState<boolean>();

  useEffect(() => {
    if (!!account && !!workhardCtx) {
      const { dao } = workhardCtx;
      const { timelock } = dao;
      timelock
        .getMinDelay()
        .then((_delay) => {
          setDelay(_delay.toNumber());
        })
        .catch(errorHandler(addToast));
    }
  }, [account, workhardCtx, txStatus]);

  useEffect(() => {
    if (!!account && !!workhardCtx && !!chainId) {
      const network = getNetworkName(chainId);
      const { dao } = workhardCtx;
      const { multisig } = dao;
      if (multisig.address === account) {
        setMultisigOwner(true);
      } else {
        const gnosisAPI =
          network === "mainnet"
            ? `https://safe-transaction.gnosis.io/api/v1/`
            : network === "rinkeby"
            ? `https://safe-transaction.rinkeby.gnosis.io/api/v1/`
            : undefined;

        if (gnosisAPI) {
          fetch(gnosisAPI + `safes/${multisig.address}/`).then(
            async (response) => {
              const result = await response.json();
              if (
                (result.owners as string[])
                  .map(getAddress)
                  .includes(getAddress(account))
              ) {
                setMultisigOwner(true);
              }
            }
          );
        }
      }
    }
  }, [account, workhardCtx, chainId]);

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !workhardCtx || !contract || !chainId) {
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
    const { data } = handler
      ? await handler(params)
      : await contract.populateTransaction[methodName](...params);
    if (!data) return alert("data is not set");
    const signer = library.getSigner(account);
    const popScheduledTx = await workhardCtx.dao.timelock.populateTransaction.schedule(
      contract.address,
      0,
      data,
      predecessor,
      salt,
      delay
    );
    if (!popScheduledTx.to || !popScheduledTx.data) {
      throw Error("Populated transaction doesn't have any value");
    }
    safeTxHandler(
      chainId,
      workhardCtx.dao.multisig.address,
      popScheduledTx,
      signer,
      setTxStatus,
      addToast,
      "Successfully scheduled a tx.",
      (receipt) => {
        if (receipt) {
        } else {
          alert("Created Multisig Tx. Go to Gnosis wallet and confirm.");
        }
        setTxStatus(undefined);
      }
    );
  };
  return (
    <Card>
      <Card.Header>
        {contractName}.{methodName}()
      </Card.Header>
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
          <a
            className="text-warning"
            style={{ cursor: "pointer" }}
            onClick={() => setAdvancedMode(!advancedMode)}
          >
            Advanced
          </a>
          <br />
          <br />
          <div hidden={!advancedMode}>
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
                Delay: {((delay || 0) / 86400).toFixed(1)} day(s) (={" "}
                {delay || 0} seconds)
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
          </div>
          <ConditionalButton
            variant="primary"
            type="submit"
            children="Create a Gnosis Safe Multisig Transaction"
            enabledWhen={multisigOwner}
            whyDisabled={"You don't have the proposer role."}
          />
        </Form>
      </Card.Body>
    </Card>
  );
};
