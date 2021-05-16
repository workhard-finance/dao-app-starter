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
              {lockIds?.length === 0 || (
                <p>I can't wait to show your locks here!</p>
              )}
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
            <Tab.Pane eventKey="faq">
              <h5>
                <strong>What is Voting Escrow?</strong>
              </h5>
              <p>
                Voting Escrow is a lock up system to get voting powers and claim
                dividends.
                <ul>
                  <li>Max lock is 208 weeks(~= 4 years).</li>
                  <li>veVISION = RIGHT</li>
                  <li>1 VISION = 1 RIGHT when you locked 4 years</li>
                  <li>1 VISION = 0.5 RIGHT when you locked 2 years</li>
                </ul>
              </p>
              <h5>
                <strong>Can I have multiple locks?</strong>
              </h5>
              <p>
                Yes, you can :) Your $RIGHT will be the sum of all locks' RIGHT
                you own now.
              </p>
              <h5>
                <strong>Can I update my locks?</strong>
              </h5>
              <p>
                Yes, but only before the expiration! You can increase the lock
                amount or extend the period. If your lock's expired, please
                withdraw and re-create a lock.
              </p>
              <h5>
                <strong>
                  My private key is exposed to someone. How can I secure my
                  lock?
                </strong>
              </h5>
              <p>
                Your lock is NFT! You can simply transfer it to another account.
              </p>
              <h5>
                <strong>Can I delegate my voting power?</strong>
              </h5>
              <p>
                Yes and also you can withdraw the delegation anytime you want.
                But please note that Workers Union counts the vote in the
                quadratic voting method(square root), so you'll maximize your
                vote when you use your voting power yourself.
              </p>
              <h5>
                <strong>What is the dividend pool?</strong>
              </h5>
              <p>
                Dividend pool is where you can claim your share of the protocol
                revenue. Any kind of revenue stream, including simple donation,
                will be distributed to the $RIGHT holders. To prevent abusing
                usage of marketing purpose, it has an allowed token list for
                distribution and the list is governed by Workers' Union. Note
                that mining pools are where you get VISION emission, and
                dividend pool is where you claim protocol revenues in various
                ERC20 token.
              </p>
              <h5>
                <strong>When does new epoch start?</strong>
              </h5>
              <p>It starts every Thursday GMT +0</p>
              <h5>
                <strong>About the code?</strong>
              </h5>
              <p>
                Codes are the re-implemented version of veCRV's vyper contract
                in solidity. You can find them{" "}
                <a
                  href="https://github.com/workhard-finance/protocol/tree/main/contracts/core/governance/libraries"
                  target="_blank"
                >
                  here
                </a>{" "}
                and the original codes{" "}
                <a
                  href="https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/VotingEscrow.vy"
                  target="_blank"
                >
                  here
                </a>
                . If you take a look at the code, you'll find out that Curve's
                veCRV math is kind of an art. That allows the distributions and
                accumulation of rewards without any recursive on-chain
                transactions even though it has a time dependent functions.
                Workhard's RIGHT(veVISION) contract is a refactored version in
                solidity with two additional features: NFTization and vote
                delegation.
              </p>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};
