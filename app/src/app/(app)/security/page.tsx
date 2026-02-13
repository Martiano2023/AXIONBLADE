"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Key axioms data                                                    */
/* ------------------------------------------------------------------ */

const KEY_AXIOMS = [
  {
    id: "A0-1",
    description: "LLMs never make final decisions",
  },
  {
    id: "A0-5",
    description: "Only AEON creates agents (hard cap: 100)",
  },
  {
    id: "A0-8",
    description: "log_decision mandatory before any execution",
  },
  {
    id: "A0-10",
    description: "Minimum 2 independent evidence families required",
  },
  {
    id: "A0-22",
    description: "Reserve ratio >= 25%",
  },
];

const MOCK_PROOF_HASH = "7Kx9vQ2rFg7bPdMnZ4wYtR6dLxF3Mp8nZ4wYtR6dLxF";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SecurityPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-white">Security</h1>
        <p className="text-sm text-gray-400">
          How AXIONBLADE protects the protocol and its users
        </p>
      </motion.div>

      {/* Section 1: Axiom Enforcement */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200"
      >
        <h2 className="text-lg font-semibold text-white mb-2">
          29 axioms enforced at smart contract level
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-5">
          Axioms are immutable rules that cannot be changed without contract
          redeployment. They govern agent behavior, separation of functions, and
          economic constraints.
        </p>

        <div className="space-y-3 mb-5">
          {KEY_AXIOMS.map((axiom) => (
            <div
              key={axiom.id}
              className="flex items-start gap-3 py-2 px-3 rounded-lg bg-[#0A0E17] border border-[#1A2235]"
            >
              <span className="shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-[#1A2235] text-[#00D4FF]">
                {axiom.id}
              </span>
              <span className="text-sm text-gray-300">{axiom.description}</span>
            </div>
          ))}
        </div>

        <Link
          href="/axioms"
          className="inline-flex items-center gap-1.5 text-sm text-[#00D4FF] hover:text-[#00D4FF] transition-colors duration-200"
        >
          View all 29 axioms
          <ArrowRight size={14} />
        </Link>
      </motion.div>

      {/* Section 2: Risk Model Transparency */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Risk Model Transparency
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
            <div>
              <p className="text-sm text-gray-300">
                All risk models are deterministic and reproducible
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Given the same inputs, AXIONBLADE always produces the same risk
                score. No black-box AI.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
            <div>
              <p className="text-sm text-gray-300">
                The AI narrative layer is advisory only
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                It explains scores but never generates them.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
            <div>
              <p className="text-sm text-gray-300">
                Weights and formulas are stored on-chain and governable through
                AEON
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Any parameter change follows the policy layer delay and cooldown
                requirements.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section 3: Audit Status */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Audit Status</h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
            <span className="text-sm text-gray-300">
              Internal security review complete
            </span>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
            <span className="text-sm text-gray-300">
              38 test cases passing across 7 programs
            </span>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
            <span className="text-sm text-gray-300">
              External audit planned for Phase 2 (Mainnet launch)
            </span>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] shrink-0" />
            <span className="text-sm text-gray-300">
              Audit partner: TBD &mdash; evaluating OtterSec, Neodyme, Ackee
              Blockchain
            </span>
          </div>
        </div>
      </motion.div>

      {/* Section 4: Proof Verification */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-6 hover:border-[#243049] transition-colors duration-200"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Proof Verification
        </h2>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00D4FF] shrink-0" />
            <p className="text-sm text-gray-300">
              Every risk assessment generates an immutable proof on Solana
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00D4FF] shrink-0" />
            <p className="text-sm text-gray-300">
              Proofs contain: pool address, risk score, evidence family scores,
              timestamp, block number
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00D4FF] shrink-0" />
            <p className="text-sm text-gray-300">
              Proofs cannot be altered, deleted, or backdated
            </p>
          </div>
        </div>

        <div className="bg-[#0A0E17] border border-[#1A2235] rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2">Verify any proof:</p>
          <div className="flex items-center gap-3">
            <code className="text-sm font-mono text-gray-400 truncate">
              {MOCK_PROOF_HASH}
            </code>
            <a
              href={`https://solscan.io/tx/${MOCK_PROOF_HASH}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 shrink-0 text-sm text-[#00D4FF] hover:text-[#00D4FF] transition-colors duration-200"
            >
              View on Explorer
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
