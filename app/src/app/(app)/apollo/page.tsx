"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Layers,
  BarChart3,
  TrendingUp,
  Shield,
  Activity,
  Eye,
  CheckCircle2,
  XCircle,
  Bell,
  ArrowDownRight,
  Plus,
  ArrowRight,
  ChevronDown,
  Star,
  ExternalLink,
  Download,
  X,
  Check,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { InfoTooltip } from "@/components/atoms/Tooltip";
import { TechnicalDetails } from "@/components/atoms/TechnicalDetails";
import { DataSourceBadge } from "@/components/atoms/DataSourceBadge";
import { useTierStore } from "@/stores/useTierStore";
import { useWallet } from "@solana/wallet-adapter-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EvidenceFamily {
  name: string;
  active: boolean;
}

interface PoolAssessment {
  id: string;
  pool: string;
  dex: string;
  dexLetter: string;
  dexColor: string;
  score: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  evidenceFamilies: EvidenceFamily[];
  headlineApr: number;
  effectiveApr: number;
}

interface RiskDriver {
  name: string;
  value: number; // negative = reduces risk, positive = adds risk
}

interface AlertItem {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  pool: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const POOLS: PoolAssessment[] = [
  {
    id: "ASM-0081",
    pool: "SOL-USDC",
    dex: "Raydium",
    dexLetter: "R",
    dexColor: "bg-purple-500",
    score: 87,
    riskLevel: "Low",
    evidenceFamilies: [
      { name: "Price/Volume", active: true },
      { name: "Liquidity", active: true },
      { name: "Behavior", active: true },
      { name: "Incentive", active: true },
      { name: "Protocol", active: true },
    ],
    headlineApr: 24.5,
    effectiveApr: 18.2,
  },
  {
    id: "ASM-0082",
    pool: "SOL-USDT",
    dex: "Orca",
    dexLetter: "O",
    dexColor: "bg-cyan-400",
    score: 72,
    riskLevel: "Medium",
    evidenceFamilies: [
      { name: "Price/Volume", active: true },
      { name: "Liquidity", active: true },
      { name: "Behavior", active: false },
      { name: "Incentive", active: true },
      { name: "Protocol", active: true },
    ],
    headlineApr: 31.8,
    effectiveApr: 17.9,
  },
  {
    id: "ASM-0083",
    pool: "mSOL-SOL",
    dex: "Marinade",
    dexLetter: "M",
    dexColor: "bg-emerald-400",
    score: 91,
    riskLevel: "Low",
    evidenceFamilies: [
      { name: "Price/Volume", active: true },
      { name: "Liquidity", active: true },
      { name: "Behavior", active: true },
      { name: "Incentive", active: true },
      { name: "Protocol", active: true },
    ],
    headlineApr: 8.1,
    effectiveApr: 7.6,
  },
  {
    id: "ASM-0084",
    pool: "RAY-USDC",
    dex: "Raydium",
    dexLetter: "R",
    dexColor: "bg-purple-500",
    score: 45,
    riskLevel: "High",
    evidenceFamilies: [
      { name: "Price/Volume", active: true },
      { name: "Liquidity", active: false },
      { name: "Behavior", active: true },
      { name: "Incentive", active: false },
      { name: "Protocol", active: true },
    ],
    headlineApr: 89.4,
    effectiveApr: 31.2,
  },
  {
    id: "ASM-0085",
    pool: "JitoSOL-SOL",
    dex: "Jito",
    dexLetter: "J",
    dexColor: "bg-amber-400",
    score: 88,
    riskLevel: "Low",
    evidenceFamilies: [
      { name: "Price/Volume", active: true },
      { name: "Liquidity", active: true },
      { name: "Behavior", active: true },
      { name: "Incentive", active: false },
      { name: "Protocol", active: true },
    ],
    headlineApr: 9.7,
    effectiveApr: 8.9,
  },
  {
    id: "ASM-0086",
    pool: "BONK-SOL",
    dex: "Orca",
    dexLetter: "O",
    dexColor: "bg-cyan-400",
    score: 31,
    riskLevel: "Critical",
    evidenceFamilies: [
      { name: "Price/Volume", active: true },
      { name: "Liquidity", active: false },
      { name: "Behavior", active: true },
      { name: "Incentive", active: true },
      { name: "Protocol", active: false },
    ],
    headlineApr: 145.0,
    effectiveApr: 12.3,
  },
  {
    id: "ASM-0087",
    pool: "JUP-USDC",
    dex: "Jupiter",
    dexLetter: "J",
    dexColor: "bg-sky-400",
    score: 76,
    riskLevel: "Medium",
    evidenceFamilies: [
      { name: "Price/Volume", active: true },
      { name: "Liquidity", active: true },
      { name: "Behavior", active: false },
      { name: "Incentive", active: true },
      { name: "Protocol", active: true },
    ],
    headlineApr: 42.1,
    effectiveApr: 28.7,
  },
  {
    id: "ASM-0088",
    pool: "DRIFT-USDC",
    dex: "Drift",
    dexLetter: "D",
    dexColor: "bg-violet-400",
    score: 82,
    riskLevel: "Low",
    evidenceFamilies: [
      { name: "Price/Volume", active: true },
      { name: "Liquidity", active: true },
      { name: "Behavior", active: true },
      { name: "Incentive", active: true },
      { name: "Protocol", active: false },
    ],
    headlineApr: 19.3,
    effectiveApr: 15.8,
  },
];

const ALERTS: AlertItem[] = [
  {
    id: "ALR-001",
    severity: "critical",
    message: "BONK-SOL pool showing unsustainable yield pattern",
    pool: "BONK-SOL",
    timestamp: "2m ago",
  },
  {
    id: "ALR-002",
    severity: "warning",
    message: "RAY-USDC liquidity concentration spike detected",
    pool: "RAY-USDC",
    timestamp: "15m ago",
  },
  {
    id: "ALR-003",
    severity: "info",
    message: "JUP-USDC assessment updated with new evidence family",
    pool: "JUP-USDC",
    timestamp: "1h ago",
  },
  {
    id: "ALR-004",
    severity: "warning",
    message: "SOL-USDT effective APR diverging from headline by >40%",
    pool: "SOL-USDT",
    timestamp: "2h ago",
  },
  {
    id: "ALR-005",
    severity: "info",
    message: "mSOL-SOL pool reclassified from Medium to Low risk",
    pool: "mSOL-SOL",
    timestamp: "4h ago",
  },
];

const RISK_DRIVERS: Record<string, RiskDriver[]> = {
  "SOL-USDC": [
    { name: "Liquidity depth", value: -5 },
    { name: "Protocol maturity", value: -8 },
    { name: "Volume concentration", value: 12 },
    { name: "Smart contract age", value: -6 },
  ],
  "SOL-USDT": [
    { name: "Depeg correlation", value: 15 },
    { name: "Liquidity bands", value: 10 },
    { name: "Volume stability", value: -4 },
    { name: "Protocol maturity", value: -6 },
  ],
  "mSOL-SOL": [
    { name: "Peg stability", value: -10 },
    { name: "Protocol maturity", value: -9 },
    { name: "Liquidity depth", value: -7 },
    { name: "Validator diversity", value: 3 },
  ],
  "RAY-USDC": [
    { name: "Liquidity concentration", value: 22 },
    { name: "Incentive dependency", value: 18 },
    { name: "Token volatility", value: 14 },
    { name: "Protocol TVL trend", value: -8 },
  ],
  "JitoSOL-SOL": [
    { name: "Peg stability", value: -9 },
    { name: "MEV yield sustainability", value: -7 },
    { name: "Smart contract age", value: 4 },
    { name: "Validator concentration", value: 5 },
  ],
  "BONK-SOL": [
    { name: "Liquidity volatility", value: 28 },
    { name: "Incentive decay", value: 22 },
    { name: "Protocol age", value: 11 },
    { name: "Volume manipulation", value: 5 },
  ],
  "JUP-USDC": [
    { name: "Fee revenue stability", value: -6 },
    { name: "IL exposure", value: 14 },
    { name: "Protocol maturity", value: -5 },
    { name: "Volume concentration", value: 8 },
  ],
  "DRIFT-USDC": [
    { name: "Protocol TVL trend", value: -7 },
    { name: "Insurance fund ratio", value: -5 },
    { name: "Leverage exposure", value: 9 },
    { name: "Funding rate volatility", value: 6 },
  ],
};

const POOL_TECHNICAL: Record<string, { pda: string; block: string; tx: string; proofHash: string }> = {
  "SOL-USDC": { pda: "7Xk9R2pVn4Yw8Lm3qBf6Jh5Nc1Dt0Gs3nP", block: "#245,891,023", tx: "4Vk7Rp3Wn9Xm2Bf6Lh1Jc5Nt0Ds8mN", proofHash: "0x7a3f8b2c1e4d9a06f5b8c3d7e2a1f094" },
  "SOL-USDT": { pda: "8Ym0S3qVp5Zx9Mn4rCg7Ki6Od2Eu1Ht4oQ", block: "#245,890,847", tx: "5Wl8Sq4Xo0Yn3Cg7Mh2Kd6Ou1Et9nO", proofHash: "0x9c1d4e7f2a5b8301c6d9a0f3e7b2c581" },
  "mSOL-SOL": { pda: "9Zn1T4rWq6Ay0No5sDh8Lj7Pe3Fv2Iu5pR", block: "#245,891,102", tx: "6Xm9Tr5Yp1Zo4Dh8Ni3Le7Pv2Fu0oP", proofHash: "0x2b5e8a1f3c6d9704a8f0b3c7d1e5a296" },
  "RAY-USDC": { pda: "AoB2U5sXr7Bz1Op6tEi9Mk8Qf4Gw3Jv6qS", block: "#245,890,691", tx: "7Yn0Us6Zq2Ap5Ei9Oj4Mf8Qw3Gv1pQ", proofHash: "0x4d7f0a3c6e9b1258b1c4d8e2f6a3b704" },
  "JitoSOL-SOL": { pda: "BpC3V6tYs8Ca2Pq7uFj0Nl9Rg5Hx4Kw7rT", block: "#245,891,056", tx: "8Zo1Vt7Ar3Bq6Fj0Pk5Ng9Rx4Hw2qR", proofHash: "0x6e9b1c4f7a2d5803d4f7a0c3e8b5c914" },
  "BONK-SOL": { pda: "CqD4W7uZt9Db3Qr8vGk1Om0Sh6Iy5Lx8sU", block: "#245,890,534", tx: "9Ap2Wu8Bs4Cr7Gk1Ql6Oh0Sy5Ix3rS", proofHash: "0x8a2d5f0c3e6b9714f0c3d6e9a2b7c128" },
  "JUP-USDC": { pda: "DrE5X8vAt0Ec4Rs9wHl2Pn1Ti7Jz6My9tV", block: "#245,890,912", tx: "0Bq3Xv9Ct5Ds8Hl2Rm7Pi1Tz6Jy4sT", proofHash: "0x0c3e6b9f2a5d8171c6f9a3d0e7b4c538" },
  "DRIFT-USDC": { pda: "EsF6Y9wBu1Fd5St0xIm3Qo2Uj8Ka7Nz0uW", block: "#245,890,778", tx: "1Cr4Yw0Du6Et9Im3Sn8Qj2Ua7Kz5tU", proofHash: "0x3e6b9f2c5a8d0174f9c6a3d0e1b8c742" },
};

// Pricing tiers for Pay-Per-Proof
type PricingTier = "free" | "basic" | "pro" | "institutional";

interface PricingTierConfig {
  id: PricingTier;
  name: string;
  price: string;
  priceColor: string;
  description: string;
  features: string[];
  note?: string;
  aiAdjusted?: boolean;
  launchPrice?: boolean;
  afterLaunch?: string;
}

const PRICING_TIERS: PricingTierConfig[] = [
  {
    id: "free",
    name: "FREE",
    price: "Free",
    priceColor: "text-gray-400",
    description: "1 assessment per day — score + risk level only",
    features: [
      "1 assessment per day",
      "Risk score (0-100)",
      "Risk level label",
      "Pool name + address",
    ],
    note: "Free preview — upgrade for full analysis",
  },
  {
    id: "basic",
    name: "BASIC",
    price: "0.02 SOL",
    priceColor: "text-[#00D4FF]",
    description: "Simple risk score only — minimal compute",
    features: [
      "Risk score (0-100)",
      "Risk level label (Low/Medium/High/Critical)",
      "Pool name + address",
    ],
    note: "Simple risk score — upgrade to Pro for full breakdown and AI analysis",
    launchPrice: true,
    afterLaunch: "After launch: ~0.03-0.08 SOL",
  },
  {
    id: "pro",
    name: "PRO",
    price: "0.15 SOL",
    priceColor: "text-cyan-400",
    description: "Full breakdown + drivers + trend + proof hash + AI narrative + watchlist alerts",
    features: [
      "Everything in Basic",
      "Full risk breakdown by evidence family",
      "Risk drivers with contribution bars",
      "7-day and 30-day trend charts",
      "Confidence metrics",
      "Proof hash + explorer link",
      "AI-generated risk narrative (2-3 sentences)",
      "Watchlist: add pool to monitoring",
    ],
    launchPrice: true,
    afterLaunch: "After launch: ~0.20-0.40 SOL",
  },
  {
    id: "institutional",
    name: "INSTITUTIONAL",
    price: "From 2 SOL",
    priceColor: "text-emerald-400",
    description: "AI-dynamic pricing — adjusts based on pool complexity, TVL, network load. Minimum always covers costs + 30% margin.",
    features: [
      "Everything in Pro",
      "Compare: up to 3 pools side-by-side",
      "Full JSON + PDF export",
      "Comparative analysis vs similar pools",
      "Historical risk trajectory (30d)",
      "AI-generated risk narrative",
      "Priority queue processing",
      "Dedicated proof with enhanced metadata",
    ],
    note: "AI-adjusted pricing guarantees minimum 30% treasury allocation.",
    aiAdjusted: true,
    launchPrice: true,
    afterLaunch: "After launch: ~3-8 SOL (AI-adjusted)",
  },
];

// Tier feature descriptions for proof minted display
const TIER_FEATURE_SUMMARY: Record<PricingTier, string[]> = {
  free: ["Risk score", "Risk level label", "Pool name + address"],
  basic: ["Risk score", "Risk level label", "Pool name + address"],
  pro: ["Risk score", "Evidence families", "Risk drivers", "Confidence %", "7d + 30d trend", "Proof hash", "AI narrative", "Watchlist", "Compare", "Export"],
  institutional: ["Full analysis", "JSON + PDF export", "Comparative analysis", "30d trajectory", "AI narrative", "Priority processing"],
};

// Mock 7-day trend deltas per pool
const POOL_7D_TREND: Record<string, { delta: number; sparkline: number[] }> = {
  "SOL-USDC": { delta: 3, sparkline: [84, 85, 86, 85, 87, 86, 87] },
  "SOL-USDT": { delta: -5, sparkline: [77, 76, 74, 73, 74, 73, 72] },
  "mSOL-SOL": { delta: 2, sparkline: [89, 89, 90, 90, 91, 90, 91] },
  "RAY-USDC": { delta: -8, sparkline: [53, 51, 49, 48, 47, 46, 45] },
  "JitoSOL-SOL": { delta: 1, sparkline: [87, 87, 88, 87, 88, 88, 88] },
  "BONK-SOL": { delta: -12, sparkline: [43, 40, 38, 35, 34, 32, 31] },
  "JUP-USDC": { delta: 4, sparkline: [72, 73, 74, 74, 75, 75, 76] },
  "DRIFT-USDC": { delta: -2, sparkline: [84, 83, 83, 83, 82, 82, 82] },
};

const HTL_SPARKLINE = [88.1, 89.4, 89.9, 90.2, 90.8, 91.0, 91.2];
const FPR_SPARKLINE = [11.2, 10.5, 9.8, 9.4, 8.9, 8.5, 8.1];
const BRIER_SPARKLINE = [0.11, 0.105, 0.098, 0.094, 0.091, 0.089, 0.087];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreStrokeColor(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 50) return "#fbbf24";
  return "#f43f5e";
}

