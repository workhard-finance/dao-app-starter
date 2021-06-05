import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Dropdown,
  Form,
  InputGroup,
  Nav,
} from "react-bootstrap";
import { Col, Row, Tab } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { ProposeTx } from "../../../components/contracts/workers-union/proposal-types/ProposeTx";
import { ProposeBatchTx } from "../../../components/contracts/workers-union/proposal-types/ProposeBatchTx";
import { TimelockPresetProposal } from "../../../components/contracts/timelocked-governance/TimelockPresetProposal";
import { buildPresets, Preset } from "../../../utils/preset";
import { PresetProposal } from "../../../components/contracts/workers-union/proposal-types/PresetProposal";
import { solidityKeccak256 } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { providers } from "ethers";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import { prefix } from "../../../utils/utils";

export const WorkersUnionProposal: React.FC = ({}) => {
  const { account } = useWeb3React<providers.Web3Provider>();
  const workhardCtx = useWorkhard();
  const [hasProposerRole, setHasProposerRole] = useState<boolean>(false);
  const [presets, setPresets] = useState<Preset[]>();
  const [contractName, setContractName] = useState<string>();
  const [functionName, setFunctionName] = useState<string>();
  const [preset, setPreset] = useState<Preset>();
  const history = useHistory();
  const { subtab } = useParams<{ subtab?: string }>();
  const { daoId } = workhardCtx || { daoId: 0 };

  useEffect(() => {
    if (!!account && !!workhardCtx) {
      const timeLockGovernance = workhardCtx.dao.timelock;
      timeLockGovernance
        .hasRole(solidityKeccak256(["string"], ["PROPOSER_ROLE"]), account)
        .then(setHasProposerRole);
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
          // <Dropdown as={Nav.Item}>
          //   <Dropdown.Toggle
          //     variant="success"
          //     as={Nav.Link}
          //     eventKey={contractName}
          //   >
          //     {contractName}
          //   </Dropdown.Toggle>
          //   <Dropdown.Menu>
          //     {presets
          //       ?.filter(
          //         (preset) => preset.contractName === contractName
          //       )
          //       .map((prop) => {
          //         return (
          //           <Dropdown.Item
          //             key={`${prop.contractName}-${prop.methodName}`}
          //             eventKey={`${prop.contractName}-${prop.methodName}`}
          //           >
          //             {`${prop.methodName}`}
          //           </Dropdown.Item>
          //         );
          //       })}
          //   </Dropdown.Menu>
          // </Dropdown>
        ))
      ) : (
        <p>fetching...</p>
      )}
      {/* {presets && (
              <Dropdown as={Nav.Item}>
                <Dropdown.Toggle variant="success" as={Nav.Link}>
                  Manual
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item eventKey="manual">
                    Manual Transaction Proposal
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="manual-batch">
                    Manual Batch Transaction
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown> */}
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
