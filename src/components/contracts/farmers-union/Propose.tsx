import React from "react";
import { Dropdown, Nav } from "react-bootstrap";
import { Col, Row, Tab } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { ProposeTx } from "./proposal-types/ProposeTx";
import { ProposeBatchTx } from "./proposal-types/ProposeBatchTx";
import { TimelockPresetProposal } from "../timelocked-governance/TimelockPresetProposal";
import { buildPresets, Preset } from "../../../utils/preset";
import { PresetProposal } from "./proposal-types/PresetProposal";

export const Propose: React.FC = ({}) => {
  const contracts = useWorkhardContracts();
  const presets: Preset[] | undefined = buildPresets(contracts);
  return (
    <Tab.Container id="left-tabs-example" defaultActiveKey="manual">
      <Row>
        <Col sm={4}>
          <Nav variant="pills" className="flex-column">
            <h4>Farmers Union</h4>
            {["CryptoJobBoard", "VisionFarm", "VisionTokenEmitter"].map(
              (contractName) => (
                <Dropdown as={Nav.Item}>
                  <Dropdown.Toggle
                    variant="success"
                    id={`dropdown-farmersunion-${contractName}`}
                    as={Nav.Link}
                  >
                    {contractName}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {presets
                      ?.filter((preset) => preset.contractName === contractName)
                      .map((prop) => {
                        return (
                          <Dropdown.Item
                            eventKey={`${prop.contractName}.${prop.methodName}`}
                          >
                            {`${prop.methodName}`}
                          </Dropdown.Item>
                        );
                      })}
                  </Dropdown.Menu>
                </Dropdown>
              )
            )}
            <Dropdown as={Nav.Item}>
              <Dropdown.Toggle
                variant="success"
                id="dropdown-farmersunion-manual"
                as={Nav.Link}
              >
                Manual
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey="manual">
                  Manual Transaction Proposal
                </Dropdown.Item>
                <Dropdown.Item eventKey="maunal(batch)">
                  Manual Batch Transaction
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <hr />
            <h4>Timelock</h4>
            {["CryptoJobBoard", "VisionFarm", "VisionTokenEmitter"].map(
              (contractName) => (
                <Dropdown as={Nav.Item}>
                  <Dropdown.Toggle
                    variant="success"
                    id={`dropdown-timelock-${contractName}`}
                    as={Nav.Link}
                  >
                    {contractName}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {presets
                      ?.filter((preset) => preset.contractName === contractName)
                      .map((prop) => {
                        return (
                          <Dropdown.Item
                            eventKey={`timelock-${prop.contractName}.${prop.methodName}`}
                          >
                            {`${prop.methodName}`}
                          </Dropdown.Item>
                        );
                      })}
                  </Dropdown.Menu>
                </Dropdown>
              )
            )}
          </Nav>
        </Col>
        <Col sm={8}>
          <Tab.Content>
            <Tab.Pane eventKey="manual">
              <ProposeTx />
            </Tab.Pane>
            <Tab.Pane eventKey="maunal(batch)">
              <ProposeBatchTx />
            </Tab.Pane>
            {presets?.map((prop) => {
              return (
                <Tab.Pane eventKey={`${prop.contractName}.${prop.methodName}`}>
                  <PresetProposal
                    paramArray={prop.paramArray}
                    methodName={prop.methodName}
                    contract={prop.contract}
                    contractName={prop.contractName}
                  />
                </Tab.Pane>
              );
            })}
            {presets?.map((prop) => {
              return (
                <Tab.Pane
                  eventKey={`timelock-${prop.contractName}.${prop.methodName}`}
                >
                  <TimelockPresetProposal
                    paramArray={prop.paramArray}
                    methodName={prop.methodName}
                    contract={prop.contract}
                    contractName={prop.contractName}
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
