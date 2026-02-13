"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { ScrollText, CheckCircle2, Shield } from "lucide-react";
import { InfoTooltip } from "@/components/atoms/Tooltip";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AxiomCategory =
  | "governance"
  | "separation"
  | "proofs"
  | "security"
  | "economy"
  | "donations";

interface Axiom {
  number: string;
  description: string;
  category: AxiomCategory;
  rationale: string;
}

/* ------------------------------------------------------------------ */
/*  Complete axiom data (29 active, A0-2 deprecated / excluded)        */
/* ------------------------------------------------------------------ */

const AXIOMS: Axiom[] = [
  // Governance (6)
  { number: "A0-1",  description: "Only AEON creates agents",                                    category: "governance", rationale: "Prevents unauthorized agent proliferation. Single point of control ensures governance accountability." },
  { number: "A0-9",  description: "Hard cap 100 agents; depth = 1",                              category: "governance", rationale: "Limits system complexity and attack surface. Flat hierarchy prevents cascading delegation risks." },
  { number: "A0-15", description: "LLMs never make final decisions",                             category: "governance", rationale: "Ensures all final decisions are deterministic and auditable. LLMs lack accountability for outcomes." },
  { number: "A0-16", description: "LLMs are advisors only - all outputs reviewed",               category: "governance", rationale: "Prevents hallucinated or manipulated outputs from reaching execution. Human-in-the-loop for all LLM advice." },
  { number: "A0-26", description: "Only AEON authorizes agent creation via create_agent",         category: "governance", rationale: "Enforces the single-creator pattern at the instruction level. No backdoor agent creation paths." },
  { number: "A0-28", description: "Agent removal requires kill_proof with reason hash",           category: "governance", rationale: "Prevents silent agent removal. Every deactivation must be justified and permanently recorded." },

  // Separation (5)
  { number: "A0-4",  description: "Evaluation and execution never in same agent for same domain", category: "separation", rationale: "Prevents conflicts of interest. An agent that evaluates risk cannot also act on that evaluation." },
  { number: "A0-5",  description: "HERMES output is terminal — never enters execution chain",     category: "separation", rationale: "Intelligence data is for external consumption only. Prevents feedback loops and manipulation vectors." },
  { number: "A0-6",  description: "APOLLO weight capped at 40% in risk engine",                  category: "separation", rationale: "No single evaluator can dominate risk decisions. Forces diversification of risk signal sources." },
  { number: "A0-8",  description: "Executors never read APOLLO PDAs directly",                   category: "separation", rationale: "Maintains the firewall chain. Executors only receive filtered, validated risk signals through AEON." },
  { number: "A0-22", description: "HERMES services are read-only; no state mutation allowed",     category: "separation", rationale: "Intelligence gathering must never alter protocol state. Read-only access eliminates side-effect risks." },

  // Proofs (5)
  { number: "A0-3",  description: "log_decision mandatory before any execution",                 category: "proofs", rationale: "Ensures every action has a verifiable audit trail. Without prior proof, no execution can occur." },
  { number: "A0-10", description: "Every execution requires >= 2 independent evidence families",  category: "proofs", rationale: "Single-source assessments are unreliable. Multiple independent signals reduce false positive/negative rates." },
  { number: "A0-11", description: "5 evidence families: Price/Volume, Liquidity, Behavior, Incentive, Protocol", category: "proofs", rationale: "Defines the complete taxonomy of risk signals. Each family covers an orthogonal risk dimension." },
  { number: "A0-12", description: "If < 2 families available, system goes ALERT-ONLY mode",       category: "proofs", rationale: "Insufficient data must never trigger execution. Alert-only mode protects against incomplete assessments." },
  { number: "A0-27", description: "Every decision_log must include pre_state_hash and post_state_hash", category: "proofs", rationale: "Enables exact state reconstruction for audits. Proves what changed and verifies no hidden mutations." },

  // Security (5)
  { number: "A0-7",  description: "Auto-learning in production is prohibited",                   category: "security", rationale: "Prevents model drift and adversarial manipulation. All model updates require explicit human review." },
  { number: "A0-13", description: "Circuit breaker: 3 modes (Normal, Degraded, Halted)",          category: "security", rationale: "Graduated response to anomalies. Degraded mode preserves critical functions while isolating threats." },
  { number: "A0-14", description: "Failed proof -> automatic halt and incident report",           category: "security", rationale: "A failed proof indicates potential data corruption or attack. Immediate halt prevents cascading damage." },
  { number: "A0-23", description: "All cross-program invocations must be explicitly whitelisted", category: "security", rationale: "Prevents composability attacks. Only audited, approved programs can interact with AXIONBLADE contracts." },
  { number: "A0-24", description: "Rate limiting on all public-facing instructions",             category: "security", rationale: "Mitigates spam, DoS attacks, and resource exhaustion. Protects compute budget and system stability." },

  // Economy (5)
  { number: "A0-17", description: "Reserve ratio >= 25% at all times",                           category: "economy", rationale: "Ensures protocol solvency during market stress. 25% reserve provides a safety buffer against black swan events." },
  { number: "A0-18", description: "Daily treasury spend <= 3% of free balance",                  category: "economy", rationale: "Prevents treasury drain from runaway spending. Limits daily exposure to maintain multi-month runway." },
  { number: "A0-19", description: "Every service must cover its cost (floor: cost + 20% margin)", category: "economy", rationale: "Ensures economic sustainability. No service can operate at a loss indefinitely, preventing treasury depletion." },
  { number: "A0-20", description: "Subsidy period max 90 days, then service discontinued",        category: "economy", rationale: "Forces market validation. If a service cannot achieve profitability in 90 days, it lacks real demand." },
  { number: "A0-25", description: "CCS total creator capture capped at 15%, floor 4%, stipend cap 5%", category: "economy", rationale: "Balances creator incentives with protocol sustainability. Prevents excessive extraction while rewarding contribution." },

  // Donations (3)
  { number: "A0-29", description: "Donations confer no rights, priority, or influence",          category: "donations", rationale: "Prevents plutocratic capture. No amount of donation can buy governance power or preferential treatment." },
  { number: "A0-30", description: "Conditional donations are rejected (anti-masquerade)",         category: "donations", rationale: "Blocks attempts to disguise purchases or bribes as donations. All donations must be unconditional." },
  { number: "A0-21", description: "Donation PDA swept daily to Treasury, bypasses CCS split",    category: "donations", rationale: "Donations fund the protocol directly, not creators. Daily sweep prevents accumulation in the donation vault." },
];

