"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Radio,
  FileSearch,
  AlertOctagon,
  GitCompareArrows,
  TrendingUp,
  HeartPulse,
  Clipboard,
  Check,
  FileText,
  Key,
  Fingerprint,
  Download,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { InfoTooltip } from "@/components/atoms/Tooltip";
import { useTierStore } from "@/stores/useTierStore";
import { useWallet } from "@solana/wallet-adapter-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportType =
  | "RiskDecomposition"
  | "YieldTrap"
  | "PoolComparison"
  | "EffectiveAPR"
  | "ProtocolHealth";

type HermesTier = "free" | "pro" | "protocol";

interface IntelligenceReport {
  id: string;
  type: ReportType;
  subjectPool: string;
  protocol: string;
  protocolLetter: string;
  protocolColor: string;
  confidence: number;
  contentHash: string;
  timestamp: string;
  summary: string;
}

interface FilterOption {
  label: string;
  value: ReportType | "All";
  color: string;
  activeColor: string;
}

interface ComparisonPoolData {
  pool: string;
  protocol: string;
  score: number;
  apr: string;
  tvl: string;
  riskLevel: string;
  evidenceFamilies: number;
}

// ---------------------------------------------------------------------------
// Constants — Free tier allowlist
// ---------------------------------------------------------------------------

