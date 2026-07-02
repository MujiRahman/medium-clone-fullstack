"use client";

import React from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Award } from "lucide-react";

interface TopTagsClientProps {
  tagPerformance: { tag: string; views: number }[];
}

const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b"];

export function TopTagsClient({ tagPerformance }: TopTagsClientProps) {
  return (
    <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm h-[316px] flex flex-col justify-between">
      <div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <Award className="w-3.5 h-3.5 text-emerald-500" /> Top Performing Tags
        </span>
        {tagPerformance.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tagPerformance} layout="vertical">
                <XAxis type="number" fontSize={10} hide />
                <YAxis dataKey="tag" type="category" fontSize={10} stroke="var(--muted-foreground)" width={70} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--background)", 
                    borderColor: "var(--border)", 
                    borderRadius: "0.5rem",
                    fontSize: "11px"
                  }} 
                />
                <Bar dataKey="views" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12}>
                  {tagPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">
            No tag performance metrics available yet.
          </div>
        )}
      </div>
    </div>
  );
}
