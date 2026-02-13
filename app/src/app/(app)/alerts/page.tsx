"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Bell, Share2, ChevronDown, Rss } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Severity = "critical" | "warning" | "info" | "stable";

interface Alert {
  id: string;
  severity: Severity;
  text: string;
  detail: string;
  pool: string;
  protocol: string;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/*  Severity config                                                    */
/* ------------------------------------------------------------------ */

const severityConfig: Record<Severity, { color: string; label: string }> = {
  critical: { color: "bg-[#EF4444]", label: "Critical" },
  warning:  { color: "bg-[#F59E0B]", label: "Warning" },
  info:     { color: "bg-[#00D4FF]", label: "Info" },
  stable:   { color: "bg-[#10B981]", label: "Stable" },
};

/* ------------------------------------------------------------------ */
/*  Mock alerts (25)                                                   */
/* ------------------------------------------------------------------ */

const now = Math.floor(Date.now() / 1000);

const MOCK_ALERTS: Alert[] = [
  {
    id: "alert-01",
    severity: "critical",
    text: "RAY-USDC risk increased from 72 to 58 (-14 points)",
    detail: "Liquidity drop detected \u2014 Top LP concentration increased 23%",
    pool: "RAY-USDC",
    protocol: "Raydium",
    timestamp: now - 120,
  },
  {
    id: "alert-02",
    severity: "critical",
    text: "Yield trap detected on BONK-SOL \u2014 effective APR diverges 68% from headline",
    detail: "Headline APR: 142% | Effective APR: 45% | Incentive decay rate: -12%/day",
    pool: "BONK-SOL",
    protocol: "Raydium",
    timestamp: now - 340,
  },
  {
    id: "alert-03",
    severity: "warning",
    text: "SOL-USDC risk score declined from 89 to 81 (-8 points)",
    detail: "Volume/liquidity ratio dropped below 0.3 threshold for 4 consecutive hours",
    pool: "SOL-USDC",
    protocol: "Orca",
    timestamp: now - 600,
  },
  {
    id: "alert-04",
    severity: "critical",
    text: "Exploit alert: abnormal token flow detected on DRIFT-USDC",
    detail: "Single wallet withdrew 34% of pool liquidity in 2 transactions within 90 seconds",
    pool: "DRIFT-USDC",
    protocol: "Drift",
    timestamp: now - 780,
  },
  {
    id: "alert-05",
    severity: "info",
    text: "New pool indexed: JUP-USDC on Orca Whirlpool",
    detail: "Initial risk assessment queued \u2014 expected completion in ~15 minutes",
    pool: "JUP-USDC",
    protocol: "Orca",
    timestamp: now - 960,
  },
  {
    id: "alert-06",
    severity: "warning",
    text: "mSOL-SOL incentive rewards declining \u2014 projected 40% reduction in 7 days",
    detail: "Incentive family score dropped from 78 to 62. Emission schedule reduction confirmed",
    pool: "mSOL-SOL",
    protocol: "Marinade",
    timestamp: now - 1200,
  },
  {
    id: "alert-07",
    severity: "stable",
    text: "SOL-USDC has maintained Low Risk status for 14 consecutive days",
    detail: "All 5 evidence families scoring above 80. Proof trail: 336 assessments verified",
    pool: "SOL-USDC",
    protocol: "Orca",
    timestamp: now - 1500,
  },
  {
    id: "alert-08",
    severity: "info",
    text: "Risk assessment completed for JitoSOL-SOL \u2014 Score: 84 (Low Risk)",
    detail: "Evidence families: Price 88, Liquidity 82, Behavior 79, Incentive 86, Protocol 85",
    pool: "JitoSOL-SOL",
    protocol: "Jito",
    timestamp: now - 1800,
  },
  {
    id: "alert-09",
    severity: "warning",
    text: "RAY-USDC liquidity dropped 18% in the last 6 hours",
    detail: "3 large LPs exited positions totaling $2.1M. Concentration risk elevated",
    pool: "RAY-USDC",
    protocol: "Raydium",
    timestamp: now - 2100,
  },
  {
    id: "alert-10",
    severity: "critical",
    text: "BONK-SOL risk score collapsed from 65 to 41 (-24 points)",
    detail: "Behavior family anomaly: wash trading pattern detected across 12 wallets",
    pool: "BONK-SOL",
    protocol: "Raydium",
    timestamp: now - 2400,
  },
  {
    id: "alert-11",
    severity: "stable",
    text: "JUP-USDC risk improved from 71 to 79 (+8 points)",
    detail: "Liquidity depth increased 32% after protocol incentive boost. TVL now $14.2M",
    pool: "JUP-USDC",
    protocol: "Orca",
    timestamp: now - 3000,
  },
  {
    id: "alert-12",
    severity: "info",
    text: "Proof minted for mSOL-SOL assessment \u2014 Block #248,127,493",
    detail: "On-chain proof hash: 7Kx9v...3bPdM. Verification available on Solscan",
    pool: "mSOL-SOL",
    protocol: "Marinade",
    timestamp: now - 3600,
  },
  {
    id: "alert-13",
    severity: "warning",
    text: "DRIFT-USDC risk score increased from 68 to 59 (-9 points)",
    detail: "Protocol family score declined after governance proposal #47 uncertainty",
    pool: "DRIFT-USDC",
    protocol: "Drift",
    timestamp: now - 4200,
  },
  {
    id: "alert-14",
    severity: "critical",
    text: "Major risk increase on RAY-USDC: oracle deviation exceeds 2.5% for 30+ minutes",
    detail: "Price family score dropped to 38. Switchboard vs Pyth spread: 2.8%",
    pool: "RAY-USDC",
    protocol: "Raydium",
    timestamp: now - 4800,
  },
  {
    id: "alert-15",
    severity: "stable",
    text: "JitoSOL-SOL stable for 21 days \u2014 consistently Low Risk",
    detail: "Average score: 85.2. No evidence family has dropped below 75 in 3 weeks",
    pool: "JitoSOL-SOL",
    protocol: "Jito",
    timestamp: now - 5400,
  },
  {
    id: "alert-16",
    severity: "info",
    text: "Assessment completed for BONK-SOL \u2014 Score: 41 (High Risk)",
    detail: "2 of 5 evidence families below threshold. ALERT-ONLY mode activated per A0-10",
    pool: "BONK-SOL",
    protocol: "Raydium",
    timestamp: now - 7200,
  },
  {
    id: "alert-17",
    severity: "warning",
    text: "SOL-USDC volume declined 35% vs 7-day average",
    detail: "Price/Volume family score adjusted from 91 to 79. Monitoring for sustained drop",
    pool: "SOL-USDC",
    protocol: "Orca",
    timestamp: now - 9000,
  },
  {
    id: "alert-18",
    severity: "stable",
    text: "mSOL-SOL risk score recovered from 64 to 73 (+9 points)",
    detail: "New liquidity inflows detected: $890K added by 4 institutional wallets",
    pool: "mSOL-SOL",
    protocol: "Marinade",
    timestamp: now - 10800,
  },
  {
    id: "alert-19",
    severity: "info",
    text: "New pool indexed: DRIFT-USDC on Drift Protocol",
    detail: "Pool added to monitoring queue. Initial taxonomy classification: Tier 2 Perpetual",
    pool: "DRIFT-USDC",
    protocol: "Drift",
    timestamp: now - 14400,
  },
  {
    id: "alert-20",
    severity: "critical",
    text: "Yield trap confirmed on RAY-USDC \u2014 effective APR is 61% below headline",
    detail: "Headline: 89% APR | Effective: 34.7% APR | IL impact: -22% | Fee decay: -32%",
    pool: "RAY-USDC",
    protocol: "Raydium",
    timestamp: now - 18000,
  },
  {
    id: "alert-21",
    severity: "warning",
    text: "JUP-USDC behavior anomaly: unusual swap pattern from 3 linked wallets",
    detail: "Behavior family score declined from 84 to 71. Pattern flagged for manual review",
    pool: "JUP-USDC",
    protocol: "Orca",
    timestamp: now - 21600,
  },
  {
    id: "alert-22",
    severity: "info",
    text: "Proof minted for SOL-USDC assessment \u2014 Block #248,126,201",
    detail: "Score: 81 | Confidence: 94% | All evidence families above minimum threshold",
    pool: "SOL-USDC",
    protocol: "Orca",
    timestamp: now - 28800,
  },
  {
    id: "alert-23",
    severity: "stable",
    text: "BONK-SOL showing early recovery signs \u2014 score up from 41 to 48",
    detail: "Wash trading activity reduced 60%. Liquidity family stabilizing at 52",
    pool: "BONK-SOL",
    protocol: "Raydium",
    timestamp: now - 43200,
  },
  {
    id: "alert-24",
    severity: "warning",
    text: "JitoSOL-SOL liquidity concentration risk elevated \u2014 top 3 LPs hold 67%",
    detail: "Liquidity family score adjusted from 85 to 74. Herfindahl index: 0.18",
    pool: "JitoSOL-SOL",
    protocol: "Jito",
    timestamp: now - 64800,
  },
  {
    id: "alert-25",
    severity: "info",
    text: "New pool indexed: mSOL-SOL on Marinade Finance",
    detail: "Liquid staking pool detected. Initial classification: Tier 1 Staking Derivative",
    pool: "mSOL-SOL",
    protocol: "Marinade",
    timestamp: now - 86400,
  },
];

/* ------------------------------------------------------------------ */
/*  Pools list                                                         */
/* ------------------------------------------------------------------ */

const ALL_POOLS = [
  "All Pools",
  "SOL-USDC",
  "RAY-USDC",
  "BONK-SOL",
  "mSOL-SOL",
  "JUP-USDC",
  "JitoSOL-SOL",
  "DRIFT-USDC",
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

function twitterShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + " via @axionblade_")}`;
}

/* ------------------------------------------------------------------ */
/*  Filter buttons                                                     */
/* ------------------------------------------------------------------ */

const SEVERITY_FILTERS: { key: Severity | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "warning", label: "Warning" },
  { key: "stable", label: "Stable" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [poolFilter, setPoolFilter] = useState("All Pools");

  const filteredAlerts = useMemo(() => {
    return MOCK_ALERTS.filter((alert) => {
      if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
      if (poolFilter !== "All Pools" && alert.pool !== poolFilter) return false;
      return true;
    });
  }, [severityFilter, poolFilter]);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Risk Alerts</h1>
          <p className="text-sm text-gray-400">
            Real-time risk changes across monitored pools
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#00D4FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#00B8D9] transition-colors duration-200">
            <Bell size={14} />
            Subscribe to Alerts
          </button>
          <button
            disabled
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 cursor-not-allowed transition-colors duration-200"
            title="RSS Feed coming soon"
          >
            <Rss size={14} />
            RSS Feed
          </button>
        </div>
      </motion.div>

      {/* Alert Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.03 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: "Critical", count: MOCK_ALERTS.filter(a => a.severity === "critical").length, color: "text-red-400", bg: "bg-red-400/10" },
          { label: "Warning", count: MOCK_ALERTS.filter(a => a.severity === "warning").length, color: "text-yellow-400", bg: "bg-yellow-400/10" },
          { label: "Info", count: MOCK_ALERTS.filter(a => a.severity === "info").length, color: "text-[#00D4FF]", bg: "bg-[#00D4FF]/80/10" },
          { label: "Stable", count: MOCK_ALERTS.filter(a => a.severity === "stable").length, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} border border-white/[0.06] rounded-lg p-3 text-center`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Most Affected Pools */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.07 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-4"
      >
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Most Affected Pools</h3>
        <div className="space-y-2">
          {(() => {
            const poolCounts: Record<string, { total: number; critical: number }> = {};
            MOCK_ALERTS.forEach((a) => {
              if (!poolCounts[a.pool]) poolCounts[a.pool] = { total: 0, critical: 0 };
              poolCounts[a.pool].total++;
              if (a.severity === "critical") poolCounts[a.pool].critical++;
            });
            return Object.entries(poolCounts)
              .sort((a, b) => b[1].total - a[1].total)
              .slice(0, 5)
              .map(([pool, counts]) => (
                <div key={pool} className="flex items-center justify-between">
                  <span className="text-xs text-gray-300 font-medium">{pool}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500">{counts.total} alerts</span>
                    {counts.critical > 0 && (
                      <span className="text-[10px] text-red-400 font-medium">{counts.critical} critical</span>
                    )}
                    <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-400/60"
                        style={{ width: `${(counts.total / MOCK_ALERTS.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ));
          })()}
        </div>
      </motion.div>

      {/* Alert Frequency (24h) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.09 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-4"
      >
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Alert Frequency (24h)</h3>
        <div className="flex items-end gap-1 h-16">
          {Array.from({ length: 24 }, (_, h) => {
            const count = MOCK_ALERTS.filter(a => {
              const hoursAgo = (Date.now() / 1000 - a.timestamp) / 3600;
              return hoursAgo >= h && hoursAgo < h + 1;
            }).length;
            const maxCount = 4;
            const height = count > 0 ? Math.max(8, (count / maxCount) * 64) : 2;
            const hasCritical = MOCK_ALERTS.some(a => {
              const hoursAgo = (Date.now() / 1000 - a.timestamp) / 3600;
              return hoursAgo >= h && hoursAgo < h + 1 && a.severity === "critical";
            });
            return (
              <div
                key={h}
                className={`flex-1 rounded-sm ${hasCritical ? "bg-red-400/60" : count > 0 ? "bg-[#00D4FF]/80/40" : "bg-white/[0.04]"}`}
                style={{ height: `${height}px` }}
                title={`${h}h ago: ${count} alerts`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-600">24h ago</span>
          <span className="text-[9px] text-gray-600">now</span>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="flex items-center gap-1">
          {SEVERITY_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSeverityFilter(filter.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 ${
                severityFilter === filter.key
                  ? "bg-[#1A2235] text-white"
                  : "text-gray-500 hover:text-gray-300 hover:bg-[#0F1420]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            value={poolFilter}
            onChange={(e) => setPoolFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-[#1A2235] bg-[#0F1420] pl-3 pr-8 text-sm text-gray-300 focus:outline-none focus:border-[#243049] hover:border-[#243049] transition-colors duration-200"
          >
            {ALL_POOLS.map((pool) => (
              <option key={pool} value={pool} className="bg-[#0F1420] text-gray-300">
                {pool}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>

        <span className="text-xs text-gray-600 ml-auto">
          {filteredAlerts.length} of {MOCK_ALERTS.length} alerts
        </span>
      </motion.div>

      {/* Alert feed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {filteredAlerts.map((alert) => {
          const config = severityConfig[alert.severity];

          return (
            <div
              key={alert.id}
              className="border-b border-[#1A2235] py-4 flex items-start gap-3"
            >
              {/* Severity dot */}
              <div className="mt-1.5 shrink-0">
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{alert.text}</p>
                <p className="text-xs text-gray-500 mt-1">{alert.detail}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#1A2235] text-gray-400">
                    {alert.pool}
                  </span>
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#1A2235] text-gray-500">
                    {alert.protocol}
                  </span>
                </div>
              </div>

              {/* Right side */}
              <div className="shrink-0 flex flex-col items-end gap-2">
                <span className="text-xs text-gray-600">
                  {formatTimeAgo(alert.timestamp)}
                </span>
                <a
                  href={twitterShareUrl(alert.text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors duration-200"
                >
                  <Share2 size={10} />
                  Share
                </a>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">No alerts match the current filters</p>
            <button
              onClick={() => {
                setSeverityFilter("all");
                setPoolFilter("All Pools");
              }}
              className="mt-2 text-xs text-[#00D4FF] hover:text-[#00D4FF] transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 text-center"
      >
        <p className="text-sm text-gray-400 mb-1">
          Want alerts delivered to you?
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Upgrade to HERMES Pro for real-time notifications
        </p>
        <button className="inline-flex items-center gap-2 rounded-lg bg-[#00D4FF] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#00B8D9] transition-colors duration-200">
          Upgrade to Pro
        </button>
      </motion.div>

      {/* Disclaimer */}
      <div className="border-t border-white/[0.04] pt-6 mt-8 space-y-2">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Alert thresholds are configurable at Policy Layer 2 (24h delay). Critical alerts trigger immediate notification.
          Alert data shown is from devnet beta and may differ from mainnet conditions.
        </p>
      </div>
    </div>
  );
}