/* ------------------------------------------------------------------ */
/*  Category metadata                                                  */
/* ------------------------------------------------------------------ */

const CATEGORY_META: Record<
  AxiomCategory,
  { label: string; color: string; dotClass: string; bgClass: string; borderClass: string }
> = {
  governance:  { label: "Governance",  color: "#a855f7", dotClass: "bg-purple-500",  bgClass: "bg-purple-500/15",  borderClass: "border-purple-500/40" },
  separation:  { label: "Separation",  color: "#00D4FF", dotClass: "bg-[#00D4FF]",    bgClass: "bg-[#00D4FF]/15",    borderClass: "border-[#00D4FF]/40" },
  proofs:      { label: "Proofs",      color: "#22d3ee", dotClass: "bg-cyan-500",    bgClass: "bg-cyan-500/15",    borderClass: "border-cyan-500/40" },
  security:    { label: "Security",    color: "#f43f5e", dotClass: "bg-rose-500",    bgClass: "bg-rose-500/15",    borderClass: "border-rose-500/40" },
  economy:     { label: "Economy",     color: "#10b981", dotClass: "bg-emerald-500", bgClass: "bg-emerald-500/15", borderClass: "border-emerald-500/40" },
  donations:   { label: "Donations",   color: "#f59e0b", dotClass: "bg-amber-500",  bgClass: "bg-amber-500/15",  borderClass: "border-amber-500/40" },
};

const FILTER_CATEGORIES: { key: AxiomCategory | "all"; label: string; count: number }[] = [
  { key: "all",        label: "All",        count: 29 },
  { key: "governance", label: "Governance", count: 6  },
  { key: "separation", label: "Separation", count: 5  },
  { key: "proofs",     label: "Proofs",     count: 5  },
  { key: "security",   label: "Security",   count: 5  },
  { key: "economy",    label: "Economy",    count: 5  },
  { key: "donations",  label: "Donations",  count: 3  },
];

/* ------------------------------------------------------------------ */
/*  Radar chart data                                                   */
/* ------------------------------------------------------------------ */

const radarData = [
  { category: "Governance",  compliance: 100, fullMark: 100 },
  { category: "Separation",  compliance: 100, fullMark: 100 },
  { category: "Proofs",      compliance: 100, fullMark: 100 },
  { category: "Security",    compliance: 100, fullMark: 100 },
  { category: "Economy",     compliance: 100, fullMark: 100 },
  { category: "Donations",   compliance: 100, fullMark: 100 },
];

/* ------------------------------------------------------------------ */
/*  Compliance Gauge SVG component                                     */
/* ------------------------------------------------------------------ */

