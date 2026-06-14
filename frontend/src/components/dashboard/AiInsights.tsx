import React from "react";
import { AiInsightsClient } from "./AiInsightsClient";

interface AiInsightsProps {
  timeframe: string;
  token: string | undefined;
}

export async function AiInsights({ timeframe, token }: AiInsightsProps) {
  let aiInsights = [];

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
      aiInsights = payload.data?.aiInsights || [];
    }
  } catch (error) {
    console.error("Failed to fetch AI insights:", error);
  }

  return <AiInsightsClient aiInsights={aiInsights} />;
}
