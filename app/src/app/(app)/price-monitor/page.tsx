// ---------------------------------------------------------------------------
// AXIONBLADE Price Monitor — Autonomous Daily AI Price Adjustment Engine
// ---------------------------------------------------------------------------
// Displays the live status of the AI pricing engine: current prices for all
// services, demand signals, next adjustment countdown, and recent adjustment
// history.
//
// Data flow:
//   • Polls GET /api/price-monitor every 30s for live prices (random-walk ±5%)
//   • Polls GET /api/price-monitor/history every 60s for adjustment log
//   • Countdown timer ticks every second using the nextAdjustment timestamp
//
// Colour-coding per price status:
//   "target"       green  — at 200% margin ceiling, high demand
//   "interpolated" amber  — between floor and target, moderate demand
//   "floor"        red    — at 100% margin floor, low demand
// ---------------------------------------------------------------------------

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { GlassCard } from "@/components/atoms/GlassCard";

// ---------------------------------------------------------------------------
// API response types (mirrors the shapes returned by route.ts files)
// ---------------------------------------------------------------------------

interface ServicePrice {
  serviceId: string;
  displayName: string;
  currentPrice: number;
  baseCost: number;
  floorPrice: number;
  targetPrice: number;
  margin: number; // percentage, e.g. 150.0
  lastAdjusted: string;
  nextAdjustment: string;
  lastDemandScore: number;
  priceStatus: "target" | "interpolated" | "floor";
}

interface PriceMonitorResponse {
  ok: boolean;
  fetchedAt: string;
  count: number;
  services: ServicePrice[];
}

interface AdjustmentChange {
  serviceId: string;
  displayName: string;
  oldPrice: number;
  newPrice: number;
  demand: number;
}

interface AdjustmentRecord {
  id: number;
  adjustedAt: string;
  changes: AdjustmentChange[];
  servicesAdjusted: number;
}

