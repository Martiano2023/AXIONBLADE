"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Glossary of key terms ──────────────────────────────────
export const GLOSSARY: Record<string, string> = {
  CCS: "Cost-Contribution Split — how revenue is divided between creators and treasury. Separate from the base 15% creator allocation in the revenue split",
  Axiom: "One of 50 immutable rules (A0-1 through A0-50, with A0-2 deprecated — 49 active) enforced at the smart contract level that cannot be changed without contract redeployment",
  "Evidence Family": "A category of data used to evaluate risk (e.g., liquidity, volatility)",
  "Brier Score": "Measures prediction accuracy — lower is better, 0 is perfect",
  HTL: "Hit-to-Loss ratio: percentage of risk predictions that correctly identified the outcome",
  PDA: "Program Derived Address — a deterministic account on Solana owned by a program",
  MLI: "Multi-Layered Incentive — analysis framework for evaluating yield sustainability",
  TTL: "Time-To-Live — how long before an agent or data point expires",
  "Reserve Ratio": "Percentage of treasury held in reserve — minimum 25% per Axiom A0-3",
  "Circuit Breaker": "Emergency mechanism that halts execution when anomalies are detected",

  // Evidence families - explain what each measures
  "Price/Volume": "Measures price stability, trading volume consistency, and oracle reliability for the pool's token pair",
  "Liquidity": "Evaluates TVL depth, LP concentration (Herfindahl index), and liquidity flow trends over 24h",
  "Behavior": "Detects wash trading, MEV exploitation, and abnormal transaction patterns from linked wallets",
  "Incentive": "Analyzes headline vs effective APR gap, reward token sustainability, and emission schedule decay rate",
  "Protocol": "Assesses team identity, audit history, governance model, and TVL rank within the protocol's category",

  // Risk score ranges
  "Low Risk": "Score 81-100: Strong fundamentals across most evidence families. Suitable for conservative strategies",
  "Medium Risk": "Score 61-80: Some risk factors present but manageable. Monitor actively",
  "High Risk": "Score 41-60: Multiple risk factors detected. Only for risk-tolerant participants with active monitoring",
  "Critical Risk": "Score 0-40: Severe risk indicators. Potential yield trap or exploit conditions. ALERT-ONLY mode activated",

  // Additional terms
  "Effective APR": "The real yield after accounting for impermanent loss, fee decay, reward token depreciation, and gas costs",
  "Yield Trap": "A pool where headline APR significantly exceeds effective APR, misleading participants about true returns",
  "Proof Hash": "SHA-256 hash of the assessment data stored on-chain, enabling cryptographic verification of the result",
  "Assessment PDA": "Program Derived Address storing the immutable risk assessment record on Solana",
  "Treasury Reserve": "The protocol maintains a minimum 25% reserve ratio at all times (Axiom A0-3), funded by the 45% treasury allocation",
  "Treasury": "45% of all protocol revenue flows to the Treasury — covering reserve requirements and protocol sustainability",
  "Operations": "40% of revenue allocated to compute, RPC nodes, storage, and infrastructure costs",
  "Creator Allocation": "15% of revenue allocated to protocol founder/creator (capped by Axiom A0-28)",
  "Confidence Level": "Percentage of data fields available for the assessment. Higher confidence = more complete data input",
  "AEON": "Sovereign governor agent — delegates tasks, coordinates agents, makes governance decisions. Never executes directly",
  "APOLLO": "DeFi risk evaluator agent with 3 modules: Pool Taxonomy, Multi-Layered Incentive (MLI), and Effective APR",
  "HERMES": "DeFi intelligence agent providing 5 report types for external consumption. Output is terminal — never enters execution chain",

  // Revenue and pricing terms
  "Launch Price": "Introductory pricing for the first 30 days of protocol operation. Prices may adjust after the launch period based on the AI Pricing Stabilizer",
  "AI Pricing Stabilizer": "Automated pricing engine with 3 phases: Launch (fixed), Calibration (±10%/week), Stable (±5%/week). Ensures protocol sustainability",
  "Smart Safeguards": "Automatic rules that protect protocol economics: treasury reserve monitoring, volume-based pricing, SOL volatility adjustment",
  "Revenue Split": "Split applied on NET revenue (gross − costs): 40% Operations, 45% Treasury, 15% Creator. Target margin: +200% (floor: +100%). AI reajusts every 4h.",
};

// ── Base Tooltip ───────────────────────────────────────────
interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  className,
}: TooltipProps) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnter = () => {
    timeoutRef.current = setTimeout(() => setShow(true), 200);
  };

  const handleLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.span
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 px-3 py-2 text-xs text-gray-200 leading-relaxed",
              "bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 rounded-lg",
              "shadow-lg shadow-black/20 whitespace-normal w-56 pointer-events-none",
              positionClasses[position]
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// ── Info Tooltip (ⓘ icon with tooltip) ─────────────────────
interface InfoTooltipProps {
  term: string;
  definition?: string;
  className?: string;
}

export function InfoTooltip({ term, definition, className }: InfoTooltipProps) {
  const text = definition || GLOSSARY[term] || term;
  return (
    <Tooltip content={text} position="top">
      <span
        className={cn(
          "inline-flex items-center justify-center w-3.5 h-3.5 ml-1",
          "rounded-full border border-white/10 text-gray-500",
          "hover:text-gray-300 hover:border-white/20 transition-colors cursor-help",
          className
        )}
      >
        <Info className="w-2.5 h-2.5" />
      </span>
    </Tooltip>
  );
}

// ── Term with automatic tooltip ────────────────────────────
interface GlossaryTermProps {
  term: string;
  children?: ReactNode;
  className?: string;
}

export function GlossaryTerm({ term, children, className }: GlossaryTermProps) {
  const definition = GLOSSARY[term];
  if (!definition) return <span className={className}>{children || term}</span>;

  return (
    <Tooltip content={definition}>
      <span
        className={cn(
          "underline decoration-dotted decoration-white/20 underline-offset-2",
          "hover:decoration-white/40 cursor-help transition-colors",
          className
        )}
      >
        {children || term}
      </span>
    </Tooltip>
  );
}
