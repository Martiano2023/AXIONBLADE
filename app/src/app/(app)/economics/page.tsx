"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Clock, AlertCircle } from "lucide-react";

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
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Economics Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            Live pricing, margins, and cost transparency (C1 requirement)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4" />
          <span>Sample Data - Mainnet integration pending</span>
        </div>
      </motion.div>

      {/* Cost Breakdown Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4">Cost Structure (C1: Cost Oracle)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">On-Chain Fees</p>
            <p className="text-2xl font-bold text-white">0.0002 SOL</p>
            <p className="text-xs text-emerald-400 mt-1">Per query</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Cost Index (Signed)</p>
            <p className="text-2xl font-bold text-white">0.0018 SOL</p>
            <p className="text-xs text-gray-400 mt-1">Per 1k queries</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">RPC Cost</p>
            <p className="text-2xl font-bold text-white">0.0008 SOL</p>
            <p className="text-xs text-gray-400 mt-1">Helius/Quicknode</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">AI Cost</p>
            <p className="text-2xl font-bold text-white">0.0012 SOL</p>
            <p className="text-xs text-gray-400 mt-1">OpenAI/Anthropic</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 italic">
          ✓ Cost data signed by multisig authority (2-of-3 required)
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Display: "On-chain fees + Signed CostIndex" (C1 transparency requirement)
        </p>
      </motion.div>

      {/* Live Pricing Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4">Current Pricing</h2>
        <div className="space-y-3">
          {currentPrices.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-[#0A0E17] border border-[#1A2235] rounded-lg hover:border-[#243049] transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-white">{item.service}</p>
                <p className="text-xs text-gray-500">Updated {item.updated}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-[#00D4FF]">{item.price}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  parseInt(item.margin) >= 150
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-400/10 text-amber-400 border border-amber-400/30"
                }`}>
                  {item.margin} margin
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-4">
          Formula: price = max(cost_basis × 2.5, tier_minimum) | Margin floor: 150%
        </p>
      </motion.div>

      {/* Revenue Split */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4">Revenue Split (NET after costs)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <DollarSign className="w-6 h-6 text-purple-400 mb-2" />
            <p className="text-xs text-gray-400">Operations</p>
            <p className="text-2xl font-bold text-purple-400">40%</p>
          </div>
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <TrendingUp className="w-6 h-6 text-cyan-400 mb-2" />
            <p className="text-xs text-gray-400">Treasury Reserve</p>
            <p className="text-2xl font-bold text-cyan-400">30%</p>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <DollarSign className="w-6 h-6 text-emerald-400 mb-2" />
            <p className="text-xs text-gray-400">Dev Fund</p>
            <p className="text-2xl font-bold text-emerald-400">15%</p>
          </div>
          <div className="p-4 bg-amber-400/10 border border-amber-400/30 rounded-lg">
            <DollarSign className="w-6 h-6 text-amber-400 mb-2" />
            <p className="text-xs text-gray-400">Creator</p>
            <p className="text-2xl font-bold text-amber-400">15%</p>
          </div>
        </div>
      </motion.div>

      {/* Next Price Adjustment Timer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-[#00D4FF]/10 to-cyan-500/10 border border-[#00D4FF]/30 rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-[#00D4FF]" />
              <h2 className="text-lg font-bold text-white">Next Price Adjustment</h2>
            </div>
            <p className="text-sm text-gray-400">
              KRONOS crank runs every 12 hours based on PriceEpoch completion
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[#00D4FF]">6h 23m</p>
            <p className="text-xs text-gray-500 mt-1">Permissionless crank</p>
          </div>
        </div>
      </motion.div>

      {/* Disclaimer */}
      <div className="border-t border-white/[0.04] pt-4 space-y-2">
        <p className="text-xs text-gray-600">
          ⚠️ This page displays sample data for demonstration. Full implementation requires:
        </p>
        <ul className="text-xs text-gray-600 space-y-1 ml-4">
          <li>• Real-time CostOracle PDA polling (every 30s via @tanstack/react-query)</li>
          <li>• PriceEpoch history indexing (Helius webhooks or Solana RPC)</li>
          <li>• Volume discount tracker integration</li>
          <li>• Service-by-service cost breakdowns</li>
          <li>• Historical price adjustment timeline</li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">
          See: <code className="text-[#00D4FF]">contracts/programs/noumen-treasury/src/economic_engine.rs</code>
        </p>
      </div>
    </div>
  );
}
