"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function TimeframeSelector({ initialTimeframe }: { initialTimeframe: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("timeframe", value);
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Timeframe:
      </span>
      <div className="relative">
        <select 
          value={initialTimeframe}
          onChange={handleChange}
          disabled={isPending}
          className={`bg-secondary/50 border border-border px-3 py-1.5 rounded-full text-sm outline-none font-medium cursor-pointer focus:border-violet-500 transition-all ${
            isPending ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
        {isPending && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
          </span>
        )}
      </div>
    </div>
  );
}
