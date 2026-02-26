"use client";

// ---------------------------------------------------------------------------
// AXIONBLADE Liquidation Danger Scanner
// Loan health monitoring with stress testing and volatility analysis
// Price: 0.006 SOL per scan | Tier: Pro
// ---------------------------------------------------------------------------

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/atoms/GlassCard";
import { Badge } from "@/components/atoms/Badge";
import {
  AlertTriangle,
  Wallet,
  Loader2,
  Copy,
  Check,
  ShieldAlert,
  Activity,
  TrendingDown,
  Zap,
  BarChart3,
  Lock,
  CheckCircle2,
  XCircle,
  Skull,
  ChevronDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types (mirrored from API route)
// ---------------------------------------------------------------------------

type Protocol = "marginfi" | "kamino" | "solend" | "drift";
type RiskLevel = "low" | "medium" | "high" | "critical";

interface LoanPosition {
  asset: string;
  collateralUSD: number;
  debtUSD: number;
  ltv: number;
  liquidationThreshold: number;
  healthFactor: number;
  priceDropToLiquidation: number;
}

interface StressTest {
  scenario: string;
  priceDropPct: number;
  resultingLTV: number;
  liquidated: boolean;
  estimatedLoss: number;
  survivingPositions: number;
}

interface LiquidationAlert {
  severity: "warning" | "critical";
  message: string;
  asset: string;
  healthFactor: number;
}

interface VolatilityWindow {
  avgVolatility: number;
  maxDrawdown: number;
  liquidationRisk: RiskLevel;
}

interface LiquidationScanResult {
  walletAddress: string;
  protocol: Protocol;
  positions: LoanPosition[];
  portfolioHealth: number;
  totalCollateralUSD: number;
  totalDebtUSD: number;
  globalLTV: number;
  liquidationLTV: number;
  safetyBuffer: number;
  volatilityAnalysis: {
    "7d": VolatilityWindow;
    "14d": VolatilityWindow;
    "30d": VolatilityWindow;
  };
  stressTests: StressTest[];
  alerts: LiquidationAlert[];
  scanTimestamp: number;
  proofHash: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROTOCOLS: { id: Protocol; label: string; desc: string }[] = [
  { id: "marginfi", label: "MarginFi", desc: "Peer-to-peer margin trading" },
  { id: "kamino", label: "Kamino", desc: "Automated liquidity vaults" },
  { id: "solend", label: "Solend", desc: "Algorithmic money market" },
  { id: "drift", label: "Drift", desc: "Perpetuals & spot lending" },
];

const SCAN_PRICE_SOL = 0.006;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function healthLabel(health: number): { label: string; color: string; bg: string } {
  if (health >= 80) return { label: "Safe", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
  if (health >= 60) return { label: "Monitor", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
  if (health >= 40) return { label: "Warning", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" };
  return { label: "Critical — Liquidation Risk", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" };
}

function riskLevelStyle(level: RiskLevel): { color: string; badge: string } {
  switch (level) {
    case "low":      return { color: "text-emerald-400", badge: "success" };
    case "medium":   return { color: "text-amber-400",   badge: "warning" };
    case "high":     return { color: "text-orange-400",  badge: "warning" };
    case "critical": return { color: "text-rose-400",    badge: "danger"  };
  }
}

function hfColor(hf: number): string {
  if (hf >= 2.0) return "text-emerald-400";
  if (hf >= 1.5) return "text-cyan-400";
  if (hf >= 1.3) return "text-amber-400";
  if (hf >= 1.1) return "text-orange-400";
  return "text-rose-400";
}

function fmtUSD(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtPct(n: number): string {
  return n.toFixed(2) + "%";
}

function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Large animated health gauge ring */
function HealthGauge({ health }: { health: number }) {
  const size = 180;
  const strokeW = 12;
  const radius = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * radius;
  const progress = (health / 100) * circ;
  const { label, color } = healthLabel(health);

  const strokeColor =
    health >= 80 ? "#10b981" :
    health >= 60 ? "#f59e0b" :
    health >= 40 ? "#f97316" : "#f43f5e";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeW}
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={strokeColor}
            strokeWidth={strokeW} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - progress }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {health}
          </motion.span>
          <span className="text-xs text-gray-500 mt-0.5">/100</span>
        </div>
      </div>
      <span className={cn("text-sm font-semibold", color)}>{label}</span>
    </div>
  );
}

/** Volatility card (7d / 14d / 30d) */
function VolatilityCard({
  window: win,
  data,
  delay,
}: {
  window: "7d" | "14d" | "30d";
  data: VolatilityWindow;
  delay: number;
}) {
  const { color, badge } = riskLevelStyle(data.liquidationRisk);
  const barWidth = Math.min(100, (data.avgVolatility / 50) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <GlassCard gradient="cyan" hover={false} className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{win} Window</span>
          <Badge variant={badge as "success" | "warning" | "danger"} className="text-[10px] capitalize">
            {data.liquidationRisk}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Avg Volatility</span>
            <span className={cn("font-mono font-semibold", color)}>{data.avgVolatility.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                data.liquidationRisk === "low" ? "bg-emerald-500" :
                data.liquidationRisk === "medium" ? "bg-amber-500" :
                data.liquidationRisk === "high" ? "bg-orange-500" : "bg-rose-500"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ delay: delay + 0.2, duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Max Drawdown</span>
          <span className="font-mono font-semibold text-rose-400">-{data.maxDrawdown.toFixed(1)}%</span>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/** Loan positions table row */
function PositionRow({ pos, index }: { pos: LoanPosition; index: number }) {
  const riskBg =
    pos.healthFactor < 1.1 ? "bg-rose-500/5 border-l-2 border-l-rose-500" :
    pos.healthFactor < 1.3 ? "bg-amber-500/5 border-l-2 border-l-amber-500" :
    "bg-transparent";

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className={cn("border-b border-white/[0.04] last:border-0", riskBg)}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-gray-400">
            {pos.asset.slice(0, 2)}
          </div>
          <span className="text-sm font-semibold text-white">{pos.asset}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-300 font-mono">{fmtUSD(pos.collateralUSD)}</td>
      <td className="py-3 px-4 text-sm text-gray-300 font-mono">{fmtUSD(pos.debtUSD)}</td>
      <td className="py-3 px-4 text-sm font-mono text-cyan-400">{fmtPct(pos.ltv)}</td>
      <td className="py-3 px-4 text-sm font-mono text-gray-400">{fmtPct(pos.liquidationThreshold * 100)}</td>
      <td className="py-3 px-4">
        <span className={cn("text-sm font-bold font-mono", hfColor(pos.healthFactor))}>
          {pos.healthFactor.toFixed(3)}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={cn(
          "text-sm font-mono font-semibold",
          pos.priceDropToLiquidation < 15 ? "text-rose-400" :
          pos.priceDropToLiquidation < 30 ? "text-amber-400" : "text-emerald-400"
        )}>
          -{pos.priceDropToLiquidation.toFixed(1)}%
        </span>
      </td>
    </motion.tr>
  );
}

/** Stress test table row */
function StressRow({ test, index }: { test: StressTest; index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={cn(
        "border-b border-white/[0.04] last:border-0",
        test.liquidated ? "bg-rose-500/[0.05]" : "bg-emerald-500/[0.03]"
      )}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {test.liquidated ? (
            <Skull size={13} className="text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
          )}
          <span className="text-sm text-gray-300">{test.scenario}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm font-mono font-semibold text-rose-400">-{test.priceDropPct}%</span>
      </td>
      <td className="py-3 px-4">
        <span className={cn(
          "text-sm font-mono font-semibold",
          test.liquidated ? "text-rose-400" : "text-cyan-400"
        )}>
          {fmtPct(test.resultingLTV)}
        </span>
      </td>
      <td className="py-3 px-4">
        {test.liquidated ? (
          <Badge variant="danger" className="text-[10px]">Liquidated</Badge>
        ) : (
          <Badge variant="success" className="text-[10px]">Survived</Badge>
        )}
      </td>
      <td className="py-3 px-4">
        <span className={cn(
          "text-sm font-mono",
          test.estimatedLoss > 0 ? "text-rose-400 font-semibold" : "text-emerald-400"
        )}>
          {test.estimatedLoss > 0 ? `-${fmtUSD(test.estimatedLoss)}` : "—"}
        </span>
      </td>
    </motion.tr>
  );
}

/** Loading skeleton */
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[180, 120, 100, 140].map((h, i) => (
        <div
          key={i}
          className="rounded-xl bg-white/[0.03] border border-white/[0.05]"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function LiquidationScannerPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [protocol, setProtocol] = useState<Protocol>("marginfi");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LiquidationScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [protocolOpen, setProtocolOpen] = useState(false);

  const selectedProtocol = PROTOCOLS.find((p) => p.id === protocol)!;

  const handleScan = useCallback(async () => {
    if (!walletAddress) {
      setError("Enter a Solana wallet address to scan.");
      return;
    }
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      setError("Invalid Solana address format (base-58, 32–44 characters).");
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/liquidation-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, protocol }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Scan failed. Please try again.");
      }

      const data: LiquidationScanResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setLoading(false);
    }
  }, [walletAddress, protocol]);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const handleCopyHash = useCallback(() => {
    if (result?.proofHash) {
      navigator.clipboard.writeText(result.proofHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Derived
  const healthInfo = result ? healthLabel(result.portfolioHealth) : null;
  const criticalAlerts = result?.alerts.filter((a) => a.severity === "critical") ?? [];
  const warningAlerts = result?.alerts.filter((a) => a.severity === "warning") ?? [];

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/25 bg-gradient-to-r from-rose-500/10 via-transparent to-transparent p-6">
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-rose-400" />
              </div>
              <div>
                <div className="text-xs text-rose-400 font-medium tracking-wide">AXIONBLADE Loan Monitor</div>
                <h1 className="text-2xl font-bold text-white">Liquidation Scanner</h1>
              </div>
            </div>
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              Real-time loan health monitoring with stress testing and volatility analysis across MarginFi, Kamino, Solend, and Drift.
            </p>
          </div>
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
            <span className="inline-flex items-center rounded-full px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold gap-1.5">
              <Zap size={13} />
              {SCAN_PRICE_SOL} SOL
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-1 bg-white/[0.05] text-gray-400 text-[10px] font-medium gap-1">
              <Lock size={10} />
              Pro Tier
            </span>
          </div>
        </div>
      </div>

      {/* ── Input Form ──────────────────────────────────────────────────────── */}
      {!result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="rounded-2xl border border-[#1A2235] bg-[#0A0E17] p-6 space-y-5"
        >
          {/* Wallet input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet Address
            </label>
            <div className="relative">
              <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => { setWalletAddress(e.target.value); setError(null); }}
                placeholder="Enter Solana wallet address (base-58)…"
                disabled={loading}
                className="w-full rounded-xl bg-[#050810] border border-[#1A2235] pl-9 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 transition-all font-mono disabled:opacity-50"
              />
            </div>
          </div>

          {/* Protocol selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Protocol
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProtocolOpen((o) => !o)}
                disabled={loading}
                className="w-full flex items-center justify-between rounded-xl bg-[#050810] border border-[#1A2235] px-4 py-3 text-sm text-white hover:border-rose-500/30 transition-colors disabled:opacity-50"
              >
                <span className="font-medium">{selectedProtocol.label}</span>
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="text-xs">{selectedProtocol.desc}</span>
                  <ChevronDown size={14} className={cn("transition-transform", protocolOpen && "rotate-180")} />
                </div>
              </button>
              <AnimatePresence>
                {protocolOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-1 left-0 right-0 z-20 rounded-xl border border-[#1A2235] bg-[#0A0E17] shadow-2xl overflow-hidden"
                  >
                    {PROTOCOLS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setProtocol(p.id); setProtocolOpen(false); }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-white/[0.04]",
                          p.id === protocol ? "text-rose-400 bg-rose-500/5" : "text-gray-300"
                        )}
                      >
                        <span className="font-medium">{p.label}</span>
                        <span className="text-xs text-gray-500">{p.desc}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400"
              >
                <XCircle size={15} className="shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scan button */}
          <button
            type="button"
            onClick={handleScan}
            disabled={loading || !walletAddress}
            className={cn(
              "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
              walletAddress && !loading
                ? "bg-rose-500 hover:bg-rose-500/90 text-white"
                : "bg-white/[0.05] text-gray-600 cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <AlertTriangle size={15} />
                Scan Now ({SCAN_PRICE_SOL} SOL)
              </>
            )}
          </button>

          {/* Feature pills */}
          <div className="pt-3 border-t border-white/[0.04] flex flex-wrap gap-2">
            {[
              "Health factor monitoring",
              "Volatility 7/14/30d",
              "Stress test simulations",
              "Liquidation price alerts",
              "On-chain proof hash",
            ].map((f) => (
              <span
                key={f}
                className="inline-flex items-center rounded-full px-3 py-1 bg-white/[0.03] border border-white/[0.06] text-xs text-gray-500 gap-1.5"
              >
                <CheckCircle2 size={9} className="text-rose-400" />
                {f}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────────── */}
      {loading && <LoadingSkeleton />}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            {/* Top bar: back + timestamp */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                &larr; New Scan
              </button>
              <span className="text-xs text-gray-600 font-mono">
                {new Date(result.scanTimestamp).toLocaleString()} &mdash; {selectedProtocol.label} &mdash; {truncate(result.walletAddress)}
              </span>
            </motion.div>

            {/* Alerts feed — shown first if any */}
            {result.alerts.length > 0 && (
              <motion.div variants={itemVariants} className="space-y-2">
                {criticalAlerts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3"
                  >
                    <Skull size={16} className="text-rose-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">Critical Alert</span>
                      <p className="text-sm text-rose-300 mt-0.5">{a.message}</p>
                    </div>
                    <span className="text-xs text-rose-500 font-mono shrink-0">HF {a.healthFactor.toFixed(3)}</span>
                  </div>
                ))}
                {warningAlerts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3"
                  >
                    <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Warning</span>
                      <p className="text-sm text-amber-300/80 mt-0.5">{a.message}</p>
                    </div>
                    <span className="text-xs text-amber-500 font-mono shrink-0">HF {a.healthFactor.toFixed(3)}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* A) Portfolio Health Overview */}
            <motion.div variants={itemVariants}>
              <GlassCard gradient="rose" hover={false} className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <ShieldAlert size={18} className="text-rose-400" />
                  <h2 className="text-base font-bold text-white">Portfolio Health</h2>
                </div>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  <HealthGauge health={result.portfolioHealth} />

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    <div className="rounded-xl bg-black/20 border border-white/[0.05] px-4 py-3">
                      <p className="text-xs text-gray-500 mb-1">Total Collateral</p>
                      <p className="text-lg font-bold text-emerald-400 font-mono">{fmtUSD(result.totalCollateralUSD)}</p>
                    </div>
                    <div className="rounded-xl bg-black/20 border border-white/[0.05] px-4 py-3">
                      <p className="text-xs text-gray-500 mb-1">Total Debt</p>
                      <p className="text-lg font-bold text-rose-400 font-mono">{fmtUSD(result.totalDebtUSD)}</p>
                    </div>
                    <div className="rounded-xl bg-black/20 border border-white/[0.05] px-4 py-3">
                      <p className="text-xs text-gray-500 mb-1">Current LTV</p>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-lg font-bold text-cyan-400 font-mono">{fmtPct(result.globalLTV)}</p>
                        <span className="text-xs text-gray-600">/ {fmtPct(result.liquidationLTV)} liq</span>
                      </div>
                    </div>
                    <div className={cn(
                      "rounded-xl border px-4 py-3",
                      result.safetyBuffer < 5 ? "bg-rose-500/10 border-rose-500/20" :
                      result.safetyBuffer < 12 ? "bg-amber-500/10 border-amber-500/20" :
                      "bg-emerald-500/10 border-emerald-500/20"
                    )}>
                      <p className="text-xs text-gray-500 mb-1">Safety Buffer</p>
                      <p className={cn(
                        "text-lg font-bold font-mono",
                        result.safetyBuffer < 5 ? "text-rose-400" :
                        result.safetyBuffer < 12 ? "text-amber-400" : "text-emerald-400"
                      )}>
                        {result.safetyBuffer > 0 ? "+" : ""}{fmtPct(result.safetyBuffer)}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* B) Loan Positions Table */}
            <motion.div variants={itemVariants}>
              <GlassCard gradient="cyan" hover={false} className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={17} className="text-cyan-400" />
                  <h2 className="text-base font-bold text-white">Loan Positions</h2>
                  <span className="text-xs text-gray-600 ml-auto">{result.positions.length} positions</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[640px]">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {["Asset", "Collateral", "Debt", "Current LTV", "Liq. Threshold", "Health Factor", "Drop to Liq."].map((h) => (
                          <th key={h} className="py-2 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.positions.map((pos, i) => (
                        <PositionRow key={pos.asset} pos={pos} index={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-600 mt-3">
                  Health Factor &gt; 1 = safe. Below 1.0 = immediate liquidation risk.
                </p>
              </GlassCard>
            </motion.div>

            {/* C) Volatility Analysis — 3 cards */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-cyan-400" />
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Volatility Analysis</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <VolatilityCard window="7d"  data={result.volatilityAnalysis["7d"]}  delay={0.1} />
                <VolatilityCard window="14d" data={result.volatilityAnalysis["14d"]} delay={0.2} />
                <VolatilityCard window="30d" data={result.volatilityAnalysis["30d"]} delay={0.3} />
              </div>
            </motion.div>

            {/* D) Stress Test Simulator */}
            <motion.div variants={itemVariants}>
              <GlassCard gradient="amber" hover={false} className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={17} className="text-amber-400" />
                  <h2 className="text-base font-bold text-white">Stress Test Simulator</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[560px]">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {["Scenario", "Price Drop", "Resulting LTV", "Status", "Est. Loss"].map((h) => (
                          <th key={h} className="py-2 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.stressTests.map((test, i) => (
                        <StressRow key={test.scenario} test={test} index={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-600 mt-3">
                  Stress tests simulate uniform price drops applied to all non-stablecoin collateral assets.
                </p>
              </GlassCard>
            </motion.div>

            {/* E) Alerts feed recap (if none, show clean state) */}
            {result.alerts.length === 0 && (
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-400">
                    No active alerts. All positions are within safe health factor ranges.
                  </p>
                </div>
              </motion.div>
            )}

            {/* F) Proof hash */}
            <motion.div variants={itemVariants}>
              <div className="rounded-xl border border-white/[0.06] bg-[#050810] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Lock size={12} className="text-cyan-400 shrink-0" />
                  <span className="text-xs text-gray-500 shrink-0">SHA-256:</span>
                  <span className="text-xs text-gray-400 font-mono truncate">{result.proofHash}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-cyan-400 transition-colors shrink-0"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Info cards when idle ─────────────────────────────────────────────── */}
      {!result && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            {
              icon: ShieldAlert,
              color: "text-rose-400",
              bg: "bg-rose-500/10",
              title: "Real-Time Health Monitoring",
              desc: "Track health factors across all your loan positions. Get alerted before you approach the liquidation threshold.",
            },
            {
              icon: TrendingDown,
              color: "text-amber-400",
              bg: "bg-amber-500/10",
              title: "Stress Test Simulations",
              desc: "Model -10%, -20%, -40%, and -60% price crashes. See exactly which positions survive and estimate potential losses.",
            },
            {
              icon: BarChart3,
              color: "text-cyan-400",
              bg: "bg-cyan-500/10",
              title: "7 / 14 / 30d Volatility",
              desc: "Historical volatility windows help you understand how close your safety buffer is to realistic market drawdowns.",
            },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="rounded-2xl border border-[#1A2235] bg-[#0A0E17] p-5 space-y-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.06]", bg)}>
                <Icon size={20} className={color} />
              </div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
