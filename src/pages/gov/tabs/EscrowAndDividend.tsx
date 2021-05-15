import { useWeb3React } from "@web3-react/core";
import { BigNumber } from "ethers";
import React, { useEffect, useState } from "react";
import { Col, Nav, Row, Tab } from "react-bootstrap";
import { CreateLock } from "../../../components/contracts/dividend-pool/CreateLock";
import { MyLock } from "../../../components/contracts/dividend-pool/MyLock";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { Claim } from "./Claim";

export const EscrowAndDividend: React.FC = () => {
  const contracts = useWorkhardContracts();
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const [stakedAmount, setStakedAmount] = useState<BigNumber>();
  const [lockIds, setLockIds] = useState<BigNumber[]>();

  useEffect(() => {
    if (!!account && !!contracts) {
      const { veLocker } = contracts;
      veLocker.balanceOf(account).then((locks) => {
        Promise.all(
          Array(locks.toNumber())
            .fill(undefined)
            .map((_, idx) => veLocker.tokenByIndex(idx))
        ).then((lockIds) => setLockIds(lockIds));
      });
    }
  }, [account, contracts, blockNumber]);
  useEffect(() => {
    if (!!account && !!contracts && !!lockIds) {
      const { veLocker } = contracts;
      Promise.all(lockIds.map((lockId) => veLocker.locks(lockId))).then(
        (locks) => {
          let totalLocked = locks.reduce(
            (acc, lock) => acc.add(lock.amount),
            BigNumber.from(0)
          );
          setStakedAmount(totalLocked);
        }
      );
    }
  }, [account, contracts, lockIds]);

  return (
    <Tab.Container defaultActiveKey="locks">
      <Row>
        <Col sm={3}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="locks">Voting Escrows</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="claim">Claim Dividend</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="faq">FAQ</Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane eventKey="locks">
              <CreateLock stakedAmount={stakedAmount} />
              <hr />
              <h3>Your Voting Escrows</h3>
              {lockIds &&
                lockIds
                  .map((lockId, index) => (
                    <>
                      <MyLock index={index} lockId={lockId} />
                      <br />
                    </>
                  ))
                  .reverse()}
            </Tab.Pane>
            <Tab.Pane eventKey="claim">
              <Claim />
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};
