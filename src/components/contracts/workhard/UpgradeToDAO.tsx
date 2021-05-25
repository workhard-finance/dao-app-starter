import { useEffect, useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import {
  TxStatus,
  handleTransaction,
  getStablecoinList,
  errorHandler,
} from "../../../utils/utils";
import { useToasts } from "react-toast-notifications";
import { BigNumberish } from "ethers";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { ConditionalButton } from "../../ConditionalButton";

const defaultSetting = {
  minDelay: 86400,
  launchDelay: 86400 * 28,
  initialEmission: 24000000,
  minEmissionRatePerWeek: 60,
  emissionCutRate: 3000,
  founderShare: 500,
};

export const UpgradeToDAO: React.FC<{
  id?: BigNumberish;
  onUpgraded?: () => void;
}> = ({ id, onUpgraded }) => {
  const { chainId, account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const workhardCtx = useWorkhard();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const { addToast } = useToasts();

  const [advancedMode, setAdvancedMode] = useState<boolean>(false);

  const [stablecoinList, setStablecoinList] = useState<
    { symbol: string; address: string }[]
  >();
  const [multisig, setMultisig] = useState<string>();
  const [baseCurrency, setBaseCurrency] = useState<string | undefined>(
    stablecoinList && stablecoinList[0] ? stablecoinList[0].address : undefined
  );

  const [projectOwner, setProjectOwner] = useState<string>();

  const [projectName, setProjectName] = useState<string>();
  const [projectSymbol, setProjectSymbol] = useState<string>();

  const [visionName, setVisionName] = useState<string>();
  const [visionSymbol, setVisionSymbol] = useState<string>();

  const [commitName, setCommitName] = useState<string>();
  const [commitSymbol, setCommitSymbol] = useState<string>();

  const [rightName, setRightName] = useState<string>();
  const [rightSymbol, setRightSymbol] = useState<string>();

  const [minDelay, setMinDelay] = useState<number>(defaultSetting.minDelay);
  const [launchDelay, setLaunchDelay] = useState<number>(
    defaultSetting.launchDelay
  );
  const [initialEmission, setInitialEmission] = useState<number>(
    defaultSetting.initialEmission
  );
  const [minEmissionRatePerWeek, setMinEmissionRatePerWeek] = useState<number>(
    defaultSetting.minEmissionRatePerWeek
  );
  const [emissionCutRate, setEmissionCutRate] = useState<number>(
    defaultSetting.emissionCutRate
  );
  const [founderShare, setFounderShare] = useState<number>(
    defaultSetting.founderShare
  );

  useEffect(() => {
    const list = getStablecoinList(chainId);
    if (!list) return;
    setStablecoinList(list);
    if (!baseCurrency && list[0]) {
      setBaseCurrency(list[0].address);
    }
  }, [chainId]);
  useEffect(() => {
    if (workhardCtx && id) {
      const { workhard } = workhardCtx;
      workhard.ownerOf(id).then(setProjectOwner).catch(errorHandler(addToast));
    }
  }, [workhardCtx, id]);

  const upgradeToDAO = async () => {
    if (!workhardCtx) {
      alert("Not connected");
      return;
    } else if (!id) {
      alert("Project not exists");
      return;
    } else if (
      !multisig ||
      !baseCurrency ||
      !projectName ||
      !projectSymbol ||
      !visionName ||
      !visionSymbol ||
      !commitName ||
      !commitSymbol ||
      !rightName ||
      !rightSymbol ||
      !minDelay ||
      !launchDelay ||
      !initialEmission ||
      !minEmissionRatePerWeek ||
      !emissionCutRate ||
      !founderShare
    ) {
      alert("Please fill out the form.");
      return;
    }
    const { workhard } = workhardCtx;
    const signer = library.getSigner(account);
    handleTransaction(
      workhard.connect(signer).upgradeToDAO(id, {
        multisig,
        baseCurrency,
        projectName,
        projectSymbol,
        visionName,
        visionSymbol,
        commitName,
        commitSymbol,
        rightName,
        rightSymbol,
        minDelay,
        launchDelay,
        initialEmission,
        minEmissionRatePerWeek,
        emissionCutRate,
        founderShare,
      }),
      setTxStatus,
      addToast,
      "Posted a new job",
      (receipt) => {
        alert(`You've successfully upgraded project to a DAO`);
        setTxStatus(undefined);
        onUpgraded && onUpgraded();
      }
    );
  };
  return (
    <Form>
      <Form.Group>
        <Form.Label>Multisig Wallet</Form.Label>
        <Form.Control
          type="text"
          placeholder="eg) 0xABCD1234ABCD1234ABCD1234ABCD1234ABCD1234"
          onChange={({ target: { value } }) => setMultisig(value)}
          value={multisig}
        />
        <Form.Text>
          <a
            href="https://gnosis-safe.io"
            target="_blank"
            className="text-primary"
          >
            Create a Gnosis Safe wallet
          </a>
        </Form.Text>
      </Form.Group>
      <Form.Group>
        <Form.Label>Stablecoin Pegging</Form.Label>
        <Form.Control
          as="select"
          required
          type="text"
          placeholder="eg) 0xABCD1234ABCD1234ABCD1234ABCD1234ABCD1234"
          onChange={({ target: { value } }) => setBaseCurrency(value)}
          value={baseCurrency}
        >
          {stablecoinList?.map((t) => (
            <option value={t.address}>{`${t.symbol}: ${t.address}`}</option>
          ))}
        </Form.Control>
      </Form.Group>
      <Row>
        <Form.Group as={Col} md={8}>
          <Form.Label>DAO Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="eg) Workhard Finance"
            onChange={({ target: { value } }) => {
              setProjectName(value);
              setVisionName(`${value} Vision Token`);
              setCommitName(`${value} Commit Token`);
              setRightName(`${value} Right Token`);
            }}
            value={projectName}
          />
        </Form.Group>
        <Form.Group as={Col} md={4}>
          <Form.Label>DAO Symbol</Form.Label>
          <Form.Control
            type="text"
            placeholder="eg) WHF"
            onChange={({ target: { value } }) => {
              setProjectSymbol(value);
              setVisionSymbol(`v${value}`);
              setCommitSymbol(`c${value}`);
              setRightSymbol(`r${value}`);
            }}
            value={projectSymbol}
          />
        </Form.Group>
      </Row>
      <ConditionalButton
        variant="info"
        onClick={upgradeToDAO}
        enabledWhen={account === projectOwner}
        whyDisabled={id ? `Not allowed` : "This is a preview"}
        children="Start DAO!"
      />
      <hr />
      <a
        className="text-warning"
        style={{ cursor: "pointer" }}
        onClick={() => setAdvancedMode(!advancedMode)}
      >
        Advanced
      </a>
      <div hidden={!advancedMode}>
        <br />
        <Row>
          <Form.Group as={Col} md={8}>
            <Form.Label>VISION token name</Form.Label>
            <Form.Control
              type="text"
              placeholder="eg) Workhard Vision Token (Your own token name)"
              onChange={({ target: { value } }) => setVisionName(value)}
              value={visionName}
            />
          </Form.Group>
          <Form.Group as={Col} md={4}>
            <Form.Label>VISION token symbol</Form.Label>
            <Form.Control
              type="text"
              placeholder="eg) VISION"
              onChange={({ target: { value } }) => setVisionSymbol(value)}
              value={visionSymbol}
            />
          </Form.Group>
          <Form.Group as={Col} md={8}>
            <Form.Label>COMMIT token name</Form.Label>
            <Form.Control
              type="text"
              placeholder="eg) Workhard Commit Token (Your DAO's commit token name)"
              onChange={({ target: { value } }) => setCommitName(value)}
              value={commitName}
            />
          </Form.Group>
          <Form.Group as={Col} md={4}>
            <Form.Label>COMMIT token symbol</Form.Label>
            <Form.Control
              type="text"
              placeholder="eg) COMMIT"
              onChange={({ target: { value } }) => setCommitSymbol(value)}
              value={commitSymbol}
            />
          </Form.Group>
          <Form.Group as={Col} md={8}>
            <Form.Label>RIGHT token name</Form.Label>
            <Form.Control
              type="text"
              placeholder="eg) Workhard Right Token (Your DAO's right token name)"
              onChange={({ target: { value } }) => setRightName(value)}
              value={rightName}
            />
          </Form.Group>
          <Form.Group as={Col} md={4}>
            <Form.Label>RIGHT token symbol</Form.Label>
            <Form.Control
              type="text"
              placeholder="eg) RIGHT"
              onChange={({ target: { value } }) => setRightSymbol(value)}
              value={rightSymbol}
            />
          </Form.Group>
        </Row>
        <Form.Group>
          <Form.Label>Minimum Timelock Delay</Form.Label>
          <Form.Control
            type="range"
            min={86400}
            max={86400 * 7}
            value={minDelay}
            step={86400}
            onChange={({ target: { value } }) => setMinDelay(parseInt(value))}
          />
          <Form.Text>{(minDelay / 86400).toFixed(0)} day(s)</Form.Text>
        </Form.Group>
        <Form.Group>
          <Form.Label>Enable Vote After</Form.Label>
          <Form.Control
            type="range"
            min={86400}
            max={86400 * 365}
            value={launchDelay}
            step={86400}
            onChange={({ target: { value } }) =>
              setLaunchDelay(parseInt(value))
            }
          />
          <Form.Text>{(launchDelay / 86400).toFixed(0)} day(s)</Form.Text>
        </Form.Group>
        <Form.Group>
          <Form.Label>Initial Emission</Form.Label>
          <Form.Control
            type="range"
            min={1}
            max={100000000}
            value={initialEmission}
            step={1}
            onChange={({ target: { value } }) =>
              setInitialEmission(parseInt(value))
            }
          />
          <Form.Text>{initialEmission} 1e18 wei(s)</Form.Text>
        </Form.Group>
        <Form.Group>
          <Form.Label>Minimum Emission Rate Per Week</Form.Label>
          <Form.Control
            type="range"
            min={0}
            max={134}
            value={minEmissionRatePerWeek}
            step={1}
            onChange={({ target: { value } }) =>
              setMinEmissionRatePerWeek(parseInt(value))
            }
          />
          <Form.Text>
            Minimum {minEmissionRatePerWeek / 100} % emission per week ~={" "}
            {(((1 + minEmissionRatePerWeek / 10000) ** 52 - 1) * 100).toFixed(
              1
            )}{" "}
            % yearly inflation
          </Form.Text>
        </Form.Group>
        <Form.Group>
          <Form.Label>Founder Share Rate</Form.Label>
          <Form.Control
            type="range"
            min={0}
            max={3000}
            value={founderShare}
            step={1}
            onChange={({ target: { value } }) =>
              setFounderShare(parseInt(value))
            }
          />
          <Form.Text>
            {((33 / 34) * (1 / (10000 / founderShare + 1)) * 100).toFixed(2)}%
            goes to the founder reward pool
          </Form.Text>
        </Form.Group>
        <Form.Group>
          <Form.Label>Initial Emission Cut Rate</Form.Label>
          <Form.Control
            type="range"
            min={500}
            max={5000}
            value={emissionCutRate}
            step={100}
            onChange={({ target: { value } }) =>
              setEmissionCutRate(parseInt(value))
            }
          />
          <Form.Text>
            {emissionCutRate / 100} % cuts per week until it reaches to the
            minimum emission rate.
          </Form.Text>
        </Form.Group>
        <Button
          variant="secondary"
          onClick={() => {
            setMinDelay(defaultSetting.minDelay);
            setLaunchDelay(defaultSetting.launchDelay);
            setInitialEmission(defaultSetting.initialEmission);
            setMinEmissionRatePerWeek(defaultSetting.minEmissionRatePerWeek);
            setEmissionCutRate(defaultSetting.emissionCutRate);
            setFounderShare(defaultSetting.founderShare);
            if (projectName) {
              setVisionName(`${projectName} Vision Token`);
              setCommitName(`${projectName} Commit Token`);
              setRightName(`${projectName} Right Token`);
            }
            if (projectSymbol) {
              setVisionSymbol(`v${projectSymbol}`);
              setCommitSymbol(`c${projectSymbol}`);
              setRightSymbol(`r${projectSymbol}`);
            }
          }}
        >
          Use default
        </Button>
      </div>
    </Form>
  );
};
