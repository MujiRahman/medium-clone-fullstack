"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
  TrendingUp, TrendingDown, BookOpen, Clock, Eye,
  Sparkles, AlertCircle, Award, Compass, MessageSquare
} from "lucide-react";
import api from "@/lib/api/axios";

/**
 * TypeScript Interfaces Mapped to Go Database Schema
 * 
 * Expected Go backend GORM database schema:
 * 
 * type ArticleAnalytics struct {
 *     ID        uint      `gorm:"primaryKey" json:"id"`
 *     ArticleID uuid.UUID `gorm:"type:uuid;not null;index" json:"article_id"`
 *     Timestamp time.Time `gorm:"not null;index" json:"timestamp"`
 *     Source    string    `gorm:"type:varchar(50);not null" json:"source"`
 *     Duration  int       `gorm:"not null" json:"duration"` // duration in seconds
 * }
 */

export interface GoArticleAnalytics {
  id: number;
  article_id: string;
  timestamp: string; // ISO string format
  source: string;    // 'Google', 'Twitter', 'Direct', 'Medium Feed', etc.
  duration: number;  // Time spent on the article in seconds
}

export interface ArticleStat {
  id: string;
  title: string;
  views: number;
  reads: number;
  claps: number;
  comments: number;
  duration: number; // average duration in seconds
  engagementRate: number; // calculated claps + comments / views
  readThroughRate: number; // calculated reads / views
}

export interface AIInsight {
  type: string;
  title: string;
  description: string;
}

export interface DashboardStats {
  totalViews: number;
  totalReads: number;
  avgReadTime: number; // in seconds
  viewTrends: { date: string; views: number }[];
  trafficSources: { name: string; value: number }[];
  tagPerformance: { tag: string; views: number }[];
  timeDistribution: { hour: string; activeReaders: number }[];
  articles: ArticleStat[];
  aiInsights: AIInsight[];
}

// Curated colors for clean Medium-like style
const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b"];

export function WriterDashboard() {
  const [mounted, setMounted] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "all">("7d");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/me/stats?timeframe=${timeFilter}`);
      setStats(response.data.data);
    } catch (err: any) {
      console.error("Error loading stats:", err);
      setError(err.response?.data?.message || err.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchStats();
    }
  }, [timeFilter, mounted]);

  const activeStats = stats || {
    totalViews: 0,
    totalReads: 0,
    avgReadTime: 0,
    viewTrends: [],
    trafficSources: [],
    tagPerformance: [],
    timeDistribution: [],
    articles: [],
    aiInsights: []
  };

  const formatAvgTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  };

  // SSR Hydration Safeguard
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-medium animate-pulse">Loading Analytics...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[400px] bg-background flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-medium animate-pulse">Fetching latest statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] bg-background flex items-center justify-center p-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h3 className="font-bold text-lg text-foreground mb-1">Error Loading Analytics</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-violet-600 text-white rounded-full text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 px-4 sm:px-6 md:px-8">
      {/* Dashboard Control Bar */}
      <header className="max-w-5xl mx-auto pt-8 pb-6 border-b border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans">Writer Stats</h1>
          <p className="text-sm text-muted-foreground mt-1">Review your platform readership analytics, tag metrics, and AI recommendations.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timeframe:</span>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="bg-secondary/50 border border-border px-3 py-1.5 rounded-full text-sm outline-none font-medium cursor-pointer focus:border-violet-500 transition-all"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </header>

      {/* Snapshot Summary Cards */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Total Views Card */}
        <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-40 hover:border-border transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-violet-500" /> Total Views
              </span>
              <span className="text-3xl font-extrabold tracking-tight font-sans mt-2">
                {activeStats.totalViews.toLocaleString()}
              </span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
          {/* Sparkline widget inside Views Card */}
          <div className="h-12 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeStats.viewTrends}>
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
                {activeStats.totalReads.toLocaleString()}
              </span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +8.4%
            </span>
          </div>
          <div className="text-xs text-muted-foreground flex justify-between items-center mt-6">
            <span>Read-Through Rate (RTR)</span>
            <span className="font-bold text-foreground">
              {((activeStats.totalReads / activeStats.totalViews) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-fuchsia-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(activeStats.totalReads / activeStats.totalViews) * 100}%` }}
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
                {formatAvgTime(activeStats.avgReadTime)}
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

      {/* Reader Demographics & Behaviors */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
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
              <AreaChart data={activeStats.timeDistribution}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                  data={activeStats.trafficSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {activeStats.trafficSources.map((entry, index) => (
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
            {activeStats.trafficSources.map((source, index) => (
              <div key={source.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{source.name}</span>
                <span className="font-semibold text-foreground ml-auto">
                  {((source.value / activeStats.trafficSources.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Tags Bar Chart & AI Recommendations Row */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Tag Views Metric */}
        <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <Award className="w-3.5 h-3.5 text-emerald-500" /> Top Performing Tags
          </span>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeStats.tagPerformance} layout="vertical">
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
                  {activeStats.tagPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Powered Insights Section */}
        <div className="bg-gradient-to-br from-violet-600/5 to-fuchsia-600/5 border border-violet-500/20 rounded-2xl p-5 shadow-md md:col-span-2 relative overflow-hidden flex flex-col justify-between">
          {/* Subtle glowing blur ring backdrops */}
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-violet-500/10 mb-4">
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 animate-pulse text-violet-500" /> AI Insights Recommendations
              </span>
              {/* <span className="text-[10px] bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-bold">
                Powered by Gemini
              </span> */}
            </div>

            <div className="flex flex-col gap-3">
              {activeStats.aiInsights && activeStats.aiInsights.length > 0 ? (
                activeStats.aiInsights.map((insight, idx) => {
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
                    <div key={idx} className="flex gap-3 text-xs bg-background/50 dark:bg-zinc-900/40 p-3 rounded-xl border border-violet-500/5">
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
                <div className="text-xs text-muted-foreground text-center py-6">
                  No insights available yet. Keep writing and generating views!
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Individual Article Analysis */}
      <section className="max-w-5xl mx-auto mt-8">
        <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm overflow-hidden">
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
                {activeStats.articles.map((article) => (
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
                        {/* Miniature completion track bar */}
                        <div className="w-12 bg-secondary h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-violet-500 h-full rounded-full"
                            style={{ width: `${article.readThroughRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
