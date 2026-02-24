"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { truncateAddress } from "@/lib/format";
import {
  Wallet,
  Heart,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  ExternalLink,
  Activity,
  CircleDollarSign,
  PieChart as PieChartIcon,
} from "lucide-react";
import { InfoTooltip } from "@/components/atoms/Tooltip";
import { TechnicalDetails } from "@/components/atoms/TechnicalDetails";
import { RecentChangesFeed } from "@/components/atoms/RecentChangesFeed";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TransactionType = "Revenue" | "Expense" | "Donation" | "CCS";

interface Transaction {
  id: string;
  time: string;
  type: TransactionType;
  description: string;
  amount: number;
  direction: "in" | "out";
  txHash: string;
}

interface DonationReceipt {
  nonce: number;
  amount: number;
  source: string;
  status: "Clean" | "Flagged";
  time: string;
}

interface BudgetAllocation {
  agent: string;
  used: number;
  total: number;
  color: string;
  accent: string;
}

interface RevenueDataPoint {
  day: string;
  revenue: number;
  expenses: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const TREASURY_BALANCE = 42.5371;
const USD_PRICE = 149.85;
const FREE_BALANCE = 31.9;
const RESERVED = 10.6;
const RESERVE_PCT = 25;
const DAILY_LIMIT = 1.28;
const DAILY_LIMIT_PCT = 3;

const RESERVE_RATIO = 32;
const RESERVE_THRESHOLD = 25;

const OPERATIONS_SPLIT = 40;
const TREASURY_RESERVE_SPLIT = 30;
const DEV_FUND_SPLIT = 15;
const CREATOR_SPLIT = 15;

const TOTAL_DONATED = 12.5;

const MOCK_REVENUE: RevenueDataPoint[] = [
  { day: "Mon", revenue: 1.8, expenses: 0.9 },
  { day: "Tue", revenue: 2.4, expenses: 1.2 },
  { day: "Wed", revenue: 1.2, expenses: 0.5 },
  { day: "Thu", revenue: 3.1, expenses: 1.8 },
  { day: "Fri", revenue: 2.7, expenses: 1.1 },
  { day: "Sat", revenue: 3.5, expenses: 1.6 },
  { day: "Sun", revenue: 2.9, expenses: 0.8 },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "tx-01", time: "2m ago", type: "Revenue", description: "Service payment: Risk Snapshot", amount: 0.45, direction: "in", txHash: "5kN3mP8rT2wX4yZ6aB9cD1eF3gH5iJ7kL0mN2pR4sT6v" },
  { id: "tx-02", time: "5m ago", type: "CCS", description: "CCS creator payment", amount: 0.12, direction: "out", txHash: "7bC9dE1fG3hI5jK7lM9nO1pQ3rS5tU7vW9xY1zA3bC5dE" },
  { id: "tx-03", time: "12m ago", type: "Revenue", description: "API call: Pool Analysis (Premium)", amount: 1.20, direction: "in", txHash: "9fG3hI5jK7lM9nO1pQ3rS5tU7vW9xY1zA3bC5dE7fG9hI" },
  { id: "tx-04", time: "18m ago", type: "Expense", description: "Agent budget: APOLLO", amount: 0.85, direction: "out", txHash: "2hI5jK7lM9nO1pQ3rS5tU7vW9xY1zA3bC5dE7fG9hI1jK" },
  { id: "tx-05", time: "24m ago", type: "Donation", description: "Donation received", amount: 2.50, direction: "in", txHash: "4jK7lM9nO1pQ3rS5tU7vW9xY1zA3bC5dE7fG9hI1jK3lM" },
  { id: "tx-06", time: "31m ago", type: "Revenue", description: "A2A marketplace: Risk Assessment", amount: 0.75, direction: "in", txHash: "6lM9nO1pQ3rS5tU7vW9xY1zA3bC5dE7fG9hI1jK3lM5nO" },
  { id: "tx-07", time: "45m ago", type: "Expense", description: "Agent budget: HERMES", amount: 0.42, direction: "out", txHash: "8nO1pQ3rS5tU7vW9xY1zA3bC5dE7fG9hI1jK3lM5nO7pQ" },
  { id: "tx-08", time: "1h ago", type: "CCS", description: "CCS creator stipend", amount: 0.08, direction: "out", txHash: "1pQ3rS5tU7vW9xY1zA3bC5dE7fG9hI1jK3lM5nO7pQ9rS" },
  { id: "tx-09", time: "1h ago", type: "Revenue", description: "Service payment: Effective APR Report", amount: 0.95, direction: "in", txHash: "3rS5tU7vW9xY1zA3bC5dE7fG9hI1jK3lM5nO7pQ9rS1tU" },
  { id: "tx-10", time: "2h ago", type: "Expense", description: "Infrastructure: RPC node fees", amount: 0.15, direction: "out", txHash: "5tU7vW9xY1zA3bC5dE7fG9hI1jK3lM5nO7pQ9rS1tU3vW" },
  { id: "tx-11", time: "2h ago", type: "Revenue", description: "A2A marketplace: MLI Query", amount: 0.30, direction: "in", txHash: "7vW9xY1zA3bC5dE7fG9hI1jK3lM5nO7pQ9rS1tU3vW5xY" },
  { id: "tx-12", time: "3h ago", type: "Donation", description: "Donation received", amount: 5.00, direction: "in", txHash: "9xY1zA3bC5dE7fG9hI1jK3lM5nO7pQ9rS1tU3vW5xY7zA" },
  { id: "tx-13", time: "4h ago", type: "Expense", description: "Agent budget: AEON", amount: 1.10, direction: "out", txHash: "2zA3bC5dE7fG9hI1jK3lM5nO7pQ9rS1tU3vW5xY7zA9bC" },
  { id: "tx-14", time: "5h ago", type: "CCS", description: "CCS creator payment", amount: 0.06, direction: "out", txHash: "4bC5dE7fG9hI1jK3lM5nO7pQ9rS1tU3vW5xY7zA9bC1dE" },
  { id: "tx-15", time: "6h ago", type: "Revenue", description: "Service payment: Risk Snapshot (B2B)", amount: 3.20, direction: "in", txHash: "6dE7fG9hI1jK3lM5nO7pQ9rS1tU3vW5xY7zA9bC1dE3fG" },
];