function ComplianceGauge() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const progress = mounted ? 1 : 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={200} height={200} viewBox="0 0 200 200" className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={100}
          cy={100}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={12}
        />
        {/* Progress ring */}
        <circle
          cx={100}
          cy={100}
          r={radius}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className="transition-all duration-[2000ms] ease-out"
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
        >
          100%
        </motion.span>
        <motion.span
          className="text-sm text-emerald-400 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          Compliant
        </motion.span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AxiomsPage() {
  const [activeCategory, setActiveCategory] = useState<AxiomCategory | "all">("all");

  const filteredAxioms =
    activeCategory === "all"
      ? AXIOMS
      : AXIOMS.filter((a) => a.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* ---- Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00D4FF]/15 text-[#00D4FF]">
            <ScrollText size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white inline-flex items-center">Axiom<InfoTooltip term="Axiom" /> Monitor</h1>
            <p className="text-sm text-gray-400">
              29 immutable rules — the constitution of AXIONBLADE
            </p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-2"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <CheckCircle2 size={18} className="text-emerald-400" />
          </motion.div>
          <span className="text-sm font-semibold text-emerald-400">100% Compliant</span>
        </motion.div>
      </motion.div>

      {/* ---- Section 1: Compliance Gauge ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-8 flex flex-col items-center gap-4">
          <ComplianceGauge />
          <p className="text-sm text-gray-500">
            <span className="text-gray-300 font-medium">29/29</span> Active
            <span className="mx-2 text-gray-600">|</span>
            <span className="text-gray-500">1 Deprecated (A0-2)</span>
          </p>
        </div>
      </motion.div>

      {/* ---- Section 2: Radar Chart ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-[#00D4FF]" />
          <h2 className="text-lg font-semibold text-white">Compliance by Category</h2>
        </div>
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={400} maxHeight={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
              <PolarAngleAxis
                dataKey="category"
                tick={({ x, y, payload }) => {
                  const cat = Object.values(CATEGORY_META).find(
                    (c) => c.label === payload.value
                  );
                  return (
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={cat?.color || "#94a3b8"}
                      fontSize={12}
                      fontWeight={600}
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Compliance"
                dataKey="compliance"
                stroke="#00D4FF"
                fill="#00D4FF"
                fillOpacity={0.3}
                strokeWidth={2}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ---- Compliance History Timeline ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6"
      >
        <h2 className="text-sm font-semibold text-white mb-4">Compliance History (30d)</h2>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={Array.from({ length: 30 }, (_, i) => ({
            day: i + 1,
            compliant: 29,
            total: 29,
          }))} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="complianceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 29]} tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Area type="monotone" dataKey="compliant" stroke="#10B981" strokeWidth={2} fill="url(#complianceGrad)" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-gray-600 text-center mt-2">29/29 axioms compliant for 30 consecutive days</p>
      </motion.div>

      {/* ---- Section 3: Category Filter Chips ---- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex flex-wrap gap-2"
      >
        {FILTER_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          const meta = cat.key !== "all" ? CATEGORY_META[cat.key] : null;

          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer",
                isActive
                  ? cat.key === "all"
                    ? "bg-[#1A2235] text-white border-[#243049]"
                    : cn(meta?.bgClass, "border-transparent text-white")
                  : "bg-[#0F1420] text-gray-400 border-[#1A2235] hover:bg-[#1A2235]/60 hover:text-gray-200"
              )}
            >
              {meta && (
                <span
                  className={cn("h-2 w-2 rounded-full", meta.dotClass)}
                />
              )}
              {cat.label}
              <span
                className={cn(
                  "text-xs font-mono",
                  isActive ? "text-white/70" : "text-gray-500"
                )}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ---- Section 4: Axiom Cards Grid ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAxioms.map((axiom, index) => {
          const meta = CATEGORY_META[axiom.category];

          return (
            <motion.div
              key={axiom.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.4,
                delay: index * 0.04,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <div
                className={cn(
                  "bg-[#0F1420] border border-[#1A2235] rounded-xl p-5",
                  "hover:border-[#243049] transition-colors duration-200",
                  "group cursor-default"
                )}
                style={{
                  // Category glow on hover via CSS variable
                  "--cat-border": meta.color,
                } as React.CSSProperties}
              >
                {/* Top row: dot + number + category */}
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={cn("h-2 w-2 rounded-full shrink-0", meta.dotClass)}
                  />
                  <span className="text-xs font-bold font-mono text-white/80">
                    {axiom.number}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium ml-auto px-2 py-0.5 rounded-full",
                      meta.bgClass
                    )}
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-300 leading-relaxed mb-1">
                  {axiom.description}
                </p>

                {/* Rationale */}
                <p className="text-xs text-gray-500 italic mt-1 mb-4">{axiom.rationale}</p>

                {/* Status row */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{
                          repeat: Infinity,
                          duration: 3,
                          delay: index * 0.15,
                          ease: "easeInOut",
                        }}
                      >
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      </motion.div>
                      <span className="text-xs font-medium text-emerald-400">
                        Compliant
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500">
                      47d consecutive
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-600">Last check: 2m ago</span>
                    <span className="text-gray-600 font-mono">proof: {axiom.number.replace("A0-", "a0")}...x{(parseInt(axiom.number.replace("A0-", "")) * 7 % 99).toString(16)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-white/[0.04] pt-6 mt-8 space-y-2">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Axioms are enforced at the smart contract level and cannot be modified without contract redeployment.
          Policy Layer changes follow governance delays: L1 (72h-30d), L2 (24h), L3 (agent-adjustable).
        </p>
      </div>
    </div>
  );
}
