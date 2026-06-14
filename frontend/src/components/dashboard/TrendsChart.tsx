import React from "react";
import { TrendsChartClient } from "./TrendsChartClient";

interface TrendsChartProps {
  timeframe: string;
  token: string | undefined;
}

export async function TrendsChart({ timeframe, token }: TrendsChartProps) {
  let data = {
    timeDistribution: [],
    trafficSources: [],
  };

  try {
    const apiURL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    const res = await fetch(`${apiURL}/me/stats?timeframe=${timeframe}`, {
      headers: {
        Cookie: `jwt_token=${token}`,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const payload = await res.json();
      data = payload.data || data;
    }
  } catch (error) {
    console.error("Failed to fetch trends charts:", error);
  }

  return (
    <TrendsChartClient
      timeDistribution={data.timeDistribution || []}
      trafficSources={data.trafficSources || []}
    />
  );
}
