import React, { useEffect, useState } from "react";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { useWeb3React } from "@web3-react/core";
import { TimelockTx } from "./TimelockTx";
import { providers, Transaction } from "ethers";

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
      <p>
        Governance will be transferred from admin's timelock to FarmersUnion.sol
        in 4 weeks.
      </p>
      {Object.values(txs)
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .map((tx, index) => {
          return (
            <>
              <br />
              <TimelockTx {...tx} index={Object.values(txs).length - index} />
            </>
          );
        })}
    </>
  );
};
