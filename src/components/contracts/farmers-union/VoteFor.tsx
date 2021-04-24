import {
  Button,
  Card,
  Form,
  FormControl,
  InputGroup,
  ProgressBar,
} from "react-bootstrap";
import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { BigNumber } from "ethers";
import { id, defaultAbiCoder } from "ethers/lib/utils";
import { FarmersUnion } from "@workhard/protocol";

interface Proposal {
  id: number;
  proposer: string;
  txHash: string;
  start: number;
  end: number;
  totalForVotes: number;
  totalAgainstVotes: number;
  executed: boolean;
  to?: string;
  value?: number;
  data?: string;
}

export const VoteFor: React.FC = () => {
  const { account, library, chainId } = useWeb3React();
  const contracts = useWorkhardContracts();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [myVotes, setMyVotes] = useState<BigNumber>();
  const [page, setPage] = useState(0);
  const [projIdToVote, setProjIdToVote] = useState();
  useEffect(() => {
    if (!account || !library || !chainId || !contracts) {
      return;
    }
    let stale = false;
    const farmersUnion = contracts.farmersUnion;
    farmersUnion.getVotes(account).then((vote) => {
      setMyVotes(vote);
    });
    paginatedProposals(page).then((result) => setProposals(result));
    return () => {
      stale = true;
    };
  }, [account, library, chainId]);

  return (
    <Card>
      {proposals.map((p) => {
        return (
          <Card>
            <Card.Header as="h5">propose: {p.txHash}</Card.Header>
            <Card.Body>
              <Form.Label>To</Form.Label>
              <Card.Text>{p.to}</Card.Text>
              <Form.Label>Value</Form.Label>
              <Card.Text>{p.value}</Card.Text>
              <Form.Label>Data</Form.Label>
              <Card.Text>{p.data}</Card.Text>
              <Form.Label>start</Form.Label>
              <Card.Text>timestamp: {p.start}</Card.Text>
              <Form.Label>end</Form.Label>
              <Card.Text>timestamp: {p.end}</Card.Text>
              <Form.Label>executed</Form.Label>
              <Card.Text>{p.executed.toString()}</Card.Text>
              <Form.Label>Voting</Form.Label>
              <ProgressBar>
                <ProgressBar
                  animated
                  variant="success"
                  now={frac(
                    BigNumber.from(p.totalForVotes).toNumber(),
                    BigNumber.from(p.totalForVotes)
                      .add(p.totalAgainstVotes)
                      .toNumber()
                  )}
                  key={1}
                />
                <ProgressBar
                  animated
                  variant="danger"
                  now={frac(
                    BigNumber.from(p.totalAgainstVotes).toNumber(),
                    BigNumber.from(p.totalForVotes)
                      .add(p.totalAgainstVotes)
                      .toNumber()
                  )}
                  key={2}
                />
              </ProgressBar>
              <Card.Text>
                {p.totalForVotes} votes for / {p.totalAgainstVotes} votes
                against
              </Card.Text>
              <Form>
                <Form.Group controlId="formBasicEmail">
                  <Form.Label>Amount</Form.Label>
                  {/* <Form.Label>Staking</Form.Label> */}
                  <InputGroup className="mb-2">
                    <FormControl
                      id="inlineFormInputGroup"
                      placeholder={myVotes?.toString()}
                    />
                    <InputGroup.Append>
                      <InputGroup.Text>MAX</InputGroup.Text>
                    </InputGroup.Append>
                  </InputGroup>
                </Form.Group>
                <Button variant="success" onClick={onVote(p.id, true)}>
                  For
                </Button>{" "}
                <Button variant="danger" onClick={onVote(p.id, false)}>
                  Against
                </Button>{" "}
              </Form>
            </Card.Body>
          </Card>
        );
      })}
      <Card.Body>
        <Button variant="primary" onClick={nextPage}>
          next page
        </Button>
        <Button variant="secondary" onClick={prevPage}>
          previous page
        </Button>{" "}
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
    const farmersUnion = contracts.farmersUnion;
    for (let i = size * page; i < size * (page + 1); ++i) {
      try {
        result.push(await getProposal(i, farmersUnion));
      } catch (e) {
        console.log(e);
      }
    }
    return result.filter((p) => !p.executed);
  }

  function onVote(projId: number, agree: boolean) {
    return async function (event: any) {
      event.preventDefault();
      event.stopPropagation();
      if (!contracts) {
        return;
      }
      const farmersUnion = contracts.farmersUnion;
      const proposal = await getProposal(projId, farmersUnion);
      const now = Math.floor(new Date().getTime() / 1000);
      if (now < proposal.start || now > proposal.end) {
        alert("not voting period");
        return;
      }
      const signer = await library.getSigner(account);
      await farmersUnion.connect(signer).vote(projId, agree);
    };
  }

  async function nextPage() {
    const results = await paginatedProposals(page + 1);
    if (results?.length == 0) {
      alert("this is last page");
      return;
    }
    setProposals(results);
    setPage(page + 1);
  }

  async function prevPage() {
    if (page == 0) {
      alert("this is first page");
      return;
    }
    setProposals(await paginatedProposals(page - 1));
    setPage(page - 1);
  }

  async function getProposal(proposalId: number, farmersUnion: FarmersUnion) {
    let proposal = await farmersUnion.callStatic.proposals(proposalId);
    let filter = {
      address: farmersUnion.address,
      fromBlock: 0,
      toBlock: "latest",
      topics: [
        id("TxProposed(bytes32,address,uint256,bytes,uint256,uint256)"),
        proposal.txHash,
      ],
    };
    const logs = await library.getLogs(filter);
    const log = defaultAbiCoder.decode(
      ["bytes32", "address", "uint256", "bytes32", "uint256", "uint256"],
      logs[0].data
    );
    const to = log[1];
    const value = (log[2] as BigNumber).toNumber();
    const data = (log[3] as BigNumber).toString();
    return {
      id: proposalId,
      totalAgainstVotes: proposal.totalAgainstVotes.toNumber(),
      totalForVotes: proposal.totalForVotes.toNumber(),
      txHash: proposal.txHash,
      proposer: proposal.proposer,
      start: proposal.start.toNumber(),
      end: proposal.end.toNumber(),
      executed: proposal.executed,
      to,
      value,
      data,
    } as Proposal;
  }

  function frac(a: number, b: number): number {
    if (a == 0 && b == 0) {
      return 0;
    }
    return (a / b) * 100;
  }
};
