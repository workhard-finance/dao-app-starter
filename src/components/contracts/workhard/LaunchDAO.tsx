import { useEffect, useState } from "react";
import { Form, Row, Col, Button, Figure } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { PieChart } from "react-minimal-pie-chart";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import {
  TxStatus,
  handleTransaction,
  errorHandler,
} from "../../../utils/utils";
import { ConditionalButton } from "../../ConditionalButton";
import { useToasts } from "react-toast-notifications";
import { BigNumber, BigNumberish } from "ethers";

const defaultSetting = {
  minDelay: 86400,
  launchDelay: 86400 * 28,
  initialEmission: 24000000,
  minEmissionRatePerWeek: 60,
  emissionCutRate: 3000,
  founderShare: 500,
};

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
  const [
    founderShareDenominator,
    setfounderShareDenominator,
  ] = useState<BigNumber>(BigNumber.from(500));

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

  useEffect(() => {
    if (workhardCtx && id) {
      const { workhard, dao, periphery } = workhardCtx;
      workhard.ownerOf(id).then(setProjectOwner).catch(errorHandler(addToast));
      workhard.nameOf(id).then(setProjectName).catch(errorHandler(addToast));
      dao.visionEmitter
        .FOUNDER_SHARE_DENOMINATOR()
        .then(setfounderShareDenominator)
        .catch(errorHandler(addToast));
      dao.vision.symbol().then(setVisionSymbol).catch(errorHandler(addToast));
    }
  }, [workhardCtx]);

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
  const notAProjectOwner = (
    <p>Only the project owner can upgrade it to a DAO.</p>
  );
  const notFound = <p>Not Found</p>;
  const getSum = () => {
    return liquidityMining + commitMining + treasury + caller;
  };
  const getFounderShare = (): number => {
    if (!founderShareDenominator) return 0;
    const founderShare = getSum() / founderShareDenominator.toNumber();
    const founderShareRate =
      (founderShare / (founderShare + getSum())) * (33 / 34) * 100;
    return founderShareRate;
  };
  const getPercent = (val: number) => {
    if (!founderShareDenominator) return 0;
    const founderShare = getSum() / founderShareDenominator.toNumber();
    const p = (val / (founderShare + getSum())) * (33 / 34) * 100;
    return p;
  };

  return (
    <Form>
      <PieChart
        radius={30}
        viewBoxSize={[100, 70]}
        center={[50, 35]}
        data={[
          {
            title: `${visionSymbol || "VISION"}/ETH LP`,
            value: getPercent(liquidityMining),
            color: "#17a2b8",
          },
          {
            title: "Commit Burners",
            value: getPercent(commitMining),
            color: "#ffc107",
          },
          { title: "Treasury", value: getPercent(treasury), color: "#28a745" },
          { title: "Founder", value: getFounderShare(), color: "#dc3545" },
          {
            title: "Protocol",
            value: (1 / 34) * 100,
            color: "#868e96",
          },
          { title: "Caller", value: getPercent(caller), color: "#6A2135" },
        ]}
        labelStyle={{ fontSize: 3 }}
        labelPosition={100}
        label={(data) =>
          `${data.dataEntry.title}: ${data.dataEntry.value.toFixed(2)}%`
        }
      />
      <ConditionalButton
        variant="success"
        onClick={launchDAO}
        enabledWhen={account === projectOwner}
        whyDisabled={id ? `Not allowed` : "This is a preview"}
        children="Start Emission!"
      />
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
    </Form>
  );
};
