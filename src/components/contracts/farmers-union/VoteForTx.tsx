import { Button, Card, ProgressBar } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { BigNumber, Signer } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { DecodedTxData, decodeTxDetails } from "../../../utils/utils";
import { DecodedTxs } from "../../DecodedTxs";
import { ConditionalButton } from "../../ConditionalButton";

interface Proposal {
  proposer: string;
  start: BigNumber;
  end: BigNumber;
  totalForVotes: BigNumber;
  totalAgainstVotes: BigNumber;
  executed: boolean;
}

export interface ProposedTx {
  txHash: string;
  target: string;
  value: BigNumber;
  data: string;
  predecessor: string;
  salt: string;
  start: BigNumber;
  end: BigNumber;
}

export interface ProposedBatchTx {
  txHash: string;
  target: string[];
  value: BigNumber[];
  data: string[];
  predecessor: string;
  salt: string;
  start: BigNumber;
  end: BigNumber;
}

export enum VoteForTxStatus {
  Pending,
  Voting,
  Ended,
}

export interface VoteForTxProps {
  tx: ProposedTx | ProposedBatchTx;
  status: VoteForTxStatus;
  myVotes?: BigNumber;
}

export const VoteForTx: React.FC<VoteForTxProps> = ({
  myVotes,
  tx,
  status,
}) => {
  const { account, library, chainId } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [proposal, setProposal] = useState<Proposal>();
  const [lastTx, setLastTx] = useState<string>();
  const [decodedTxData, setDecodedTxData] = useState<DecodedTxData[]>();

  useEffect(() => {
    if (!contracts) {
      return;
    }
    const farmersUnion = contracts.farmersUnion;
    farmersUnion.callStatic.proposals(tx.txHash).then(setProposal);
  }, [contracts, blockNumber]);

  useEffect(() => {
    if (!contracts || !proposal) {
      return;
    }
    if (Array.isArray(tx.target) && Array.isArray(tx.data)) {
      setDecodedTxData(
        tx.target.reduce(
          (arr, target, i) => [
            ...arr,
            decodeTxDetails(contracts, target, tx.data[i]),
          ],
          [] as DecodedTxData[]
        )
      );
    } else if (!Array.isArray(tx.target) && !Array.isArray(tx.data)) {
      setDecodedTxData([decodeTxDetails(contracts, tx.target, tx.data)]);
    }
  }, [contracts, proposal]);

  const onVote = (agree: boolean) => async () => {
    if (!contracts) {
      return;
    }
    const farmersUnion = contracts.farmersUnion;
    const signer = await library.getSigner(account);
    await farmersUnion.connect(signer).vote(tx.txHash, agree);
  };
  const execute = () => {
    if (!contracts) {
      return;
    }
    const farmersUnion = contracts.farmersUnion;
    const signer: Signer = library.getSigner(account);
    if (
      !Array.isArray(tx.target) &&
      !Array.isArray(tx.value) &&
      !Array.isArray(tx.data)
    ) {
      farmersUnion
        .connect(signer)
        .execute(tx.target, tx.value, tx.data, tx.predecessor, tx.salt)
        .then((res) => {
          res.wait().then((receipt) => setLastTx(receipt.transactionHash));
        });
    } else if (
      Array.isArray(tx.target) &&
      Array.isArray(tx.value) &&
      Array.isArray(tx.data)
    ) {
      farmersUnion
        .connect(signer)
        .executeBatch(tx.target, tx.value, tx.data, tx.predecessor, tx.salt)
        .then((res) => {
          res.wait().then((receipt) => setLastTx(receipt.transactionHash));
        });
    } else {
      throw Error("unexpected type");
    }
  };

  return (
    <Card>
      <Card.Header as="h5">propose: {tx.txHash}</Card.Header>
      <Card.Body>
        <Card.Text>Schedule:</Card.Text>
        <ul>
          <li>
            Voting period:{" "}
            {new Date(tx.start.mul(1000).toNumber()).toLocaleString()}
            {" ~ "}
            {new Date(tx.end.mul(1000).toNumber()).toLocaleString()}
          </li>
          <li>executed: {proposal?.executed.toString()}</li>
        </ul>
        <Card.Text>Transaction:</Card.Text>
        {decodedTxData && <DecodedTxs txs={decodedTxData} values={tx.value} />}
        <br />
        <Card.Text>Voting power:</Card.Text>
        <Card.Text style={{ fontSize: "3rem" }}>
          {votesInGwei(myVotes)}
          <span style={{ fontSize: "1rem" }}> votes</span>
        </Card.Text>
        {status === VoteForTxStatus.Voting && (
          <>
            <Card.Text>Voting</Card.Text>
            <ProgressBar>
              <ProgressBar
                animated
                variant="success"
                now={frac(
                  proposal?.totalForVotes,
                  proposal?.totalForVotes.add(proposal?.totalAgainstVotes || 0)
                )}
                key={1}
              />
              <ProgressBar
                animated
                variant="danger"
                now={frac(
                  proposal?.totalAgainstVotes,
                  proposal?.totalForVotes.add(proposal?.totalAgainstVotes || 0)
                )}
                key={2}
              />
            </ProgressBar>
            <Card.Text>
              {votesInGwei(proposal?.totalForVotes)} votes for /{" "}
              {votesInGwei(proposal?.totalAgainstVotes)} votes against
            </Card.Text>
            <br />
            <Button variant="success" onClick={onVote(true)}>
              For
            </Button>{" "}
            <Button variant="danger" onClick={onVote(false)}>
              Against
            </Button>{" "}
          </>
        )}
        {status === VoteForTxStatus.Ended && (
          <ConditionalButton
            variant="info"
            enabledWhen={
              !proposal?.executed &&
              proposal?.totalForVotes.gt(proposal?.totalAgainstVotes || 0)
            }
            onClick={execute}
            whyDisabled={
              proposal?.executed
                ? "Already executed"
                : "Proposal is not passed."
            }
            children={"Execute"}
          />
        )}
      </Card.Body>
    </Card>
  );

  async function paginatedProposals(
    page: number,
    size: number = 10
  ): Promise<Proposal[]> {
    let result: Proposal[] = [] as any;
    if (!contracts) {
      return result;
    }
    // Promise.all()
    const farmersUnion = contracts.farmersUnion;
    for (let i = size * page; i < size * (page + 1); ++i) {
      try {
        // result.push(await getProposal(i, farmersUnion));
      } catch (e) {
        console.log(e);
      }
    }
    return result.filter((p) => !p.executed);
  }

  // async function nextPage() {
  //   const results = await paginatedProposals(page + 1);
  //   if (results?.length == 0) {
  //     alert("this is last page");
  //     return;
  //   }
  //   setProposals(results);
  //   setPage(page + 1);
  // }

  // async function prevPage() {
  //   if (page == 0) {
  //     alert("this is first page");
  //     return;
  //   }
  //   setProposals(await paginatedProposals(page - 1));
  //   setPage(page - 1);
  // }

  function frac(a?: BigNumber, b?: BigNumber): number {
    if (!a || !b) {
      return 0;
    } else if (b.eq(0)) {
      return 0;
    } else {
      return a.mul(100).div(b).toNumber();
    }
  }
};

const votesInGwei = (vote?: BigNumber): string => {
  return parseFloat(formatUnits(vote || 0, "gwei")).toFixed(2);
};
