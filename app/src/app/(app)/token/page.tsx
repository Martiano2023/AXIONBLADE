"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, XCircle, AlertCircle, Flame } from "lucide-react";

// NOTE: Simplified implementation - Full version polls TokenVaultConfig PDA

export default function TokenPage() {
  // SAMPLE DATA - Replace with on-chain TokenVaultConfig
  const launchConditions = [
    { label: "Treasury ≥ $100,000 USD", met: false, current: "$87,234", target: "$100,000" },
    { label: "3 consecutive growth weeks", met: false, current: "2 weeks", target: "3 weeks" },
    { label: "Market stability (30d)", met: true, current: "Stable", target: "Stable" },
    { label: "No anomalies detected", met: true, current: "Clean", target: "Clean" },
  ];

  const vestingSchedules = [
    { allocation: "Team", percent: "20%", amount: "200M", cliff: "6 months", vest: "2 years" },
    { allocation: "Treasury", percent: "30%", amount: "300M", cliff: "0", vest: "Controlled by AEON" },
    { allocation: "Community", percent: "30%", amount: "300M", cliff: "0", vest: "Airdrop via C3" },
    { allocation: "Liquidity", percent: "10%", amount: "100M", cliff: "0", vest: "LP provision" },
    { allocation: "Reserve", percent: "10%", amount: "100M", cliff: "0", vest: "Emergency fund" },
  ];

  const isLaunched = false; // Check TokenVaultConfig.launch_status

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">$AXION Token</h1>
          <p className="text-sm text-gray-400 mt-1">
            Conditional launch via KRONOS proof | Axiom A0-46: 72h delay required
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4" />
          <span>Sample Data - Token not yet launched</span>
        </div>
      </motion.div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`border rounded-xl p-6 ${
          isLaunched
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-amber-400/10 border-amber-400/30"
        }`}
      >
        <div className="flex items-center gap-3">
          {isLaunched ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          ) : (
            <Clock className="w-8 h-8 text-amber-400" />
          )}
          <div>
            <h2 className="text-xl font-bold text-white">
              {isLaunched ? "Token Launched" : "Awaiting Launch Conditions"}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {isLaunched
                ? "Mint authority revoked. Supply: 1B $AXION"
                : "KRONOS monitoring treasury and growth metrics"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Launch Conditions Checklist */}
      {!isLaunched && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4">Launch Conditions</h2>
          <div className="space-y-3">
            {launchConditions.map((condition, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-[#0A0E17] border border-[#1A2235] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {condition.met ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{condition.label}</p>
                    <p className="text-xs text-gray-500">
                      Current: {condition.current} | Target: {condition.target}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-4 italic">
            Once all conditions met, KRONOS emits proof + 72h delay before launch (Axiom A0-46)
          </p>
        </motion.div>
      )}

      {/* Vesting Allocations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4">Token Allocation (1B supply)</h2>
        <div className="space-y-2">
          {vestingSchedules.map((schedule, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-[#0A0E17] border border-[#1A2235] rounded-lg"
            >
              <div>
                <p className="text-sm font-semibold text-white">{schedule.allocation}</p>
                <p className="text-xs text-gray-500">
                  {schedule.amount} tokens | Cliff: {schedule.cliff} | Vest: {schedule.vest}
                </p>
              </div>
              <span className="text-lg font-bold text-[#00D4FF]">{schedule.percent}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-4">
          All allocations minted to vesting PDAs at launch. Mint authority revoked immediately.
        </p>
      </motion.div>

      {/* Deflationary Mechanics (C4) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/30 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Flame className="w-6 h-6 text-rose-400" />
          <h2 className="text-lg font-bold text-white">Buyback & Burn (C4)</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Burn Budget</p>
            <p className="text-2xl font-bold text-white">5% NET</p>
            <p className="text-xs text-gray-400 mt-1">Per epoch</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Reserve Protection</p>
            <p className="text-2xl font-bold text-emerald-400">≥25%</p>
            <p className="text-xs text-gray-400 mt-1">Always maintained</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Burned</p>
            <p className="text-2xl font-bold text-rose-400">0</p>
            <p className="text-xs text-gray-400 mt-1">Post-launch</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Next Burn</p>
            <p className="text-2xl font-bold text-[#00D4FF]">--</p>
            <p className="text-xs text-gray-400 mt-1">Monthly cadence</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-4 italic">
          ✓ Slippage checks + Reserve ratio validation before every burn (Axiom A0-45)
        </p>
      </motion.div>

      {/* Post-Launch Stats (Hidden pre-launch) */}
      {isLaunched && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4">Live Token Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Price</p>
              <p className="text-2xl font-bold text-white">$0.0342</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Market Cap</p>
              <p className="text-2xl font-bold text-white">$34.2M</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Holders</p>
              <p className="text-2xl font-bold text-white">2,847</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Circulating</p>
              <p className="text-2xl font-bold text-white">120M</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">
            Data from Jupiter/Raydium + on-chain supply tracking
          </p>
        </motion.div>
      )}

      {/* Disclaimer */}
      <div className="border-t border-white/[0.04] pt-4 space-y-2">
        <p className="text-xs text-gray-600">
          ⚠️ This page displays sample data. Full implementation requires:
        </p>
        <ul className="text-xs text-gray-600 space-y-1 ml-4">
          <li>• Polling TokenVaultConfig PDA for launch status</li>
          <li>• KRONOS proof verification UI</li>
          <li>• Vesting schedule timeline visualization</li>
          <li>• Burn history chart (post-launch)</li>
          <li>• Real-time token stats (price, mcap, holders)</li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">
          See: <code className="text-[#00D4FF]">contracts/programs/axionblade-token-vault/src/lib.rs</code>
        </p>
      </div>
    </div>
  );
}
