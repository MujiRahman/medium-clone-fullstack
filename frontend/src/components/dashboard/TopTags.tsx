import React from "react";
import { TopTagsClient } from "./TopTagsClient";

interface TopTagsProps {
  timeframe: string;
  token: string | undefined;
}

export async function TopTags({ timeframe, token }: TopTagsProps) {
  let tagPerformance = [];

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
      tagPerformance = payload.data?.tagPerformance || [];
    }
  } catch (error) {
    console.error("Failed to fetch top tags:", error);
  }

  return <TopTagsClient tagPerformance={tagPerformance} />;
}
