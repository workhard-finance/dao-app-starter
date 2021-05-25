import { BigNumber } from "ethers";
import { formatEther } from "ethers/lib/utils";
import React, { useState } from "react";
import { Form } from "react-bootstrap";
import {
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
  ReferenceLine,
  Legend,
} from "recharts";

export const EmissionChart: React.FC<{
  width?: number;
  height?: number;
  initialEmission: BigNumber;
  emissionCut: number; // bootstrapping emission cut rate (denom: 10000)
  minimumRate: number; // weekly emission minimumRate
  currentWeek?: number;
}> = ({
  width,
  height,
  initialEmission,
  emissionCut,
  minimumRate,
  currentWeek,
}) => {
  type WeekStat = {
    weekNum: number;
    emission: BigNumber;
    totalSupply: BigNumber;
  };
  const weeklyStat: WeekStat[] = [];
  const [weekDisplayRange, setWeekDisplayRange] = useState<number>(12);

  weeklyStat.push({
    weekNum: 0,
    emission: initialEmission,
    totalSupply: initialEmission,
  });
  let totalSupply = BigNumber.from(initialEmission);
  for (let weekNum = 1; weekNum < 52 * 4; weekNum++) {
    const cutEmission = Array(weekNum)
      .fill(0)
      .reduce(
        (acc, _) => acc.mul(10000 - emissionCut).div(10000),
        initialEmission
      );
    const minimum = totalSupply.mul(minimumRate).div(10000);
    const emission = cutEmission.gt(minimum) ? cutEmission : minimum;
    totalSupply = totalSupply.add(emission);
    weeklyStat.push({
      weekNum,
      emission: emission,
      totalSupply: totalSupply,
    });
  }
  const data = weeklyStat.map((stat) => ({
    weekNum: stat.weekNum,
    emission: parseInt(formatEther(stat.emission)),
    totalSupply: parseInt(formatEther(stat.totalSupply)),
  }));
  return (
    <div>
      <AreaChart
        width={width || 680}
        height={height || 300}
        data={data.slice(0, weekDisplayRange)}
        margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorEmission" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#17a2b8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#17a2b8" stopOpacity={0.3} />
          </linearGradient>
          <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#28a745" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#28a745" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <Legend verticalAlign="top" height={36} />
        <XAxis dataKey="weekNum" label={"Week"} />
        <YAxis
          yAxisId="emission"
          name="Emission"
          type="number"
          dataKey="emission"
          domain={["auto", "auto"]}
        />
        <YAxis
          yAxisId="totalSupply"
          name="Total Supply"
          type="number"
          dataKey="totalSupply"
          orientation="right"
          domain={["auto", "auto"]}
        />
        {currentWeek && (
          <ReferenceLine
            x={currentWeek}
            y={data[currentWeek].emission}
            stroke="green"
            label={`Current week: ${currentWeek}`}
            yAxisId="emission"
          />
        )}

        <Tooltip cursor={{ stroke: "red", strokeWidth: 2 }} />
        <Area
          type="monotone"
          dataKey="emission"
          stroke="#17a2b8"
          fillOpacity={1}
          fill="url(#colorEmission)"
          yAxisId={"emission"}
        />
        <Area
          type="monotone"
          dataKey="totalSupply"
          stroke="#28a745"
          fillOpacity={1}
          fill="url(#colorSupply)"
          yAxisId={"totalSupply"}
        />
      </AreaChart>
      <Form>
        <Form.Group>
          <Form.Control
            type="range"
            min={0}
            max={52 * 4}
            value={weekDisplayRange}
            step={1}
            onChange={({ target: { value } }) =>
              setWeekDisplayRange(parseInt(value))
            }
          />
          <Form.Text>
            0 ~ {weekDisplayRange} weeks ({(weekDisplayRange / 52).toFixed(1)}{" "}
            years)
          </Form.Text>
        </Form.Group>
      </Form>
    </div>
  );
};
