"use client";

import { motion } from "framer-motion";
import { Trophy, CheckCircle2, XCircle, AlertCircle, Gift } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";

// NOTE: Simplified - Full version polls AirdropEligibility PDA

export default function AirdropPage() {
  const { connected } = useWallet();

  // SAMPLE DATA - Replace with on-chain AirdropEligibility
  const userPoints = {
    total: 2847,
    breakdown: [
      { source: "Service payments", points: 1200, description: "Basic/Pro/Inst usage" },
      { source: "Proof creation", points: 800, description: "DecisionLog PDAs" },
      { source: "Protocol interaction", points: 520, description: "Unique services" },
      { source: "Seniority bonus", points: 327, description: "Early adopter (+15%)" },
    ],
    estimatedAllocation: "12,438 $AXION",
    percentile: "Top 8%",
  };

  const eligibilityChecks = [
    { label: "On-chain protocol usage", met: true, description: "≥3 services used" },
    { label: "First interaction timestamp", met: true, description: "Recorded: Jan 15, 2026" },
    { label: "Total payments ≥ 0.1 SOL", met: true, description: "1.23 SOL paid" },
    { label: "Proof count ≥ 5", met: false, description: "3 proofs created" },
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
          <h1 className="text-3xl font-bold text-white">$AXION Airdrop</h1>
          <p className="text-sm text-gray-400 mt-1">
            C3: Deterministic eligibility based on on-chain usage only
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4" />
          <span>Sample Data - Connect wallet for real status</span>
        </div>
      </motion.div>

      {/* Connect Wallet CTA */}
      {!connected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-[#00D4FF]/10 to-cyan-500/10 border border-[#00D4FF]/30 rounded-xl p-8 text-center"
        >
          <Gift className="w-12 h-12 text-[#00D4FF] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Check Your Eligibility</h2>
          <p className="text-sm text-gray-400 mb-4">
            Connect your wallet to view your points and estimated allocation
          </p>
          <button className="bg-gradient-to-r from-[#00D4FF] to-cyan-600 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
            Connect Wallet
          </button>
        </motion.div>
      )}

      {/* Your Points */}
      {connected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Your Points</h2>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1">
              <Trophy className="w-3 h-3" />
              <span>{userPoints.percentile}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Points</p>
              <p className="text-4xl font-bold text-[#00D4FF]">{userPoints.total.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Estimated Allocation</p>
              <p className="text-4xl font-bold text-emerald-400">{userPoints.estimatedAllocation}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase">Points Breakdown</p>
            {userPoints.breakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-[#0A0E17] border border-[#1A2235] rounded-lg"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{item.source}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <span className="text-lg font-bold text-[#00D4FF]">+{item.points}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Eligibility Requirements (C3) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4">Eligibility Requirements (C3)</h2>
        <div className="space-y-3 mb-4">
          {eligibilityChecks.map((check, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-[#0A0E17] border border-[#1A2235] rounded-lg"
            >
              <div className="flex items-center gap-3">
                {check.met ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-600" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{check.label}</p>
                  <p className="text-xs text-gray-500">{check.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-400 mb-2">C3 Requirement: On-Chain Data Only</p>
          <p className="text-xs text-gray-400">
            Eligibility is <strong>deterministic</strong> and based ONLY on protocol usage recorded on-chain
            (ServicePayment events, DecisionLog PDAs, first_seen timestamps).
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Off-chain heuristics (wallet age, transaction count) are <strong>advisory only</strong> and
            never used as sole gate. All points accumulate transparently from verifiable on-chain actions.
          </p>
        </div>
      </motion.div>

      {/* Points History */}
      {connected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4">Points History</h2>
          <div className="space-y-2">
            {[
              { date: "Feb 10, 2026", action: "Pro Analysis", points: "+100", tx: "4Vk7...mN" },
              { date: "Feb 8, 2026", action: "Wallet Scanner", points: "+50", tx: "5Wl8...oN" },
              { date: "Feb 5, 2026", action: "Proof Created", points: "+20", tx: "6Xm9...oP" },
              { date: "Feb 1, 2026", action: "Basic Analysis", points: "+10", tx: "7Yn0...pQ" },
            ].map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-[#0A0E17] border border-[#1A2235] rounded-lg text-xs"
              >
                <div>
                  <p className="text-white font-semibold">{entry.action}</p>
                  <p className="text-gray-500">{entry.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">{entry.points}</span>
                  <a
                    href={`https://solscan.io/tx/${entry.tx}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00D4FF] hover:underline"
                  >
                    {entry.tx}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Claim Interface (Post-Launch) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-6 text-center"
      >
        <h2 className="text-xl font-bold text-white mb-2">Claim Interface</h2>
        <p className="text-sm text-gray-400 mb-4">
          Available after $AXION token launch (see /token page for status)
        </p>
        <button
          disabled
          className="bg-gray-700 text-gray-500 font-semibold px-6 py-3 rounded-xl cursor-not-allowed"
        >
          Claim Tokens (Disabled)
        </button>
        <p className="text-xs text-gray-600 mt-2">
          Claim will use Merkle proof + on-chain eligibility verification
        </p>
      </motion.div>

      {/* Disclaimer */}
      <div className="border-t border-white/[0.04] pt-4 space-y-2">
        <p className="text-xs text-gray-600">
          ⚠️ This page displays sample data. Full implementation requires:
        </p>
        <ul className="text-xs text-gray-600 space-y-1 ml-4">
          <li>• Polling AirdropEligibility PDA per wallet</li>
          <li>• Indexing ServicePayment + DecisionLog events (Helius webhooks)</li>
          <li>• Points calculation engine (on-chain or off-chain indexer)</li>
          <li>• Merkle tree generation for efficient claiming</li>
          <li>• Claim verification UI with proof display</li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">
          See: <code className="text-[#00D4FF]">contracts/programs/noumen-treasury/src/economic_engine.rs</code> (AirdropEligibility PDA)
        </p>
      </div>
    </div>
  );
}
