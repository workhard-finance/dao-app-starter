import React, { useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { ProposeTx } from "../../../components/contracts/workers-union/proposal-types/ProposeTx";
import { ProposeBatchTx } from "../../../components/contracts/workers-union/proposal-types/ProposeBatchTx";
import { buildPresets, Preset } from "../../../utils/preset";
import { PresetProposal } from "../../../components/contracts/workers-union/proposal-types/PresetProposal";
import { useWeb3React } from "@web3-react/core";
import { providers } from "ethers";

export const WorkersUnionProposal: React.FC = ({}) => {
  const { account } = useWeb3React<providers.Web3Provider>();
  const workhardCtx = useWorkhard();
  const [presets, setPresets] = useState<Preset[]>();
  const [contractName, setContractName] = useState<string>();
  const [functionName, setFunctionName] = useState<string>();
  const [preset, setPreset] = useState<Preset>();

  useEffect(() => {
    if (!!account && !!workhardCtx) {
      const presets = buildPresets(workhardCtx.dao);
      setPresets(presets);
      setPreset(presets[0]);
    }
  }, [account, workhardCtx]);

  useEffect(() => {
    if (preset) {
      setContractName(preset.contractName);
      setFunctionName(preset.methodName);
    }
  }, [preset]);

  return (
    <Container>
      <h5>Contract</h5>
      {presets ? (
        [
          "StableReserve",
          "DividendPool",
          "VisionEmitter",
          "Marketplace",
          "VotingEscrowLock",
          "WorkersUnion",
          "Manual",
        ].map((name) => (
          <Button
            style={{ margin: "0.2rem" }}
            onClick={() => {
              setContractName(name);
            }}
            variant={name === contractName ? "primary" : "outline-primary"}
          >
            {name}
          </Button>
        ))
      ) : (
        <p>fetching...</p>
      )}
      <br />
      <br />
      <h5>Function</h5>
      {!presets && <p>Select Contract</p>}
      {presets
        ?.filter((preset) => preset.contractName === contractName)
        .map((prop) => {
          return (
            <>
              <Button
                style={{ margin: "0.2rem" }}
                onClick={() => {
                  setFunctionName(prop.methodName);
                  setPreset(prop);
                }}
                variant={
                  prop.methodName === functionName
                    ? "primary"
                    : "outline-primary"
                }
              >
                {`${prop.methodName}`}
              </Button>
            </>
          );
        })}
      <br />
      <br />
      <h5>Submit proposal</h5>
      {preset ? (
        preset.contractName !== "Manual" ? (
          <PresetProposal
            paramArray={preset.paramArray}
            methodName={preset.methodName}
            contract={preset.contract}
            contractName={preset.contractName}
          />
        ) : preset.methodName === "proposeTx" ? (
          <ProposeTx />
        ) : (
          <ProposeBatchTx />
        )
      ) : (
        <p>Select contract and method name</p>
      )}
    </Container>
  );
};
