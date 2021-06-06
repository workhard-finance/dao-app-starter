import React from "react";
import { Button, Card, Container } from "react-bootstrap";
import {
  Pie,
  Cell,
  PieChart,
  Label,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PoolType, PoolTypeHash } from "../../utils/ERC165Interfaces";
import { humanReadablePoolType } from "../../utils/utils";

export interface AllocationChartProps {
  pools: {
    name: string;
    weight: number;
    poolType?: string;
  }[];
  treasury: number;
  caller: number;
  protocol: number;
  founder: number;
  sum: number;
}

export const AllocationChart: React.FC<AllocationChartProps> = ({
  pools,
  treasury,
  caller,
  protocol,
  founder,
  sum,
}) => {
  const COLORS = ["#28a745", "#17a2b8", "#ffc107", "#dc3545"];
  const data = [
    ...pools.map((pool) => ({
      title: pool.name,
      value: (pool.weight / sum) * 100,
      color: `#17a2b8${Math.floor(Math.random() * 200 + 55).toString(16)}`,
      poolType: pool.poolType,
    })),
    {
      title: "Treasury",
      value: (treasury / sum) * 100,
      color: "#28a745",
    },
    {
      title: "Founder",
      value: (founder / sum) * 100,
      color: "#dc3545",
    },
    { title: "Caller", value: (caller / sum) * 100, color: "#6A2135" },
  ];
  if (protocol !== 0) {
    data.push({
      title: "Protocol",
      value: (protocol / sum) * 100,
      color: "#868e96",
    });
  }

  const getPoolColor = (poolType?: PoolTypeHash): string => {
    return poolType
      ? [PoolType.ERC20BurnV1, PoolType.ERC1155BurnV1].includes(poolType)
        ? "#dc3545"
        : [
            PoolType.ERC20StakeV1,
            PoolType.ERC721StakeV1,
            PoolType.ERC1155StakeV1,
          ].includes(poolType)
        ? "#28a745"
        : "#17a2b8"
      : "#17a2b8";
  };

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

    const poolType = (data[index] as any).poolType;
    return (
      <text
        x={x}
        y={y}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {data[index].title}
      </text>
    );
  };

  return (
    <Container style={{ height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
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
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <Card>
                    <Card.Body>
                      <Card.Text>
                        Pool type:{" "}
                        <span
                          style={{
                            color: getPoolColor(payload[0].payload?.poolType),
                          }}
                        >
                          {humanReadablePoolType(payload[0].payload?.poolType)}
                        </span>
                      </Card.Text>
                      <Card.Text>
                        {payload[0].name}:{" "}
                        {parseFloat(`${payload[0].value}`).toFixed(2)}%
                      </Card.Text>
                    </Card.Body>
                  </Card>
                );
              }

              return null;
            }}
          />
          <Label value="Pages of my website" offset={0} position="center" />
        </PieChart>
      </ResponsiveContainer>
    </Container>
  );
};
