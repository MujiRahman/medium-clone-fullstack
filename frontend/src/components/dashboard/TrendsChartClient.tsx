"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Clock, Compass } from "lucide-react";

interface TrendsChartClientProps {
  timeDistribution: { hour: string; activeReaders: number }[];
  trafficSources: { name: string; value: number }[];
}

const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b"];

export function TrendsChartClient({
  timeDistribution,
  trafficSources,
}: TrendsChartClientProps) {
  const totalTrafficValue = trafficSources.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {/* Time Distribution Peak Area Chart */}
      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-violet-500" /> Active Read Hours Peak
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">Timezone: UTC</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeDistribution}>
              <defs>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" fontSize={10} stroke="var(--muted-foreground)" />
              <YAxis fontSize={10} stroke="var(--muted-foreground)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "var(--background)", 
                  borderColor: "var(--border)", 
                  borderRadius: "0.75rem",
                  fontSize: "12px"
                }} 
              />
              <Area type="monotone" dataKey="activeReaders" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Traffic Sources Pie Chart */}
      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <Compass className="w-3.5 h-3.5 text-fuchsia-500" /> Traffic Channels
        </span>
        <div className="h-44 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={trafficSources}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {trafficSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "var(--background)", 
                  borderColor: "var(--border)", 
                  borderRadius: "0.5rem",
                  fontSize: "11px"
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {trafficSources.map((source, index) => (
            <div key={source.name} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-muted-foreground truncate">{source.name}</span>
              <span className="font-semibold text-foreground ml-auto">
                {totalTrafficValue > 0 ? ((source.value / totalTrafficValue) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
