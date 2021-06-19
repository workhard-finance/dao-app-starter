import { useEffect, useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import {
  TxStatus,
  getStablecoinList,
  errorHandler,
  compareAddress,
  getGnosisAPI,
  safeTxHandler,
} from "../../../utils/utils";
import { useToasts } from "react-toast-notifications";
import { BigNumberish, providers } from "ethers";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { ConditionalButton } from "../../ConditionalButton";
import { EmissionChart } from "../../views/EmissionChart";
import { getAddress, parseEther } from "ethers/lib/utils";
import { useHistory } from "react-router-dom";

const defaultSetting = {
  emissionStartDelay: 86400 * 7,
  minDelay: 86400,
  voteLaunchDelay: 86400 * 28,
  initialEmission: 24000000,
  minEmissionRatePerWeek: 60,
  emissionCutRate: 1000,
  founderShare: 500,
};

export const UpgradeToDAO: React.FC<{
  id?: BigNumberish;
  onUpgraded?: () => void;
}> = ({ id, onUpgraded }) => {
  const { chainId, account, library } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const history = useHistory();
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

  const [emissionStartDelay, setEmissionStartDelay] = useState<number>(
    defaultSetting.emissionStartDelay
  );
  const [minDelay, setMinDelay] = useState<number>(defaultSetting.minDelay);
  const [voteLaunchDelay, setVoteLaunchDelay] = useState<number>(
    defaultSetting.voteLaunchDelay
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

  const [hasAdminPermission, setHasAdminPermission] = useState<boolean>();

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
      const { project } = workhardCtx;
      project.ownerOf(id).then(setProjectOwner).catch(errorHandler(addToast));
    }
  }, [workhardCtx, id, blockNumber, history.location]);

  useEffect(() => {
    if (
      !!workhardCtx &&
      !!account &&
      !!chainId &&
      !!id &&
      !!projectOwner &&
      !!chainId
    ) {
      if (compareAddress(account, projectOwner)) {
        setHasAdminPermission(true);
      } else {
        const gnosisAPI = getGnosisAPI(chainId);
        if (gnosisAPI) {
          fetch(gnosisAPI + `safes/${projectOwner}/`)
            .then(async (response) => {
              const result = await response.json();
              if (
                (result.owners as string[])
                  .map(getAddress)
                  .includes(getAddress(account))
              ) {
                setHasAdminPermission(true);
              }
            })
            .catch((_) => {
              setHasAdminPermission(false);
            });
        }
      }
    }
  }, [id, workhardCtx, account, chainId, projectOwner]);

  const upgradeToDAO = async () => {
    if (!workhardCtx || !account || !library || !chainId) {
      alert("Not connected");
      return;
    } else if (!id) {
      alert("Project not exists");
      return;
    } else if (!projectOwner) {
      alert("Project owner is not fetched");
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
      emissionStartDelay === undefined ||
      !minDelay ||
      !voteLaunchDelay ||
      !initialEmission ||
      !minEmissionRatePerWeek ||
      !emissionCutRate ||
      !founderShare
    ) {
      alert("Please fill out the form.");
      return;
    }
    const { project } = workhardCtx;
    const signer = library.getSigner(account);
    const popTx = await project.populateTransaction.upgradeToDAO(id, {
      multisig,
      treasury: multisig, // TODO: should designate treasury
      baseCurrency,
      projectName,
      projectSymbol,
      visionName,
      visionSymbol,
      commitName,
      commitSymbol,
      rightName,
      rightSymbol,
      emissionStartDelay,
      minDelay,
      voteLaunchDelay,
      initialEmission: parseEther(`${initialEmission}`),
      minEmissionRatePerWeek,
      emissionCutRate,
      founderShare,
    });
    safeTxHandler(
      chainId,
      projectOwner,
      popTx,
      signer,
      setTxStatus,
      addToast,
      "Successfully upgraded this project to a DAO!",
      (receipt) => {
        if (receipt) {
        } else {
          alert("Created Multisig Tx. Go to Gnosis wallet and confirm.");
        }
        setTxStatus(undefined);
        onUpgraded && onUpgraded();
      },
      4100000
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
      <a
        className="text-warning"
        style={{ cursor: "pointer" }}
        onClick={() => setAdvancedMode(!advancedMode)}
      >
        Advanced
      </a>
      <br />
      <br />
      {advancedMode && (
        <div>
          <hr />
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
              value={voteLaunchDelay}
              step={86400}
              onChange={({ target: { value } }) =>
                setVoteLaunchDelay(parseInt(value))
              }
            />
            <Form.Text>{(voteLaunchDelay / 86400).toFixed(0)} day(s)</Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Emission starts after</Form.Label>
            <Form.Control
              type="range"
              min={0}
              max={86400 * 28}
              value={emissionStartDelay}
              step={86400}
              onChange={({ target: { value } }) =>
                setEmissionStartDelay(parseInt(value))
              }
            />
            <Form.Text>
              {(emissionStartDelay / 86400).toFixed(0)} day(s)
            </Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Initial Emission</Form.Label>
            <Row>
              <Col md={9}>
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
              </Col>
              <Col md={3}>
                <Form.Control
                  type="number"
                  min={1}
                  value={initialEmission}
                  step={1}
                  onChange={({ target: { value } }) =>
                    setInitialEmission(parseInt(value))
                  }
                />
              </Col>
            </Row>
            <Form.Text>{initialEmission} 1e18 wei(s)</Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Minimum Emission Rate Per Week</Form.Label>
            <Row>
              <Col md={10}>
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
              </Col>
              <Col md={2}>
                <Form.Control
                  type="number"
                  min={0}
                  max={134}
                  value={minEmissionRatePerWeek}
                  step={1}
                  onChange={({ target: { value } }) =>
                    setMinEmissionRatePerWeek(parseInt(value))
                  }
                />
              </Col>
            </Row>
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
            <Row>
              <Col md={10}>
                <Form.Control
                  type="range"
                  min={500}
                  max={3000}
                  value={founderShare}
                  step={1}
                  onChange={({ target: { value } }) =>
                    setFounderShare(parseInt(value))
                  }
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  type="number"
                  min={500}
                  max={3000}
                  value={founderShare}
                  step={1}
                  onChange={({ target: { value } }) =>
                    setFounderShare(parseInt(value))
                  }
                />
              </Col>
            </Row>

            <Form.Text>
              {((33 / 34) * (1 / (10000 / founderShare + 1)) * 100).toFixed(2)}%
              goes to the founder reward pool
            </Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Initial Emission Cut Rate</Form.Label>
            <Row>
              <Col md={10}>
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
              </Col>
              <Col md={2}>
                <Form.Control
                  type="number"
                  min={500}
                  max={5000}
                  value={emissionCutRate}
                  step={100}
                  onChange={({ target: { value } }) =>
                    setEmissionCutRate(parseInt(value))
                  }
                />
              </Col>
            </Row>

            <Form.Text>
              {emissionCutRate / 100} % cuts per week until it reaches to the
              minimum emission rate.
            </Form.Text>
          </Form.Group>
          <Button
            variant="secondary"
            onClick={() => {
              setEmissionStartDelay(defaultSetting.emissionStartDelay);
              setMinDelay(defaultSetting.minDelay);
              setVoteLaunchDelay(defaultSetting.voteLaunchDelay);
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
          <hr />
          <p>Expected Emission Schedule</p>
          <EmissionChart
            initialEmission={parseEther(`${initialEmission}`)}
            emissionCut={emissionCutRate}
            minimumRate={minEmissionRatePerWeek}
            currentWeek={0}
          />
        </div>
      )}
      <ConditionalButton
        variant="info"
        onClick={upgradeToDAO}
        enabledWhen={hasAdminPermission}
        whyDisabled={id ? `Not allowed` : "This is a preview"}
        tooltip={
          compareAddress(projectOwner, account || undefined)
            ? undefined
            : "Create a multisig transaction"
        }
        children={`Start DAO!`}
      />
    </Form>
  );
};