const FREE_REPORT_TYPES: ReportType[] = ["PoolComparison"];
const FREE_REPORT_LIMIT = 2;

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const REPORTS: IntelligenceReport[] = [
  {
    id: "RPT-001",
    type: "RiskDecomposition",
    subjectPool: "SOL-USDC",
    protocol: "Raydium",
    protocolLetter: "R",
    protocolColor: "bg-purple-500",
    confidence: 94,
    contentHash: "0x7a3f8b2c1e4d9a06",
    timestamp: "5m ago",
    summary: "Risk distributed across liquidity depth (38%) and impermanent loss exposure (27%). Protocol risk minimal.",
  },
  {
    id: "RPT-002",
    type: "YieldTrap",
    subjectPool: "BONK-SOL",
    protocol: "Orca",
    protocolLetter: "O",
    protocolColor: "bg-cyan-400",
    confidence: 89,
    contentHash: "0x9c1d4e7f2a5b8301",
    timestamp: "12m ago",
    summary: "Headline APR of 145% driven by unsustainable emission schedule. Effective yield collapses to 12.3% within 14 days.",
  },
  {
    id: "RPT-003",
    type: "EffectiveAPR",
    subjectPool: "mSOL-SOL",
    protocol: "Marinade",
    protocolLetter: "M",
    protocolColor: "bg-emerald-400",
    confidence: 97,
    contentHash: "0x2b5e8a1f3c6d9704",
    timestamp: "28m ago",
    summary: "Effective APR of 7.6% closely tracks headline 8.1%. Minimal IL risk due to correlated pair. Stable yield profile.",
  },
  {
    id: "RPT-004",
    type: "PoolComparison",
    subjectPool: "SOL-USDC vs SOL-USDT",
    protocol: "Multi",
    protocolLetter: "M",
    protocolColor: "bg-gray-500",
    confidence: 92,
    contentHash: "0x4d7f0a3c6e9b1258",
    timestamp: "45m ago",
    summary: "SOL-USDC outperforms on risk-adjusted basis. SOL-USDT shows 43% APR divergence vs 25% for SOL-USDC.",
  },
  {
    id: "RPT-005",
    type: "ProtocolHealth",
    subjectPool: "RAY-USDC",
    protocol: "Raydium",
    protocolLetter: "R",
    protocolColor: "bg-purple-500",
    confidence: 78,
    contentHash: "0x6e9b1c4f7a2d5803",
    timestamp: "1h ago",
    summary: "Liquidity concentration spike detected. Top 3 LPs control 67% of pool depth. Elevated withdrawal risk.",
  },
  {
    id: "RPT-006",
    type: "RiskDecomposition",
    subjectPool: "JitoSOL-SOL",
    protocol: "Jito",
    protocolLetter: "J",
    protocolColor: "bg-amber-400",
    confidence: 91,
    contentHash: "0x8a2d5f0c3e6b9714",
    timestamp: "1.5h ago",
    summary: "Low risk profile. Staking derivative pair shows strong peg stability. MEV rewards add sustainable yield component.",
  },
  {
    id: "RPT-007",
    type: "YieldTrap",
    subjectPool: "RAY-USDC",
    protocol: "Raydium",
    protocolLetter: "R",
    protocolColor: "bg-purple-500",
    confidence: 85,
    contentHash: "0x0c3e6b9f2a5d8171",
    timestamp: "2h ago",
    summary: "89.4% headline APR includes temporary incentive boost expiring in 8 days. Post-boost effective APR estimated at 14.7%.",
  },
  {
    id: "RPT-008",
    type: "EffectiveAPR",
    subjectPool: "JUP-USDC",
    protocol: "Jupiter",
    protocolLetter: "J",
    protocolColor: "bg-sky-400",
    confidence: 88,
    contentHash: "0x3e6b9f2c5a8d0174",
    timestamp: "2.5h ago",
    summary: "Effective APR 28.7% vs headline 42.1%. Gap primarily from IL in trending market conditions. Fee revenue stable.",
  },
  {
    id: "RPT-009",
    type: "PoolComparison",
    subjectPool: "mSOL-SOL vs JitoSOL-SOL",
    protocol: "Multi",
    protocolLetter: "M",
    protocolColor: "bg-gray-500",
    confidence: 93,
    contentHash: "0x6b9f2c5e8a1d0374",
    timestamp: "3h ago",
    summary: "Both LST pairs show low-risk profiles. JitoSOL marginally higher yield from MEV. Marinade has deeper liquidity.",
  },
  {
    id: "RPT-010",
    type: "ProtocolHealth",
    subjectPool: "DRIFT-USDC",
    protocol: "Drift",
    protocolLetter: "D",
    protocolColor: "bg-violet-400",
    confidence: 82,
    contentHash: "0x9f2c5e8b1a4d0637",
    timestamp: "3.5h ago",
    summary: "Protocol TVL stable at $180M. Insurance fund ratio at 4.2%. Open interest growth healthy but monitoring leverage ratios.",
  },
  {
    id: "RPT-011",
    type: "RiskDecomposition",
    subjectPool: "SOL-USDT",
    protocol: "Orca",
    protocolLetter: "O",
    protocolColor: "bg-cyan-400",
    confidence: 86,
    contentHash: "0x2c5e8b1f4a7d0963",
    timestamp: "4h ago",
    summary: "Medium risk. Primary factors: USDT depeg correlation risk (15%), concentrated liquidity bands (23%), volume volatility (18%).",
  },
  {
    id: "RPT-012",
    type: "EffectiveAPR",
    subjectPool: "DRIFT-USDC",
    protocol: "Drift",
    protocolLetter: "D",
    protocolColor: "bg-violet-400",
    confidence: 72,
    contentHash: "0x5e8b1f4c7a0d2396",
    timestamp: "5h ago",
    summary: "Effective APR 15.8% vs headline 19.3%. Funding rate component volatile. Recommend monitoring during high OI periods.",
  },
];

