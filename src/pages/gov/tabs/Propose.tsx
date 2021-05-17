import React, { useEffect, useState } from "react";
import { Dropdown, Nav } from "react-bootstrap";
import { Col, Row, Tab } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
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

export const Propose: React.FC = ({}) => {
  const { account } = useWeb3React<providers.Web3Provider>();
  const contracts = useWorkhardContracts();
  const [hasProposerRole, setHasProposerRole] = useState<boolean>(false);
  const [presets, setPresets] = useState<Preset[]>();
  const history = useHistory();
  const { subtab } = useParams<{ subtab?: string }>();

  useEffect(() => {
    if (!!account && !!contracts) {
      const timeLockGovernance = contracts.timelockedGovernance;
      timeLockGovernance
        .hasRole(solidityKeccak256(["string"], ["PROPOSER_ROLE"]), account)
        .then(setHasProposerRole);
      setPresets(buildPresets(contracts));
    }
  }, [account, contracts]);

  return (
    <Tab.Container defaultActiveKey={subtab || "manual"}>
      <Row>
        <Col sm={3}>
          <Nav variant="pills" className="flex-column">
            <h5>
              <strong>Preset proposals</strong>
            </h5>
            {presets ? (
              ["JobBoard", "DividendPool", "VisionEmitter"].map(
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
            {hasProposerRole && (
              <>
                <h5>
                  <strong>Multisig</strong>
                </h5>
                {presets ? (
                  ["JobBoard", "DividendPool", "VisionEmitter"].map(
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
              </>
            )}
          </Nav>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane
              eventKey="manual"
              onEnter={() => history.push("/gov/propose/manual")}
            >
              <ProposeTx />
            </Tab.Pane>
            <Tab.Pane
              eventKey="manual-batch"
              onEnter={() => history.push("/gov/propose/manual-batch")}
            >
              <ProposeBatchTx />
            </Tab.Pane>
            {presets?.map((prop) => {
              return (
                <Tab.Pane
                  key={`${prop.contractName}-${prop.methodName}`}
                  eventKey={`${prop.contractName}-${prop.methodName}`}
                  onEnter={() =>
                    history.push(
                      `/gov/propose/${`${prop.contractName}-${prop.methodName}`}`
                    )
                  }
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
                  key={`multisig-${prop.contractName}-${prop.methodName}`}
                  eventKey={`multisig-${prop.contractName}-${prop.methodName}`}
                  onEnter={() =>
                    history.push(
                      `/gov/propose/multisig-${`${prop.contractName}-${prop.methodName}`}`
                    )
                  }
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