const MOCK_DONATIONS: DonationReceipt[] = [
  { nonce: 1047, amount: 2.50, source: "8Hf3JqK9mN2pR5sT7vW0xY1zA4bC6dE8Hf3JqK9mN2p", status: "Clean", time: "24m ago" },
  { nonce: 1046, amount: 0.80, source: "3kL5mN7pR9sT1vW3xY5zA7bC9dE1fG3kL5mN7pR9sT1v", status: "Clean", time: "2h ago" },
  { nonce: 1045, amount: 5.00, source: "6nP8rS0tV2wX4yZ6aB8cD0eF2gH4iJ6nP8rS0tV2wX4y", status: "Flagged", time: "5h ago" },
  { nonce: 1044, amount: 1.20, source: "9qS1tV3wX5yZ7aB9cD1eF3gH5iJ7kL9qS1tV3wX5yZ7a", status: "Clean", time: "12h ago" },
  { nonce: 1043, amount: 3.00, source: "2tV4wX6yZ8aB0cD2eF4gH6iJ8kL0mN2tV4wX6yZ8aB0c", status: "Clean", time: "1d ago" },
];

const MOCK_BUDGETS: BudgetAllocation[] = [
  { agent: "AEON", used: 8.5, total: 15.0, color: "from-purple-500 to-purple-400", accent: "text-purple-400" },
  { agent: "APOLLO", used: 5.2, total: 10.0, color: "from-cyan-500 to-cyan-400", accent: "text-cyan-400" },
  { agent: "HERMES", used: 3.1, total: 8.0, color: "from-emerald-500 to-emerald-400", accent: "text-emerald-400" },
];

