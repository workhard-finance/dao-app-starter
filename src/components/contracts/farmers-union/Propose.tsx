import React from "react";
import { Nav } from "react-bootstrap";
import { Col, Row, Tab } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import {
  PresetProposal,
  PresetProposalProps,
} from "./proposal-types/PresetProposal";
import { ProposeTx } from "./proposal-types/ProposeTx";
import { ProposeBatchTx } from "./proposal-types/ProposeBatchTx";
import { buildPresets } from "../../../utils/utils";

export const Propose: React.FC = ({}) => {
  const contracts = useWorkhardContracts();
  const presets: PresetProposalProps[] = buildPresets(contracts);
  return (
    <Tab.Container id="left-tabs-example" defaultActiveKey="manual">
      <Row>
        <Col sm={4}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="manual">manual</Nav.Link>
              <Nav.Link eventKey="maunal(batch)">manual(batch)</Nav.Link>
              <h4>Presets</h4>
              {presets.map((prop) => {
                return (
                  <Nav.Link eventKey={prop.methodName}>
                    {`${prop.methodName}(${prop.contractName})`}
                  </Nav.Link>
                );
              })}
            </Nav.Item>
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
            {presets.map((prop) => {
              return (
                <Tab.Pane eventKey={prop.methodName}>
                  <PresetProposal
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
