"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { truncateAddress } from "@/lib/format";
import {
  Crown,
  Scale,
  ShieldCheck,
  Heart,
  Lock,
  Clock,
  Settings,
  SlidersHorizontal,
  Copy,
  Check,
  ExternalLink,
  Users,
  Activity,
  Layers,
  GitBranch,
  HeartPulse,
} from "lucide-react";
import { TechnicalDetails } from "@/components/atoms/TechnicalDetails";
import { InfoTooltip } from "@/components/atoms/Tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Agent {
  id: number;
  name: string;
  type: string;
  status: "Active" | "Standby" | "Inactive";
  depth: number;
  budgetPct: number;
  ttl: string;
  lastHeartbeat: string;
}

interface TimelineEvent {
  id: number;
  label: string;
  time: string;
  type: "normal" | "warning" | "info";
}

interface PolicyLayer {
  id: number;
  name: string;
  subtitle: string;
  accent: string;
  borderColor: string;
  bgColor: string;
  icon: React.ReactNode;
  items: string[];
  activeProposals: number;
}

interface CircuitBreakerEvent {
  id: number;
  label: string;
  time: string;
  type: "normal" | "warning" | "resolved";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTHORITY_ADDRESS = "9jNGzLEhNggpoSHbWozAsHmSMzrKBPJvHQmu5Tj8j8gE";
const HEARTBEAT_INTERVAL = 60;
const TABS = ["Agents", "Policy Layers", "Circuit Breaker"] as const;
type TabType = (typeof TABS)[number];

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_AGENTS: Agent[] = [
  { id: 1, name: "APOLLO", type: "Evaluator", status: "Active", depth: 1, budgetPct: 52, ttl: "Active for 3d", lastHeartbeat: "30s ago" },
  { id: 2, name: "HERMES", type: "Service", status: "Active", depth: 1, budgetPct: 39, ttl: "Active for 3d", lastHeartbeat: "45s ago" },
  { id: 3, name: "Monitor-01", type: "Monitor", status: "Active", depth: 1, budgetPct: 15, ttl: "Active for 1d", lastHeartbeat: "2m ago" },
  { id: 4, name: "Executor-01", type: "Executor", status: "Standby", depth: 1, budgetPct: 0, ttl: "Active for 2d", lastHeartbeat: "5m ago" },
  { id: 5, name: "Backup-01", type: "Monitor", status: "Inactive", depth: 1, budgetPct: 0, ttl: "Expired", lastHeartbeat: "N/A" },
];

const MOCK_HEARTBEAT_LOG: TimelineEvent[] = [
  { id: 1, label: "Heartbeat #4712 confirmed", time: "60s ago", type: "normal" },
  { id: 2, label: "Heartbeat #4711 confirmed", time: "2m ago", type: "normal" },
  { id: 3, label: "Heartbeat #4710 confirmed", time: "3m ago", type: "normal" },
  { id: 4, label: "Heartbeat #4709 - minor delay", time: "4m ago", type: "warning" },
  { id: 5, label: "Heartbeat #4708 confirmed", time: "5m ago", type: "normal" },
];

const MOCK_POLICY_LAYERS: PolicyLayer[] = [
  {
    id: 0,
    name: "Layer 0 - Axioms",
    subtitle: "Immutable without contract redeploy",
    accent: "text-rose-400",
    borderColor: "border-l-rose-500",
    bgColor: "bg-rose-500/5",
    icon: <Lock className="w-4 h-4 text-rose-400" />,
    items: ["29 axioms, all compliant"],
    activeProposals: 0,
  },
  {
    id: 1,
    name: "Layer 1 - Constitutional",
    subtitle: "72h-30d delay, 7-30d cooldown",
    accent: "text-amber-400",
    borderColor: "border-l-amber-400",
    bgColor: "bg-amber-400/5",
    icon: <Clock className="w-4 h-4 text-amber-400" />,
    items: ["Budget limits", "Evidence families", "CCS bands", "Protocol allowlists"],
    activeProposals: 1,
  },
  {
    id: 2,
    name: "Layer 2 - Operational",
    subtitle: "24h delay/cooldown",
    accent: "text-cyan-400",
    borderColor: "border-l-cyan-400",
    bgColor: "bg-cyan-400/5",
    icon: <Settings className="w-4 h-4 text-cyan-400" />,
    items: ["Prices", "Agent lifecycle", "Budget allocation"],
    activeProposals: 2,
  },
  {
    id: 3,
    name: "Layer 3 - Tactical",
    subtitle: "Agent-adjustable, monitored",
    accent: "text-emerald-400",
    borderColor: "border-l-emerald-400",
    bgColor: "bg-emerald-400/5",
    icon: <SlidersHorizontal className="w-4 h-4 text-emerald-400" />,
    items: ["Monitored pools", "Update frequency", "Prioritization"],
    activeProposals: 0,
  },
];

const MOCK_CB_EVENTS: CircuitBreakerEvent[] = [
  { id: 1, label: "System started - Normal mode", time: "24h ago", type: "normal" },
  { id: 2, label: "Routine check passed", time: "12h ago", type: "normal" },
  { id: 3, label: "Brief network congestion detected", time: "8h ago", type: "warning" },
  { id: 4, label: "Congestion resolved - returned to Normal", time: "8h ago", type: "resolved" },
  { id: 5, label: "Current status verified", time: "now", type: "normal" },
];

// ---------------------------------------------------------------------------
// Stagger variants
// ---------------------------------------------------------------------------

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, { dot: string; badge: string }> = {
  Active: { dot: "bg-emerald-400", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  Standby: { dot: "bg-amber-400", badge: "bg-amber-400/15 text-amber-400 border-amber-400/30" },
  Inactive: { dot: "bg-gray-500", badge: "bg-white/5 text-gray-400 border-white/10" },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function HeartbeatCountdown() {
  const [remaining, setRemaining] = useState(54);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => (prev <= 0 ? HEARTBEAT_INTERVAL : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pct = (remaining / HEARTBEAT_INTERVAL) * 100;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8">
      {/* Large countdown circle */}
      <div className="relative w-52 h-52 flex-shrink-0">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Animated arc */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              remaining > 15 ? "stroke-blue-500" : remaining > 5 ? "stroke-amber-400" : "stroke-rose-500"
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={remaining}
            initial={{ scale: 1.1, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-bold text-white tabular-nums"
          >
            {remaining}
          </motion.span>
          <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            Next Heartbeat
          </span>
          <span className={cn(
            "text-[10px] mt-1.5 font-medium",
            remaining > 5 ? "text-emerald-400" : "text-amber-400"
          )}>
            {remaining > 5 ? "All signals healthy" : "Verifying..."}
          </span>
        </div>
      </div>

      {/* Recent heartbeats log */}
      <div className="flex-1 w-full">
        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Recent Heartbeats</h4>
        <div className="space-y-2">
          {MOCK_HEARTBEAT_LOG.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0B0F1A] hover:bg-[#1F2937] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  event.type === "warning" ? "bg-amber-400" : "bg-emerald-400"
                )} />
                <span className="text-sm text-gray-300">{event.label}</span>
              </div>
              <span className="text-xs text-gray-500">{event.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentsTab() {
  const headers = [
    { label: "Agent ID", tooltip: undefined },
    { label: "Type", tooltip: undefined },
    { label: "Status", tooltip: undefined },
    { label: "Depth", tooltip: "Agent creation depth — AEON only creates at depth 1, hard cap 100 agents" },
    { label: "Budget Used %", tooltip: undefined },
    { label: "Lifespan", tooltip: "Time-To-Live — how long before an agent or data point expires" },
    { label: "Last Verified", tooltip: "Time since the agent last confirmed it is alive via heartbeat" },
  ];

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1F2937]">
              {headers.map((h) => (
                <th key={h.label} className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                  <span className="inline-flex items-center">
                    {h.label}
                    {h.tooltip && <InfoTooltip term={h.label} definition={h.tooltip} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_AGENTS.map((agent, i) => {
              const statusStyle = STATUS_STYLES[agent.status];
              const barColor = agent.budgetPct >= 80 ? "from-rose-500 to-rose-400" :
                agent.budgetPct >= 50 ? "from-amber-400 to-amber-300" :
                "from-blue-500 to-blue-400";

              return (
                <motion.tr
                  key={agent.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-[#0B0F1A] hover:bg-[#1F2937] transition-colors border-b border-[#1F2937] last:border-b-0"
                >
                  <td className="px-6 py-3">
                    <span className="font-medium text-white">{agent.name}</span>
                    <span className="text-gray-500 text-xs ml-2">#{agent.id}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-300">{agent.type}</td>
                  <td className="px-6 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", statusStyle.badge)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", statusStyle.dot)} />
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-300 font-mono">{agent.depth}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 rounded-full bg-[#1F2937] overflow-hidden">
                        <motion.div
                          className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
                          initial={{ width: 0 }}
                          animate={{ width: `${agent.budgetPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + i * 0.05 }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 tabular-nums w-8">{agent.budgetPct}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={cn(
                      "text-sm",
                      agent.ttl === "Expired" ? "text-rose-400" : "text-gray-300"
                    )}>
                      {agent.ttl}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-sm">{agent.lastHeartbeat}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TechnicalDetails label="On-chain Agent Registry" className="px-6 pb-4">
        <div className="space-y-1">
          <p>Program ID: 9jNG...j8gE</p>
          <p>Agent Registry PDA: 7kPm...xR2d</p>
          <p>Max Agents: 100 (Axiom A0-5)</p>
          <p>Creation Depth: 1 (only AEON creates)</p>
          <p>{`{ "registered": 5, "active": 3, "standby": 1, "inactive": 1 }`}</p>
        </div>
      </TechnicalDetails>
    </div>
  );
}

function PolicyLayersTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {MOCK_POLICY_LAYERS.map((layer, i) => (
        <motion.div
          key={layer.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className={cn(
            "bg-[#111827] border border-[#1F2937] rounded-xl p-5 border-l-4 hover:border-[#374151] transition-colors duration-200",
            layer.borderColor,
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", layer.bgColor)}>
                {layer.icon}
              </div>
              <div>
                <h3 className={cn("text-sm font-bold", layer.accent)}>{layer.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{layer.subtitle}</p>
              </div>
            </div>
            {layer.activeProposals > 0 && (
              <span className="inline-flex items-center rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                {layer.activeProposals} proposal{layer.activeProposals > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Items */}
          <div className="space-y-1.5 mt-4">
            {layer.items.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CircuitBreakerTab() {
  const currentStatus = "NORMAL";

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-4xl font-bold text-emerald-400 tracking-tight mb-2"
        >
          {currentStatus}
        </motion.div>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          All systems operational. No anomalies detected.
        </p>

        {/* Three states legend */}
        <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-[#1F2937]">
          {[
            { label: "Normal", color: "bg-emerald-400", text: "text-emerald-400", active: true },
            { label: "Degraded", color: "bg-amber-400", text: "text-amber-400", active: false },
            { label: "Halted", color: "bg-rose-500", text: "text-rose-400", active: false },
          ].map((state) => (
            <div key={state.label} className="flex items-center gap-2">
              <span className={cn("w-2.5 h-2.5 rounded-full", state.color, !state.active && "opacity-40")} />
              <span className={cn("text-xs", state.active ? cn(state.text, "font-medium") : "text-gray-500")}>
                {state.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Trigger History Timeline */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4 font-medium">Trigger History</h3>
        <div className="relative ml-4">
          {/* Vertical line */}
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[#1F2937]" />

          <div className="space-y-4">
            {MOCK_CB_EVENTS.map((event, i) => {
              const dotColor = event.type === "warning"
                ? "bg-amber-400 shadow-amber-400/30"
                : event.type === "resolved"
                  ? "bg-emerald-400 shadow-emerald-400/30"
                  : "bg-blue-500 shadow-blue-500/30";

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  className="relative flex items-start gap-4 pl-6"
                >
                  {/* Dot */}
                  <span className={cn(
                    "absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full shadow-sm z-10",
                    dotColor,
                  )} />

                  {/* Content */}
                  <div className="flex-1 flex items-center justify-between py-2 px-4 rounded-xl bg-[#0B0F1A] hover:bg-[#1F2937] transition-colors">
                    <span className="text-sm text-gray-300">{event.label}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{event.time}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      <TechnicalDetails label="Circuit Breaker State">
        <div className="space-y-1">
          <p>Current state: NORMAL (0)</p>
          <p>Last state change: block #281,438,200</p>
          <p>State change TX: 3Rf7...pN2w</p>
          <p>Degraded threshold: 3 anomalies / 10 min</p>
          <p>Halt threshold: 5 anomalies / 5 min</p>
          <p>Auto-recovery: after 30 min of clean signals</p>
        </div>
      </TechnicalDetails>
    </div>
  );
}

function AddressChip({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }, [address]);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F2937] border border-[#1F2937] px-3 py-1.5 text-xs font-mono text-gray-400">
      {truncateAddress(address)}
      <button
        type="button"
        onClick={handleCopy}
        className="text-gray-500 hover:text-white transition-colors p-0.5"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      </button>
      <a
        href={`https://solscan.io/account/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 hover:text-blue-400 transition-colors p-0.5"
      >
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AeonPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Agents");
  const [heartbeatRemaining, setHeartbeatRemaining] = useState(54);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeartbeatRemaining((prev) => (prev <= 0 ? HEARTBEAT_INTERVAL : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const heartbeatPct = (heartbeatRemaining / HEARTBEAT_INTERVAL) * 100;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ================================================================= */}
      {/* Hero Section                                                      */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem} className="text-center">
        <div className="flex flex-col items-center gap-4">
          {/* Agent icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center"
          >
            <Crown className="w-8 h-8 text-blue-400" />
          </motion.div>

          {/* Title + Subtitle */}
          <div>
            <h1 className="text-3xl font-bold text-white">AEON</h1>
            <p className="text-lg text-gray-400 mt-1">Sovereign Governance</p>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-400 max-w-2xl">
            AEON is the governance brain of NOUMEN. It manages policy layers, enforces axioms, and coordinates all agents. AEON decides — but never executes directly. Every governance action requires proof-before-action.
          </p>
        </div>

        {/* How it works — 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            {
              step: "01",
              icon: <Layers className="w-5 h-5 text-blue-400" />,
              description: "Policies are organized in 4 layers: Immutable (L0) → Constitutional (L1) → Operational (L2) → Tactical (L3)",
            },
            {
              step: "02",
              icon: <GitBranch className="w-5 h-5 text-blue-400" />,
              description: "Any policy change must pass through proposal → vote → proof → execution pipeline",
            },
            {
              step: "03",
              icon: <HeartPulse className="w-5 h-5 text-blue-400" />,
              description: "Circuit breakers and heartbeat monitoring ensure system safety 24/7",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 text-left hover:border-[#374151] transition-colors duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                  {item.step}
                </span>
                {item.icon}
              </div>
              <p className="text-sm text-gray-400">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Governance note pill */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="mt-6 flex justify-center"
        >
          <span className="bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-xs text-blue-400">
            Governance participation requires staking (coming soon)
          </span>
        </motion.div>
      </motion.div>

      {/* ================================================================= */}
      {/* Header                                                            */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/20">
            <Crown className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">AEON</h1>
              {/* Online pulse */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Online
              </span>
            </div>
            <p className="text-sm text-gray-500">Sovereign Governor — orchestrates agents, enforces axioms, and approves every execution</p>
          </div>
        </div>

        <AddressChip address={AUTHORITY_ADDRESS} />
      </motion.div>

      {/* ================================================================= */}
      {/* Status Banner                                                     */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem}>
        <div className="bg-[#111827] border border-[#1F2937] border-l-4 border-l-emerald-500 rounded-xl p-6 flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-lg font-semibold text-white">AEON Status: All Clear</p>
              <p className="text-sm text-gray-400">Governance operating normally — all signals healthy</p>
            </div>
          </div>
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
          </span>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Section 1: Governance Metrics (4 cards)                           */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Agents */}
        <motion.div variants={staggerItem}>
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 hover:border-[#374151] transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Active Agents</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">2</span>
              <span className="text-lg text-gray-500">/100</span>
            </div>
          </div>
        </motion.div>

        {/* Decisions Today */}
        <motion.div variants={staggerItem}>
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 hover:border-[#374151] transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Decisions Today</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-400/15 flex items-center justify-center">
                <Scale className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="text-3xl font-bold text-white">47</span>
          </div>
        </motion.div>

        {/* System Safety */}
        <motion.div variants={staggerItem}>
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 hover:border-[#374151] transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider flex items-center">
                System Safety
                <InfoTooltip term="Circuit Breaker" />
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-400/15 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <span className="text-3xl font-bold text-emerald-400">Operational</span>
          </div>
        </motion.div>

        {/* Heartbeat */}
        <motion.div variants={staggerItem}>
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 hover:border-[#374151] transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider flex items-center">
                Heartbeat
                <InfoTooltip term="Heartbeat" definition="Periodic signal confirming AEON is alive and governance is operating normally" />
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Mini countdown circle */}
              <div className="relative w-9 h-9">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${heartbeatPct * 0.88} ${88 - heartbeatPct * 0.88}`}
                    className="stroke-rose-400 transition-all duration-1000"
                  />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold text-white">Last verified: {HEARTBEAT_INTERVAL - heartbeatRemaining}s ago</span>
                <p className="text-[10px] text-gray-500">Next check in {heartbeatRemaining}s</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ================================================================= */}
      {/* Section 2: Heartbeat Monitor                                      */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem}>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 hover:border-[#374151] transition-colors duration-200">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Governance Health Monitor</h2>
            <InfoTooltip term="Heartbeat" definition="Periodic on-chain signal confirming AEON governance is alive and all systems are operating within normal parameters" />
          </div>
          <HeartbeatCountdown />
          <TechnicalDetails label="Raw Heartbeat Data" className="mt-6">
            <div className="space-y-1">
              <p>Latest block: #281,442,017</p>
              <p>Heartbeat TX: 5Uj8...mK9v</p>
              <p>Timestamp: 2026-02-11T14:32:07Z</p>
              <p>Slot: 281442017 | Epoch: 652</p>
              <p>Interval: {HEARTBEAT_INTERVAL}s</p>
              <p>Program: 9jNG...j8gE</p>
            </div>
          </TechnicalDetails>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Section 3: Tabs                                                   */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem}>
        {/* Tab buttons */}
        <div className="flex gap-1 mb-4 p-1 bg-[#111827] rounded-xl border border-[#1F2937] w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                activeTab === tab
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="aeon-tab-bg"
                  className="absolute inset-0 bg-[#1F2937] border border-[#374151] rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "Agents" && <AgentsTab />}
            {activeTab === "Policy Layers" && <PolicyLayersTab />}
            {activeTab === "Circuit Breaker" && <CircuitBreakerTab />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
