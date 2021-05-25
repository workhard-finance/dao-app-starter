import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { PieChart } from "react-minimal-pie-chart";

export interface AllocationChartProps {
  pools: {
    name: string;
    weight: number;
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
  return (
    <PieChart
      radius={30}
      viewBoxSize={[100, 70]}
      center={[50, 35]}
      data={[
        ...pools.map((pool) => ({
          title: pool.name,
          value: (pool.weight / sum) * 100,
          color: `#17a2b8${Math.floor(Math.random() * 200 + 55).toString(16)}`,
        })),
        { title: "Treasury", value: (treasury / sum) * 100, color: "#28a745" },
        { title: "Founder", value: (founder / sum) * 100, color: "#dc3545" },
        {
          title: "Protocol",
          value: (protocol / sum) * 100,
          color: "#868e96",
        },
        { title: "Caller", value: (caller / sum) * 100, color: "#6A2135" },
      ]}
      labelStyle={{ fontSize: 3 }}
      labelPosition={100}
      label={(data) =>
        `${data.dataEntry.title}: ${data.dataEntry.value.toFixed(2)}%`
      }
    />
  );
};
