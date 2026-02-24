// ---------------------------------------------------------------------------
// AXIONBLADE Dashboard — Enhanced with glassmorphism and animations
// ---------------------------------------------------------------------------
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { GlassCard } from "@/components/atoms/GlassCard";
import { Activity, Zap, Shield, TrendingUp } from "lucide-react";

// --- Mock data ---

function generateChartData(days: number) {
  const data = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - days);

  let value = 40;
  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    value = Math.max(10, Math.min(100, value + (Math.random() - 0.45) * 12));
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      transactions: Math.round(value),
    });
  }
  return data;
}

const chartDataSets: Record<string, ReturnType<typeof generateChartData>> = {
  "24h": generateChartData(1),
  "7d": generateChartData(7),
  "30d": generateChartData(30),
  "90d": generateChartData(90),
};

const recentActivity = [
  { agent: "AEON", description: "Delegated pool assessment to APOLLO", time: "2m ago" },
  { agent: "KRONOS", description: "Crank cycle executed: epoch #4,218 settled", time: "3m ago" },
  { agent: "APOLLO", description: "Risk evaluation complete: RAY-USDC", time: "5m ago" },
  { agent: "HERMES", description: "Intelligence report published", time: "15m ago" },
  { agent: "AEON", description: "Policy parameter updated", time: "1h ago" },
  { agent: "KRONOS", description: "Keeper heartbeat confirmed on-chain", time: "1h ago" },
  { agent: "APOLLO", description: "Yield trap alert: BONK-SOL", time: "2h ago" },
];

// --- Custom tooltip ---

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F1420] border border-[#1A2235] rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">{payload[0].value} transactions</p>
    </div>
  );
}

// --- Sparkline data ---

function generateSparkData(days: number, base: number, volatility: number) {
  return Array.from({ length: days }, (_, i) => ({
    v: Math.max(0, base + (Math.random() - 0.4) * volatility * base),
  }));
}

const proofsSparkData = generateSparkData(7, 42, 0.3);
const revenueSparkData = generateSparkData(7, 8.2, 0.25);

// --- Live badge ---

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Live
    </span>
  );
}

// --- Animated counter ---

function AnimatedStat({ value, className }: { value: string; className?: string }) {
  const [display, setDisplay] = useState(value);
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShimmer(true);
      setTimeout(() => setShimmer(false), 600);
    }, 7000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={
        `transition-all duration-300 ${shimmer ? "opacity-60 scale-[1.03]" : "opacity-100 scale-100"} inline-block ` +
        (className ?? "")
      }
    >
      {display}
    </span>
  );
}

