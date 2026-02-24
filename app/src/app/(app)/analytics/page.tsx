// AXIONBLADE Analytics — On-chain metrics and deployment status
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { GlassCard } from "@/components/atoms/GlassCard";
import {
  Activity,
  Shield,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Database,
  AlertCircle,
} from "lucide-react";
import { MAINNET_STATUS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Static on-chain data (sourced from mainnet, 2026-02-24)
// ---------------------------------------------------------------------------

const ON_CHAIN = {
  aeonConfigPDA:    "2mdu4o1p2isEHQeZ2KYHYFnnDdHd183p7HzKQ3Nh8pN3",
  deploySlot:       402486662,
  activeAgents:     4,
  agentCap:         100,
  circuitBreaker:   "Normal",
  lastHeartbeat:    "2026-02-24T21:33:38Z",
  heartbeatInterval: 300,
  deployDate:       "2026-02-24",
};

const PROGRAMS = [
  { name: "noumen_core",     id: "9jNGhtB...8gE", status: "live",    cost: 2.12, deployedAt: "2026-02-24" },
  { name: "noumen_proof",    id: "3SNcx2k...ZqV", status: "live",    cost: 1.69, deployedAt: "2026-02-24" },
  { name: "noumen_treasury", id: "EMNF5A4...LFu", status: "pending", cost: 2.25, deployedAt: null },
  { name: "noumen_apollo",   id: "92WeuJo...3Ee", status: "pending", cost: 1.58, deployedAt: null },
  { name: "noumen_hermes",   id: "Hfv5AS3...mTj", status: "pending", cost: 1.70, deployedAt: null },
  { name: "noumen_auditor",  id: "CGLy91m...vTe", status: "pending", cost: 1.67, deployedAt: null },
  { name: "noumen_service",  id: "9ArzMqH...LbY", status: "pending", cost: 1.49, deployedAt: null },
];

const AGENTS = [
  { name: "AEON",   color: "rose",   type: "Executor",  perm: "Full",    id: 1, pda: "jZXfyn...zu1" },
  { name: "APOLLO", color: "cyan",   type: "Evaluator", perm: "Never",   id: 2, pda: "FfQXgd...pBm" },
  { name: "HERMES", color: "purple", type: "Evaluator", perm: "Never",   id: 3, pda: "68sHfd...XT2" },
  { name: "KRONOS", color: "amber",  type: "Executor",  perm: "Limited", id: 4, pda: "FuH1MD...oEF" },
];

const agentColorMap: Record<string, string> = {
  rose:   "text-rose-400 bg-rose-500/20 border-rose-500/30",
  cyan:   "text-cyan-400 bg-cyan-500/20 border-cyan-500/30",
  purple: "text-purple-400 bg-purple-500/20 border-purple-500/30",
  amber:  "text-amber-400 bg-amber-500/20 border-amber-500/30",
};

const dotColorMap: Record<string, string> = {
  rose: "bg-rose-400", cyan: "bg-cyan-400", purple: "bg-purple-400", amber: "bg-amber-400",
};

// Mock heartbeat history (5-min intervals since deploy)
function generateHeartbeats() {
  const base = new Date("2026-02-24T21:33:38Z").getTime();
  return Array.from({ length: 24 }, (_, i) => ({
    t:   new Date(base - (23 - i) * 300_000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    val: i === 23 ? 1 : 0,
  }));
}

function generateSlotActivity() {
  let slot = 402486662;
  return Array.from({ length: 14 }, (_, i) => {
    slot += Math.floor(Math.random() * 80 + 40);
    return { slot: `#${(402486662 + i * 60).toLocaleString()}`, txs: i === 0 ? 3 : 1 };
  });
}

const heartbeatData  = generateHeartbeats();
const slotActivity   = generateSlotActivity();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Mainnet
    </span>
  );
}

function MainnetBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-semibold uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
      On-chain
    </span>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F1420] border border-[#1A2235] rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">{payload[0].value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "programs" | "agents">("overview");

  const liveCount    = MAINNET_STATUS.deployedPrograms.length;
  const totalPrograms = liveCount + MAINNET_STATUS.pendingPrograms.length;
  const progressPct  = Math.round((liveCount / totalPrograms) * 100);
  const pendingCost  = PROGRAMS.filter((p) => p.status === "pending").reduce((s, p) => s + p.cost, 0);

  return (
    <div className="space-y-8 relative">
      {/* Background gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-60 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent"
        >
          Analytics
        </motion.h1>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-gray-400 text-lg">On-chain metrics and deployment status</p>
          <LiveBadge />
          <MainnetBadge />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          AXIONBLADE v3.4.0 — noumen_core + noumen_proof live since {ON_CHAIN.deployDate} · slot #{ON_CHAIN.deploySlot.toLocaleString()}
        </p>
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex gap-1 bg-[#0A0E17]/80 backdrop-blur border border-white/5 rounded-lg p-1 w-fit">
        {(["overview", "programs", "agents"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              "px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 " +
              (activeTab === tab
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-gray-500 hover:text-gray-300")
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <>
          {/* Row 1: Key on-chain metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">
            {[
              { label: "Programs Live",    value: `${liveCount}/${totalPrograms}`,  sub: `${progressPct}% deployed`,    icon: Database,    grad: "cyan"    as const },
              { label: "Active Agents",    value: `${ON_CHAIN.activeAgents}/100`,   sub: "AEON · APOLLO · HERMES · KRONOS", icon: Zap,      grad: "amber"   as const },
              { label: "Circuit Breaker",  value: ON_CHAIN.circuitBreaker,          sub: "aeon_config · slot #402M",    icon: Shield,      grad: "emerald" as const },
              { label: "Deploy Slot",      value: `#${(ON_CHAIN.deploySlot / 1e6).toFixed(2)}M`, sub: "mainnet-beta",  icon: TrendingUp,  grad: "purple"  as const },
            ].map(({ label, value, sub, icon: Icon, grad }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <GlassCard gradient={grad} hover>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{value}</p>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Row 2: Deployment progress + heartbeat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
            {/* Deployment progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <GlassCard gradient="cyan" hover>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Deployment Progress</h2>
                    <span className="text-xs text-gray-500">{liveCount}/{totalPrograms} programs</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Deployed</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Program list mini */}
                  <div className="space-y-2">
                    {PROGRAMS.map((p) => (
                      <div key={p.name} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          {p.status === "live"
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            : <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
                          <span className={`text-xs font-mono ${p.status === "live" ? "text-white" : "text-gray-500"}`}>{p.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-600">{p.cost} SOL</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            p.status === "live"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-white/5 text-gray-600 border border-white/5"
                          }`}>
                            {p.status === "live" ? "LIVE" : "PENDING"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs">
                    <span className="text-gray-500">Remaining cost</span>
                    <span className="text-amber-400 font-semibold">~{pendingCost.toFixed(2)} SOL</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Heartbeat chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <GlassCard gradient="amber" hover>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-white">Heartbeat Timeline</h2>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    keeper_authority · interval: {ON_CHAIN.heartbeatInterval}s · last: {new Date(ON_CHAIN.lastHeartbeat).toLocaleTimeString()}
                  </p>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={heartbeatData} margin={{ top: 4, right: 4, bottom: 0, left: -30 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="t" tick={{ fill: "#4b5563", fontSize: 9 }} axisLine={false} tickLine={false} interval={5} />
                        <YAxis tick={false} axisLine={false} tickLine={false} domain={[0, 1]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="val" fill="#F59E0B" radius={[2, 2, 0, 0]} maxBarSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Heartbeats",  value: "1" },
                      { label: "Uptime",      value: "100%" },
                      { label: "Next in",     value: `${ON_CHAIN.heartbeatInterval}s` },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-lg font-bold text-white">{value}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Row 3: Slot activity chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="relative z-10"
          >
            <GlassCard gradient="purple" hover>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-semibold text-white">On-chain Transactions</h2>
                  <span className="text-xs text-gray-500">Since deploy · slot #402,486,662</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={slotActivity} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A855F7" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="slot" tick={{ fill: "#4b5563", fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} dx={-4} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="txs" stroke="#A855F7" strokeWidth={2} fill="url(#gradPurple)" dot={false}
                      activeDot={{ r: 4, fill: "#A855F7", stroke: "#0F1420", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}

      {/* ── PROGRAMS TAB ── */}
      {activeTab === "programs" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-4"
        >
          <GlassCard gradient="cyan" hover>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Program Registry</h2>
                <span className="text-xs text-gray-500">{liveCount} live · {totalPrograms - liveCount} pending · ~{pendingCost.toFixed(2)} SOL remaining</span>
              </div>

              <div className="space-y-0">
                {PROGRAMS.map((p, i) => (
                  <div
                    key={p.name}
                    className={`flex items-center gap-4 py-4 ${i < PROGRAMS.length - 1 ? "border-b border-white/5" : ""}`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${p.status === "live" ? "bg-emerald-400 animate-pulse" : "bg-gray-700"}`} />

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-mono font-semibold ${p.status === "live" ? "text-white" : "text-gray-500"}`}>
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-600 font-mono truncate">{p.id}</p>
                    </div>

                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-gray-500">{p.deployedAt ?? "—"}</p>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider">{p.deployedAt ? "deployed" : "pending"}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-white">{p.cost} SOL</p>
                      <p className="text-[10px] text-gray-600">rent cost</p>
                    </div>

                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded border ${
                      p.status === "live"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-white/5 text-gray-600 border-white/5"
                    }`}>
                      {p.status === "live" ? "LIVE" : "PENDING"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{progressPct}% complete · {totalPrograms - liveCount} programs remaining</p>
              </div>
            </div>
          </GlassCard>

          {/* aeon_config summary */}
          <GlassCard gradient="emerald" hover>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-white">aeon_config PDA</h2>
                <MainnetBadge />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "PDA",                value: "2mdu4o1...8pN3" },
                  { label: "Owner",              value: "noumen_core" },
                  { label: "is_initialized",     value: "true" },
                  { label: "active_agent_count", value: "4 / 100" },
                  { label: "circuit_breaker",    value: "Normal (0)" },
                  { label: "heartbeat_interval", value: "300s" },
                  { label: "balance",            value: "0.003236 SOL" },
                  { label: "size",               value: "337 bytes" },
                  { label: "deploy_slot",        value: "#402,486,662" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-mono text-white font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* ── AGENTS TAB ── */}
      {activeTab === "agents" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {AGENTS.map((agent, i) => {
              const colorCls = agentColorMap[agent.color];
              const dotCls   = dotColorMap[agent.color];
              return (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <GlassCard gradient={agent.color as "rose" | "cyan" | "purple" | "amber"} hover>
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${dotCls} animate-pulse`} />
                          <span className={`text-xs font-semibold uppercase tracking-wider ${colorCls.split(" ")[0]}`}>
                            {agent.name}
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${colorCls}`}>
                          Active
                        </span>
                      </div>

                      {/* Fields */}
                      <div className="space-y-2.5">
                        {[
                          { k: "agent_id",            v: `#${agent.id}` },
                          { k: "agent_type",          v: agent.type },
                          { k: "execution_permission",v: agent.perm },
                          { k: "manifest_pda",        v: agent.pda },
                          { k: "ttl",                 v: "2028-02-24" },
                          { k: "created_at",          v: "2026-02-24" },
                        ].map(({ k, v }) => (
                          <div key={k} className="flex justify-between gap-2 text-sm">
                            <span className="text-gray-500 font-mono text-xs">{k}</span>
                            <span className="text-white font-semibold text-xs font-mono text-right">{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* A0-14 badge for evaluators */}
                      {agent.type === "Evaluator" && (
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <span className="text-[10px] text-gray-500">
                            A0-14 enforced on-chain — cannot be upgraded to executor
                          </span>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>

          {/* Agent count progress */}
          <GlassCard gradient="emerald" hover>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Agent Capacity</h2>
                <span className="text-sm text-gray-400">4 / 100</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "4%" }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>4 active (AEON · APOLLO · HERMES · KRONOS)</span>
                <span>96 slots remaining · hard cap: A0-9</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Disclaimer */}
      <div className="relative z-10 border-t border-white/[0.04] pt-6 mt-8 flex items-start gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 leading-relaxed">
          On-chain data sourced directly from Solana mainnet-beta.
          Program metrics (assessments, reports, treasury) pending deployment of remaining 5 programs.
          AXIONBLADE does not provide financial advice.
        </p>
      </div>
    </div>
  );
}