const TYPE_STYLES: Record<TransactionType, { bg: string; text: string }> = {
  Revenue: { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-400" },
  Expense: { bg: "bg-rose-500/15 border-rose-500/30", text: "text-rose-400" },
  Donation: { bg: "bg-amber-400/15 border-amber-400/30", text: "text-amber-400" },
  CCS: { bg: "bg-purple-500/15 border-purple-500/30", text: "text-purple-400" },
};

const FILTER_OPTIONS: (TransactionType | "All")[] = ["All", "Revenue", "Expense", "Donation", "CCS"];

// ---------------------------------------------------------------------------
// Stagger animation variants
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
// Animated number component
// ---------------------------------------------------------------------------

function AnimatedBalance({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => v.toFixed(4));
  const [text, setText] = useState("0.0000");

  useEffect(() => {
    spring.set(value);
    const unsub = display.on("change", (v) => setText(v));
    return unsub;
  }, [spring, display, value]);

  return (
    <motion.span
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-5xl font-bold tracking-tight text-white tabular-nums"
    >
      {text}
      <span className="text-2xl font-medium text-purple-400 ml-3">SOL</span>
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// Reserve Ratio Gauge (SVG circular)
// ---------------------------------------------------------------------------

function ReserveGauge({ ratio, threshold }: { ratio: number; threshold: number }) {
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const fillPercent = Math.min(ratio, 100);
  const offset = circumference - (fillPercent / 100) * circumference;
  const isHealthy = ratio >= threshold;

  // Calculate threshold marker position
  const thresholdAngle = (threshold / 100) * 360 - 90; // -90 because of rotation
  const thresholdRad = (thresholdAngle * Math.PI) / 180;
  const cx = 70 + (radius - 2) * Math.cos(thresholdRad);
  const cy = 70 + (radius - 2) * Math.sin(thresholdRad);
  const outerX = 70 + (radius + 8) * Math.cos(thresholdRad);
  const outerY = 70 + (radius + 8) * Math.sin(thresholdRad);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          {/* Background track */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Animated fill */}
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
            className={isHealthy ? "stroke-emerald-400" : "stroke-rose-500"}
          />
          {/* Threshold tick marker */}
          <line
            x1={cx}
            y1={cy}
            x2={outerX}
            y2={outerY}
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold", isHealthy ? "text-emerald-400" : "text-rose-500")}>
            {ratio}%
          </span>
          <span className="text-xs text-gray-500 uppercase tracking-wider mt-1 inline-flex items-center">
            Reserve Ratio<InfoTooltip term="Reserve Ratio" />
          </span>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-gray-400">
        <ShieldCheck className="w-3 h-3" />
        Reserve ratio<InfoTooltip term="Reserve Ratio" /> must stay ≥{threshold}% · daily spend ≤3% of free balance
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CCS Donut Chart (SVG)
// ---------------------------------------------------------------------------

function CCSDonut() {
  const radius = 52;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  const operationsArc = (OPERATIONS_SPLIT / 100) * circumference;
  const treasuryArc = (TREASURY_RESERVE_SPLIT / 100) * circumference;
  const devFundArc = (DEV_FUND_SPLIT / 100) * circumference;
  const creatorArc = (CREATOR_SPLIT / 100) * circumference;
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          {/* Operations segment (gray-600) - starts at top */}
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={`${operationsArc} ${circumference - operationsArc}`}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${operationsArc} ${circumference - operationsArc}` }}
            transition={{ duration: 1.0, ease: "easeOut", delay: 0.3 }}
            className="stroke-gray-600"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoveredSegment("operations")}
            onMouseLeave={() => setHoveredSegment(null)}
          />
          {/* Treasury segment (emerald-500) - starts after operations */}
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={`${treasuryArc} ${circumference - treasuryArc}`}
            strokeDashoffset={-operationsArc}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${treasuryArc} ${circumference - treasuryArc}` }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.4 }}
            className="stroke-emerald-500"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoveredSegment("treasury")}
            onMouseLeave={() => setHoveredSegment(null)}
          />
          {/* Dev Fund segment (blue-500) - starts after operations + treasury */}
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={`${devFundArc} ${circumference - devFundArc}`}
            strokeDashoffset={-(operationsArc + treasuryArc)}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${devFundArc} ${circumference - devFundArc}` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
            className="stroke-[#00D4FF]"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoveredSegment("devfund")}
            onMouseLeave={() => setHoveredSegment(null)}
          />
          {/* Creator segment (amber-400) - starts after operations + treasury + devfund */}
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={`${creatorArc} ${circumference - creatorArc}`}
            strokeDashoffset={-(operationsArc + treasuryArc + devFundArc)}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${creatorArc} ${circumference - creatorArc}` }}
            transition={{ duration: 1.3, ease: "easeOut", delay: 0.6 }}
            className="stroke-amber-400"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoveredSegment("creator")}
            onMouseLeave={() => setHoveredSegment(null)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white inline-flex items-center">Split<InfoTooltip term="CCS" /></span>
        </div>
        {/* Tooltip */}
        <AnimatePresence>
          {hoveredSegment && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1A2235] border border-[#243049] rounded-lg px-3 py-2 text-xs whitespace-nowrap z-10"
            >
              {hoveredSegment === "operations" && (
                <span className="text-gray-400">Operations: {OPERATIONS_SPLIT}%</span>
              )}
              {hoveredSegment === "treasury" && (
                <span className="text-emerald-400">Treasury Reserve: {TREASURY_RESERVE_SPLIT}%</span>
              )}
              {hoveredSegment === "devfund" && (
                <span className="text-[#00D4FF]">Dev Fund: {DEV_FUND_SPLIT}%</span>
              )}
              {hoveredSegment === "creator" && (
                <span className="text-amber-400">Creator: {CREATOR_SPLIT}%</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Legend */}
      <div className="space-y-2 w-full">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
            <span className="text-gray-400">Operations</span>
          </div>
          <span className="text-gray-400 font-medium">{OPERATIONS_SPLIT}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-gray-400">Treasury Reserve</span>
          </div>
          <span className="text-emerald-400 font-medium">{TREASURY_RESERVE_SPLIT}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF]" />
            <span className="text-gray-400">Dev Fund</span>
          </div>
          <span className="text-[#00D4FF] font-medium">{DEV_FUND_SPLIT}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-gray-400">Creator</span>
          </div>
          <span className="text-amber-400 font-medium">{CREATOR_SPLIT}%</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Recharts Tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1A2235] border border-[#243049] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span className={cn("w-2 h-2 rounded-full", entry.dataKey === "revenue" ? "bg-emerald-400" : "bg-rose-500")} />
          <span className="text-gray-300">{entry.dataKey === "revenue" ? "Revenue" : "Expenses"}:</span>
          <span className="font-medium text-white">{entry.value.toFixed(2)} SOL</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue trend data generator (30d)
// ---------------------------------------------------------------------------

function generateRevenueTrend() {
  const data = [];
  const base = new Date();
  base.setDate(base.getDate() - 30);
  for (let i = 0; i < 30; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const daily = 5 + Math.random() * 6;
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: parseFloat(daily.toFixed(2)),
    });
  }
  return data;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TreasuryPage() {
  const [filter, setFilter] = useState<TransactionType | "All">("All");
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredTransactions = useMemo(
    () => filter === "All" ? MOCK_TRANSACTIONS : MOCK_TRANSACTIONS.filter((t) => t.type === filter),
    [filter],
  );

  const usdValue = (TREASURY_BALANCE * USD_PRICE).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
            className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center"
          >
            <Wallet className="w-8 h-8 text-purple-400" />
          </motion.div>

          {/* Title + Subtitle */}
          <div>
            <h1 className="text-3xl font-bold text-white">TREASURY</h1>
            <p className="text-lg text-gray-400 mt-1">Financial Transparency</p>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-400 max-w-2xl">
            Treasury manages all protocol revenue transparently on-chain. Every SOL received, spent, or reserved is tracked and auditable. The <span className="inline-flex items-center">CCS<InfoTooltip term="CCS" /></span> (Cost-Contribution Split) ensures fair distribution.
          </p>
        </div>

        {/* How it works — 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            {
              step: "01",
              icon: <ArrowDownRight className="w-5 h-5 text-purple-400" />,
              description: "Revenue flows exclusively from real usage: paid services (APOLLO, HERMES), APIs, and A2A marketplace. Every service must cover its cost or be discontinued after 90 days.",
            },
            {
              step: "02",
              icon: <PieChartIcon className="w-5 h-5 text-purple-400" />,
              description: "Revenue split: 40% Operations + 30% Treasury + 15% Dev Fund + 15% Creator",
            },
            {
              step: "03",
              icon: <Heart className="w-5 h-5 text-purple-400" />,
              description: "Donations go to a separate Donation PDA, swept daily to Treasury — bypassing the CCS split entirely. Conditional donations are rejected (anti-masquerade rule).",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-5 text-left hover:border-[#243049] transition-colors duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400">
                  {item.step}
                </span>
                {item.icon}
              </div>
              <p className="text-sm text-gray-400">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Header                                                            */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/20">
          <Wallet className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Treasury</h1>
          <p className="text-sm text-gray-500">Every SOL tracked, every flow transparent</p>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Section 1: Hero Balance Card                                      */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem}>
        <div className="relative overflow-hidden rounded-xl bg-[#0F1420] border border-[#1A2235] p-8">
          {/* Animated gradient border glow */}
          <div className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(34,211,238,0.08) 50%, rgba(168,85,247,0.15) 100%)",
            }}
          />
          <motion.div
            className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.6), transparent 70%)" }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative flex flex-col items-center gap-3">
            {/* SOL icon */}
            <motion.div
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-5 h-5 bg-white/90 rotate-45 rounded-sm" />
            </motion.div>

            {/* Balance */}
            <AnimatedBalance value={TREASURY_BALANCE} />

            {/* USD value */}
            <p className="text-gray-400 text-sm">
              ≈ ${usdValue} USD
            </p>

            {/* Mini stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-white/[0.06] w-full max-w-lg">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Free Balance</p>
                <p className="text-sm font-semibold text-white">{FREE_BALANCE} SOL</p>
              </div>
              <div className="w-px h-8 bg-white/[0.06] hidden sm:block" />
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reserved</p>
                <p className="text-sm font-semibold text-white">{RESERVED} SOL <span className="text-gray-500 font-normal">({RESERVE_PCT}%)</span></p>
              </div>
              <div className="w-px h-8 bg-white/[0.06] hidden sm:block" />
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Daily Limit</p>
                <p className="text-sm font-semibold text-white">{DAILY_LIMIT} SOL <span className="text-gray-500 font-normal">({DAILY_LIMIT_PCT}%)</span></p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Recent Changes Mini-Feed                                          */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem}>
        <RecentChangesFeed
          changes={[
            { amount: "+0.42 SOL", positive: true, description: "Service Payment (HERMES)", time: "2m ago" },
            { amount: "-0.18 SOL", positive: false, description: "Agent Rewards", time: "15m ago" },
            { amount: "+1.20 SOL", positive: true, description: "Risk Assessment Fee (APOLLO)", time: "1h ago" },
            { amount: "-0.05 SOL", positive: false, description: "Gas Costs", time: "2h ago" },
            { amount: "+0.85 SOL", positive: true, description: "API Subscription (Premium)", time: "3h ago" },
          ]}
        />
      </motion.div>

      {/* ================================================================= */}
      {/* Revenue Breakdown                                                 */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem} className="space-y-4">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Revenue Breakdown</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Revenue Pie Chart */}
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200">
            <div className="flex flex-col items-center">
              <div className="relative w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Proof Revenue", value: 42.5 },
                        { name: "Subscription Revenue", value: 28.5 },
                        { name: "Agent Revenue Share", value: 12.0 },
                        { name: "API Access", value: 15.0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#a855f7" />
                      <Cell fill="#22d3ee" />
                      <Cell fill="#34d399" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-white">98.0 SOL</span>
                  <span className="text-xs text-gray-500">Total</span>
                </div>
              </div>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-gray-400">Proof Revenue</span>
                  <span className="ml-auto text-white font-medium">42.5</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                  <span className="text-gray-400">Subscription</span>
                  <span className="ml-auto text-white font-medium">28.5</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-gray-400">Agent Share</span>
                  <span className="ml-auto text-white font-medium">12.0</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-gray-400">API Access</span>
                  <span className="ml-auto text-white font-medium">15.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Revenue Events Feed */}
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200">
            <h3 className="text-sm font-medium text-white mb-4">Recent Revenue Events</h3>
            <div className="max-h-[280px] overflow-y-auto space-y-0 pr-1 custom-scrollbar">
              {[
                { amount: "+0.25 SOL", description: "APOLLO Pro Assessment — RAY-USDC", time: "2m ago" },
                { amount: "+5.00 SOL", description: "APOLLO Institutional Assessment — mSOL-SOL", time: "8m ago" },
                { amount: "+0.05 SOL", description: "APOLLO Basic Assessment — RAY-USDC", time: "15m ago" },
                { amount: "+1.50 SOL", description: "HERMES Pro Subscription — 0x7a3f...", time: "1h ago" },
                { amount: "+0.25 SOL", description: "APOLLO Pro Assessment — JUP-USDC", time: "2h ago" },
                { amount: "+0.15 SOL", description: "API calls (batch) — Protocol Tier", time: "3h ago" },
                { amount: "+0.05 SOL", description: "APOLLO Basic Assessment — BONK-SOL", time: "4h ago" },
                { amount: "+399.00 SOL", description: "Protocol Subscription — 0x8b2e...", time: "1d ago" },
              ].map((event, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between py-3 px-1",
                    i < 7 && "border-b border-white/[0.04]"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-emerald-400 text-sm font-medium tabular-nums whitespace-nowrap">
                      {event.amount}
                    </span>
                    <span className="text-gray-400 text-xs truncate">{event.description}</span>
                  </div>
                  <span className="text-gray-600 text-xs whitespace-nowrap ml-3">{event.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-4 hover:border-[#243049] transition-colors duration-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Today&apos;s Revenue</p>
            <p className="text-lg font-bold text-emerald-400 tabular-nums">8.2 SOL</p>
          </div>
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-4 hover:border-[#243049] transition-colors duration-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">This Week</p>
            <p className="text-lg font-bold text-purple-400 tabular-nums">65.3 SOL</p>
          </div>
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-4 hover:border-[#243049] transition-colors duration-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Active Subscriptions</p>
            <p className="text-lg font-bold text-cyan-400 tabular-nums">47</p>
          </div>
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-4 hover:border-[#243049] transition-colors duration-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg Proof/Day</p>
            <p className="text-lg font-bold text-amber-400 tabular-nums">312</p>
          </div>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Daily Revenue Trend (30d)                                        */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem}>
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Daily Revenue (30d)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={generateRevenueTrend()} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v} SOL`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Revenue by Source + Reserve Ratio Gauge                           */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Source */}
        <motion.div variants={staggerItem}>
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Revenue by Source</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Apollo Assessments", value: 58, fill: "#00D4FF" },
                    { name: "Hermes Reports", value: 27, fill: "#10B981" },
                    { name: "Protocol API", value: 15, fill: "#F59E0B" },
                  ]}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {[
                { name: "Apollo", color: "#00D4FF", pct: "58%" },
                { name: "Hermes", color: "#10B981", pct: "27%" },
                { name: "API", color: "#F59E0B", pct: "15%" },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[10px] text-gray-400">{s.name} {s.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Reserve Ratio Compliance */}
        <motion.div variants={staggerItem}>
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-white mb-4">Reserve Ratio (A0-17)</h3>
            <div className="relative">
              <svg width={140} height={80} viewBox="0 0 140 80">
                <path d="M 10 70 A 55 55 0 0 1 130 70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} strokeLinecap="round" />
                <path d="M 10 70 A 55 55 0 0 1 130 70" fill="none" stroke="#10B981" strokeWidth={10} strokeLinecap="round" strokeDasharray={`${Math.PI * 55}`} strokeDashoffset={`${Math.PI * 55 * (1 - 0.32)}`} className="transition-all duration-1000" />
                {/* 25% threshold marker */}
                <line x1="37" y1="22" x2="37" y2="32" stroke="#EF4444" strokeWidth={2} opacity={0.6} />
              </svg>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <span className="text-xl font-bold text-emerald-400">32%</span>
                <span className="text-[10px] text-gray-500 block">min 25%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ================================================================= */}
      {/* Recent Transactions (detailed table)                              */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem}>
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Source</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: "Feb 11", type: "Service Payment", amount: "0.3 SOL", source: "Apollo Pro", hash: "7Kx9v...3bPdM" },
                  { date: "Feb 11", type: "Service Payment", amount: "0.05 SOL", source: "Apollo Basic", hash: "4mNq2...8vRtK" },
                  { date: "Feb 11", type: "Subscription", amount: "2.0 SOL", source: "Hermes Pro", hash: "9pLw6...2cFmJ" },
                  { date: "Feb 10", type: "Service Payment", amount: "0.3 SOL", source: "Apollo Pro", hash: "3kHn8...7dQxP" },
                  { date: "Feb 10", type: "Donation", amount: "1.0 SOL", source: "Anonymous", hash: "6wRt4...1aNbS" },
                  { date: "Feb 10", type: "API Usage", amount: "0.8 SOL", source: "Protocol API", hash: "2jMp5...9eTvL" },
                  { date: "Feb 9", type: "Service Payment", amount: "5.0 SOL", source: "Apollo Institutional", hash: "8cVx1...4hGmW" },
                  { date: "Feb 9", type: "Budget Allocation", amount: "-0.5 SOL", source: "APOLLO Agent", hash: "1nKf7...6bYsR" },
                ].map((tx, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 text-gray-400">{tx.date}</td>
                    <td className="py-2.5 text-gray-300">{tx.type}</td>
                    <td className={`py-2.5 text-right font-mono ${tx.amount.startsWith("-") ? "text-red-400" : "text-emerald-400"}`}>{tx.amount}</td>
                    <td className="py-2.5 text-gray-400">{tx.source}</td>
                    <td className="py-2.5 text-right font-mono text-[#00D4FF]/70 hover:text-[#00D4FF] cursor-pointer">{tx.hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Protocol Economics                                                */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem} className="space-y-4">
        <h2 className="text-lg font-bold text-white">Protocol Economics</h2>
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 space-y-6">
          {/* Revenue Split — 4 colored bars */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Revenue Split</p>
            <p className="text-xs text-gray-500">AI-adjusted pricing guarantees minimum 30% treasury allocation on every transaction</p>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 inline-flex items-center">Operations<InfoTooltip term="Operations" /> (compute, RPC, storage)</span>
                  <span className="text-xs font-medium text-gray-400">40%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-gray-600" style={{ width: "40%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 inline-flex items-center">Treasury Reserve<InfoTooltip term="Treasury Reserve" /></span>
                  <span className="text-xs font-medium text-emerald-400">30%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: "30%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 inline-flex items-center">Development Fund<InfoTooltip term="Development Fund" /></span>
                  <span className="text-xs font-medium text-[#00D4FF]">15%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-[#00D4FF]" style={{ width: "15%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 inline-flex items-center">Creator Allocation<InfoTooltip term="CCS" /></span>
                  <span className="text-xs font-medium text-amber-400">15%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: "15%" }} />
                </div>
              </div>
            </div>
            {/* Summary badge */}
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5 mt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-400">
                Revenue Split: 40% Operations | 30% Treasury | 15% Dev Fund | 15% Creator
              </p>
            </div>
          </div>

          {/* Margin Enforcement */}
          <div className="border-t border-[#1A2235] pt-4">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Margin Enforcement</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Every paid transaction enforces minimum allocation: 30% to Treasury PDA, 15% to Development Fund, 15% to Creator wallet.
              If AI calculates a price below cost threshold, the pricing engine auto-adjusts UP to maintain margins.
            </p>
          </div>

          {/* Projected Monthly Revenue */}
          <div className="border-t border-[#1A2235] pt-4">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Projected Monthly Revenue</p>
            <p className="text-xs text-gray-500 mb-1">Based on daily average x 30</p>
            <p className="text-xl font-bold text-white">~246 SOL/month <span className="text-sm font-normal text-gray-500">(projected)</span></p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-400">~98 SOL</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Operations (40%)</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-emerald-400">~74 SOL</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Treasury (30%)</p>
              </div>
              <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-[#00D4FF]">~37 SOL</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Dev Fund (15%)</p>
              </div>
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-amber-400">~37 SOL</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Creator (15%)</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Section 2: Three-column metrics                                   */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* (a) Reserve Ratio Gauge */}
        <motion.div variants={staggerItem}>
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 flex flex-col items-center justify-center h-full hover:border-[#243049] transition-colors duration-200">
            <ReserveGauge ratio={RESERVE_RATIO} threshold={RESERVE_THRESHOLD} />
          </div>
        </motion.div>

        {/* (b) CCS Distribution Donut */}
        <motion.div variants={staggerItem}>
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 flex flex-col items-center justify-center h-full hover:border-[#243049] transition-colors duration-200">
            <CCSDonut />
          </div>
        </motion.div>

        {/* (c) Revenue vs Expenses chart */}
        <motion.div variants={staggerItem}>
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 h-full hover:border-[#243049] transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Revenue vs Expenses</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-gray-400">Revenue</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-gray-400">Expenses</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MOCK_REVENUE}>
                <defs>
                  <linearGradient id="treasuryRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="treasuryExpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#34d399"
                  fill="url(#treasuryRevGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f43f5e"
                  fill="url(#treasuryExpGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ================================================================= */}
      {/* Section 3: Transaction History                                    */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem}>
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                {filter}
              </button>
              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 z-20 bg-[#1A2235] border border-[#243049] rounded-xl overflow-hidden shadow-2xl min-w-[140px]"
                  >
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setFilter(opt); setFilterOpen(false); }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm transition-colors",
                          filter === opt ? "bg-purple-500/20 text-purple-400" : "text-gray-300 hover:bg-white/[0.06]",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Time", "Type", "Description", "Amount", "TX Hash"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredTransactions.map((tx, i) => {
                    const typeStyle = TYPE_STYLES[tx.type];
                    return (
                      <motion.tr
                        key={tx.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2, delay: i * 0.02 }}
                        className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors border-b border-white/[0.03] last:border-b-0"
                      >
                        <td className="px-6 py-3 text-gray-400 whitespace-nowrap">{tx.time}</td>
                        <td className="px-6 py-3">
                          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", typeStyle.bg, typeStyle.text)}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-300">{tx.description}</td>
                        <td className="px-6 py-3 whitespace-nowrap font-medium tabular-nums">
                          <span className={cn("flex items-center gap-1", tx.direction === "in" ? "text-emerald-400" : "text-rose-400")}>
                            {tx.direction === "in" ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            {tx.direction === "in" ? "+" : "-"}{tx.amount.toFixed(2)} SOL
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <a
                            href={`https://solscan.io/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-purple-400 transition-colors"
                          >
                            {truncateAddress(tx.txHash, 6)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Section 4: Donations                                              */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem}>
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15">
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Donation Vault</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Donated</p>
                <p className="text-lg font-bold text-white">{TOTAL_DONATED} SOL</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                No conditional donations detected
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Nonce", "Amount", "Source", "Status", "Time"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_DONATIONS.map((d, i) => (
                  <motion.tr
                    key={d.nonce}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors border-b border-white/[0.03] last:border-b-0"
                  >
                    <td className="px-6 py-3 font-mono text-gray-300">#{d.nonce}</td>
                    <td className="px-6 py-3 font-semibold text-white tabular-nums">{d.amount.toFixed(2)} SOL</td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{truncateAddress(d.source, 6)}</td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        d.status === "Clean"
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : "bg-rose-500/15 border-rose-500/30 text-rose-400",
                      )}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400">{d.time}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Technical Details */}
          <div className="px-6 pb-4">
            <TechnicalDetails label="On-chain Details">
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600">Donation PDA:</span>{" "}
                  <span className="text-gray-400">DonV4u1t...PDA8xKm2</span>
                </div>
                <div>
                  <span className="text-gray-600">Treasury PDA:</span>{" "}
                  <span className="text-gray-400">Tres8yPD...A7nQw4Rx</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Sweep TX:</span>{" "}
                  <span className="text-gray-400">6Hs3nJ8mPr7sNfXi...Yw2kL9</span>
                </div>
                <div>
                  <span className="text-gray-600">Sweep Frequency:</span>{" "}
                  <span className="text-gray-400">Daily (per Axiom A0-21)</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Sweep Block:</span>{" "}
                  <span className="text-gray-400">#248,193,047</span>
                </div>
              </div>
            </TechnicalDetails>
          </div>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Section 5: Budget Allocations                                     */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem} className="space-y-4">
        <h2 className="text-lg font-bold text-white">Budget Allocations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {MOCK_BUDGETS.map((b, i) => {
            const pct = Math.round((b.used / b.total) * 100);
            return (
              <motion.div
                key={b.agent}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-5 hover:border-[#243049] transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={cn("text-base font-bold", b.accent)}>{b.agent}</span>
                  <span className="text-xs text-gray-500">{pct}% used</span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden mb-3">
                  <motion.div
                    className={cn("h-full rounded-full bg-gradient-to-r", b.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 + i * 0.1 }}
                  />
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">{b.used} / {b.total} SOL</span>
                  <span className="text-gray-500">{(b.total - b.used).toFixed(1)} SOL remaining</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* Creator Allocation                                                */}
      {/* ================================================================= */}
      <motion.div variants={staggerItem} className="space-y-4">
        <h2 className="text-lg font-bold text-white">Creator Allocation</h2>
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Founder/Creator Share</p>
              <p className="text-xs text-gray-500">Fixed 15% of all revenue — CCS: cap 15%, floor 4%, stipend cap 5%</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-400">15%</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">of revenue</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Current allocation</span>
              <span className="text-xs text-amber-400">15% / 15% max</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-amber-400" style={{ width: "100%" }} />
            </div>
          </div>

          {/* Axiom reference */}
          <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-lg px-4 py-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-400">
              CCS (Cost-Contribution Split): total creator capture capped at 15%, floor 4%, stipend cap 5%. Donations bypass CCS entirely — swept daily from Donation PDA to Treasury.
            </p>
          </div>

          {/* Recent payouts table */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Recent Creator Payouts</p>
            <div className="space-y-2">
              {[
                { amount: "0.045 SOL", source: "Apollo Pro Assessment", time: "2m ago" },
                { amount: "0.0075 SOL", source: "Apollo Basic Assessment", time: "15m ago" },
                { amount: "0.30 SOL", source: "Hermes Pro Subscription", time: "1h ago" },
                { amount: "0.75 SOL", source: "Apollo Institutional", time: "3h ago" },
                { amount: "1.50 SOL", source: "Hermes Protocol Subscription", time: "1d ago" },
              ].map((payout, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-sm font-medium tabular-nums">{payout.amount}</span>
                    <span className="text-xs text-gray-400">{payout.source}</span>
                  </div>
                  <span className="text-xs text-gray-600">{payout.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Disclaimers */}
      <div className="border-t border-white/[0.04] pt-6 mt-8 space-y-2">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Treasury data shown is from devnet beta. Balances, revenue projections, and reserve ratios may differ from mainnet deployment.
          All financial operations are governed by immutable axioms enforced at the smart contract level.
        </p>
      </div>
    </motion.div>
  );
}
