"use client";

import React from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { Eye, BookOpen, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface SnapshotCardsClientProps {
  totalViews: number;
  totalReads: number;
  avgReadTime: number;
  viewTrends: { date: string; views: number }[];
}

export function SnapshotCardsClient({
  totalViews,
  totalReads,
  avgReadTime,
  viewTrends,
}: SnapshotCardsClientProps) {
  const formatAvgTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  };

  const readThroughRate = totalViews > 0 ? (totalReads / totalViews) * 100 : 0;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {/* Total Views Card */}
      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-40 hover:border-border transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-violet-500" /> Total Views
            </span>
            <span className="text-3xl font-extrabold tracking-tight font-sans mt-2">
              {totalViews.toLocaleString()}
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12%
          </span>
        </div>
        {/* Sparkline widget */}
        <div className="h-12 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={viewTrends}>
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#6366f1" 
                strokeWidth={2} 
                dot={false} 
              />
              <Tooltip 
                contentStyle={{ display: "none" }} 
                cursor={{ stroke: "#a855f7", strokeWidth: 1, strokeDasharray: "3 3" }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Total Reads Card */}
      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-40 hover:border-border transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-fuchsia-500" /> Total Reads
            </span>
            <span className="text-3xl font-extrabold tracking-tight font-sans mt-2">
              {totalReads.toLocaleString()}
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +8.4%
          </span>
        </div>
        <div className="text-xs text-muted-foreground flex justify-between items-center mt-6">
          <span>Read-Through Rate (RTR)</span>
          <span className="font-bold text-foreground">
            {readThroughRate.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-2">
          <div 
            className="bg-fuchsia-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${readThroughRate}%` }}
          />
        </div>
      </div>

      {/* Average Reading Time Card */}
      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-40 hover:border-border transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" /> Avg. Read Time
            </span>
            <span className="text-3xl font-extrabold tracking-tight font-sans mt-2">
              {formatAvgTime(avgReadTime)}
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> -2.1%
          </span>
        </div>
        <div className="text-xs text-muted-foreground border-t border-border/40 pt-3 flex justify-between items-center mt-4">
          <span>Global standard benchmark:</span>
          <span className="font-semibold text-foreground">2m 30s</span>
        </div>
      </div>
    </section>
  );
}
