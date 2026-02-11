"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
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
        </div>

        {/* Proofs Today */}
        <div className={cardBase}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Proofs Today</p>
          <p className="text-3xl font-bold text-white mb-2">47</p>
          <p className="text-sm text-[#10B981]">{"\u2191"} +12% vs yesterday</p>
        </div>
      </div>

      {/* Row 2: Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Treasury */}
        <div className={cardBase}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Treasury Balance</p>
          <p className="text-2xl font-bold text-white">42.5 SOL</p>
          <p className="text-sm text-[#10B981] mt-1">+1.2 SOL (24h)</p>
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
    </div>
  );
}
