import React, { useEffect, useState } from "react";
import { Dropdown, Nav } from "react-bootstrap";
import { Col, Row, Tab } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { ProposeTx } from "./proposal-types/ProposeTx";
import { ProposeBatchTx } from "./proposal-types/ProposeBatchTx";
import { TimelockPresetProposal } from "../timelocked-governance/TimelockPresetProposal";
import { buildPresets, Preset } from "../../../utils/preset";
import { PresetProposal } from "./proposal-types/PresetProposal";
import { solidityKeccak256 } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { providers } from "ethers";

export const Propose: React.FC = ({}) => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const contracts = useWorkhardContracts();
  const presets: Preset[] | undefined = buildPresets(contracts);
  const [hasProposerRole, setHasProposerRole] = useState<boolean>(false);

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const timeLockGovernance = contracts.timelockedGovernance;
      timeLockGovernance
        .hasRole(solidityKeccak256(["string"], ["PROPOSER_ROLE"]), account)
        .then(setHasProposerRole);

      return () => {
        stale = true;
        setHasProposerRole(false);
      };
    }
  }, [account, contracts]);
  return (
    <Tab.Container defaultActiveKey="manual">
      <Row>
        <Col sm={4}>
          <Nav variant="pills" className="flex-column">
            <h4>Farmers Union</h4>
            {["CryptoJobBoard", "VisionFarm", "VisionTokenEmitter"].map(
              (contractName) => (
                <Dropdown as={Nav.Item} key={`farmers-union-${contractName}`}>
                  <Dropdown.Toggle variant="success" as={Nav.Link}>
                    {contractName}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {presets
                      ?.filter((preset) => preset.contractName === contractName)
                      .map((prop) => {
                        return (
                          <Dropdown.Item
                            key={`${prop.contractName}.${prop.methodName}`}
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
              <Dropdown.Toggle variant="success" as={Nav.Link}>
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
            {hasProposerRole && (
              <>
                <h4>Timelock</h4>
                {["CryptoJobBoard", "VisionFarm", "VisionTokenEmitter"].map(
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
                                key={`timelock-${prop.contractName}.${prop.methodName}`}
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
              </>
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
                <Tab.Pane
                  key={`${prop.contractName}.${prop.methodName}`}
                  eventKey={`${prop.contractName}.${prop.methodName}`}
                >
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
                  key={`timelock-${prop.contractName}.${prop.methodName}`}
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
