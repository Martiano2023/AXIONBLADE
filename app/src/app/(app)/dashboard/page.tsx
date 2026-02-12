"use client";

import { useState } from "react";
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
  { agent: "APOLLO", description: "Risk evaluation complete: RAY-USDC", time: "5m ago" },
  { agent: "HERMES", description: "Intelligence report published", time: "15m ago" },
  { agent: "AEON", description: "Policy parameter updated", time: "1h ago" },
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
    <div className="bg-[#111827] border border-[#1F2937] rounded-lg px-3 py-2 shadow-lg">
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

// --- Card wrapper ---

const cardBase =
  "bg-[#111827] border border-[#1F2937] rounded-xl hover:border-[#374151] transition-colors duration-200 p-6";

// --- Dashboard page ---

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "90d">("7d");

  return (
    <div className="space-y-6">
      {/* Row 1: Hero metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Status */}
        <div className={cardBase}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">System Status</p>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <p className="text-3xl font-bold text-white">Operational</p>
          </div>
          <div className="flex items-center gap-4">
            {["AEON", "APOLLO", "HERMES"].map((name) => (
              <div key={name} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="text-xs text-gray-400">{name}</span>
              </div>
            ))}
          </div>
          {/* Health Checks */}
          <div className="mt-4 space-y-2">
            {[
              { name: "All agents responding", status: true },
              { name: "Treasury reserve >= 25%", status: true },
              { name: "Axioms 29/29 compliant", status: true },
              { name: "Circuit breaker: Normal", status: true },
              { name: "Proof chain intact", status: true },
            ].map((check) => (
              <div key={check.name} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{check.name}</span>
                <span className={`text-[10px] font-medium ${check.status ? "text-emerald-400" : "text-red-400"}`}>
                  {check.status ? "PASS" : "FAIL"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Proofs Today */}
        <div className={cardBase}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Proofs Today</p>
          <p className="text-3xl font-bold text-white mb-2">47</p>
          <p className="text-sm text-[#10B981]">{"\u2191"} +12% vs yesterday</p>
          <div className="mt-3 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={proofsSparkData}>
                <defs>
                  <linearGradient id="sparkGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={1.5} fill="url(#sparkGreen)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Treasury */}
        <div className={cardBase}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Treasury Balance</p>
          <p className="text-2xl font-bold text-white">42.5 SOL</p>
          <p className="text-sm text-[#10B981] mt-1">+1.2 SOL (24h)</p>
          <div className="mt-3 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSparkData}>
                <defs>
                  <linearGradient id="sparkBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={1.5} fill="url(#sparkBlue)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Assessments */}
        <div className={cardBase}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Active Assessments</p>
          <p className="text-2xl font-bold text-white">23</p>
          <p className="text-sm text-gray-400 mt-1">8 pools monitored</p>
        </div>

        {/* Axiom Compliance */}
        <div className={cardBase}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Axiom Compliance</p>
          <p className="text-2xl font-bold text-white">100%</p>
          <p className="text-sm text-gray-400 mt-1">29/29 enforced</p>
        </div>
      </div>

      {/* Row: Agent Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* AEON */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <p className="text-xs text-gray-500 uppercase tracking-wider">AEON — Governance</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Delegations today</span>
              <span className="text-white font-mono">12</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Policy proposals</span>
              <span className="text-white font-mono">0 pending</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Circuit breaker</span>
              <span className="text-emerald-400 font-mono">Normal</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Last heartbeat</span>
              <span className="text-gray-400">14s ago</span>
            </div>
          </div>
        </div>

        {/* APOLLO */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <p className="text-xs text-gray-500 uppercase tracking-wider">APOLLO — Risk Assessment</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Assessments today</span>
              <span className="text-white font-mono">47</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Pools monitored</span>
              <span className="text-white font-mono">8</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Avg confidence</span>
              <span className="text-white font-mono">87.3%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Last assessment</span>
              <span className="text-gray-400">2m ago</span>
            </div>
          </div>
        </div>

        {/* HERMES */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <p className="text-xs text-gray-500 uppercase tracking-wider">HERMES — Intelligence</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Reports today</span>
              <span className="text-white font-mono">23</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Active subscribers</span>
              <span className="text-white font-mono">14</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">API requests (24h)</span>
              <span className="text-white font-mono">1,247</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Last report</span>
              <span className="text-gray-400">5m ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Chart */}
      <div className={cardBase}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-white">Protocol Activity (7d)</h2>
          <div className="flex items-center gap-1 bg-[#0B0F1A] rounded-lg p-1">
            {(["24h", "7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 " +
                  (timeRange === range
                    ? "bg-[#1F2937] text-white"
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
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(59,130,246,0.2)", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="transactions"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#3B82F6", stroke: "#111827", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3: Recent Activity */}
      <div className={cardBase}>
        <h2 className="text-sm font-semibold text-white mb-3">Recent Activity</h2>
        <div>
          {recentActivity.map((event, i) => (
            <div
              key={i}
              className={
                "flex items-center py-2.5" +
                (i < recentActivity.length - 1 ? " border-b border-[#1F2937]" : "")
              }
            >
              <span className="text-xs font-medium text-blue-400 w-16">{event.agent}</span>
              <span className="text-sm text-gray-400 flex-1">{event.description}</span>
              <span className="text-xs text-gray-600">{event.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-white/[0.04] pt-6 mt-8 space-y-2">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Dashboard data is from devnet beta. Metrics, balances, and agent statuses may differ from mainnet deployment.
          NOUMEN does not provide financial advice. All risk assessments are informational only.
        </p>
      </div>
    </div>
  );
}
