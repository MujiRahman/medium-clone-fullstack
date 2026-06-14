import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TimeframeSelector } from "@/components/dashboard/TimeframeSelector";
import { SnapshotCards } from "@/components/dashboard/SnapshotCards";
import { TrendsChart } from "@/components/dashboard/TrendsChart";
import { TopTags } from "@/components/dashboard/TopTags";
import { AiInsights } from "@/components/dashboard/AiInsights";
import { ArticlesTable } from "@/components/dashboard/ArticlesTable";
import {
  SnapshotCardsSkeleton,
  ChartSkeleton,
  TopTagsSkeleton,
  AiInsightsSkeleton,
  ArticlesTableSkeleton,
} from "@/components/dashboard/Skeletons";

export const dynamic = "force-dynamic";

export default async function MeStatsPage({
  searchParams,
}: {
  searchParams: { timeframe?: string };
}) {
  const cookieStore = cookies();
  const token = cookieStore.get("jwt_token")?.value;

  // 1. Authenticate server-side via Cookie presence
  if (!token) {
    redirect("/login");
  }

  const timeframe = searchParams.timeframe || "7d";

  // 2. Fetch user profile server-side to greet author
  let username = "";
  try {
    const apiURL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    const userRes = await fetch(`${apiURL}/auth/me`, {
      headers: {
        Cookie: `jwt_token=${token}`,
      },
      cache: "no-store",
    });

    if (userRes.ok) {
      const payload = await userRes.json();
      username = payload.data?.username || "";
    }
  } catch (error) {
    console.error("Failed to fetch user profile in stats server page:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <nav className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-primary">
              Medium Clone
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/new-story" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2">
              Write
            </Link>
            {username && (
              <span className="text-sm font-medium text-muted-foreground mr-2">
                Hi, {username}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Main Stats Container */}
      <main className="max-w-5xl mx-auto pb-20 px-6">
        {/* Dashboard Control Bar */}
        <header className="pt-8 pb-6 border-b border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-sans">Writer Stats</h1>
            <p className="text-sm text-muted-foreground mt-1">Review your platform readership analytics, tag metrics, and AI recommendations.</p>
          </div>
          <TimeframeSelector initialTimeframe={timeframe} />
        </header>

        {/* 1. Summary Cards Section */}
        <Suspense key={`summary-${timeframe}`} fallback={<SnapshotCardsSkeleton />}>
          <SnapshotCards timeframe={timeframe} token={token} />
        </Suspense>

        {/* 2. Trends & Sources Section */}
        <Suspense key={`trends-${timeframe}`} fallback={<ChartSkeleton />}>
          <TrendsChart timeframe={timeframe} token={token} />
        </Suspense>

        {/* 3. Top Tags & AI Insights Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Suspense key={`tags-${timeframe}`} fallback={<TopTagsSkeleton />}>
            <TopTags timeframe={timeframe} token={token} />
          </Suspense>
          <Suspense key={`ai-${timeframe}`} fallback={<AiInsightsSkeleton />}>
            <AiInsights timeframe={timeframe} token={token} />
          </Suspense>
        </div>

        {/* 4. Articles Performance List */}
        <Suspense key={`articles-${timeframe}`} fallback={<ArticlesTableSkeleton />}>
          <ArticlesTable timeframe={timeframe} token={token} />
        </Suspense>
      </main>
    </div>
  );
}
