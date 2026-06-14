import React from "react";
import { SnapshotCardsClient } from "./SnapshotCardsClient";

interface SnapshotCardsProps {
  timeframe: string;
  token: string | undefined;
}

export async function SnapshotCards({ timeframe, token }: SnapshotCardsProps) {
  let data = {
    totalViews: 0,
    totalReads: 0,
    avgReadTime: 0,
    viewTrends: [],
  };

  try {
    const apiURL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    const res = await fetch(`${apiURL}/me/stats?timeframe=${timeframe}`, {
      headers: {
        Cookie: `jwt_token=${token}`,
      },
      cache: "no-store", // ensure we always fetch fresh metrics
    });

    if (res.ok) {
      const payload = await res.json();
      data = payload.data || data;
    }
  } catch (error) {
    console.error("Failed to fetch snapshot cards:", error);
  }

  return (
    <SnapshotCardsClient
      totalViews={data.totalViews}
      totalReads={data.totalReads}
      avgReadTime={data.avgReadTime}
      viewTrends={data.viewTrends || []}
    />
  );
}
