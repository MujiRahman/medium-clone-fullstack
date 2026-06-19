import React from "react";
import { TrendsChartClient } from "./TrendsChartClient";

interface TrendsChartProps {
  data: any;
}

export function TrendsChart({ data }: TrendsChartProps) {
  return (
    <TrendsChartClient
      timeDistribution={data.timeDistribution || []}
      trafficSources={data.trafficSources || []}
    />
  );
}
