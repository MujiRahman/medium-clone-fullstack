import React from "react";
import { TopArticlesClient } from "./TopArticlesClient";

interface TopArticlesProps {
  timeframe: string;
  token: string | undefined;
}

export async function TopArticles({ timeframe, token }: TopArticlesProps) {
  let data = {
    tagPerformance: [],
    articles: [],
  };

  try {
    const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
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
    console.error("Failed to fetch top articles:", error);
  }

  return (
    <TopArticlesClient
      tagPerformance={data.tagPerformance || []}
      articles={data.articles || []}
    />
  );
}
