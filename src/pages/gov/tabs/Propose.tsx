import React, { useEffect, useState } from "react";
import { Dropdown, Nav } from "react-bootstrap";
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

export const Propose: React.FC = ({}) => {
  const { account } = useWeb3React<providers.Web3Provider>();
  const workhardCtx = useWorkhard();
  const [hasProposerRole, setHasProposerRole] = useState<boolean>(false);
  const [presets, setPresets] = useState<Preset[]>();
  const history = useHistory();
  const { subtab } = useParams<{ subtab?: string }>();
  const { daoId } = workhardCtx || { daoId: 0 };

  useEffect(() => {
    if (!!account && !!workhardCtx) {
      const timeLockGovernance = workhardCtx.dao.timelock;
      timeLockGovernance
        .hasRole(solidityKeccak256(["string"], ["PROPOSER_ROLE"]), account)
        .then(setHasProposerRole);
      setPresets(buildPresets(workhardCtx.dao));
    }
  }, [account, workhardCtx]);

  return (
    <Tab.Container defaultActiveKey={subtab || "manual"}>
      <Row>
        <Col sm={3}>
          <Nav variant="pills" className="flex-column">
            <h5>
              <strong>By workers' union</strong>
            </h5>
            {presets ? (
              ["ContributionBoard", "DividendPool", "VisionEmitter"].map(
                (contractName) => (
                  <Dropdown as={Nav.Item}>
                    <Dropdown.Toggle variant="success" as={Nav.Link}>
                      {contractName}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {presets
                        ?.filter(
                          (preset) => preset.contractName === contractName
                        )
                        .map((prop) => {
                          return (
                            <Dropdown.Item
                              key={`${prop.contractName}-${prop.methodName}`}
                              eventKey={`${prop.contractName}-${prop.methodName}`}
                            >
                              {`${prop.methodName}`}
                            </Dropdown.Item>
                          );
                        })}
                    </Dropdown.Menu>
                  </Dropdown>
                )
              )
            ) : (
              <p>Not connected to the web3 module</p>
            )}
            {presets && (
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
              </Dropdown>
            )}
            <hr />
            <h5>
              <strong>By Multisig</strong>
            </h5>
            {presets ? (
              ["ContributionBoard", "DividendPool", "VisionEmitter"].map(
                (contractName) => (
                  <Dropdown as={Nav.Item} key={`multisig-${contractName}`}>
                    <Dropdown.Toggle variant="success" as={Nav.Link}>
                      {contractName}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {presets
                        ?.filter(
                          (preset) => preset.contractName === contractName
                        )
                        .map((prop) => {
                          return (
                            <Dropdown.Item
                              key={`multisig-${prop.contractName}-${prop.methodName}`}
                              eventKey={`multisig-${prop.contractName}-${prop.methodName}`}
                            >
                              {`${prop.methodName}`}
                            </Dropdown.Item>
                          );
                        })}
                    </Dropdown.Menu>
                  </Dropdown>
                )
              )
            ) : (
              <p>Not connected to the web3 module</p>
            )}
          </Nav>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane
              eventKey="manual"
              onEnter={() => history.push(prefix(daoId, "/gov/propose/manual"))}
            >
              <ProposeTx />
            </Tab.Pane>
            <Tab.Pane
              eventKey="manual-batch"
              onEnter={() =>
                history.push(prefix(daoId, "/gov/propose/manual-batch"))
              }
            >
              <ProposeBatchTx />
            </Tab.Pane>
            {presets?.map((preset) => {
              return (
                <Tab.Pane
                  key={`${preset.contractName}-${preset.methodName}`}
                  eventKey={`${preset.contractName}-${preset.methodName}`}
                  onEnter={() =>
                    history.push(
                      prefix(
                        daoId,
                        `/gov/propose/${`${preset.contractName}-${preset.methodName}`}`
                      )
                    )
                  }
                >
                  <PresetProposal
                    paramArray={preset.paramArray}
                    methodName={preset.methodName}
                    contract={preset.contract}
                    contractName={preset.contractName}
                    handler={preset.handler}
                  />
                </Tab.Pane>
              );
            })}
            {presets?.map((prop) => {
              return (
                <Tab.Pane
                  key={`multisig-${prop.contractName}-${prop.methodName}`}
                  eventKey={`multisig-${prop.contractName}-${prop.methodName}`}
                  onEnter={() =>
                    history.push(
                      prefix(
                        daoId,
                        `/gov/propose/multisig-${`${prop.contractName}-${prop.methodName}`}`
                      )
                    )
                  }
                >
                  <TimelockPresetProposal
                    paramArray={prop.paramArray}
                    methodName={prop.methodName}
                    contract={prop.contract}
                    contractName={prop.contractName}
                    handler={prop.handler}
                  />
                </Tab.Pane>
              );
            })}
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};