// --- Dashboard page ---

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "90d">("7d");

  return (
    <div className="space-y-8 relative">
      {/* Background gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

      {/* Page Header */}
      <div className="relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
        >
          Mission Control
        </motion.h1>
        <div className="flex items-center gap-3">
          <p className="text-gray-400 text-lg">Real-time system overview and agent performance</p>
          <LiveBadge />
        </div>
        <p className="text-xs text-gray-600 mt-1">AXIONBLADE v3.4.0 — Devnet Beta</p>
      </div>

      {/* Row 1: Hero metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard gradient="emerald" glow hover>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">System Status</p>
                  <p className="text-2xl font-bold text-white">Operational</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 flex-wrap">
                {[
                  { name: "AEON", color: "bg-purple-400" },
                  { name: "APOLLO", color: "bg-cyan-400" },
                  { name: "HERMES", color: "bg-rose-400" },
                  { name: "KRONOS", color: "bg-amber-400" },
                ].map(({ name, color }) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
                    <span className="text-xs text-gray-400 font-semibold">{name}</span>
                  </div>
                ))}
              </div>

              {/* Health Checks */}
              <div className="bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg p-4 space-y-2">
                {[
                  { name: "All agents responding (4/4)", status: true },
                  { name: "Treasury reserve >= 25%", status: true },
                  { name: "Axioms 49/50 active", status: true },
                  { name: "Circuit breaker: Normal", status: true },
                  { name: "Proof chain intact", status: true },
                  { name: "KRONOS keeper synced", status: true },
                ].map((check) => (
                  <div key={check.name} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{check.name}</span>
                    <span className={`text-xs font-semibold ${check.status ? "text-emerald-400" : "text-red-400"}`}>
                      {check.status ? "✓ PASS" : "✗ FAIL"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Proofs Today */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard gradient="cyan" glow hover>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Proofs Today</p>
                  <p className="text-2xl font-bold text-white"><AnimatedStat value="47" /></p>
                </div>
              </div>
              <p className="text-sm text-emerald-400 mb-3">↑ +12% vs yesterday</p>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={proofsSparkData}>
                    <defs>
                      <linearGradient id="sparkCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#00D4FF" strokeWidth={2} fill="url(#sparkCyan)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Row 2: Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">
        {/* Treasury */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard gradient="amber" hover>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <p className="text-xs text-gray-500 uppercase tracking-wider">Treasury Balance</p>
              </div>
              <p className="text-3xl font-bold text-white mb-2"><AnimatedStat value="42.5 SOL" /></p>
              <p className="text-sm text-emerald-400">+1.2 SOL (24h)</p>
              <div className="mt-4 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueSparkData}>
                    <defs>
                      <linearGradient id="sparkAmber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={2} fill="url(#sparkAmber)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Active Assessments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard gradient="purple" hover>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-purple-400" />
                <p className="text-xs text-gray-500 uppercase tracking-wider">Active Assessments</p>
              </div>
              <p className="text-3xl font-bold text-white mb-2"><AnimatedStat value="23" /></p>
              <p className="text-sm text-gray-400">8 pools monitored</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Axiom Compliance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard gradient="emerald" hover>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-emerald-400" />
                <p className="text-xs text-gray-500 uppercase tracking-wider">Axiom Compliance</p>
              </div>
              <p className="text-3xl font-bold text-white mb-2">100%</p>
              <p className="text-sm text-gray-400">49/50 active · 1 deprecated</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Agents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <GlassCard gradient="purple" hover>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-purple-400" />
                <p className="text-xs text-gray-500 uppercase tracking-wider">Active Agents</p>
              </div>
              <p className="text-3xl font-bold text-white mb-2">4 / 100</p>
              <p className="text-sm text-gray-400">AEON · APOLLO · HERMES · KRONOS</p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Row: Agent Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">
        {/* AEON */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard gradient="purple" hover>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
                <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider">AEON — Governance</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Delegations today</span>
                  <span className="text-white font-semibold">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Policy proposals</span>
                  <span className="text-white font-semibold">0 pending</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Circuit breaker</span>
                  <span className="text-emerald-400 font-semibold">Normal</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Last heartbeat</span>
                  <span className="text-gray-500">14s ago</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* APOLLO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <GlassCard gradient="cyan" hover>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">APOLLO — Risk Assessment</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Assessments today</span>
                  <span className="text-white font-semibold">47</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Pools monitored</span>
                  <span className="text-white font-semibold">8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg confidence</span>
                  <span className="text-white font-semibold">87.3%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Last assessment</span>
                  <span className="text-gray-500">2m ago</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* HERMES */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <GlassCard gradient="rose" hover>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-rose-400 animate-pulse" />
                <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider">HERMES — Intelligence</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Reports today</span>
                  <span className="text-white font-semibold">23</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Active subscribers</span>
                  <span className="text-white font-semibold">14</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">API requests (24h)</span>
                  <span className="text-white font-semibold">1,247</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Last report</span>
                  <span className="text-gray-500">5m ago</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* KRONOS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <GlassCard gradient="amber" hover>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">KRONOS — Keeper</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Crank cycles today</span>
                  <span className="text-white font-semibold">318</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Epochs settled</span>
                  <span className="text-white font-semibold">4,218</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Keeper status</span>
                  <span className="text-emerald-400 font-semibold">Synced</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Last heartbeat</span>
                  <span className="text-gray-500">8s ago</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Row 3: Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="relative z-10"
      >
        <GlassCard gradient="cyan" hover>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">Protocol Activity</h2>
                <LiveBadge />
              </div>
              <div className="flex items-center gap-1 bg-[#0A0E17]/60 backdrop-blur rounded-lg p-1 border border-white/5">
                {(["24h", "7d", "30d", "90d"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={
                      "px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 " +
                      (timeRange === range
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "text-gray-500 hover:text-gray-300")
                    }
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartDataSets[timeRange]} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-4}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(0,212,255,0.2)", strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke="#00D4FF"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#00D4FF", stroke: "#0F1420", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </motion.div>

      {/* Row 3: Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="relative z-10"
      >
        <GlassCard gradient="purple" hover>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <LiveBadge />
            </div>
            <div className="space-y-0">
              {recentActivity.map((event, i) => {
                const agentColor: Record<string, string> = {
                  AEON: "text-purple-400",
                  APOLLO: "text-cyan-400",
                  HERMES: "text-rose-400",
                  KRONOS: "text-amber-400",
                };
                return (
                  <div
                    key={i}
                    className={
                      "flex items-center py-3 gap-4" +
                      (i < recentActivity.length - 1 ? " border-b border-white/5" : "")
                    }
                  >
                    <span className={`text-xs font-semibold w-20 shrink-0 ${agentColor[event.agent] ?? "text-gray-400"}`}>
                      {event.agent}
                    </span>
                    <span className="text-sm text-gray-300 flex-1">{event.description}</span>
                    <span className="text-xs text-gray-500 shrink-0">{event.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Disclaimer */}
      <div className="relative z-10 border-t border-white/[0.04] pt-6 mt-8 space-y-2">
        <p className="text-xs text-gray-600 leading-relaxed">
          Dashboard data is from devnet beta. Metrics, balances, and agent statuses may differ from mainnet deployment.
          AXIONBLADE does not provide financial advice. All risk assessments are informational only.
        </p>
      </div>
    </div>
  );
}
