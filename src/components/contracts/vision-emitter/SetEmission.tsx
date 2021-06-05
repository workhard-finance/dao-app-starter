import React, { useEffect, useState } from "react";
import Page from "../../../layouts/Page";
import {
  Col,
  Row,
  Nav,
  Tab,
  Container,
  Button,
  Card,
  Form,
} from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import {
  compareAddress,
  errorHandler,
  humanReadablePoolType,
  prefix,
  safeTxHandler,
  TxStatus,
} from "../../../utils/utils";
import { FatherSays } from "../../../components/views/FatherSays";
import { PoolWeight } from "../../views/PoolWeight";
import { AllocationChart } from "../../views/AllocationChart";
import { useToasts } from "react-toast-notifications";
import { BigNumber, providers, constants } from "ethers";
import { MiningPool__factory } from "@workhard/protocol";
import { useWeb3React } from "@web3-react/core";
import { randomBytes } from "ethers/lib/utils";

export const SetEmission = () => {
  const workhardCtx = useWorkhard();
  const { library, account, chainId } = useWeb3React<providers.Web3Provider>();
  const { addToast } = useToasts();

  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [pools, setPools] = useState<
    {
      baseToken: string;
      poolType: string;
      weight: number;
      name?: string;
    }[]
  >();

  const [founderShareDenom, setFounderShareDenom] = useState<BigNumber>();
  const [emissionWeight, setEmissionWeight] = useState<{
    treasury: BigNumber;
    caller: BigNumber;
    protocol: BigNumber;
    dev: BigNumber;
    sum: BigNumber;
  }>();
  const [emissionWeightForChart, setEmissionWeightForChart] = useState<{
    treasury: number;
    caller: number;
    protocol: number;
    dev: number;
    sum: number;
  }>();

  const [treasuryWeight, setTreasuryWeight] = useState<number>();
  const [callerWeight, setCallerWeight] = useState<number>();

  const getPresetTokenName = (address: string): string | undefined => {
    if (compareAddress(address, workhardCtx?.periphery.visionLP.address)) {
      return "Vision LP";
    } else {
      return undefined;
    }
  };

  useEffect(() => {
    if (workhardCtx && library) {
      workhardCtx.dao.visionEmitter
        .emissionWeight()
        .then(setEmissionWeight)
        .catch(errorHandler(addToast));
      workhardCtx.dao.visionEmitter
        .FOUNDER_SHARE_DENOMINATOR()
        .then(setFounderShareDenom)
        .catch(errorHandler(addToast));
      workhardCtx.dao.visionEmitter
        .getNumberOfPools()
        .then(async (num) => {
          const [_weights, _pools] = await Promise.all([
            Promise.all(
              Array(num.toNumber())
                .fill(workhardCtx.dao.visionEmitter)
                .map((emitter, i) => emitter.getPoolWeight(i))
            ),
            Promise.all(
              Array(num.toNumber())
                .fill(workhardCtx.dao.visionEmitter)
                .map((emitter, i) => emitter.pools(i))
            ),
          ]);
          const [_types, _baseTokens] = await Promise.all([
            Promise.all(
              _pools.map((addr) =>
                workhardCtx.dao.visionEmitter.poolTypes(addr)
              )
            ),
            Promise.all(
              _pools.map((addr) =>
                MiningPool__factory.connect(addr, library).baseToken()
              )
            ),
          ]);
          setPools(
            _weights.map((weight, i) => ({
              weight: weight.toNumber(),
              baseToken: _baseTokens[i],
              poolType: _types[i],
              name: getPresetTokenName(_baseTokens[i]),
            }))
          );
        })
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, library]);

  useEffect(() => {
    if (pools && emissionWeight && founderShareDenom) {
      let sum = BigNumber.from(0)
        .add(emissionWeight.treasury)
        .add(emissionWeight.caller);
      sum = pools.reduce((acc, pool) => acc.add(pool.weight), sum);
      const dev = sum.div(founderShareDenom);
      sum = sum.add(dev);
      const protocol = emissionWeight.protocol.eq(0)
        ? BigNumber.from(0)
        : sum.div(33);
      sum = sum.add(protocol);
      setEmissionWeightForChart({
        treasury: emissionWeight.treasury.toNumber(),
        caller: emissionWeight.caller.toNumber(),
        protocol: protocol.toNumber(),
        dev: dev.toNumber(),
        sum: sum.toNumber(),
      });
      setTreasuryWeight(emissionWeight.treasury.toNumber());
      setCallerWeight(emissionWeight.caller.toNumber());
    }
  }, [pools, emissionWeight, founderShareDenom]);

  const multisigSetEmission = async () => {
    if (!workhardCtx || !library || !account || !chainId) {
      alert("Not connected");
      return;
    }
    if (!treasuryWeight) {
      alert("Setup treasury weight");
      return;
    }

    if (!callerWeight) {
      alert("Setup caller bonus weight");
      return;
    }

    const signer = library.getSigner(account);
    const emissionSetTx = await workhardCtx.dao.visionEmitter.populateTransaction.setEmission(
      {
        pools:
          pools?.map((pool) => ({
            baseToken: pool.baseToken,
            poolType: pool.poolType,
            weight: pool.weight,
          })) || [],
        treasuryWeight,
        callerWeight,
      }
    );
    const { to, data } = emissionSetTx;
    if (!to || !data) {
      throw Error("Failed to create tx");
    }
    const tx = await workhardCtx.dao.timelock.populateTransaction.schedule(
      to,
      0,
      data,
      constants.HashZero,
      BigNumber.from(randomBytes(32)).toHexString(),
      await workhardCtx.dao.timelock.getMinDelay()
    );

    safeTxHandler(
      chainId,
      workhardCtx.dao.multisig.address,
      tx,
      signer,
      setTxStatus,
      addToast,
      "Paid successfully!",
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
    <Container>
      <h2>Pools</h2>
      <Row>
        {pools?.map((pool, i) => (
          <Col md={6}>
            <Card>
              <Card.Body>
                <PoolWeight
                  preset={pool}
                  onChange={(_pool) => {
                    const newPools = [...pools];
                    newPools[i] = _pool;
                    setPools(newPools);
                  }}
                />
                <Button
                  onClick={() => {
                    setPools([...pools.slice(0, i), ...pools.slice(i + 1)]);
                  }}
                >
                  Remove
                </Button>
              </Card.Body>
            </Card>
            <br />
          </Col>
        ))}
      </Row>
      <Card>
        <Card.Body>
          <Card.Title>Basic configuration</Card.Title>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Treasury</Form.Label>
                  <Row>
                    <Col md={8}>
                      <Form.Control
                        type="range"
                        min={0}
                        max={9999}
                        step={1}
                        value={treasuryWeight || 0}
                        onChange={(event) => {
                          setTreasuryWeight(parseInt(event.target.value));
                        }}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        type="number"
                        min={0}
                        max={9999}
                        step={1}
                        value={treasuryWeight || 0}
                        onChange={(event) => {
                          setTreasuryWeight(parseInt(event.target.value));
                        }}
                      />
                    </Col>
                  </Row>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Caller</Form.Label>
                  <Row>
                    <Col md={8}>
                      <Form.Control
                        type="range"
                        min={0}
                        max={10}
                        step={1}
                        value={callerWeight || 0}
                        onChange={(event) => {
                          setCallerWeight(parseInt(event.target.value));
                        }}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        type="number"
                        min={0}
                        max={10}
                        step={1}
                        value={callerWeight || 0}
                        onChange={(event) => {
                          setCallerWeight(parseInt(event.target.value));
                        }}
                      />
                    </Col>
                  </Row>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      <br />
      {pools && (
        <>
          <Button
            onClick={() => {
              const emptyPreset = {
                baseToken: "",
                poolType: "",
                weight: 0,
              };
              const newPools = pools ? [...pools, emptyPreset] : [emptyPreset];
              setPools(newPools);
            }}
          >
            Add a pool
          </Button>{" "}
          <Button variant="info" onClick={multisigSetEmission}>
            Create Multisig Transaction
          </Button>
        </>
      )}
      <hr />
      <h2>Expected Emission</h2>
      {emissionWeightForChart && (
        <AllocationChart
          pools={
            pools
              ? pools.map((pool) => ({
                  name: `${humanReadablePoolType(pool.poolType)} - ${
                    pool.name || pool.baseToken
                  }`,
                  weight: pool.weight,
                  poolType: pool.poolType,
                }))
              : []
          }
          treasury={emissionWeightForChart.treasury || 1}
          caller={emissionWeightForChart.caller || 0}
          protocol={emissionWeightForChart.protocol || 0}
          founder={emissionWeightForChart.dev || 0}
          sum={emissionWeightForChart.sum || 1}
        />
      )}
    </Container>
  );
};
