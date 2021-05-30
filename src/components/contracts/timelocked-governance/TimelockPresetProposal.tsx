import React, { FormEventHandler, useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { BigNumber, constants, PopulatedTransaction } from "ethers";
import { Card, Form, InputGroup, Modal } from "react-bootstrap";
import {
  getIcapAddress,
  randomBytes,
  solidityKeccak256,
} from "ethers/lib/utils";
import { ConditionalButton } from "../../ConditionalButton";
import { convertType, Param, Preset } from "../../../utils/preset";
import { useToasts } from "react-toast-notifications";
import EthersSafe, {
  SafeTransactionDataPartial,
} from "@gnosis.pm/safe-core-sdk";
import {
  errorHandler,
  handleTransaction,
  TxStatus,
} from "../../../utils/utils";
import { getNetworkName } from "@workhard/protocol";

export const TimelockPresetProposal: React.FC<Preset> = ({
  paramArray,
  methodName,
  contract,
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
            ? `https://safe-transaction.gnosis.io/`
            : network === "rinkeby"
            ? `https://safe-transaction.rinkeby.gnosis.io/`
            : undefined;

        if (gnosisAPI) {
          fetch(gnosisAPI + `safes/${multisig.address}/`).then((result) => {
            console.log("result", result);
          });
        }
      }
    }
  }, [account, workhardCtx, chainId]);

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!account || !workhardCtx || !contract) {
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
    const popScheduledTx = await workhardCtx.dao.timelock.populateTransaction.schedule(
      contract.address,
      0,
      data,
      predecessor,
      salt,
      delay
    );
    if (!popScheduledTx.to || !popScheduledTx.value || !popScheduledTx.data) {
      throw Error("Populated transaction doesn't have any value");
    }
    const safe = await EthersSafe.create(
      library,
      workhardCtx.dao.multisig.address,
      signer
    );
    const safeTx = await safe.createTransaction({
      to: popScheduledTx.to,
      value: popScheduledTx.value.toString(),
      data: popScheduledTx.data,
    });
    const safeTxHash = await safe.getTransactionHash(safeTx);
    alert(`Safe tx id: ${safeTxHash}`);
  };
  return (
    <Card>
      <Card.Header>preset proposal(timelock): {methodName}</Card.Header>
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
            enabledWhen={multisigOwner}
            whyDisabled={"You don't have the proposer role."}
          />
        </Form>
      </Card.Body>
    </Card>
  );
};
