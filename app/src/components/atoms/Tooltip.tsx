"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Glossary of key terms ──────────────────────────────────
export const GLOSSARY: Record<string, string> = {
  CCS: "Cost-Contribution Split — how revenue is divided between creators and treasury",
  Axiom: "An immutable rule enforced at the smart contract level that can never be changed",
  "Evidence Family": "A category of data used to evaluate risk (e.g., liquidity, volatility)",
  "Brier Score": "Measures prediction accuracy — lower is better, 0 is perfect",
  HTL: "Headline-to-Liquidation — measures gap between advertised and real APR",
  PDA: "Program Derived Address — a deterministic account on Solana owned by a program",
  MLI: "Multi-Layered Incentive — analysis framework for evaluating yield sustainability",
  TTL: "Time-To-Live — how long before an agent or data point expires",
  "Reserve Ratio": "Percentage of treasury held in reserve — minimum 25% per Axiom A0-3",
  "Circuit Breaker": "Emergency mechanism that halts execution when anomalies are detected",
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