const ALL_FILTER_OPTIONS: FilterOption[] = [
  { label: "All", value: "All", color: "bg-white/10 text-white border-white/20", activeColor: "bg-white text-gray-900" },
  { label: "RiskDecomposition", value: "RiskDecomposition", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", activeColor: "bg-emerald-500 text-white" },
  { label: "YieldTrap", value: "YieldTrap", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", activeColor: "bg-rose-500 text-white" },
  { label: "PoolComparison", value: "PoolComparison", color: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20", activeColor: "bg-cyan-400 text-gray-900" },
  { label: "EffectiveAPR", value: "EffectiveAPR", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", activeColor: "bg-purple-500 text-white" },
  { label: "ProtocolHealth", value: "ProtocolHealth", color: "bg-amber-400/10 text-amber-400 border-amber-400/20", activeColor: "bg-amber-400 text-gray-900" },
];

const COMPARISON_POOLS: ComparisonPoolData[] = [
  { pool: "SOL-USDC", protocol: "Raydium", score: 87, apr: "18.2%", tvl: "$42.8M", riskLevel: "Low", evidenceFamilies: 5 },
  { pool: "SOL-USDT", protocol: "Orca", score: 72, apr: "17.9%", tvl: "$28.4M", riskLevel: "Medium", evidenceFamilies: 4 },
  { pool: "mSOL-SOL", protocol: "Marinade", score: 91, apr: "7.6%", tvl: "$67.2M", riskLevel: "Low", evidenceFamilies: 5 },
];

const SERVICE_STATUS = [
  { name: "Pool Comparison", Icon: GitCompareArrows, active: true, freeVisible: true },
  { name: "Effective APR Calculator", Icon: TrendingUp, active: true, freeVisible: false },
  { name: "Risk Decomposition Vector", Icon: FileSearch, active: true, freeVisible: false },
  { name: "Yield Trap Intelligence", Icon: AlertOctagon, active: true, freeVisible: false },
  { name: "Protocol Health Snapshot", Icon: HeartPulse, active: true, freeVisible: false },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function reportTypeColor(type: ReportType): string {
  switch (type) {
    case "RiskDecomposition":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "YieldTrap":
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    case "PoolComparison":
      return "bg-cyan-400/15 text-cyan-400 border-cyan-400/30";
    case "EffectiveAPR":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "ProtocolHealth":
      return "bg-amber-400/15 text-amber-400 border-amber-400/30";
  }
}

function reportTypeBorderGlow(type: ReportType): string {
  switch (type) {
    case "RiskDecomposition":
      return "hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(52,211,153,0.08)]";
    case "YieldTrap":
      return "hover:border-rose-500/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.08)]";
    case "PoolComparison":
      return "hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(34,211,238,0.08)]";
    case "EffectiveAPR":
      return "hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.08)]";
    case "ProtocolHealth":
      return "hover:border-amber-400/40 hover:shadow-[0_0_15px_rgba(251,191,36,0.08)]";
  }
}

function confidenceBarColor(c: number): string {
  if (c >= 85) return "bg-emerald-400";
  if (c >= 70) return "bg-amber-400";
  return "bg-rose-400";
}

function semanticBadge(report: IntelligenceReport): { label: string; classes: string } {
  switch (report.type) {
    case "RiskDecomposition":
      return { label: "Insight", classes: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" };
    case "YieldTrap":
      return { label: "Risk Alert", classes: "bg-rose-500/20 text-rose-400 border border-rose-500/30" };
    case "PoolComparison":
      return { label: "Comparison", classes: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" };
    case "EffectiveAPR":
      return { label: "Insight", classes: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" };
    case "ProtocolHealth":
      return report.confidence < 85
        ? { label: "Warning", classes: "bg-amber-500/20 text-amber-400 border border-amber-500/30" }
        : { label: "Insight", classes: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" };
  }
}

function scoreStrokeColor(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 50) return "#fbbf24";
  return "#f43f5e";
}

/** Get the visible reports based on tier, applying invisible access control. */
function getVisibleReports(allReports: IntelligenceReport[], tier: HermesTier): IntelligenceReport[] {
  if (tier === "free") {
    return allReports
      .filter((r) => FREE_REPORT_TYPES.includes(r.type))
      .slice(0, FREE_REPORT_LIMIT);
  }
  return allReports;
}

/** Get visible filter options based on tier. */
function getVisibleFilters(tier: HermesTier): FilterOption[] {
  if (tier === "free") {
    return ALL_FILTER_OPTIONS.filter(
      (opt) => opt.value === "All" || FREE_REPORT_TYPES.includes(opt.value as ReportType)
    );
  }
  return ALL_FILTER_OPTIONS;
}

/** Get visible service status cards based on tier. */
function getVisibleServices(tier: HermesTier) {
  if (tier === "free") {
    return SERVICE_STATUS.filter((svc) => svc.freeVisible);
  }
  return SERVICE_STATUS;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
      aria-label={copied ? "Copied" : "Copy hash"}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Clipboard className="h-3.5 w-3.5" />}
    </button>
  );
}

function ComparisonGauge({ score, size = 90 }: { score: number; size?: number }) {
  const strokeWidth = 7;
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
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-xl font-bold tabular-nums"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {score}
        </motion.span>
      </div>
    </div>
  );
}

function ReportCard({
  report,
  index,
  showDownload,
}: {
  report: IntelligenceReport;
  index: number;
  showDownload: boolean;
}) {
  const handleDownload = useCallback(() => {
    const data = {
      id: report.id,
      type: report.type,
      pool: report.subjectPool,
      protocol: report.protocol,
      confidence: report.confidence,
      contentHash: report.contentHash,
      summary: report.summary,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hermes-${report.id.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [report]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "bg-[#0F1420] border border-[#1A2235] rounded-xl p-5",
        "hover:border-[#243049] transition-colors duration-200",
        reportTypeBorderGlow(report.type),
        "flex flex-col gap-3"
      )}
    >
      {/* Semantic + Type badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", semanticBadge(report).classes)}>
            {semanticBadge(report).label}
          </span>
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", reportTypeColor(report.type))}>
            {report.type}
            {report.type === "YieldTrap" && <InfoTooltip term="Yield Trap" />}
            {report.type === "EffectiveAPR" && <InfoTooltip term="Effective APR" />}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Download report"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="text-xs text-gray-600">{report.id}</span>
        </div>
      </div>

      {/* Subject pool */}
      <div className="flex items-center gap-2.5">
        <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", report.protocolColor)}>
          {report.protocolLetter}
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm">{report.subjectPool}</p>
          <p className="text-[10px] text-gray-500">{report.protocol}</p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-gray-400 leading-relaxed">{report.summary}</p>

      {/* Confidence meter */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center text-xs text-gray-500 uppercase tracking-wider">
            Confidence
            <InfoTooltip term="Confidence" definition="Statistical confidence level of this intelligence report based on evidence quality and quantity" />
          </span>
          <span className="text-xs font-semibold text-white tabular-nums">{report.confidence}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", confidenceBarColor(report.confidence))}
            initial={{ width: 0 }}
            animate={{ width: `${report.confidence}%` }}
            transition={{ duration: 0.8, delay: 0.2 + index * 0.03, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Content hash + timestamp */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono text-gray-600 truncate">{report.contentHash}</span>
          <CopyButton text={report.contentHash} />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{report.timestamp}</span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// How-it-works steps
// ---------------------------------------------------------------------------

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Monitor",
    description: "HERMES continuously monitors on-chain data, price feeds, and protocol metrics — for external intelligence output only",
    Icon: Radio,
    borderColor: "border-l-cyan-400",
    iconColor: "text-cyan-400",
    bgIcon: "bg-cyan-400/10",
  },
  {
    step: "02",
    title: "Analyze",
    description: "5 services: Pool Comparison, Effective APR Calculator, Risk Decomposition Vector, Yield Trap Intelligence, Protocol Health Snapshot. Enforces axioms A0-22, A0-29, A0-35.",
    Icon: FileSearch,
    borderColor: "border-l-purple-400",
    iconColor: "text-purple-400",
    bgIcon: "bg-purple-400/10",
  },
  {
    step: "03",
    title: "Deliver",
    description: "All outputs are terminal — for external consumption only. HERMES never feeds the risk engine or execution pipeline. Reports are hashed and timestamped for full auditability.",
    Icon: Fingerprint,
    borderColor: "border-l-emerald-400",
    iconColor: "text-emerald-400",
    bgIcon: "bg-emerald-400/10",
  },
];

// ---------------------------------------------------------------------------
// Tier card data
// ---------------------------------------------------------------------------

const TIER_CARDS: {
  id: HermesTier;
  name: string;
  price: string;
  priceNote?: string;
  previewLabel?: string;
  launchPrice?: boolean;
  afterLaunch?: string;
  features: string[];
  borderColor: string;
  priceColor: string;
  hasTooltip?: boolean;
}[] = [
  {
    id: "free",
    name: "FREE PREVIEW",
    price: "Free",
    previewLabel: "Free Preview — limited analysis for evaluation purposes",
    features: [
      "2 reports per day",
      "Pool Comparison service only",
      "No downloads",
      "24h delay on new reports",
      "Basic confidence only",
    ],
    borderColor: "border-white/15",
    priceColor: "text-white",
  },
  {
    id: "pro",
    name: "PRO",
    price: "0.5 SOL/month",
    priceNote: "Launch price — unlimited reports, all 5 services, real-time",
    launchPrice: true,
    afterLaunch: "After launch: ~1-3 SOL/month",
    features: [
      "Unlimited reports",
      "All 5 services (Pool Comparison, Effective APR Calculator, Risk Decomposition Vector, Yield Trap Intelligence, Protocol Health Snapshot)",
      "Real-time delivery",
      "Downloads (JSON)",
      "Custom watchlist with alerts",
      "Historical report access (30 days)",
    ],
    borderColor: "border-purple-500/50",
    priceColor: "text-purple-400",
  },
  {
    id: "protocol",
    name: "PROTOCOL API",
    price: "10 SOL/month",
    priceNote: "Launch price — 10,000 API requests included",
    launchPrice: true,
    afterLaunch: "After launch: ~15-25 SOL/month",
    features: [
      "Everything in Pro",
      "REST API access",
      "All endpoints: /risk-score, /effective-apr, /yield-trap, /pool-health, /proof-hash",
      "10,000 requests/month included",
      "Custom SLA",
      "Webhook support",
    ],
    borderColor: "border-cyan-500/50",
    priceColor: "text-cyan-400",
    hasTooltip: true,
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HermesPage() {
  const [activeFilter, setActiveFilter] = useState<ReportType | "All">("All");

  const { hermesTier: tier, setHermesTier: setTier, freeReportsUsed } = useTierStore();
  const { connected } = useWallet();

  // ----- Invisible access control -----
  // 1. Filter reports by type based on tier, then apply type filter
  const tierFilteredReports = getVisibleReports(REPORTS, tier);
  const filteredReports =
    activeFilter === "All"
      ? tierFilteredReports
      : tierFilteredReports.filter((r) => r.type === activeFilter);

  // 2. Filter pills: free tier only sees allowed types
  const visibleFilters = getVisibleFilters(tier);

  // Recompute counts based on tier-filtered reports
  const filterCounts = (value: ReportType | "All") => {
    if (value === "All") return tierFilteredReports.length;
    return tierFilteredReports.filter((r) => r.type === value).length;
  };

  // 3. Service status: free tier only sees 2
  const visibleServices = getVisibleServices(tier);

  // 4. Pool comparison: only visible for pro/protocol
  const showComparison = tier !== "free" && activeFilter === "PoolComparison";

  // 5. Download: only on pro/protocol
  const showDownload = tier !== "free";

  // Free tier remaining counter
  const freeRemaining = Math.max(0, FREE_REPORT_LIMIT - freeReportsUsed);

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/* Hero Section                                                       */}
      {/* ================================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Title + status row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 border border-cyan-400/20 shrink-0">
              <Radio className="h-7 w-7 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white inline-flex items-center">HERMES<InfoTooltip term="HERMES" /></h1>
                <span className="text-lg text-gray-500 font-medium">DeFi Intelligence</span>
              </div>
              <p className="text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
                DeFi Intelligence — 5 services for external consumption, never enters execution chain.
                HERMES generates terminal outputs only: pool comparisons, APR analysis, risk decomposition, yield trap detection, and protocol health snapshots.
                It observes and reports — it never feeds the execution pipeline.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 text-gray-300 border border-white/10 px-3 py-1.5 text-xs font-medium">
              <FileText className="h-3.5 w-3.5" />
              156 reports generated
            </span>
          </div>
        </div>

        {/* How it works — 3 cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {HOW_IT_WORKS.map((step) => (
            <motion.div
              key={step.step}
              variants={itemVariants}
              className={cn(
                "bg-[#0F1420] border border-[#1A2235] rounded-xl p-5",
                "border-l-[3px]",
                step.borderColor,
                "hover:border-[#243049] transition-colors duration-200"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", step.bgIcon)}>
                  <step.Icon className={cn("h-5 w-5", step.iconColor)} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider font-mono">Step {step.step}</span>
                    <h3 className="text-white font-bold text-sm">{step.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ================================================================== */}
      {/* Subscription Tier Selector — Card Layout                           */}
      {/* ================================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIER_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                if (card.id === "free") {
                  setTier("free");
                } else {
                  // Open upgrade modal instead of directly setting tier
                  // For now, show a "connect wallet" message
                  if (!connected) {
                    alert("Connect wallet to upgrade");
                    return;
                  }
                  // Tier should only be set after verified payment
                  // For now, still set it but this will be gated by verification
                  setTier(card.id);
                }
              }}
              className={cn(
                "bg-white/[0.02] border rounded-2xl p-5 cursor-pointer transition-all duration-200 text-left flex flex-col gap-3",
                tier === card.id
                  ? `${card.borderColor} bg-white/[0.04] shadow-[0_0_20px_rgba(255,255,255,0.03)]`
                  : "border-white/[0.08] hover:border-white/15 hover:bg-white/[0.03]"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-white">{card.name}</p>
                {tier === card.id && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className={cn("text-lg font-bold", card.priceColor)}>{card.price}</p>
                {card.launchPrice && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium ml-2">
                    Launch Price
                  </span>
                )}
                {card.hasTooltip && (
                  <InfoTooltip
                    term="Dynamic Pricing"
                    definition="Price is AI-adjusted based on call volume and data complexity"
                  />
                )}
              </div>
              {card.priceNote && (
                <p className="text-[10px] text-gray-600 -mt-2">{card.priceNote}</p>
              )}
              {card.afterLaunch && (
                <p className="text-[10px] text-gray-500 italic">{card.afterLaunch}</p>
              )}
              {card.previewLabel && (
                <p className="text-[10px] text-amber-400/80 -mt-1 italic">{card.previewLabel}</p>
              )}
              <ul className="space-y-1.5">
                {card.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-gray-400">
                    <Check className="h-3.5 w-3.5 text-gray-600 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-gray-600 text-center">
          Revenue split: 40% Operations | 30% Reserve | 15% Treasury | 15% Creator
        </p>

        {/* Free tier remaining counter */}
        {tier === "free" && (
          <p className="text-xs text-gray-500">
            Preview mode — {freeRemaining} of {FREE_REPORT_LIMIT} reports remaining today with 24h delay. Upgrade for real-time intelligence.
          </p>
        )}

        {/* API Access Panel (Protocol tier only) */}
        <AnimatePresence>
          {tier === "protocol" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-400">API Access Enabled</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["/risk-score", "/effective-apr", "/yield-trap", "/pool-health", "/proof-hash"].map((ep) => (
                    <span key={ep} className="text-xs font-mono text-cyan-400 bg-cyan-500/10 rounded px-2 py-0.5">
                      {ep}
                    </span>
                  ))}
                </div>

                {/* Usage metrics */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Current usage</span>
                    <span className="text-xs text-white font-medium tabular-nums">847 / 10,000 requests this month</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: "8.47%" }}
                      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Rate limit: 1000 req/min</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ================================================================== */}
      {/* Section 1: Service Status Cards                                    */}
      {/* ================================================================== */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "grid gap-3",
          visibleServices.length <= 2
            ? "grid-cols-2"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        )}
      >
        {visibleServices.map((svc) => (
          <motion.div
            key={svc.name}
            variants={itemVariants}
            className={cn(
              "bg-[#0F1420] border border-[#1A2235] rounded-xl p-4",
              "hover:border-[#243049] transition-colors duration-200",
              "flex flex-col items-center gap-2.5 text-center"
            )}
          >
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-white/[0.06]">
              <svc.Icon className="h-4.5 w-4.5 text-gray-300" />
            </div>
            <p className="text-xs text-white font-medium leading-tight">{svc.name}</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Active
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* ================================================================== */}
      {/* Section 2: Filter Bar                                              */}
      {/* ================================================================== */}
      <div className="flex flex-wrap gap-2">
        {visibleFilters.map((opt) => {
          const isActive = activeFilter === opt.value;
          const count = filterCounts(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                isActive ? opt.activeColor : opt.color,
                !isActive && "hover:bg-white/[0.08]"
              )}
            >
              {opt.label}
              <span
                className={cn(
                  "inline-flex items-center justify-center h-5 min-w-[20px] rounded-full px-1.5 text-[10px] font-semibold",
                  isActive ? "bg-white/20" : "bg-white/10 text-gray-400"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* Privacy notice                                                     */}
      {/* ================================================================== */}
      <div className="flex items-start gap-3 rounded-xl bg-[#0F1420] border border-cyan-500/10 px-4 py-3">
        <Lock size={13} className="text-cyan-500/60 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="text-gray-400 font-medium">Demo data.</span>{" "}
          Results generated by your account are private and visible only in your session.
          Other users never have access to research you perform.
        </p>
      </div>

      {/* ================================================================== */}
      {/* Section 3: Intelligence Report Cards                               */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredReports.map((report, i) => (
            <ReportCard
              key={report.id}
              report={report}
              index={i}
              showDownload={showDownload}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ================================================================== */}
      {/* Section 3b: Report Analytics                                      */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report Type Distribution */}
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Report Type Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: "RiskDecomposition", value: 42, fill: "#00D4FF" },
                  { name: "YieldTrap", value: 28, fill: "#EF4444" },
                  { name: "EffectiveAPR", value: 35, fill: "#10B981" },
                  { name: "PoolComparison", value: 18, fill: "#F59E0B" },
                  { name: "ProtocolHealth", value: 12, fill: "#8B5CF6" },
                ]}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={75}
                paddingAngle={2}
                dataKey="value"
              >
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {[
              { name: "Risk", color: "#00D4FF" },
              { name: "Yield", color: "#EF4444" },
              { name: "APR", color: "#10B981" },
              { name: "Compare", color: "#F59E0B" },
              { name: "Health", color: "#8B5CF6" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-gray-500">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Confidence Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { range: "90-100%", count: 18 },
              { range: "80-89%", count: 32 },
              { range: "70-79%", count: 24 },
              { range: "60-69%", count: 8 },
              { range: "<60%", count: 3 },
            ]} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Bar dataKey="count" fill="#00D4FF" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Section 4: Pool Comparison View (hidden on free tier)              */}
      {/* ================================================================== */}
      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-5">
              <GitCompareArrows className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Pool Comparison</h2>
            </div>

            {/* Score gauges row */}
            <div className={cn(
              "bg-[#0F1420] border border-[#1A2235] rounded-xl",
              "overflow-hidden"
            )}>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
                {COMPARISON_POOLS.map((pool, i) => (
                  <motion.div
                    key={pool.pool}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                    className="p-6 flex flex-col items-center gap-4"
                  >
                    <ComparisonGauge score={pool.score} />
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">{pool.pool}</p>
                      <p className="text-[10px] text-gray-500">{pool.protocol}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Comparison table */}
              <div className="border-t border-white/[0.06] overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left text-gray-500 uppercase tracking-wider font-medium px-6 py-3">Metric</th>
                      {COMPARISON_POOLS.map((pool) => (
                        <th key={pool.pool} className="text-center text-gray-500 uppercase tracking-wider font-medium px-4 py-3">
                          {pool.pool}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/[0.04]">
                      <td className="text-gray-400 px-6 py-2.5"><span className="inline-flex items-center">Effective APR<InfoTooltip term="Effective APR" /></span></td>
                      {COMPARISON_POOLS.map((pool) => (
                        <td key={pool.pool} className="text-center text-white font-medium px-4 py-2.5">{pool.apr}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/[0.04]">
                      <td className="text-gray-400 px-6 py-2.5">TVL</td>
                      {COMPARISON_POOLS.map((pool) => (
                        <td key={pool.pool} className="text-center text-white font-medium px-4 py-2.5">{pool.tvl}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/[0.04]">
                      <td className="text-gray-400 px-6 py-2.5">Risk Level</td>
                      {COMPARISON_POOLS.map((pool) => (
                        <td key={pool.pool} className="text-center px-4 py-2.5">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border",
                            pool.riskLevel === "Low"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : pool.riskLevel === "Medium"
                                ? "bg-amber-400/15 text-amber-400 border-amber-400/30"
                                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          )}>
                            {pool.riskLevel}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="text-gray-400 px-6 py-2.5">
                        <span className="flex items-center">
                          Evidence Families
                          <InfoTooltip term="Evidence Family" />
                        </span>
                      </td>
                      {COMPARISON_POOLS.map((pool) => (
                        <td key={pool.pool} className="text-center text-white font-medium px-4 py-2.5">
                          {pool.evidenceFamilies}/5
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimers */}
      <div className="border-t border-white/[0.04] pt-6 mt-8 space-y-2">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Intelligence reports are informational only. AXIONBLADE does not provide financial advice. All analysis is algorithmic and deterministic — no LLM makes final decisions.
        </p>
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Mainnet Alpha — noumen_hermes not yet deployed. Report data uses simulated sources pending program deploy. AI-adjusted pricing may vary.
        </p>
      </div>
    </div>
  );
}
