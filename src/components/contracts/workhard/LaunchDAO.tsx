import React, { useEffect, useState } from "react";
import { Form, Row, Col, Button, Figure, Modal } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import {
  TxStatus,
  handleTransaction,
  errorHandler,
} from "../../../utils/utils";
import { ConditionalButton } from "../../ConditionalButton";
import { useToasts } from "react-toast-notifications";
import { BigNumber, BigNumberish, PopulatedTransaction } from "ethers";
import { AllocationChart } from "../../views/AllocationChart";
import { OverlayTooltip } from "../../OverlayTooltip";

export const LaunchDAO: React.FC<{
  id?: BigNumberish;
  onLaunched?: () => void;
}> = ({ id, onLaunched }) => {
  const { account, library } = useWeb3React();
  const workhardCtx = useWorkhard();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const { addToast } = useToasts();

  const [advancedMode, setAdvancedMode] = useState<boolean>(false);

  const [projectOwner, setProjectOwner] = useState<string>();

  const [projectName, setProjectName] = useState<string>();
  const [visionSymbol, setVisionSymbol] = useState<string>();
  const [commitSymbol, setCommitSymbol] = useState<string>();
  const [
    founderShareDenominator,
    setFounderShareDenominator,
  ] = useState<BigNumber>(BigNumber.from(20));

  const defaultSetting = {
    commitMining: 4750,
    liquidityMining: 4750,
    treasury: 499,
    caller: 1,
  };
  const [liquidityMining, setLiquidityMining] = useState<number>(
    defaultSetting.liquidityMining
  );
  const [commitMining, setCommitMining] = useState<number>(
    defaultSetting.commitMining
  );
  const [treasury, setTreasury] = useState<number>(defaultSetting.treasury);
  const [caller, setCaller] = useState<number>(defaultSetting.caller);
  const [popTx, setPopTx] = useState<PopulatedTransaction>();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (workhardCtx && id) {
      const { workhard, dao } = workhardCtx;
      workhard.ownerOf(id).then(setProjectOwner).catch(errorHandler(addToast));
      workhard.nameOf(id).then(setProjectName).catch(errorHandler(addToast));
      dao.visionEmitter
        .FOUNDER_SHARE_DENOMINATOR()
        .then(setFounderShareDenominator)
        .catch(errorHandler(addToast));
      dao.vision.symbol().then(setVisionSymbol).catch(errorHandler(addToast));
      dao.commit.symbol().then(setCommitSymbol).catch(errorHandler(addToast));
    }
  }, [workhardCtx, id]);

  useEffect(() => {
    if (workhardCtx && id) {
      const { workhard } = workhardCtx;
      workhard.populateTransaction
        .launch(id, liquidityMining, commitMining, treasury, caller)
        .then(setPopTx);
    }
  }, [workhardCtx, liquidityMining, commitMining, treasury, caller]);

  const launchDAO = async () => {
    if (!workhardCtx) {
      alert("Not connected");
      return;
    } else if (!id) {
      alert("Project not exists");
      return;
    }
    const { workhard } = workhardCtx;
    const signer = library.getSigner(account);
    handleTransaction(
      workhard
        .connect(signer)
        .launch(id, liquidityMining, commitMining, treasury, caller),
      setTxStatus,
      addToast,
      "Posted a new job",
      (receipt) => {
        alert(`DAO is successfully launched!`);
        setTxStatus(undefined);
        onLaunched && onLaunched();
      }
    );
  };
  const poolSum = liquidityMining + commitMining + treasury + caller;
  const founderWeight = Math.floor(
    poolSum / founderShareDenominator?.toNumber() || 20
  );
  const protocolWeight = Math.floor((poolSum + founderWeight) / 33);
  const sum = poolSum + founderWeight + protocolWeight;

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  return (
    <Form>
      <AllocationChart
        pools={[
          {
            name: `Commit Burners($${commitSymbol} Burn Pool)`,
            weight: commitMining,
          },
          {
            name: `Market Makers($${visionSymbol}/ETH LP)`,
            weight: liquidityMining,
          },
        ]}
        treasury={treasury}
        caller={caller}
        protocol={protocolWeight}
        founder={founderWeight}
        sum={sum}
      />
      <ConditionalButton
        variant="success"
        onClick={launchDAO}
        enabledWhen={account === projectOwner}
        whyDisabled={id ? `Not allowed` : "This is a preview"}
        children="Start Emission!"
      />{" "}
      <OverlayTooltip tip={`Data for Gnosis Safe Multisig Wallet.`}>
        <Button variant="outline" onClick={handleShow}>
          ABI?
        </Button>
      </OverlayTooltip>
      <br />
      <br />
      <a
        className="text-warning"
        style={{ cursor: "pointer" }}
        onClick={() => setAdvancedMode(!advancedMode)}
      >
        Advanced
      </a>
      <div hidden={!advancedMode}>
        <br />
        <Form.Group>
          <Form.Label>{visionSymbol}/ETH LP</Form.Label>
          <Form.Control
            type="range"
            min={0}
            max={9999}
            value={liquidityMining}
            step={1}
            onChange={({ target: { value } }) =>
              setLiquidityMining(parseInt(value))
            }
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Commit Mining</Form.Label>
          <Form.Control
            type="range"
            min={0}
            max={9999}
            value={commitMining}
            step={1}
            onChange={({ target: { value } }) =>
              setCommitMining(parseInt(value))
            }
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Treasury</Form.Label>
          <Form.Control
            type="range"
            min={0}
            max={9999}
            value={treasury}
            step={1}
            onChange={({ target: { value } }) => setTreasury(parseInt(value))}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Caller</Form.Label>
          <Form.Control
            type="range"
            min={0}
            max={100}
            value={caller}
            step={1}
            onChange={({ target: { value } }) => setCaller(parseInt(value))}
          />
        </Form.Group>
        <Button
          variant="secondary"
          onClick={() => {
            setLiquidityMining(defaultSetting.liquidityMining);
            setCommitMining(defaultSetting.commitMining);
            setTreasury(defaultSetting.treasury);
            setCaller(defaultSetting.caller);
          }}
        >
          Use default
        </Button>
      </div>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Here's the custom data for gnosis safe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Address:</h5>
          <code style={{ color: "black", fontFamily: "Neucha" }}>
            {popTx?.to}
          </code>
          <br />
          <br />
          <h5>Value:</h5>
          <code style={{ color: "black", fontFamily: "Neucha" }}>
            {popTx?.value || 0}
          </code>
          <br />
          <br />
          <h5>Data:</h5>
          <code style={{ color: "black", fontFamily: "Neucha" }}>
            {popTx?.data}
          </code>
        </Modal.Body>
      </Modal>
    </Form>
  );
};
