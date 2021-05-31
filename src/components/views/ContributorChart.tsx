import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { id } from "@ethersproject/hash";
import { useWeb3React } from "@web3-react/core";
import {
  ContributionBoard__factory,
  ERC1155__factory,
  VisionEmitter__factory,
} from "@workhard/protocol";
import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { Pie, Cell, PieChart, Label, ResponsiveContainer } from "recharts";
import { useToasts } from "react-toast-notifications";
import { useBlockNumber } from "../../providers/BlockNumberProvider";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { errorHandler } from "../../utils/utils";
import { formatEther } from "ethers/lib/utils";

export interface ERC1155HolderChartProps {
  id: BigNumberish;
}

export const ContributorChart: React.FC<ERC1155HolderChartProps> = ({ id }) => {
  const { library } = useWeb3React();
  const workhardCtx = useWorkhard();
  const { blockNumber } = useBlockNumber();

  const [shareAddress, setShareAddress] = useState<string>();
  const [contributors, setContributors] = useState<string[]>();
  const [balances, setBalances] = useState<BigNumber[]>();
  const [data, setData] = useState<
    {
      title: string;
      proportion: number;
      commits: string;
      color: string;
    }[]
  >([]);
  const { addToast } = useToasts();

  useEffect(() => {
    if (!!workhardCtx && !!library) {
      const { workhard } = workhardCtx;
      workhard
        .getDAO(id)
        .then((contracts) => {
          VisionEmitter__factory.connect(contracts.visionEmitter, library)
            .initialContributorShare()
            .then(setShareAddress)
            .catch(errorHandler(addToast));
        })
        .catch(errorHandler(addToast));
    }
  }, [library, workhardCtx]);

  useEffect(() => {
    if (library && shareAddress) {
      const contributionBoard = ContributionBoard__factory.connect(
        shareAddress,
        library
      );
      contributionBoard
        .getContributors(id)
        .then(setContributors)
        .catch(errorHandler(addToast));
    }
  }, [library, shareAddress, blockNumber]);

  useEffect(() => {
    if (library && shareAddress && contributors) {
      const contributionBoard = ContributionBoard__factory.connect(
        shareAddress,
        library
      );
      Promise.all(
        contributors.map((contributor) =>
          contributionBoard.balanceOf(contributor, id)
        )
      )
        .then(setBalances)
        .catch(errorHandler(addToast));
    }
  }, [library, shareAddress, contributors, blockNumber]);

  const COLORS = ["#28a745", "#17a2b8", "#ffc107", "#dc3545"];
  useEffect(() => {
    if (balances && contributors && balances.length === contributors.length) {
      const sum = parseFloat(
        formatEther(balances.reduce((sum, v) => sum.add(v)) || "0")
      );
      if (sum === 0) return;
      setData(
        balances
          .map((bal) => (100 * parseFloat(formatEther(bal))) / sum)
          .map((val, i) => ({
            title: `${contributors[i].slice(0, 10)}...${contributors[i].slice(
              -8
            )}`,
            proportion: val,
            commits: formatEther(balances[i]),
            color: COLORS[i % 4],
          }))
      );
    }
  }, [balances]);

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    index: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {data[index].title} - {`$COMMIT ${data[index].commits}`}
      </text>
    );
  };

  return (
    <Container style={{ height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="proportion"
            nameKey="title"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label={renderCustomizedLabel}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Label value="Holders" offset={0} position="center" />
        </PieChart>
      </ResponsiveContainer>
    </Container>
  );
};
