"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import { ArticleStat } from "./TopArticlesClient";

interface ArticlesTableClientProps {
  articles: ArticleStat[];
}

export function ArticlesTableClient({ articles }: ArticlesTableClientProps) {
  const formatAvgTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  };

  return (
    <section className="mt-8">
      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm overflow-hidden w-full">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <BookOpen className="w-3.5 h-3.5 text-violet-500" /> Individual Article Performance
        </span>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Article Title</th>
                <th className="pb-3 pr-4 font-semibold text-right">Views</th>
                <th className="pb-3 pr-4 font-semibold text-right">Avg Read Duration</th>
                <th className="pb-3 pr-4 font-semibold text-right">Engagement Rate</th>
                <th className="pb-3 font-semibold text-right">Read-Through (RTR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {articles && articles.length > 0 ? (
                articles.map((article) => (
                  <tr key={article.id} className="group hover:bg-secondary/15 transition-colors">
                    <td className="py-3.5 font-medium max-w-sm sm:max-w-md truncate pr-4 text-foreground/95">
                      <span className="hover:underline cursor-pointer">
                        {article.title}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-right font-mono font-medium">
                      {article.views.toLocaleString()}
                    </td>
                    <td className="py-3.5 pr-4 text-right text-muted-foreground font-mono">
                      {formatAvgTime(article.duration)}
                    </td>
                    <td className="py-3.5 pr-4 text-right font-medium">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-mono">{article.engagementRate}%</span>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          {article.claps} claps
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-semibold">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono text-violet-600 dark:text-violet-400">
                          {article.readThroughRate}%
                        </span>
                        <div className="w-12 bg-secondary h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className="bg-violet-500 h-full rounded-full" 
                            style={{ width: `${article.readThroughRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground text-xs">
                    No articles found. Write some articles to view performance metrics!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
