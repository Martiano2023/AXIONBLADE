"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Activity,
  Search,
  Copy,
  Check,
  ArrowUpRight,
  ChevronDown,
  Inbox,
} from "lucide-react";
import { TechnicalDetails } from "@/components/atoms/TechnicalDetails";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AgentId = "AEON" | "APOLLO" | "HERMES" | "Auditor" | "Service";
type EventType = "Decision" | "Execution" | "Payment" | "Assessment" | "Report" | "Incident";
type TimeRange = "24h" | "7d" | "30d" | "all";

interface ActivityEvent {
  id: string;
  timestamp: number;
  agent: AgentId;
  type: EventType;
  description: string;
  txSignature?: string;
  proofHash?: string;
  logDecision?: string;
}

/* ------------------------------------------------------------------ */
/*  Color maps                                                         */
/* ------------------------------------------------------------------ */

const agentColors: Record<AgentId, { bg: string; text: string; dot: string }> = {
  AEON:    { bg: "bg-rose-500/15",   text: "text-rose-400",   dot: "bg-rose-500"   },
  APOLLO:  { bg: "bg-cyan-500/15",   text: "text-cyan-400",   dot: "bg-cyan-500"   },
  HERMES:  { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-500" },
  Auditor: { bg: "bg-amber-500/15",  text: "text-amber-400",  dot: "bg-amber-500"  },
  Service: { bg: "bg-emerald-500/15",text: "text-emerald-400",dot: "bg-emerald-500" },
};

const eventColors: Record<EventType, { bg: string; text: string; dot: string }> = {
  Decision:   { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-500" },
  Execution:  { bg: "bg-emerald-500/15",text: "text-emerald-400",dot: "bg-emerald-500" },
  Payment:    { bg: "bg-amber-500/15",  text: "text-amber-400",  dot: "bg-amber-500"  },
  Assessment: { bg: "bg-cyan-500/15",   text: "text-cyan-400",   dot: "bg-cyan-500"   },
  Report:     { bg: "bg-[#00D4FF]/15",   text: "text-[#00D4FF]",   dot: "bg-[#00D4FF]"   },
  Incident:   { bg: "bg-rose-500/15",   text: "text-rose-400",   dot: "bg-rose-500"   },
};

/* ------------------------------------------------------------------ */
/*  Mock data (25 events)                                              */
/* ------------------------------------------------------------------ */

const now = Math.floor(Date.now() / 1000);

const MOCK_EVENTS: ActivityEvent[] = [
  { id: "evt-01", timestamp: now - 60,     agent: "AEON",    type: "Decision",   description: "Delegated pool monitoring task to APOLLO for Raydium SOL-USDC.",                        txSignature: "5Kx9vQ2rFg7bPdMn", proofHash: "0x7a3f8b2c1e4d9a06", logDecision: "log_decision(action=delegate_monitoring, target=APOLLO, pool=SOL-USDC, evidence_families=5)" },
  { id: "evt-02", timestamp: now - 180,    agent: "APOLLO",  type: "Assessment", description: "Risk assessment completed for Orca BONK-SOL pool. Score: 31/100. Output written to assessment_pda (weight ≤40%).", proofHash: "0x9c1d4e7f2a5b8301" },
  { id: "evt-03", timestamp: now - 300,    agent: "AEON",    type: "Execution",  description: "Executed rebalance of treasury reserve allocation.",                                     txSignature: "3Mp8nZ4wYtR6dLxF", proofHash: "0x2b5e8a1f3c6d9704", logDecision: "log_decision(action=treasury_rebalance, reserve_ratio=32%, daily_spend_check=PASS)" },
  { id: "evt-04", timestamp: now - 420,    agent: "HERMES",  type: "Report",     description: "Protocol Health Snapshot published for external subscribers. Terminal output only — does not enter execution chain.", proofHash: "0x4d7f0a3c6e9b1258" },
  { id: "evt-05", timestamp: now - 600,    agent: "AEON",    type: "Payment",    description: "Processed API subscription payment: 2.5 SOL from B2B service tier.",                     txSignature: "7Rj2kL9mNfGh4ePq", proofHash: "0x6e9b1c4f7a2d5803" },
  { id: "evt-06", timestamp: now - 780,    agent: "Auditor", type: "Incident",   description: "Flagged anomalous liquidity drop in Marinade mSOL-SOL pool.", proofHash: "0x8a2d5f0c3e6b9714" },
  { id: "evt-07", timestamp: now - 960,    agent: "APOLLO",  type: "Assessment", description: "MLI (Mercenary Liquidity Index) module detected incentive-driven liquidity in Jupiter perps. Output to assessment_pda.", proofHash: "0x0c3e6b9f2a5d8171" },
  { id: "evt-08", timestamp: now - 1200,   agent: "AEON",    type: "Decision",   description: "Approved HERMES report publication after proof verification.",                           txSignature: "9Wd4nH7mKp2rLfXs", proofHash: "0x3e6b9f2c5a8d0174", logDecision: "log_decision(action=approve_publication, agent=HERMES, report_id=RPT-014, proof_verified=true)" },
  { id: "evt-09", timestamp: now - 1500,   agent: "HERMES",  type: "Report",     description: "Yield Trap Intelligence report: 12 newly listed Raydium pools flagged for unsustainable emission schedules.", proofHash: "0x5b8e1c4f2a7d0963" },
  { id: "evt-10", timestamp: now - 1800,   agent: "AEON",    type: "Execution",  description: "Updated Layer 2 operational parameter: refresh interval 30s to 15s.",                    txSignature: "2Lk5mN8pQr3sYfXg", proofHash: "0x7d0f3a6b9c2e5814", logDecision: "log_decision(action=param_update, layer=2, param=refresh_interval, old=30s, new=15s)" },
  { id: "evt-11", timestamp: now - 2400,   agent: "APOLLO",  type: "Assessment", description: "Effective APR module flagged divergence: reported 42%, effective 28% for JUP-USDC. Result in assessment_pda.", proofHash: "0x9f2c5e8b1a4d0637" },
  { id: "evt-12", timestamp: now - 3000,   agent: "AEON",    type: "Decision",   description: "Rejected pool addition: insufficient evidence families (1 of minimum 2 required by A0-16). ALERT-ONLY mode.",    proofHash: "0x2c5e8b1f4a7d0963", logDecision: "log_decision(action=reject_pool, reason=insufficient_evidence, families_active=1, minimum=2)" },
  { id: "evt-13", timestamp: now - 3600,   agent: "Auditor", type: "Incident",   description: "Resolved incident #47: false positive on Oracle deviation alert.", proofHash: "0x5e8b1f4c7a0d2396" },
  { id: "evt-14", timestamp: now - 4500,   agent: "HERMES",  type: "Report",     description: "Risk Decomposition Vector delivered as A2A payload to partner protocol agent. Terminal — external consumption only.", proofHash: "0x8b1f4c7e0a3d5692" },
  { id: "evt-15", timestamp: now - 5400,   agent: "AEON",    type: "Payment",    description: "CCS distribution: creator share within 15% cap, stipend within 5% cap.",                 txSignature: "4Fn6kM9pLr2sHfXg", proofHash: "0x1f4c7e0b3a6d8925" },
  { id: "evt-16", timestamp: now - 7200,   agent: "APOLLO",  type: "Assessment", description: "Pool Taxonomy module reclassified Meteora DLMM pools from Tier 2 to Tier 1. Assessment written to PDA.", proofHash: "0x4c7e0b3f6a9d1258" },
  { id: "evt-17", timestamp: now - 9000,   agent: "AEON",    type: "Execution",  description: "Agent lifecycle: disabled idle monitoring agent (no demand 72h).",                       txSignature: "8Gp1nK4mQr5sLfXh", proofHash: "0x7e0b3f6c9a2d4581", logDecision: "log_decision(action=disable_agent, reason=no_demand_72h, agent_depth=1, reversible=true)" },
  { id: "evt-18", timestamp: now - 10800,  agent: "Auditor", type: "Decision",   description: "Auditor assigned truth label to incident #46: confirmed manipulation.",                   proofHash: "0x0b3f6c9e2a5d7814", logDecision: "log_decision(action=assign_truth_label, incident=46, label=confirmed_manipulation)" },
  { id: "evt-19", timestamp: now - 14400,  agent: "Service", type: "Report",     description: "External API served 1,247 requests in last 4h. SLA met at 99.8%. Revenue from paid services only.", proofHash: "0x3f6c9e2b5a8d0147" },
  { id: "evt-20", timestamp: now - 18000,  agent: "AEON",    type: "Execution",  description: "Treasury sweep: moved 15.2 SOL from Donation PDA to main Treasury. Bypasses CCS split per axiom.",    txSignature: "6Hs3nJ8mPr7sNfXi", proofHash: "0x6c9e2b5f8a1d3470", logDecision: "log_decision(action=donation_sweep, amount=15.2_SOL, ccs_bypass=true, source=DonationPDA)" },
  { id: "evt-21", timestamp: now - 21600,  agent: "APOLLO",  type: "Assessment", description: "Batch risk scan: 47 pools evaluated across 5 evidence families. All assessments within tolerance.", proofHash: "0x9e2b5f8c1a4d6703" },
  { id: "evt-22", timestamp: now - 28800,  agent: "HERMES",  type: "Report",     description: "Pool Comparison and Effective APR Calculator reports published for Solana DeFi weekly digest.", proofHash: "0x2b5f8c1e4a7d9036" },
  { id: "evt-23", timestamp: now - 43200,  agent: "AEON",    type: "Payment",    description: "Premium tier subscription renewed: 5.0 SOL quarterly payment received via A2A marketplace.",  txSignature: "1Bx7mP3qRs9tYfWk", proofHash: "0x5f8c1e4b7a0d2369" },
  { id: "evt-24", timestamp: now - 64800,  agent: "Service", type: "Execution",  description: "Auto-scaled HERMES API endpoints from 2 to 4 instances based on measured demand.",          txSignature: "9Qw2nL5pKr8sGfXm", proofHash: "0x8c1e4b7f0a3d5692" },
  { id: "evt-25", timestamp: now - 86400,  agent: "Auditor", type: "Incident",   description: "Circuit breaker triggered: switched to Degraded mode after 3 consecutive proof failures.",    proofHash: "0x1e4b7f0c3a6d8925" },
];

/* ------------------------------------------------------------------ */
/*  Filter options                                                     */
/* ------------------------------------------------------------------ */

const AGENT_OPTIONS: ("All" | AgentId)[] = ["All", "AEON", "APOLLO", "HERMES", "Auditor", "Service"];
const EVENT_TYPE_OPTIONS: ("All" | EventType)[] = [
  "All", "Decision", "Execution", "Payment", "Assessment", "Report", "Incident",
];
const TIME_RANGES: { key: TimeRange; label: string; seconds: number }[] = [
  { key: "24h",  label: "24h",  seconds: 86400    },
  { key: "7d",   label: "7d",   seconds: 604800   },
  { key: "30d",  label: "30d",  seconds: 2592000  },
  { key: "all",  label: "All",  seconds: Infinity },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimeAgo(ts: number): string {
  const seconds = Math.floor(Date.now() / 1000 - ts);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Copy Button component                                              */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-[#1A2235] transition-colors text-gray-500 hover:text-gray-300 cursor-pointer"
      title="Copy signature"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Select dropdown component                                          */
/* ------------------------------------------------------------------ */

function SelectDropdown({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 appearance-none rounded-xl border border-[#1A2235] bg-[#0F1420]",
          "pl-3 pr-8 text-sm text-gray-300 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/40 focus:border-[#00D4FF]/40",
          "hover:bg-[#1A2235] hover:border-[#243049] transition-colors duration-200"
        )}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-900 text-gray-300">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ActivityPage() {
  const [agentFilter, setAgentFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  const filteredEvents = useMemo(() => {
    const rangeConfig = TIME_RANGES.find((t) => t.key === timeRange);
    const cutoff = rangeConfig ? now - rangeConfig.seconds : 0;

    return MOCK_EVENTS.filter((e) => {
      if (agentFilter !== "All" && e.agent !== agentFilter) return false;
      if (typeFilter !== "All" && e.type !== typeFilter) return false;
      if (e.timestamp < cutoff) return false;
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        if (
          !e.description.toLowerCase().includes(q) &&
          !e.agent.toLowerCase().includes(q) &&
          !e.type.toLowerCase().includes(q) &&
          !(e.txSignature && e.txSignature.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [agentFilter, typeFilter, search, timeRange]);

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-1">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Activity Feed
            </h1>
            <p className="text-gray-400 text-lg">
              Real-time protocol event log — decisions, executions, proofs
            </p>
            <p className="text-xs text-gray-600 mt-1">
              All actions require log_decision before execution (A0-5)
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center gap-2 rounded-full bg-[#1A2235] border border-[#1A2235] px-4 py-2 shrink-0"
          >
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-medium text-gray-300">
              {MOCK_EVENTS.length} events
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* ---- Section 1: Filter Bar ---- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className={cn(
          "sticky top-0 z-10 -mx-1 px-1 py-3",
          "bg-[#0F1420] border border-[#1A2235] rounded-xl"
        )}
      >
        <div className="flex flex-col lg:flex-row gap-3 px-4">
          {/* Agent + Type filters */}
          <div className="flex flex-wrap gap-3">
            <SelectDropdown
              value={agentFilter}
              onChange={setAgentFilter}
              label="Filter by agent"
              options={AGENT_OPTIONS.map((a) => ({
                value: a,
                label: a === "All" ? "All Agents" : a,
              }))}
            />
            <SelectDropdown
              value={typeFilter}
              onChange={setTypeFilter}
              label="Filter by event type"
              options={EVENT_TYPE_OPTIONS.map((t) => ({
                value: t,
                label: t === "All" ? "All Types" : t,
              }))}
            />
          </div>

          {/* Search input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "h-10 w-full rounded-xl border border-[#1A2235] bg-[#0F1420]",
                "pl-9 pr-3 text-sm text-gray-300 placeholder:text-gray-600",
                "focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/40 focus:border-[#00D4FF]/40",
                "hover:bg-[#1A2235] transition-colors duration-200"
              )}
            />
          </div>

          {/* Time range buttons */}
          <div className="flex items-center gap-1 bg-[#0F1420] rounded-xl border border-[#1A2235] p-1">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.key}
                onClick={() => setTimeRange(tr.key)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 cursor-pointer",
                  timeRange === tr.key
                    ? "bg-[#1A2235] text-white border border-[#243049]"
                    : "text-gray-500 hover:text-gray-300 hover:bg-[#1A2235] border border-transparent"
                )}
              >
                {tr.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ---- Results count ---- */}
      <p className="text-xs text-gray-500 px-1">
        Showing <span className="text-gray-300 font-medium">{filteredEvents.length}</span> of {MOCK_EVENTS.length} events
      </p>

      {/* ---- Section 2: Event Timeline ---- */}
      {filteredEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 gap-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#0F1420] border border-[#1A2235]">
            <Inbox size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-500 text-sm">No events match the current filters</p>
          <button
            onClick={() => {
              setAgentFilter("All");
              setTypeFilter("All");
              setSearch("");
              setTimeRange("all");
            }}
            className="text-xs text-[#00D4FF] hover:text-[#00D4FF]/80 cursor-pointer transition-colors"
          >
            Clear all filters
          </button>
        </motion.div>
      ) : (
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-[#243049] via-[#1A2235] to-transparent" />

          <div className="space-y-3">
            {filteredEvents.map((event, index) => {
              const evtColor = eventColors[event.type];
              const agentColor = agentColors[event.agent];

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.03,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="relative flex gap-4 pl-0"
                >
                  {/* Timeline dot */}
                  <div className="relative z-10 flex shrink-0 items-start pt-5">
                    <div className={cn(
                      "h-[10px] w-[10px] rounded-full ring-4 ring-gray-950/80",
                      evtColor.dot
                    )} />
                  </div>

                  {/* Event card */}
                  <div
                    className={cn(
                      "flex-1 bg-[#0F1420] border border-[#1A2235] rounded-xl p-4",
                      "hover:border-[#243049] transition-colors duration-200",
                      "group"
                    )}
                  >
                    {/* Top row: badges + timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Agent badge */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            agentColor.bg, agentColor.text, "border-transparent"
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", agentColor.dot)} />
                          {event.agent}
                        </span>

                        {/* Event type badge */}
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            evtColor.bg, evtColor.text, "border-transparent"
                          )}
                        >
                          {event.type}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-gray-500 tabular-nums">
                        {formatTimeAgo(event.timestamp)}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Proof Hash row — shown when proofHash is present */}
                    {event.proofHash && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider shrink-0">Proof</span>
                        <span className="text-[11px] font-mono text-gray-500 truncate">{event.proofHash}</span>
                        <CopyButton text={event.proofHash} />
                      </div>
                    )}

                    {/* log_decision entry */}
                    {event.logDecision && (
                      <div className="mt-2 px-3 py-2 rounded-lg bg-[#1A2235] border border-[#243049]">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider block mb-1">log_decision</span>
                        <span className="text-[11px] font-mono text-gray-400 break-all">{event.logDecision}</span>
                      </div>
                    )}

                    {/* TX Signature row */}
                    {event.txSignature && (
                      <>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1A2235]">
                          <span className="text-[11px] font-mono text-gray-500 truncate">
                            {event.txSignature}
                          </span>
                          <CopyButton text={event.txSignature} />
                          <a
                            href={`https://solscan.io/tx/${event.txSignature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-[#1A2235] transition-colors text-gray-500 hover:text-[#00D4FF]"
                            title="View on Solscan"
                          >
                            <ArrowUpRight size={12} />
                          </a>
                        </div>
                        <TechnicalDetails label="On-chain Details">
                          <div className="space-y-1.5">
                            <div>
                              <span className="text-gray-600">TX Hash:</span>{" "}
                              <span className="text-gray-400 break-all">{event.txSignature}</span>
                            </div>
                            {event.proofHash && (
                              <div>
                                <span className="text-gray-600">Proof Hash:</span>{" "}
                                <span className="text-gray-400 break-all">{event.proofHash}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Block:</span>{" "}
                              <span className="text-gray-400">#{(248_000_000 + Math.abs(event.timestamp % 200_000)).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Proof:</span>{" "}
                              <a
                                href={`https://solscan.io/tx/${event.txSignature}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors"
                              >
                                View decision proof on Solscan
                              </a>
                            </div>
                          </div>
                        </TechnicalDetails>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
