import React from "react";

export function SnapshotCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full animate-pulse">
      {/* Views Card Skeleton */}
      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm h-40 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2 w-1/2">
            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-24" />
            <div className="h-8 bg-zinc-300 dark:bg-zinc-700 rounded-lg w-28 mt-1" />
          </div>
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-12" />
        </div>
        <div className="h-10 bg-zinc-200/50 dark:bg-zinc-850/50 rounded-md w-full mt-2" />
      </div>

      {/* Reads Card Skeleton */}
      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm h-40 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2 w-1/2">
            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-24" />
            <div className="h-8 bg-zinc-300 dark:bg-zinc-700 rounded-lg w-24 mt-1" />
          </div>
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-12" />
        </div>
        <div className="flex flex-col gap-2 w-full mt-2">
          <div className="flex justify-between">
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-32" />
            <div className="h-3 bg-zinc-300 dark:bg-zinc-700 rounded-md w-8" />
          </div>
          <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-full" />
        </div>
      </div>

      {/* Duration Card Skeleton */}
      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm h-40 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2 w-1/2">
            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-28" />
            <div className="h-8 bg-zinc-300 dark:bg-zinc-700 rounded-lg w-20 mt-1" />
          </div>
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-12" />
        </div>
        <div className="flex justify-between items-center border-t border-border/40 pt-3">
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-36" />
          <div className="h-3.5 bg-zinc-300 dark:bg-zinc-700 rounded-md w-12" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full animate-pulse">
      {/* Time distribution area chart skeleton */}
      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm md:col-span-2 flex flex-col justify-between h-[316px]">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-40" />
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-28" />
        </div>
        <div className="h-48 bg-zinc-200/40 dark:bg-zinc-800/40 rounded-xl w-full flex items-end p-2 gap-4">
          {/* Simulated chart bars or lines */}
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 w-full rounded-md" />
          <div className="h-14 bg-zinc-300 dark:bg-zinc-700 w-full rounded-md" />
          <div className="h-28 bg-zinc-200 dark:bg-zinc-800 w-full rounded-md" />
          <div className="h-40 bg-zinc-300 dark:bg-zinc-700 w-full rounded-md" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 w-full rounded-md" />
          <div className="h-44 bg-zinc-300 dark:bg-zinc-700 w-full rounded-md" />
        </div>
        <div className="flex justify-between px-2 pt-2">
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-8" />
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-8" />
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-8" />
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-8" />
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-8" />
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-8" />
        </div>
      </div>

      {/* Traffic Pie Chart Skeleton */}
      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[316px]">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-32 mb-4" />
        <div className="h-32 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto flex items-center justify-center">
          <div className="h-20 w-20 bg-background rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full animate-pulse">
      {/* Top tags performance skeleton */}
      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm h-[316px] flex flex-col justify-between">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-40 mb-4" />
        <div className="flex flex-col gap-4 flex-grow justify-center">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="flex items-center gap-3 w-full">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16 shrink-0" />
              <div className="h-3.5 bg-zinc-300 dark:bg-zinc-700 rounded-full w-full" style={{ width: `${100 - idx * 15}%` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Ai Insights skeleton placeholder */}
      <div className="bg-gradient-to-br from-violet-600/5 to-fuchsia-600/5 border border-violet-500/20 rounded-2xl p-5 shadow-md md:col-span-2 h-[316px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-violet-500/10 mb-4">
            <div className="h-4 bg-violet-200 dark:bg-violet-850 rounded-md w-44" />
            <div className="h-5 bg-violet-200 dark:bg-violet-850 rounded-full w-24" />
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="flex gap-3 bg-background/50 dark:bg-zinc-900/40 p-3 rounded-xl border border-violet-500/5">
                <div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="h-3 bg-zinc-300 dark:bg-zinc-700 rounded-md w-32" />
                  <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArticlesTableSkeleton() {
  return (
    <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm overflow-hidden w-full mt-8 animate-pulse">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-48 mb-6" />
      <div className="flex flex-col divide-y divide-border/40">
        <div className="flex justify-between py-3">
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-12" />
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
        </div>
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="flex justify-between items-center py-4">
            <div className="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-1/2" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-10" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
            <div className="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-20" />
            <div className="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopTagsSkeleton() {
  return (
    <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm h-[316px] flex flex-col justify-between animate-pulse">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-40 mb-4" />
      <div className="flex flex-col gap-4 flex-grow justify-center">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="flex items-center gap-3 w-full">
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16 shrink-0" />
            <div className="h-3.5 bg-zinc-300 dark:bg-zinc-700 rounded-full w-full" style={{ width: `${100 - idx * 15}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiInsightsSkeleton() {
  return (
    <div className="bg-gradient-to-br from-violet-600/5 to-fuchsia-600/5 border border-violet-500/20 rounded-2xl p-5 shadow-md md:col-span-2 h-[316px] flex flex-col justify-between animate-pulse w-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-violet-500/10 mb-4">
          <div className="h-4 bg-violet-200 dark:bg-violet-850 rounded-md w-44" />
          <div className="h-5 bg-violet-200 dark:bg-violet-850 rounded-full w-24" />
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="flex gap-3 bg-background/50 dark:bg-zinc-900/40 p-3 rounded-xl border border-violet-500/5">
              <div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
              <div className="flex flex-col gap-1.5 w-full">
                <div className="h-3 bg-zinc-300 dark:bg-zinc-700 rounded-md w-32" />
                <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