function riskLabelColor(level: string): string {
  switch (level) {
    case "Low":
      return "text-emerald-400";
    case "Medium":
      return "text-amber-400";
    case "High":
      return "text-rose-400";
    case "Critical":
      return "text-rose-500";
    default:
      return "text-gray-400";
  }
}

function severityConfig(severity: string) {
  switch (severity) {
    case "critical":
      return { dot: "bg-rose-500 animate-pulse", text: "text-rose-400", label: "CRITICAL", badge: "bg-rose-500/15 text-rose-400 border-rose-500/30" };
    case "warning":
      return { dot: "bg-amber-400", text: "text-amber-400", label: "WARNING", badge: "bg-amber-400/15 text-amber-400 border-amber-400/30" };
    default:
      return { dot: "bg-[#00D4FF]/80", text: "text-[#00D4FF]", label: "INFO", badge: "bg-[#00D4FF]/80/15 text-[#00D4FF] border-[#00D4FF]/80/30" };
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RiskScoreGauge({ score, riskLevel, size = 100 }: { score: number; riskLevel: string; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = scoreStrokeColor(score);
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold tabular-nums"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className={cn("text-[10px] font-medium inline-flex items-center", riskLabelColor(riskLevel))}>
          {riskLevel === "Low" ? "Low Risk" : riskLevel === "Medium" ? "Medium Risk" : riskLevel === "High" ? "High Risk" : "Critical Risk"}
          <InfoTooltip term={riskLevel === "Low" ? "Low Risk" : riskLevel === "Medium" ? "Medium Risk" : riskLevel === "High" ? "High Risk" : "Critical Risk"} />
        </span>
      </div>
    </div>
  );
}

function MiniSparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * usableW;
    const y = padding + usableH - ((v - min) / range) * usableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p}`).join(" ");
  const areaPath = `${linePath} L ${(padding + usableW).toFixed(1)},${height} L ${padding},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <defs>
        <linearGradient id={`sp-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sp-${color.replace("#", "")})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PoolCard({
  pool,
  index,
  isSelected,
  onToggleSelect,
  onExport,
  isWatched,
  onToggleWatchlist,
  currentTier,
}: {
  pool: PoolAssessment;
  index: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onExport: (pool: PoolAssessment) => void;
  isWatched: boolean;
  onToggleWatchlist: (poolName: string) => void;
  currentTier: PricingTier;
}) {
  const aprDelta = pool.headlineApr - pool.effectiveApr;
  const aprDeltaPct = pool.headlineApr > 0 ? ((aprDelta / pool.headlineApr) * 100).toFixed(0) : "0";
  const significantGap = parseFloat(aprDeltaPct) > 25;

  const isProOrAbove = currentTier === "pro" || currentTier === "institutional";
  const isInstitutional = currentTier === "institutional";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "relative bg-[#0F1420] border border-[#1A2235] rounded-xl p-5",
        "hover:border-[#243049] transition-colors duration-200",
        "flex flex-col items-center gap-4",
        isSelected && "border-[#00D4FF]/40 bg-[#00D4FF]/[0.04]",
        isWatched && isProOrAbove && "border-l-2 border-l-amber-400/50"
      )}
    >
      {/* Selection checkbox — institutional only */}
      {isInstitutional && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(pool.id);
          }}
          className="absolute top-3 left-3 z-10"
          aria-label={isSelected ? "Deselect pool" : "Select pool for comparison"}
        >
          <div
            className={cn(
              "w-4 h-4 rounded border flex items-center justify-center transition-all duration-200",
              isSelected
                ? "bg-[#00D4FF] border-[#00D4FF]"
                : "border-white/20 bg-white/[0.03] hover:border-white/40"
            )}
          >
            {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
          </div>
        </button>
      )}

      {/* Watchlist star toggle — pro+ only */}
      {isProOrAbove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(pool.pool);
          }}
          className={cn(
            "absolute top-3 z-10 transition-colors duration-200",
            isInstitutional ? "right-10" : "right-3"
          )}
          aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Star
            className={cn(
              "w-4 h-4",
              isWatched
                ? "text-amber-400 fill-amber-400"
                : "text-gray-600 hover:text-amber-400"
            )}
          />
        </button>
      )}

      {/* Export button — institutional only */}
      {isInstitutional && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExport(pool);
          }}
          className="absolute top-3 right-3 z-10 text-gray-600 hover:text-white transition-colors duration-200"
          aria-label="Export pool report"
        >
          <Download className="w-4 h-4" />
        </button>
      )}

      {/* Pool identity — always visible */}
      <div className="flex items-center gap-3 w-full">
        <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0", pool.dexColor)}>
          {pool.dexLetter}
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm">{pool.pool}</p>
          <p className="text-xs text-gray-500">{pool.dex}</p>
        </div>
      </div>

      {/* Risk score gauge — always visible */}
      <RiskScoreGauge score={pool.score} riskLevel={pool.riskLevel} />

      {/* Confidence percentage — pro+ only */}
      {isProOrAbove && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider inline-flex items-center">Confidence<InfoTooltip term="Confidence Level" /></span>
          <span className="text-xs font-semibold text-cyan-400 tabular-nums">
            {Math.min(pool.evidenceFamilies.filter((ef) => ef.active).length * 20, 100)}%
          </span>
        </div>
      )}

      {/* 7d trend (visible when watched) — pro+ only */}
      {isProOrAbove && isWatched && POOL_7D_TREND[pool.pool] && (
        <div className="flex items-center gap-2">
          <MiniSparkline
            data={POOL_7D_TREND[pool.pool].sparkline}
            color={POOL_7D_TREND[pool.pool].delta >= 0 ? "#34d399" : "#f43f5e"}
            width={48}
            height={18}
          />
          <span
            className={cn(
              "text-[10px] font-semibold tabular-nums",
              POOL_7D_TREND[pool.pool].delta >= 0 ? "text-emerald-400" : "text-rose-400"
            )}
          >
            7d: {POOL_7D_TREND[pool.pool].delta >= 0 ? "+" : ""}{POOL_7D_TREND[pool.pool].delta}
          </span>
        </div>
      )}

      {/* Evidence families — pro+ only */}
      {isProOrAbove && (
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 w-full">
          {pool.evidenceFamilies.map((ef) => (
            <div
              key={ef.name}
              className={cn(
                "flex items-center gap-1 text-[10px]",
                ef.active ? "text-cyan-400" : "text-gray-600"
              )}
            >
              {ef.active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              <span>{ef.name}</span>
              <InfoTooltip term={ef.name} className="ml-0" />
            </div>
          ))}
        </div>
      )}

      {/* Risk Drivers — pro+ only */}
      {isProOrAbove && RISK_DRIVERS[pool.pool] && (
        <div className="w-full border-t border-white/[0.06] pt-3 mt-1 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Risk Drivers</p>
          {RISK_DRIVERS[pool.pool].map((driver) => {
            const isGood = driver.value < 0;
            const isModerate = !isGood && Math.abs(driver.value) <= 10;
            const barColor = isGood
              ? "bg-emerald-400"
              : isModerate
                ? "bg-amber-400"
                : "bg-rose-400";
            const textColor = isGood
              ? "text-emerald-400"
              : isModerate
                ? "text-amber-400"
                : "text-rose-400";
            const barWidth = Math.min(Math.abs(driver.value) * 2, 60);

            return (
              <div key={driver.name} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400 flex-1 min-w-0">{driver.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-[60px] h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex items-center">
                    <div
                      className={cn("h-full rounded-full", barColor)}
                      style={{ width: `${barWidth}px` }}
                    />
                  </div>
                  <span className={cn("text-[10px] font-semibold tabular-nums w-8 text-right", textColor)}>
                    {driver.value > 0 ? "+" : ""}{driver.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Risk Narrative — pro+ only */}
      {isProOrAbove && (
        <div className="w-full border-t border-white/[0.06] pt-3 mt-1">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">AI Risk Narrative</p>
          <p className="text-xs text-gray-400 leading-relaxed italic">
            {pool.score >= 80
              ? `${pool.pool} shows a strong risk profile with ${pool.evidenceFamilies.filter(ef => ef.active).length}/5 evidence families active. Effective APR of ${pool.effectiveApr}% is well-supported by underlying fundamentals.`
              : pool.score >= 50
                ? `${pool.pool} presents moderate risk. APR gap of ${(pool.headlineApr - pool.effectiveApr).toFixed(1)}% between headline and effective yield warrants monitoring. ${pool.evidenceFamilies.filter(ef => !ef.active).length} evidence families inactive.`
                : `${pool.pool} carries elevated risk. Significant APR divergence (${pool.headlineApr}% headline vs ${pool.effectiveApr}% effective) suggests unsustainable yield structure. Exercise caution.`
            }
          </p>
        </div>
      )}

      {/* APR comparison — always visible */}
      <div className="w-full border-t border-white/[0.06] pt-3 mt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Headline: <span className="text-gray-400">{pool.headlineApr}%</span></span>
          <ArrowDownRight className={cn("h-3 w-3", significantGap ? "text-rose-400" : "text-gray-600")} />
          <span className="text-gray-500 inline-flex items-center">Effective<InfoTooltip term="Effective APR" />: <span className="text-white font-semibold ml-1">{pool.effectiveApr}%</span></span>
        </div>
        {significantGap && (
          <p className="text-[10px] text-rose-400 text-center mt-1 inline-flex items-center justify-center w-full">
            -{aprDeltaPct}% gap detected<InfoTooltip term="Yield Trap" />
          </p>
        )}
      </div>

      {/* Data source badges */}
      <div className="w-full flex items-center justify-between gap-2 px-1">
        <DataSourceBadge source="mainnet-readonly" />
        <DataSourceBadge source="axionblade" />
      </div>

      {/* Technical Details — pro+ shows proof hash, institutional shows all */}
      {isProOrAbove && POOL_TECHNICAL[pool.pool] && (
        <TechnicalDetails className="w-full">
          <div className="space-y-1">
            {isInstitutional && (
              <>
                <p className="inline-flex items-center gap-1">Assessment PDA<InfoTooltip term="Assessment PDA" />: {POOL_TECHNICAL[pool.pool].pda}</p>
                <p>Block: {POOL_TECHNICAL[pool.pool].block}</p>
                <p>TX: {POOL_TECHNICAL[pool.pool].tx}</p>
              </>
            )}
            <p className="inline-flex items-center gap-1">Proof hash<InfoTooltip term="Proof Hash" />: {POOL_TECHNICAL[pool.pool].proofHash}</p>
          </div>
        </TechnicalDetails>
      )}
    </motion.div>
  );
}

function AccuracyMetricCard({
  title,
  value,
  subtitle,
  sparklineData,
  sparklineColor,
  target,
  isGood,
  index,
}: {
  title: string;
  value: string;
  subtitle: string;
  sparklineData: number[];
  sparklineColor: string;
  target?: string;
  isGood: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
      className={cn(
        "bg-[#0F1420] border border-[#1A2235] rounded-xl p-5",
        "hover:border-[#243049] transition-colors duration-200",
        "flex flex-col gap-3"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-0.5 text-xs text-gray-500 uppercase tracking-wider font-medium">
          {title}
          {title === "Brier Score" && <InfoTooltip term="Brier Score" />}
          {title === "HTL Accuracy" && <InfoTooltip term="HTL" />}
        </span>
        <span className={cn("h-2 w-2 rounded-full", isGood ? "bg-emerald-400" : "bg-amber-400")} />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-white tabular-nums">{value}</span>
        <MiniSparkline data={sparklineData} color={sparklineColor} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{subtitle}</p>
        {target && <p className="text-[10px] text-gray-600">Target: {target}</p>}
      </div>
    </motion.div>
  );
}

function AlertRow({ alert, index }: { alert: AlertItem; index: number }) {
  const cfg = severityConfig(alert.severity);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl",
        "bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-200"
      )}
    >
      <span className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", cfg.dot)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", cfg.badge)}>
            {cfg.label}
          </span>
          <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-gray-400">
            {alert.pool}
          </span>
        </div>
        <p className="text-sm text-gray-300 mt-1.5 leading-relaxed">{alert.message}</p>
      </div>
      <span className="text-xs text-gray-600 shrink-0 mt-1">{alert.timestamp}</span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Stagger animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

function generateProofHash(): string {
  const hexChars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 40; i++) {
    hash += hexChars[Math.floor(Math.random() * 16)];
  }
  return hash;
}

function exportPoolReport(pool: PoolAssessment): string {
  const proofHash = generateProofHash();
  const report = {
    pool: pool.pool,
    protocol: pool.dex,
    riskScore: pool.score,
    riskLevel: pool.riskLevel,
    evidenceFamilies: pool.evidenceFamilies.map((ef) => ({
      name: ef.name,
      active: ef.active,
    })),
    riskDrivers: RISK_DRIVERS[pool.pool] || [],
    proofHash,
    timestamp: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `axionblade-report-${pool.pool.toLowerCase()}-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return proofHash;
}

function exportComparisonReport(pools: PoolAssessment[]): string {
  const proofHash = generateProofHash();
  const report = {
    comparison: pools.map((pool) => ({
      pool: pool.pool,
      protocol: pool.dex,
      riskScore: pool.score,
      riskLevel: pool.riskLevel,
      evidenceFamilies: pool.evidenceFamilies.map((ef) => ({
        name: ef.name,
        active: ef.active,
      })),
      riskDrivers: RISK_DRIVERS[pool.pool] || [],
    })),
    proofHash,
    timestamp: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `axionblade-comparison-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return proofHash;
}

// ---------------------------------------------------------------------------
// Risk Gauge (Half-circle dial)
// ---------------------------------------------------------------------------

function RiskGauge({ score }: { score: number }) {
  const radius = 70;
  const circumference = Math.PI * radius; // half circle
  const progress = score / 100;
  const color = score >= 81 ? "#10B981" : score >= 61 ? "#F59E0B" : score >= 41 ? "#F97316" : "#EF4444";

  return (
    <div className="relative flex items-center justify-center">
      <svg width={180} height={100} viewBox="0 0 180 100">
        {/* Background arc */}
        <path
          d="M 10 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d="M 10 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-xs text-gray-500 block">/100</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApolloPage() {
  const [poolAddress, setPoolAddress] = useState("");
  const [protocol, setProtocol] = useState("Raydium");
  const [showToast, setShowToast] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier>("basic");
  const [proofResult, setProofResult] = useState<{ hash: string; tier: PricingTier } | null>(null);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  // Tier-based access control — wired to useTierStore
  const { apolloTier: currentTier, isTierActive, incrementFreeAssessments, freeAssessmentsUsed } = useTierStore();
  const tierActive = isTierActive("apollo");
  const effectiveTier: PricingTier = tierActive ? currentTier : "free";
  const { connected } = useWallet();
  const [freeLimitMessage, setFreeLimitMessage] = useState<string | null>(null);

  // Compare pools state
  const [selectedPools, setSelectedPools] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);

  // Export flash message
  const [exportFlash, setExportFlash] = useState<string | null>(null);

  const toggleWatchlist = useCallback((poolName: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(poolName)) {
        next.delete(poolName);
      } else {
        next.add(poolName);
      }
      return next;
    });
  }, []);

  const togglePoolSelection = useCallback((poolId: string) => {
    setSelectedPools((prev) => {
      const next = new Set(prev);
      if (next.has(poolId)) {
        next.delete(poolId);
      } else {
        next.add(poolId);
      }
      return next;
    });
  }, []);

  const handleExportPool = useCallback((pool: PoolAssessment) => {
    const hash = exportPoolReport(pool);
    setExportFlash(hash);
  }, []);

  const handleCompareClick = useCallback(() => {
    setShowComparison(true);
    setTimeout(() => {
      comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const handleExportComparison = useCallback(() => {
    const pools = POOLS.filter((p) => selectedPools.has(p.id));
    const hash = exportComparisonReport(pools);
    setExportFlash(hash);
  }, [selectedPools]);

  // Auto-dismiss export flash after 2 seconds
  useEffect(() => {
    if (exportFlash) {
      const timer = setTimeout(() => setExportFlash(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [exportFlash]);

  // Auto-dismiss proof result after 5 seconds
  useEffect(() => {
    if (proofResult) {
      const timer = setTimeout(() => setProofResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [proofResult]);

  // Auto-dismiss free limit message
  useEffect(() => {
    if (freeLimitMessage) {
      const timer = setTimeout(() => setFreeLimitMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [freeLimitMessage]);

  const handleSubmit = useCallback(() => {
    if (!poolAddress.trim()) return;

    // Free tier limit check
    if (selectedTier === "free" && freeAssessmentsUsed >= 1) {
      setFreeLimitMessage("Free assessment used today. Select a tier to continue.");
      return;
    }

    // Before setting tier, require wallet connection and payment for paid tiers
    if (selectedTier !== "free") {
      if (!connected) {
        alert("Connect wallet to purchase assessment");
        return;
      }
      // Payment would be handled by the upgrade modal
      // Don't set tier directly - it should come from verified payment
    }

    console.log("Assessment submitted", { poolAddress, protocol, tier: selectedTier });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);

    // For free tier, increment counter via store
    if (selectedTier === "free") {
      incrementFreeAssessments();
    }

    // Clear any limit message
    setFreeLimitMessage(null);

    // Generate mock proof hash
    const hexChars = "0123456789abcdef";
    let hash = "0x";
    for (let i = 0; i < 40; i++) {
      hash += hexChars[Math.floor(Math.random() * 16)];
    }
    setProofResult({ hash, tier: selectedTier });
  }, [poolAddress, protocol, selectedTier, freeAssessmentsUsed, connected, incrementFreeAssessments]);

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/* Hero Section                                                       */}
      {/* ================================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-[#0F1420] border border-[#1A2235] rounded-xl p-8 overflow-hidden"
      >
        {/* Gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00D4FF]/80 via-cyan-500 to-emerald-500" />

        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00D4FF]/15 border border-[#00D4FF]/20">
            <Eye className="h-8 w-8 text-[#00D4FF]" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">APOLLO</h1>
            <p className="text-lg text-gray-400 mt-1">Risk Assessment Engine</p>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl leading-relaxed italic">
            &ldquo;APOLLO is the DeFi Risk Evaluator — never executes, weight capped at 40% in the risk engine. It operates 3 modules: Pool Taxonomy, MLI (Mercenary Liquidity Index), and Effective APR. Outputs flow to assessment_pda → Risk Engine (≤40%) → AEON, never directly to executors.&rdquo;
          </p>
        </div>

        {/* How it works — 3 steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: "01",
              description: "Submit a pool or protocol address",
              Icon: Search,
              color: "text-[#00D4FF]",
              bgColor: "bg-[#00D4FF]/15",
              borderColor: "border-[#00D4FF]/30",
              numColor: "bg-[#00D4FF]",
            },
            {
              step: "02",
              description: "APOLLO runs 3 modules: Pool Taxonomy (classifies pool type), MLI (Mercenary Liquidity Index), and Effective APR. Enforces axioms A0-4, A0-15, A0-16, A0-30.",
              Icon: BarChart3,
              color: "text-cyan-400",
              bgColor: "bg-cyan-500/15",
              borderColor: "border-cyan-500/30",
              numColor: "bg-cyan-500",
            },
            {
              step: "03",
              description: "Output is written to assessment_pda. Risk Engine reads it at ≤40% weight. AEON decides — executors never read APOLLO's PDAs directly.",
              Icon: Shield,
              color: "text-emerald-400",
              bgColor: "bg-emerald-500/15",
              borderColor: "border-emerald-500/30",
              numColor: "bg-emerald-500",
            },
          ].map((s) => (
            <div
              key={s.step}
              className={cn(
                "bg-[#0F1420] border border-[#1A2235] rounded-xl p-5",
                "hover:border-[#243049] transition-colors duration-200",
                "flex flex-col items-center text-center gap-3"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white", s.numColor)}>
                  {s.step}
                </span>
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.bgColor)}>
                  <s.Icon className={cn("h-5 w-5", s.color)} />
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ================================================================== */}
      {/* Header Section                                                     */}
      {/* ================================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00D4FF]/15 border border-[#00D4FF]/20 shrink-0">
            <Eye className="h-7 w-7 text-[#00D4FF]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white inline-flex items-center">APOLLO<InfoTooltip term="APOLLO" /></h1>
              <span className="text-lg text-gray-500 font-medium">Risk Evaluator</span>
            </div>
            <p className="text-sm text-gray-400 mt-1 max-w-xl">
              DeFi Risk Evaluator — never executes, weight capped at 40% in risk engine
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/30 px-3 py-1.5 text-xs font-medium">
            <Shield className="h-3.5 w-3.5" />
            Max Weight: 40%
          </span>
        </div>
      </motion.div>

      {/* ================================================================== */}
      {/* Analyze New Pool                                                   */}
      {/* ================================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Plus className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">New Assessment</span>
        </div>
        <div
          className="relative bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 overflow-hidden"
        >
          {/* Gradient top border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00D4FF]/80 to-cyan-500" />

          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Pool Address Input */}
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                Pool Address
              </label>
              <input
                type="text"
                value={poolAddress}
                onChange={(e) => setPoolAddress(e.target.value)}
                placeholder='Enter Solana pool address (e.g., 7Xk...)'
                className="bg-[#0F1420] border border-[#1A2235] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-all w-full"
              />
            </div>

            {/* Protocol Dropdown */}
            <div className="w-full md:w-48 shrink-0">
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                Protocol
              </label>
              <div className="relative">
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="appearance-none bg-[#0F1420] border border-[#1A2235] rounded-xl px-4 py-3 text-sm text-white focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-all w-full pr-10"
                >
                  <option value="Raydium">Raydium</option>
                  <option value="Orca">Orca</option>
                  <option value="Meteora">Meteora</option>
                  <option value="Jupiter">Jupiter</option>
                  <option value="Lifinity">Lifinity</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Pay-Per-Proof Pricing Tier Selector */}
          <div className="mt-4">
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
              Assessment Tier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRICING_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id)}
                  className={cn(
                    "bg-white/[0.02] border rounded-xl p-4 cursor-pointer transition-all duration-200 text-left",
                    selectedTier === tier.id
                      ? "border-[#00D4FF]/50 bg-[#00D4FF]/10 shadow-[0_0_15px_rgba(0,212,255,0.08)]"
                      : "border-white/[0.08] hover:border-white/15"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-white">{tier.name}</p>
                    {tier.launchPrice && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium ml-2">
                        Launch Price
                      </span>
                    )}
                    {tier.aiAdjusted && (
                      <InfoTooltip term="AI-Adjusted Pricing" definition="Price ranges from 3-8 SOL based on pool complexity, TVL, network load, and data availability." />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className={cn("text-lg font-bold", tier.priceColor)}>{tier.price}</p>
                    {tier.aiAdjusted && (
                      <span className="text-[10px] text-gray-500 font-medium">(AI-adjusted)</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{tier.description}</p>
                  {tier.afterLaunch && (
                    <p className="text-[10px] text-gray-600 mt-0.5">{tier.afterLaunch}</p>
                  )}

                  {/* Feature list */}
                  <ul className="mt-2 space-y-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5 text-[10px] text-gray-400">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Note */}
                  {tier.note && (
                    <p className="text-[10px] text-gray-600 italic mt-2 border-t border-white/[0.04] pt-2">
                      {tier.note}
                    </p>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-600 mt-3 text-center">
              Pricing is AI-adjusted to ensure protocol sustainability. Revenue split: 40% Operations | 30% Treasury | 15% Dev Fund | 15% Creator.
            </p>
          </div>

          {/* Free tier limit message */}
          <AnimatePresence>
            {freeLimitMessage && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-400/15 text-amber-400 border border-amber-400/30 px-4 py-2 text-xs font-medium"
              >
                <Bell className="h-3.5 w-3.5" />
                {freeLimitMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <p className="text-xs text-gray-400 italic">
              This action mints a verifiable proof on Solana.
            </p>
            {/* CTA Button */}
            <button
              onClick={handleSubmit}
              disabled={!poolAddress.trim()}
              className={cn(
                "bg-gradient-to-r from-[#00D4FF] to-cyan-600 text-white font-medium px-6 py-3 rounded-xl hover:from-[#00D4FF]/80 hover:to-cyan-500 transition-all duration-300 flex items-center gap-2 shrink-0",
                !poolAddress.trim() && "opacity-50 cursor-not-allowed"
              )}
            >
              Run Risk Assessment
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Submit any Solana pool address for real-time evaluation.
          </p>
        </div>

        {/* Toast notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-4 py-2 text-xs font-medium"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Assessment submitted
            </motion.div>
          )}
        </AnimatePresence>

        {/* Proof Minted Overlay */}
        <AnimatePresence>
          {proofResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mt-3 bg-[#0F1420] border border-emerald-500/30 rounded-xl p-5 overflow-hidden relative"
            >
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-emerald-500/5 animate-pulse pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row sm:items-start gap-4">
                <motion.div
                  className="h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1, type: "spring", stiffness: 200 }}
                  style={{ boxShadow: "0 0 20px rgba(52, 211, 153, 0.2), 0 0 40px rgba(52, 211, 153, 0.1)" }}
                >
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <motion.p
                    className="text-sm font-bold text-emerald-400"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    Proof Minted
                  </motion.p>
                  <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                    {proofResult.hash}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Tier: <span className="text-white font-semibold">{proofResult.tier.toUpperCase()}</span>
                  </p>

                  {/* Tier features included */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {TIER_FEATURE_SUMMARY[proofResult.tier].map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 text-[10px] text-gray-400"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={`https://solscan.io/tx/${proofResult.hash}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors shrink-0"
                >
                  View on Solscan
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ================================================================== */}
      {/* Section 1: Active Modules                                          */}
      {/* ================================================================== */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {[
          {
            name: "Pool Taxonomy",
            description: "Classifying pool types and risk profiles",
            Icon: Layers,
            borderColor: "border-l-purple-500",
            iconColor: "text-purple-400",
            bgIcon: "bg-purple-500/10",
          },
          {
            name: "MLI Scoring",
            description: "Mercenary Liquidity Index — detects unsustainable incentive-driven liquidity across 23 pools",
            Icon: BarChart3,
            borderColor: "border-l-cyan-400",
            iconColor: "text-cyan-400",
            bgIcon: "bg-cyan-400/10",
          },
          {
            name: "Effective APR",
            description: "Computing real yields vs headline APR",
            Icon: TrendingUp,
            borderColor: "border-l-emerald-400",
            iconColor: "text-emerald-400",
            bgIcon: "bg-emerald-400/10",
          },
        ].map((mod) => (
          <motion.div
            key={mod.name}
            variants={itemVariants}
            className={cn(
              "bg-[#0F1420] border border-[#1A2235] rounded-xl p-5",
              "border-l-[3px]",
              mod.borderColor,
              "hover:border-[#243049] transition-colors duration-200"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", mod.bgIcon)}>
                <mod.Icon className={cn("h-5 w-5", mod.iconColor)} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-sm">{mod.name}</h3>
                  {mod.name === "MLI Scoring" && <InfoTooltip term="MLI" />}
                  {mod.name === "Effective APR" && <InfoTooltip term="Effective APR" />}
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Running
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{mod.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ================================================================== */}
      {/* Section 2: Pool Risk Assessment Cards                              */}
      {/* ================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-[#00D4FF]" />
            <h2 className="text-lg font-bold text-white">Pool Risk Assessments</h2>
          </div>
          <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            {POOLS.length} monitored pools
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {POOLS.map((pool, i) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              index={i}
              isSelected={selectedPools.has(pool.id)}
              onToggleSelect={togglePoolSelection}
              onExport={handleExportPool}
              isWatched={watchlist.has(pool.pool)}
              onToggleWatchlist={toggleWatchlist}
              currentTier={effectiveTier}
            />
          ))}
        </div>

        {/* Evidence Family Breakdown Chart */}
        <div className="mt-6 bg-[#0F1420] border border-[#1A2235] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Risk Score by Evidence Family</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: "Price/Vol", score: 82, fill: "#00D4FF" },
              { name: "Liquidity", score: 74, fill: "#10B981" },
              { name: "Behavior", score: 68, fill: "#F59E0B" },
              { name: "Incentive", score: 71, fill: "#8B5CF6" },
              { name: "Protocol", score: 88, fill: "#EC4899" },
            ]} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 60 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                {[
                  <Cell key="0" fill="#00D4FF" />,
                  <Cell key="1" fill="#10B981" />,
                  <Cell key="2" fill="#F59E0B" />,
                  <Cell key="3" fill="#8B5CF6" />,
                  <Cell key="4" fill="#EC4899" />,
                ]}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Overall Risk Gauge */}
        <div className="mt-6 bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-white mb-4">Overall Risk Score</h3>
          <RiskGauge score={76} />
        </div>

        {/* Pool Comparison Table */}
        <div className="mt-6 bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 overflow-x-auto">
          <h3 className="text-sm font-semibold text-white mb-4">Pool Comparison</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2 text-gray-500 font-medium">Pool</th>
                <th className="text-right py-2 text-gray-500 font-medium">Score</th>
                <th className="text-right py-2 text-gray-500 font-medium">Headline APR</th>
                <th className="text-right py-2 text-gray-500 font-medium">Effective APR</th>
                <th className="text-right py-2 text-gray-500 font-medium">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {POOLS.map((pool) => (
                <tr key={pool.id} className="border-b border-white/[0.03]">
                  <td className="py-2.5 text-gray-300 font-medium">{pool.pool}</td>
                  <td className="py-2.5 text-right text-white font-mono">{pool.score}</td>
                  <td className="py-2.5 text-right text-gray-400">{pool.headlineApr}%</td>
                  <td className="py-2.5 text-right text-gray-400">{pool.effectiveApr}%</td>
                  <td className={`py-2.5 text-right font-medium ${pool.score >= 81 ? "text-green-400" : pool.score >= 61 ? "text-yellow-400" : pool.score >= 41 ? "text-orange-400" : "text-red-400"}`}>
                    {pool.score >= 81 ? "Low" : pool.score >= 61 ? "Medium" : pool.score >= 41 ? "High" : "Critical"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Comparison View — institutional only */}
        <AnimatePresence>
          {effectiveTier === "institutional" && showComparison && selectedPools.size >= 2 && (
            <motion.div
              ref={comparisonRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="mt-6 bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 relative"
            >
              {/* Close button */}
              <button
                onClick={() => setShowComparison(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors duration-200"
                aria-label="Close comparison"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-sm">Pool Comparison</h3>
                <button
                  onClick={handleExportComparison}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-white bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-1.5 transition-colors duration-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Comparison
                </button>
              </div>

              <div className="flex gap-0 overflow-x-auto pb-2">
                {POOLS.filter((p) => selectedPools.has(p.id)).map((pool, idx) => {
                  const drivers = RISK_DRIVERS[pool.pool] || [];
                  const topDrivers = [...drivers]
                    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
                    .slice(0, 2);
                  const activeCount = pool.evidenceFamilies.filter((ef) => ef.active).length;

                  return (
                    <div
                      key={pool.id}
                      className={cn(
                        "flex-shrink-0 w-56 px-5 py-4",
                        idx > 0 && "border-l border-white/[0.06]"
                      )}
                    >
                      <p className="text-white font-bold text-sm">{pool.pool}</p>
                      <p className="text-xs text-gray-500 mb-3">{pool.dex}</p>

                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-2xl font-bold tabular-nums"
                          style={{ color: scoreStrokeColor(pool.score) }}
                        >
                          {pool.score}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 border",
                            pool.riskLevel === "Low" && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                            pool.riskLevel === "Medium" && "bg-amber-400/15 text-amber-400 border-amber-400/30",
                            pool.riskLevel === "High" && "bg-rose-400/15 text-rose-400 border-rose-400/30",
                            pool.riskLevel === "Critical" && "bg-rose-500/15 text-rose-500 border-rose-500/30"
                          )}
                        >
                          {pool.riskLevel}
                        </span>
                      </div>

                      <p className="text-[10px] text-gray-500 mb-2">
                        {activeCount}/{pool.evidenceFamilies.length} evidence families
                      </p>

                      {topDrivers.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Top Drivers</p>
                          {topDrivers.map((driver) => {
                            const isGood = driver.value < 0;
                            return (
                              <div key={driver.name} className="flex items-center justify-between text-[10px]">
                                <span className="text-gray-400 truncate mr-2">{driver.name}</span>
                                <span
                                  className={cn(
                                    "font-semibold tabular-nums shrink-0",
                                    isGood ? "text-emerald-400" : "text-rose-400"
                                  )}
                                >
                                  {driver.value > 0 ? "+" : ""}
                                  {driver.value}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ================================================================== */}
      {/* Section 3: Accuracy Metrics                                        */}
      {/* ================================================================== */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Accuracy Metrics</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AccuracyMetricCard
            title="HTL Accuracy"
            value="91.2%"
            subtitle="Rolling 30-day hit-to-loss ratio"
            sparklineData={HTL_SPARKLINE}
            sparklineColor="#34d399"
            isGood={true}
            index={0}
          />
          <AccuracyMetricCard
            title="False Positive Rate"
            value="8.1%"
            subtitle="Downtrend from 11.2%"
            sparklineData={FPR_SPARKLINE}
            sparklineColor="#34d399"
            target="<10%"
            isGood={true}
            index={1}
          />
          <AccuracyMetricCard
            title="Brier Score"
            value="0.087"
            subtitle="Lower is better (0 = perfect)"
            sparklineData={BRIER_SPARKLINE}
            sparklineColor="#34d399"
            isGood={true}
            index={2}
          />
        </div>
      </div>

      {/* ================================================================== */}
      {/* Section 4: Alert Feed                                              */}
      {/* ================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white">Alert Feed</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-1 text-xs font-medium">
            {ALERTS.filter((a) => a.severity === "critical").length} critical
          </span>
        </div>
        <div
          className={cn(
            "bg-[#0F1420] border border-[#1A2235] rounded-xl",
            "overflow-hidden"
          )}
        >
          <div className="max-h-[300px] overflow-y-auto divide-y divide-white/[0.04] p-2">
            {ALERTS.map((alert, i) => (
              <AlertRow key={alert.id} alert={alert} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Floating Compare Bar — institutional only                          */}
      {/* ================================================================== */}
      <AnimatePresence>
        {effectiveTier === "institutional" && selectedPools.size >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed bottom-6 left-1/2 z-40 bg-[#0F1420] border border-[#1A2235] rounded-xl px-6 py-3 shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                <span className="text-white font-bold">{selectedPools.size}</span> pools selected
              </span>
              <button
                onClick={handleCompareClick}
                className="bg-gradient-to-r from-[#00D4FF] to-cyan-600 text-white font-medium text-sm px-4 py-2 rounded-xl hover:from-[#00D4FF]/80 hover:to-cyan-500 transition-all duration-300"
              >
                Compare
              </button>
              <button
                onClick={() => {
                  setSelectedPools(new Set());
                  setShowComparison(false);
                }}
                className="text-sm text-gray-500 hover:text-white transition-colors duration-200"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* Disclaimers                                                         */}
      {/* ================================================================== */}
      <div className="border-t border-white/[0.04] pt-6 mt-8 space-y-2">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Risk scores are informational only and do not constitute financial advice. AXIONBLADE does not recommend, endorse, or advise on any DeFi position.
          AI-adjusted pricing may vary based on pool complexity and network conditions — check current price before confirming any transaction.
        </p>
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Devnet Beta — assessment data uses simulated sources and may differ from mainnet conditions. Past accuracy metrics do not guarantee future performance.
        </p>
      </div>

      {/* ================================================================== */}
      {/* Export Proof Hash Flash                                             */}
      {/* ================================================================== */}
      <AnimatePresence>
        {exportFlash && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl px-5 py-2.5 text-xs font-medium shadow-xl"
          >
            Report exported with proof hash: {exportFlash}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
