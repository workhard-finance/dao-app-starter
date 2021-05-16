import React, { useEffect, useState } from "react";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { TimelockTx } from "../../../components/contracts/timelocked-governance/TimelockTx";
import { providers, Transaction } from "ethers";
import { Alert } from "react-bootstrap";

export const TimelockTxs: React.FC<{}> = ({}) => {
  const { library } = useWeb3React<providers.Web3Provider>();
  const contracts = useWorkhardContracts();
  const [emittedEvents, setEmittedEvents] = useState<{
    [hash: string]: { id: string; blockNumber: number };
  }>({});
  const [txs, setTxs] = useState<{
    [hash: string]: { tx: Transaction; id: string; blockNumber: number };
  }>({});

  useEffect(() => {
    if (!!contracts) {
      let stale = false;
      const timelockedGovernance = contracts.timelockedGovernance;
      timelockedGovernance
        .queryFilter(
          timelockedGovernance.filters.CallScheduled(
            null,
            null,
            null,
            null,
            null,
            null,
            null
          )
        )
        .then((events) => {
          const _txIds = Object.assign({}, emittedEvents);
          events.forEach((event) => {
            const txHash = event.transactionHash;
            const id = event.args.id;
            _txIds[txHash] = { id, blockNumber: event.blockNumber };
          });
          setEmittedEvents(_txIds);
        });
      return () => {
        stale = true;
        setEmittedEvents({});
      };
    }
  }, [contracts]);

  useEffect(() => {
    if (!!library) {
      let stale = false;
      const promises = Object.keys(emittedEvents)
        .filter((txHash) => {
          return !txs[txHash];
        })
        .map((txHash) => {
          return library.getTransaction(txHash);
        });
      Promise.all(promises).then((res) => {
        const _txs = Object.assign({}, txs);
        res.forEach(async (tx) => {
          const { id, blockNumber } = emittedEvents[tx.hash];
          _txs[tx.hash] = { tx, id, blockNumber };
        });
        setTxs(_txs);
      });
      return () => {
        stale = true;
        setTxs({});
      };
    }
  }, [library, emittedEvents]);
  return (
    <>
      {Object.values(txs).length === 0 ? (
        <p>Oops, cannot fetch the timelock transactions.</p>
      ) : (
        <Alert variant="info">
          All governance transactions are timelock controlled transactions.
          Transactions can be scheduled and executed by Workers Union voting or
          Dev's multisig wallet. Workers Union can revoke the permission of
          Dev's multisig wallet from the timelock contract by voting.
        </Alert>
      )}
      {Object.values(txs)
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .map((tx, index) => {
          return (
            <div key={`timelock-tx-${index}`}>
              <br />
              <TimelockTx {...tx} index={Object.values(txs).length - index} />
            </div>
          );
        })}
    </>
  );
};
