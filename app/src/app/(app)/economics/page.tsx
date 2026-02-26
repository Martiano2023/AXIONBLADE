// ---------------------------------------------------------------------------
// AXIONBLADE Economics Dashboard — Enhanced with glassmorphism
// ---------------------------------------------------------------------------
"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Clock, AlertCircle, CircleDollarSign, Percent, Database, ShieldCheck, Lock } from "lucide-react";
import { GlassCard } from "@/components/atoms/GlassCard";
import { Badge } from "@/components/atoms/Badge";

// NOTE: This is a SIMPLIFIED implementation showing the architecture.
// Full implementation would include:
// - Real-time polling of CostOracle PDA (every 30s)
// - PriceEpoch history from indexer
// - Volume discount calculations
// - Service-by-service margin breakdown

export default function EconomicsPage() {
  // SAMPLE DATA - Replace with real on-chain data fetching
  const currentPrices = [
    { service: "Basic Analysis", price: "0.008 SOL", margin: "165%", updated: "12 min ago" },
    { service: "Wallet Scanner", price: "0.08 SOL", margin: "158%", updated: "12 min ago" },
    { service: "Pool Analyzer", price: "0.008 SOL", margin: "170%", updated: "12 min ago" },
    { service: "Protocol Auditor", price: "0.015 SOL", margin: "152%", updated: "12 min ago" },
    { service: "Yield Optimizer", price: "0.015 SOL", margin: "148%", updated: "12 min ago" },
    { service: "Pro Analysis", price: "0.15 SOL", margin: "180%", updated: "12 min ago" },
    { service: "Institutional", price: "3.0 SOL", margin: "200%", updated: "12 min ago" },
  ];

  return (
    <div className="space-y-8 relative">
      {/* Background gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Economics Dashboard
            </h1>
            <p className="text-gray-400 text-lg">
              Live pricing, margins, and cost transparency (C1 requirement)
            </p>
          </div>
          <Badge variant="warning" className="text-sm px-4 py-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            Sample Data
          </Badge>
        </motion.div>
      </div>

      {/* Cost Breakdown Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10"
      >
        <GlassCard gradient="cyan" glow hover>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Database className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Cost Structure (C1: Cost Oracle)</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">On-Chain Fees</p>
                <p className="text-2xl font-bold text-white mb-1">0.0002 SOL</p>
                <p className="text-xs text-emerald-400">Per query</p>
              </div>
              <div className="bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">Cost Index (Signed)</p>
                <p className="text-2xl font-bold text-white mb-1">0.0018 SOL</p>
                <p className="text-xs text-gray-400">Per 1k queries</p>
              </div>
              <div className="bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">RPC Cost</p>
                <p className="text-2xl font-bold text-white mb-1">0.0008 SOL</p>
                <p className="text-xs text-gray-400">Helius/Quicknode</p>
              </div>
              <div className="bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">AI Cost</p>
                <p className="text-2xl font-bold text-white mb-1">0.0012 SOL</p>
                <p className="text-xs text-gray-400">OpenAI/Anthropic</p>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-xs text-emerald-400 mb-1">
                ✓ Cost data signed by multisig authority (2-of-3 required)
              </p>
              <p className="text-xs text-gray-500">
                Display: "On-chain fees + Signed CostIndex" (C1 transparency requirement)
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Live Pricing Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
      >
        <GlassCard gradient="purple" hover>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Percent className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Current Pricing</h2>
            </div>

            <div className="space-y-3 mb-4">
              {currentPrices.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg hover:border-purple-500/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{item.service}</p>
                    <p className="text-xs text-gray-500">Updated {item.updated}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-cyan-400">{item.price}</span>
                    <Badge
                      variant={parseInt(item.margin) >= 150 ? "success" : "warning"}
                      className="text-xs px-3 py-1"
                    >
                      {item.margin} margin
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <p className="text-xs text-gray-400">
                Formula: price = max(cost_basis × 2.5, tier_minimum) | Price floor: cost + 20% margin (axiom requirement). Every service must cover its cost or be discontinued after max 90-day subsidy period.
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Revenue Split */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10"
      >
        <GlassCard gradient="emerald" hover>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CircleDollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Revenue Split (NET after costs)</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-purple-500/20 border border-purple-500/40 rounded-xl p-6 text-center">
                <DollarSign className="w-8 h-8 text-purple-400 mb-3 mx-auto" />
                <p className="text-xs text-gray-400 mb-2">Operations</p>
                <p className="text-3xl font-bold text-purple-400">40%</p>
              </div>
              <div className="bg-cyan-500/20 border border-cyan-500/40 rounded-xl p-6 text-center">
                <TrendingUp className="w-8 h-8 text-cyan-400 mb-3 mx-auto" />
                <p className="text-xs text-gray-400 mb-2">Treasury Reserve</p>
                <p className="text-3xl font-bold text-cyan-400">30%</p>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-6 text-center">
                <DollarSign className="w-8 h-8 text-emerald-400 mb-3 mx-auto" />
                <p className="text-xs text-gray-400 mb-2">Treasury</p>
                <p className="text-3xl font-bold text-emerald-400">15%</p>
              </div>
              <div className="bg-amber-400/20 border border-amber-400/40 rounded-xl p-6 text-center">
                <DollarSign className="w-8 h-8 text-amber-400 mb-3 mx-auto" />
                <p className="text-xs text-gray-400 mb-2">Creator</p>
                <p className="text-3xl font-bold text-amber-400">15%</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Economic Constraints (Axiom Rules) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="relative z-10"
      >
        <GlassCard gradient="cyan" hover>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Economic Constraints</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Immutable rules enforced by 50 axioms (49 active, 1 deprecated) — v3.4.0
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  label: "Reserve Ratio",
                  value: "≥ 25%",
                  detail: "Treasury must maintain minimum 25% reserve at all times",
                  axiom: "Economic axioms",
                  color: "emerald",
                },
                {
                  label: "Daily Treasury Spend",
                  value: "≤ 3%",
                  detail: "Max 3% of free balance may be spent per day",
                  axiom: "Economic axioms",
                  color: "cyan",
                },
                {
                  label: "CCS Creator Capture",
                  value: "Cap 15% / Floor 4% / Stipend 5%",
                  detail: "Total creator capture capped at 15%, minimum floor 4%, stipend cap 5%",
                  axiom: "Economic axioms",
                  color: "amber",
                },
                {
                  label: "Subsidy Period",
                  value: "Max 90 days",
                  detail: "Services failing to cover costs must be discontinued after 90-day subsidy window",
                  axiom: "Economic axioms",
                  color: "purple",
                },
                {
                  label: "Price Floor",
                  value: "Cost + 20% margin",
                  detail: "All services must be priced at minimum cost basis plus 20% margin",
                  axiom: "Economic axioms",
                  color: "rose",
                },
                {
                  label: "KRONOS Crank Axioms",
                  value: "A0-44 through A0-50",
                  detail: "KRONOS economic axioms govern crank scheduling, price epoch execution, and permissionless operation",
                  axiom: "A0-44 to A0-50",
                  color: "indigo",
                },
              ].map((rule) => (
                <div
                  key={rule.label}
                  className={`flex items-start gap-4 p-4 rounded-xl border bg-[#0F1420]/60 backdrop-blur ${
                    rule.color === "emerald" ? "border-emerald-500/25 hover:border-emerald-500/40" :
                    rule.color === "cyan"    ? "border-cyan-500/25 hover:border-cyan-500/40" :
                    rule.color === "amber"   ? "border-amber-400/25 hover:border-amber-400/40" :
                    rule.color === "purple"  ? "border-purple-500/25 hover:border-purple-500/40" :
                    rule.color === "rose"    ? "border-rose-500/25 hover:border-rose-500/40" :
                                              "border-indigo-500/25 hover:border-indigo-500/40"
                  } transition-colors`}
                >
                  <div className={`mt-0.5 flex-shrink-0 ${
                    rule.color === "emerald" ? "text-emerald-400" :
                    rule.color === "cyan"    ? "text-cyan-400" :
                    rule.color === "amber"   ? "text-amber-400" :
                    rule.color === "purple"  ? "text-purple-400" :
                    rule.color === "rose"    ? "text-rose-400" :
                                              "text-indigo-400"
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{rule.label}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        rule.color === "emerald" ? "bg-emerald-500/15 text-emerald-400" :
                        rule.color === "cyan"    ? "bg-cyan-500/15 text-cyan-400" :
                        rule.color === "amber"   ? "bg-amber-400/15 text-amber-400" :
                        rule.color === "purple"  ? "bg-purple-500/15 text-purple-400" :
                        rule.color === "rose"    ? "bg-rose-500/15 text-rose-400" :
                                                  "bg-indigo-500/15 text-indigo-400"
                      }`}>
                        {rule.value}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{rule.detail}</p>
                    <p className="text-[10px] text-gray-600 mt-1 font-mono">{rule.axiom}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-rose-500/8 border border-rose-500/20 rounded-lg p-3 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-300">
                Layer 0 — These constraints are immutable without a full contract redeploy. Any violation triggers automatic rejection.
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Next Price Adjustment Timer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10"
      >
        <GlassCard gradient="amber" glow>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Next Price Adjustment</h2>
                </div>
                <p className="text-sm text-gray-400">
                  KRONOS crank runs every 12 hours based on PriceEpoch completion
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-amber-400 mb-1">6h 23m</p>
                <Badge variant="info" className="text-xs px-3 py-1">
                  Permissionless crank
                </Badge>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Disclaimer */}
      <div className="relative z-10 border-t border-white/[0.04] pt-6 space-y-3">
        <p className="text-xs text-amber-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          This page displays sample data for demonstration. Full implementation requires:
        </p>
        <ul className="text-xs text-gray-500 space-y-1 ml-4">
          <li>• Real-time CostOracle PDA polling (every 30s via @tanstack/react-query)</li>
          <li>• PriceEpoch history indexing (Helius webhooks or Solana RPC)</li>
          <li>• Volume discount tracker integration</li>
          <li>• Service-by-service cost breakdowns</li>
          <li>• Historical price adjustment timeline</li>
        </ul>
        <p className="text-xs text-gray-600">
          See: <code className="text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">contracts/programs/noumen-treasury/src/economic_engine.rs</code>
        </p>
      </div>
    </div>
  );
}
