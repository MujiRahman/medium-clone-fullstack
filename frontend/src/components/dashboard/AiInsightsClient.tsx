"use client";

import React from "react";
import { Sparkles, AlertCircle, Compass, MessageSquare } from "lucide-react";

export interface AIInsight {
  type: string;
  title: string;
  description: string;
}

interface AiInsightsClientProps {
  aiInsights: AIInsight[];
}

export function AiInsightsClient({ aiInsights }: AiInsightsClientProps) {
  return (
    <div className="bg-gradient-to-br from-violet-600/5 to-fuchsia-600/5 border border-violet-500/20 rounded-2xl p-5 shadow-md md:col-span-2 relative overflow-hidden flex flex-col justify-between h-[316px] w-full">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between pb-3 border-b border-violet-500/10 mb-4">
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 animate-pulse text-violet-500" /> AI Insights Recommendations
          </span>
          <span className="text-[10px] bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-bold">
            Powered by Gemini
          </span>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto max-h-[210px] pr-1">
          {aiInsights && aiInsights.length > 0 ? (
            aiInsights.map((insight, idx) => {
              let Icon = Compass;
              let colorClass = "text-violet-500";
              if (insight.type === "optimization") {
                Icon = AlertCircle;
                colorClass = "text-amber-500";
              } else if (insight.type === "sentiment") {
                Icon = MessageSquare;
                colorClass = "text-emerald-500";
              }
              return (
                <div key={idx} className="flex gap-3 text-xs bg-background/50 dark:bg-zinc-900/40 p-3 rounded-xl border border-violet-500/5 hover:bg-background/80 dark:hover:bg-zinc-900/60 transition-colors">
                  <Icon className={`w-5 h-5 ${colorClass} shrink-0 mt-0.5`} />
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground/90">{insight.title || "AI Insight"}</span>
                    <span className="text-muted-foreground mt-0.5 leading-relaxed">
                      {insight.description}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-muted-foreground text-center py-12">
              No insights available yet. Keep writing and generating views!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