interface HistoryResponse {
  ok: boolean;
  fetchedAt: string;
  count: number;
  totalServicesChanged: number;
  history: AdjustmentRecord[];
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatSol(value: number): string {
  if (value < 0.001) return `${(value * 1_000_000).toFixed(0)} lamps`;
  return `${value.toFixed(6)} SOL`;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

/**
 * Compute a human-readable countdown string from now to a target ISO timestamp.
 * Returns "—" if the target is in the past or invalid.
 */
function computeCountdown(targetIso: string): string {
  try {
    const remaining = new Date(targetIso).getTime() - Date.now();
    if (remaining <= 0) return "Now";
    const totalSeconds = Math.floor(remaining / 1_000);
    const h = Math.floor(totalSeconds / 3_600);
    const m = Math.floor((totalSeconds % 3_600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  } catch {
    return "—";
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Animated pulse dot — used for "Live" indicators. */
function LiveDot({ color = "bg-emerald-400" }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

/** Demand bar — thin horizontal fill from 0 to 100%. */
function DemandBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 70 ? "bg-emerald-400" :
    pct >= 40 ? "bg-amber-400"   :
                "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs text-gray-500 w-9 text-right">{pct}%</span>
    </div>
  );
}

/** Status pill with colour and icon. */
function StatusPill({ status }: { status: ServicePrice["priceStatus"] }) {
  const configs = {
    target: {
      label:  "Target",
      bg:     "bg-emerald-500/15",
      text:   "text-emerald-400",
      border: "border-emerald-500/30",
      icon:   <CheckCircle2 size={10} />,
    },
    interpolated: {
      label:  "Mid",
      bg:     "bg-amber-500/15",
      text:   "text-amber-400",
      border: "border-amber-500/30",
      icon:   <Minus size={10} />,
    },
    floor: {
      label:  "Floor",
      bg:     "bg-red-500/15",
      text:   "text-red-400",
      border: "border-red-500/30",
      icon:   <AlertTriangle size={10} />,
    },
  };
  const c = configs[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${c.bg} ${c.text} ${c.border}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function PriceMonitorPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [services, setServices]         = useState<ServicePrice[]>([]);
  const [history, setHistory]           = useState<AdjustmentRecord[]>([]);
  const [totalAdjustments, setTotalAdj] = useState(0);
  const [countdown, setCountdown]       = useState("—");
  const [nextAdjTs, setNextAdjTs]       = useState<string | null>(null);
  const [lastFetch, setLastFetch]       = useState<string | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [hasError, setHasError]         = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track the earliest "lastAdjusted" across all services for the status strip
  const lastAdjustedRef = useRef<string | null>(null);

  // ── Data fetchers ─────────────────────────────────────────────────────────

  const fetchPrices = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch("/api/price-monitor", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PriceMonitorResponse = await res.json();

      if (data.ok && data.services.length > 0) {
        setServices(data.services);
        setHasError(false);
        setLastFetch(data.fetchedAt);

        // Use the nextAdjustment from the first service (all share the same cadence)
        const next = data.services[0]?.nextAdjustment ?? null;
        setNextAdjTs(next);

        // Track last adjusted timestamp
        const lastAdj = data.services
          .map((s) => s.lastAdjusted)
          .sort()
          .at(-1) ?? null;
        lastAdjustedRef.current = lastAdj;
      }
    } catch (err) {
      console.error("[PriceMonitor] fetchPrices error:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/price-monitor/history", { cache: "no-store" });
      if (!res.ok) return;
      const data: HistoryResponse = await res.json();
      if (data.ok) {
        setHistory(data.history);
        setTotalAdj(data.count);
      }
    } catch (err) {
      console.error("[PriceMonitor] fetchHistory error:", err);
    }
  }, []);

  // ── Countdown ticker ──────────────────────────────────────────────────────

  useEffect(() => {
    const tick = () => {
      if (nextAdjTs) setCountdown(computeCountdown(nextAdjTs));
    };
    tick(); // immediate
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [nextAdjTs]);

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    void fetchPrices(false);
    void fetchHistory();
  }, [fetchPrices, fetchHistory]);

  // ── Auto-refresh: prices every 30s, history every 60s ────────────────────

  useEffect(() => {
    const priceTimer   = setInterval(() => void fetchPrices(true), 30_000);
    const historyTimer = setInterval(() => void fetchHistory(),     60_000);
    return () => {
      clearInterval(priceTimer);
      clearInterval(historyTimer);
    };
  }, [fetchPrices, fetchHistory]);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const atTarget       = services.filter((s) => s.priceStatus === "target").length;
  const atFloor        = services.filter((s) => s.priceStatus === "floor").length;
  const atInterpolated = services.filter((s) => s.priceStatus === "interpolated").length;
  const avgMargin      = services.length > 0
    ? services.reduce((sum, s) => sum + s.margin, 0) / services.length
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 relative">
      {/* Ambient background blobs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between flex-wrap gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Activity className="w-6 h-6 text-cyan-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                AI Price Monitor
              </h1>
            </div>
            <p className="text-gray-400 text-lg">
              Autonomous daily reajustment cycle
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Prices adjust between floor (cost&nbsp;&times;&nbsp;2.0) and target (cost&nbsp;&times;&nbsp;3.0) based on 24h demand signals
            </p>
          </div>

          {/* Manual refresh button */}
          <button
            type="button"
            onClick={() => { void fetchPrices(false); void fetchHistory(); }}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all text-sm disabled:opacity-50"
            aria-label="Refresh price data"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </motion.div>
      </div>

      {/* ── Status strip ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10"
      >
        <GlassCard gradient="cyan" hover={false}>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Next adjustment countdown */}
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Next Adjustment
                </p>
                <p className="text-lg font-mono font-bold text-white">
                  {countdown}
                </p>
              </div>
            </div>

            {/* Last adjusted */}
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Last Adjusted
                </p>
                <p className="text-sm font-semibold text-white">
                  {lastAdjustedRef.current
                    ? formatTimestamp(lastAdjustedRef.current)
                    : "—"}
                </p>
              </div>
            </div>

            {/* Total adjustments today */}
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Adjustments (24h)
                </p>
                <p className="text-lg font-bold text-white">{totalAdjustments}</p>
              </div>
            </div>

            {/* Live data freshness */}
            <div className="flex items-center gap-3">
              <div className="mt-0.5">
                <LiveDot />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Data Source
                </p>
                <p className="text-sm font-semibold text-emerald-400">
                  Live · auto-refresh 30s
                </p>
                {lastFetch && (
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {formatTimestamp(lastFetch)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── Summary stats row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        {[
          {
            label:  "At Target (200%)",
            value:  atTarget,
            color:  "text-emerald-400",
            bg:     "gradient-emerald" as const,
            icon:   <TrendingUp size={18} className="text-emerald-400" />,
          },
          {
            label:  "Interpolated",
            value:  atInterpolated,
            color:  "text-amber-400",
            bg:     "gradient-amber" as const,
            icon:   <Minus size={18} className="text-amber-400" />,
          },
          {
            label:  "At Floor (100%)",
            value:  atFloor,
            color:  "text-red-400",
            bg:     "gradient-rose" as const,
            icon:   <TrendingDown size={18} className="text-red-400" />,
          },
          {
            label:  "Avg Margin",
            value:  `${avgMargin.toFixed(1)}%`,
            color:  "text-cyan-400",
            bg:     "gradient-cyan" as const,
            icon:   <Activity size={18} className="text-cyan-400" />,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
          >
            <GlassCard gradient={
              stat.bg === "gradient-emerald" ? "emerald" :
              stat.bg === "gradient-amber"   ? "amber"   :
              stat.bg === "gradient-rose"    ? "rose"    :
              "cyan"
            } hover>
              <div className="p-4 flex items-center gap-3">
                <div className="shrink-0">{stat.icon}</div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {isLoading ? "—" : stat.value}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            <AlertTriangle size={16} />
            Failed to fetch live prices. Retrying automatically every 30s.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Price table ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10"
      >
        <GlassCard gradient="cyan" hover={false}>
          <div className="p-6">
            {/* Table header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Live Service Prices</h2>
                <LiveDot />
              </div>
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                {services.length} services · random walk ±5% between cron cycles
              </span>
            </div>

            {/* Scrollable table wrapper */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {[
                      "Service",
                      "Cost",
                      "Floor (100%)",
                      "Target (200%)",
                      "Live Price",
                      "Margin",
                      "Demand",
                      "Status",
                      "Last Change",
                    ].map((h) => (
                      <th
                        key={h}
                        className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600 pr-4 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.04]">
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 9 }).map((__, j) => (
                            <td key={j} className="py-3 pr-4">
                              <div className="h-3 bg-white/[0.05] rounded w-16" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : services.map((service, idx) => {
                        const livePriceColor =
                          service.priceStatus === "target"
                            ? "text-emerald-400"
                            : service.priceStatus === "floor"
                            ? "text-red-400"
                            : "text-amber-400";

                        return (
                          <motion.tr
                            key={service.serviceId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.04 }}
                            className="group hover:bg-white/[0.02] transition-colors"
                          >
                            {/* Service name */}
                            <td className="py-3 pr-4">
                              <span className="font-medium text-white">
                                {service.displayName}
                              </span>
                            </td>

                            {/* Cost */}
                            <td className="py-3 pr-4 text-gray-500 font-mono text-xs">
                              {formatSol(service.baseCost)}
                            </td>

                            {/* Floor (100% margin) */}
                            <td className="py-3 pr-4 text-gray-400 font-mono text-xs">
                              {formatSol(service.floorPrice)}
                            </td>

                            {/* Target (200% margin) */}
                            <td className="py-3 pr-4 text-gray-400 font-mono text-xs">
                              {formatSol(service.targetPrice)}
                            </td>

                            {/* Live price — colour-coded */}
                            <td className="py-3 pr-4">
                              <span className={`font-mono text-xs font-semibold ${livePriceColor}`}>
                                {formatSol(service.currentPrice)}
                              </span>
                            </td>

                            {/* Margin % */}
                            <td className="py-3 pr-4">
                              <span className={`text-xs font-semibold ${livePriceColor}`}>
                                {service.margin.toFixed(1)}%
                              </span>
                            </td>

                            {/* Demand bar */}
                            <td className="py-3 pr-4">
                              <DemandBar score={service.lastDemandScore} />
                            </td>

                            {/* Status pill */}
                            <td className="py-3 pr-4">
                              <StatusPill status={service.priceStatus} />
                            </td>

                            {/* Last adjusted */}
                            <td className="py-3 pr-4 text-gray-600 text-xs whitespace-nowrap">
                              {formatTimestamp(service.lastAdjusted)}
                            </td>
                          </motion.tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── Recent adjustment log ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10"
      >
        <GlassCard gradient="purple" hover={false}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Recent Adjustment Log
              </h2>
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                Last 5 of {totalAdjustments} within 24h
              </span>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">
                  No adjustments in the last 24h yet.
                </p>
                <p className="text-gray-700 text-xs mt-1">
                  The cron job runs once daily. First adjustment
                  will appear after the initial Vercel invocation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.slice(0, 5).map((record, i) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`pb-4 ${i < Math.min(history.length, 5) - 1 ? "border-b border-white/[0.06]" : ""}`}
                  >
                    {/* Record header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-400 font-semibold">
                          Adjustment #{record.id}
                        </span>
                        <span className="text-[10px] text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
                          {record.servicesAdjusted} price{record.servicesAdjusted !== 1 ? "s" : ""} changed
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {formatTimestamp(record.adjustedAt)}
                      </span>
                    </div>

                    {/* Per-service changes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {record.changes.slice(0, 6).map((change) => {
                        const moved    = change.newPrice !== change.oldPrice;
                        const increased = change.newPrice > change.oldPrice;

                        return (
                          <div
                            key={change.serviceId}
                            className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2"
                          >
                            <span className="text-xs text-gray-400">
                              {change.displayName}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-mono">
                              {moved ? (
                                <>
                                  <span className="text-gray-600">
                                    {formatSol(change.oldPrice)}
                                  </span>
                                  {increased
                                    ? <TrendingUp size={10} className="text-emerald-400" />
                                    : <TrendingDown size={10} className="text-red-400" />}
                                  <span className={increased ? "text-emerald-400" : "text-red-400"}>
                                    {formatSol(change.newPrice)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-600">
                                  {formatSol(change.newPrice)} (unchanged)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* ── Engine info ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title:  "Demand Engine",
              body:   "60% weight on 24h request volume, 40% weight on 7-day trend. Simulated via Poisson-distributed noise around service baselines until on-chain analytics PDA is live.",
              color:  "text-cyan-400",
            },
            {
              title:  "Price Bands",
              body:   "floor = cost × 2.0 (100% margin). target = cost × 3.0 (200% margin). Score ≥ 0.70 → target. Score < 0.40 → floor. 0.40–0.70 → linear interpolation.",
              color:  "text-emerald-400",
            },
            {
              title:  "Safety Envelope",
              body:   "Price can never go below floor — equivalent to axiom A0-8 (cost + 20% minimum). The daily cron runs as a Vercel scheduled function secured by CRON_SECRET.",
              color:  "text-amber-400",
            },
          ].map((info) => (
            <div
              key={info.title}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4"
            >
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${info.color}`}>
                {info.title}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">{info.body}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
