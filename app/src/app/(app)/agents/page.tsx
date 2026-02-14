// ---------------------------------------------------------------------------
// AXIONBLADE AI Agents Dashboard — KRONOS Economic Agent
// ---------------------------------------------------------------------------
// Simplified version focusing on KRONOS autonomous economic operator
// Previous version with AEON/APOLLO/HERMES backed up at page.tsx.backup
// ---------------------------------------------------------------------------

'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Agents</h1>
          <p className="text-gray-400">
            Autonomous economic operations with proof-before-action compliance
          </p>
        </div>
        <Badge variant="info" className="text-sm">
          v3.4.0
        </Badge>
      </div>

      {/* KRONOS Economic Agent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Bot className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">KRONOS</h2>
              <p className="text-sm text-gray-400">Autonomous Economic Operator</p>
            </div>
          </div>
          <Badge variant="success">Active</Badge>
        </div>
        <p className="text-sm text-gray-300 mb-4">
          KRONOS manages all economic operations: pricing adjustments, token launch conditions,
          revenue distribution, vesting releases, and buyback burns. Every action emits proof before execution.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Last Crank</p>
            <p className="text-sm font-semibold text-white">2h ago</p>
          </div>
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Operations</p>
            <p className="text-sm font-semibold text-[#00D4FF]">1,247</p>
          </div>
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Success Rate</p>
            <p className="text-sm font-semibold text-emerald-400">99.8%</p>
          </div>
          <div className="bg-[#0F1420] border border-[#1A2235] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Next Crank</p>
            <p className="text-sm font-semibold text-amber-400">4h 12m</p>
          </div>
        </div>
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Governed by Axioms 44-50</p>
          <div className="space-y-1">
            {[
              "A0-44: KRONOS runs only permissionless cranks with proof emission",
              "A0-45: Burn budget never reduces emergency reserve below 25%",
              "A0-46: Token launch requires KRONOS proof + 72h delay",
              "A0-47: Vesting release permissionless after cliff",
              "A0-48: Cannot modify pricing without cost oracle signature",
              "A0-49: Revenue distribution requires epoch completion proof",
              "A0-50: All actions emit proof BEFORE execution",
            ].map((axiom, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="text-emerald-400 shrink-0">✓</span>
                <span>{axiom}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/economics'}>
            View Economics Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/token'}>
            View Token Status
          </Button>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4"
      >
        <h3 className="text-sm font-semibold text-cyan-400 mb-2">AXIONBLADE v3.4.0 Economic System</h3>
        <p className="text-xs text-gray-400 mb-3">
          Complete economic autonomy with C1-C4 critical corrections implemented:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span className="text-gray-300">Cost Oracle (C1)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span className="text-gray-300">Monthly Credits (C2)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span className="text-gray-300">Deterministic Airdrop (C3)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span className="text-gray-300">Burn Budget (C4)</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-lg p-4 hover:border-cyan-500/50 transition-colors cursor-pointer"
             onClick={() => window.location.href = '/economics'}>
          <h3 className="text-sm font-semibold text-white mb-1">Economics Dashboard</h3>
          <p className="text-xs text-gray-500">Live pricing, margins, revenue splits</p>
        </div>
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-lg p-4 hover:border-cyan-500/50 transition-colors cursor-pointer"
             onClick={() => window.location.href = '/token'}>
          <h3 className="text-sm font-semibold text-white mb-1">Token Launch</h3>
          <p className="text-xs text-gray-500">Conditions, vesting, burn stats</p>
        </div>
        <div className="bg-[#0F1420] border border-[#1A2235] rounded-lg p-4 hover:border-cyan-500/50 transition-colors cursor-pointer"
             onClick={() => window.location.href = '/airdrop'}>
          <h3 className="text-sm font-semibold text-white mb-1">Airdrop Eligibility</h3>
          <p className="text-xs text-gray-500">Points, breakdown, claim status</p>
        </div>
      </motion.div>
    </div>
  );
}
