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
import { BigNumber, BigNumberish } from "ethers";
import { parseEther } from "ethers/lib/utils";

interface Proposal {
  id: number;
  proposer: string;
  txHash: string;
  start: BigNumberish;
  end: BigNumberish;
  totalForVotes: BigNumberish;
  totalAgainstVotes: BigNumberish;
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
    paginatedProposals(page);
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
                  now={BigNumber.from(p.totalForVotes)
                    .mul(100)
                    .div(
                      BigNumber.from(p.totalForVotes).add(p.totalAgainstVotes)
                    )
                    .toNumber()}
                  key={1}
                />
                <ProgressBar
                  animated
                  variant="danger"
                  now={BigNumber.from(p.totalAgainstVotes)
                    .mul(100)
                    .div(
                      BigNumber.from(p.totalForVotes).add(p.totalAgainstVotes)
                    )
                    .toNumber()}
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
      {/*todo: pagination*/}
      {/*<Button variant="danger" onClick={onStaking}>*/}
      {/*  Stake*/}
      {/*</Button>{" "}*/}
    </Card>
  );

  async function paginatedProposals(page: number, size: number = 10) {
    const result = [] as any;
    setProposals([]);
    if (!contracts) {
      return;
    }
    const farmersUnion = contracts.farmersUnion;
    for (let i = size * page; i < size * (page + 1); i++) {
      try {
        let proposal = await farmersUnion.proposals(i);
        let tx = await library.getTransaction(proposal.txHash);
        result.push({
          id: i,
          totalAgainstVotes: proposal.totalAgainstVotes,
          totalForVotes: proposal.totalForVotes,
          txHash: proposal.txHash,
          proposer: proposal.proposer,
          start: proposal.start,
          end: proposal.end,
          executed: proposal.executed,
          to: tx.to,
          value: tx.value,
          data: tx.data,
        } as Proposal);
      } catch (e) {}
    }
    setProposals(result.filter((x: any) => !!x));
    // todo: set id, to, value, data from tx info
    // setProposals([
    //   {
    //     id: 0,
    //     totalAgainstVotes: 10,
    //     totalForVotes: 20,
    //     txHash: "0x0",
    //     proposer: "0x0",
    //     start: 111,
    //     end: 222,
    //     executed: false,
    //     to: "0x0",
    //     value: 0,
    //     data: "0x0",
    //   },
    // ]);
    console.log("proposals", proposals);
  }
  // async function onStaking(event: any) {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   if (!account || !contracts) {
  //     return;
  //   }
  //   const visionToken = contracts.visionToken;
  //   const visionFarm = contracts.visionFarm;
  //   const signer = await library.getSigner(account);
  //
  //   await visionToken
  //       .connect(signer)
  //       .mint(account, parseEther("1000000"));
  //   await visionToken
  //       .connect(signer)
  //       .approve(visionFarm.address, parseEther("1000000"));
  //   await visionFarm.connect(signer).stakeAndLock(parseEther("100"), 40);
  // }
  function onVote(projId: number, agree: boolean) {
    return async function (event: any) {
      event.preventDefault();
      event.stopPropagation();
      if (!contracts) {
        return;
      }
      const farmersUnion = contracts.farmersUnion;
      const signer = await library.getSigner(account);
      await farmersUnion.connect(signer).vote(projId, agree);
    };
  }
};
