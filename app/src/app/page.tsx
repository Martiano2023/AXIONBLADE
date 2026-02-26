// ---------------------------------------------------------------------------
// AXIONBLADE Landing Page — Epic Hero Section with AI Agents Showcase
// ---------------------------------------------------------------------------
'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Shield, Brain, Zap, Bot, CheckCircle2, TrendingUp, Lock } from 'lucide-react';
import Link from 'next/link';
import { ParticlesBackground } from '@/components/effects/ParticlesBackground';
import { GlassCard } from '@/components/atoms/GlassCard';
import { KRONOSIllustration, AEONIllustration, APOLLOIllustration, HERMESIllustration } from '@/components/illustrations/AgentIllustrations';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      {/* Particles background */}
      <ParticlesBackground />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-20 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-semibold">Autonomous AI Agents for DeFi</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">v3.4.0</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight"
          >
            AXIONBLADE
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl md:text-3xl text-gray-300 mb-4 font-light"
          >
            Proof Before Action
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto"
          >
            Autonomous AI agents that monitor, analyze, and execute DeFi operations with cryptographic proof.
            Every action auditable. Every decision verifiable. Built on Solana.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/dashboard">
              <button className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg overflow-hidden shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all">
                <span className="relative z-10 flex items-center gap-2">
                  Launch App
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </Link>

            <Link href="/agents">
              <button className="px-8 py-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all">
                View AI Agents
              </button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">4</div>
              <div className="text-sm text-gray-400 mt-1">AI Agents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">7</div>
              <div className="text-sm text-gray-400 mt-1">Programs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400">50</div>
              <div className="text-sm text-gray-400 mt-1">Axioms</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">100%</div>
              <div className="text-sm text-gray-400 mt-1">Auditable</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Agents Showcase */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Meet Your AI Agents
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Autonomous operators that work 24/7 to protect and optimize your DeFi positions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KRONOS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard gradient="amber" glow hover>
                <div className="p-6">
                  <div className="w-32 h-32 mx-auto mb-4">
                    <KRONOSIllustration />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">KRONOS</h3>
                  <p className="text-sm text-amber-400 font-semibold mb-3">Economic Operator</p>
                  <p className="text-sm text-gray-400">
                    Manages pricing, token launch, revenue distribution, and buyback burns with proof-before-action.
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            {/* AEON */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard gradient="rose" glow hover>
                <div className="p-6">
                  <div className="w-32 h-32 mx-auto mb-4">
                    <AEONIllustration />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">AEON</h3>
                  <p className="text-sm text-rose-400 font-semibold mb-3">Sovereign Governor</p>
                  <p className="text-sm text-gray-400">
                    Delegates authority, coordinates agents, and decides policy. Never executes directly — proof-before-action at every layer.
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            {/* APOLLO */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard gradient="cyan" glow hover>
                <div className="p-6">
                  <div className="w-32 h-32 mx-auto mb-4">
                    <APOLLOIllustration />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">APOLLO</h3>
                  <p className="text-sm text-cyan-400 font-semibold mb-3">DeFi Risk Evaluator</p>
                  <p className="text-sm text-gray-400">
                    Evaluates pools using Pool Taxonomy, MLI, and Effective APR modules. Never executes — weight capped at 40% in the risk engine.
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            {/* HERMES */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard gradient="purple" glow hover>
                <div className="p-6">
                  <div className="w-32 h-32 mx-auto mb-4">
                    <HERMESIllustration />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">HERMES</h3>
                  <p className="text-sm text-purple-400 font-semibold mb-3">DeFi Intelligence</p>
                  <p className="text-sm text-gray-400">
                    5 services for external consumption — Pool Comparison, Effective APR, Risk Decomposition, Yield Trap Intel, Protocol Health. Never enters the execution chain.
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-4 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Built Different
            </h2>
            <p className="text-xl text-gray-400">
              Every action cryptographically proven. Every decision auditable.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard gradient="cyan" hover>
              <div className="p-8">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Proof Before Action</h3>
                <p className="text-gray-400">
                  Every agent action emits cryptographic proof BEFORE execution. Immutable audit trail on-chain.
                </p>
              </div>
            </GlassCard>

            <GlassCard gradient="purple" hover>
              <div className="p-8">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Permission-Based</h3>
                <p className="text-gray-400">
                  Granular permission controls per agent. Instant revocation. You're always in control.
                </p>
              </div>
            </GlassCard>

            <GlassCard gradient="emerald" hover>
              <div className="p-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">50 Axioms</h3>
                <p className="text-gray-400">
                  Governed by 50 immutable axioms. 49 active + 1 deprecated. No backdoors. No override keys. Deterministic execution.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <GlassCard gradient="cyan" glow>
            <div className="p-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Deploy AI Agents?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Start with KRONOS economic automation or deploy all 4 agents.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/agents">
                  <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all">
                    Configure Agents
                  </button>
                </Link>
                <Link href="/economics">
                  <button className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/20 transition-all">
                    View Economics
                  </button>
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
