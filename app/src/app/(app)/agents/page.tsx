// ---------------------------------------------------------------------------
// AXIONBLADE AI Agents Dashboard — v3.4.0
// ---------------------------------------------------------------------------
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ChevronDown, ChevronUp, ArrowRight, Clock, Activity } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { GlassCard } from '@/components/atoms/GlassCard';
import {
  KRONOSIllustration,
  AEONIllustration,
  APOLLOIllustration,
  HERMESIllustration,
} from '@/components/illustrations/AgentIllustrations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function useHeartbeat(intervalMs: number = 1000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

function RelativeTime({ secondsAgo }: { secondsAgo: number }) {
  const tick = useHeartbeat(5000);
  void tick; // re-render every 5s
  if (secondsAgo < 60) return <span>{secondsAgo}s ago</span>;
  if (secondsAgo < 3600) return <span>{Math.floor(secondsAgo / 60)}m ago</span>;
  return <span>{Math.floor(secondsAgo / 3600)}h ago</span>;
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Firewall Chain
// ---------------------------------------------------------------------------
function FirewallChain() {
  const steps = [
    { label: 'APOLLO', sub: 'DeFi Risk Evaluator', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
    { label: 'assessment_pda', sub: 'On-chain proof', color: 'text-gray-300', bg: 'bg-white/5 border-white/10' },
    { label: 'Risk Engine', sub: 'Weight ≤ 40%', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
    { label: 'AEON', sub: 'Sovereign Governor', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
    { label: 'Executor', sub: 'Final action', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  ];

  return (
    <div className="bg-[#0F1420]/70 backdrop-blur border border-white/5 rounded-xl p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Architecture Firewall Chain
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.label} className="flex items-center gap-2">
            <div className={`rounded-lg border px-3 py-2 ${step.bg}`}>
              <p className={`text-xs font-bold ${step.color}`}>{step.label}</p>
              <p className="text-[10px] text-gray-500">{step.sub}</p>
            </div>
            {idx < steps.length - 1 && (
              <ArrowRight className="w-4 h-4 text-gray-600 shrink-0" />
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-600 mt-3">
        HERMES outputs are terminal — they never enter the execution chain.
        Executors never read APOLLO PDAs directly.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KRONOS — Expanded main card
// ---------------------------------------------------------------------------
function KRONOSCard() {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  return (
    <GlassCard gradient="amber" glow>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Illustration */}
          <div className="flex items-center justify-center">
            <div className="w-48 h-48">
              <KRONOSIllustration />
            </div>
          </div>

          {/* Info */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">KRONOS</h2>
                <p className="text-amber-400 font-semibold">Economic Operator</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <PulsingDot color="bg-emerald-400" />
                  <Badge variant="success" className="text-sm px-3 py-1">Active</Badge>
                </div>
              </div>
            </div>

            {/* Last action heartbeat */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <Clock className="w-3.5 h-3.5" />
              <span>Last action:</span>
              <span className="text-amber-400 font-medium"><RelativeTime secondsAgo={7200} /></span>
              <span className="mx-2 text-gray-700">|</span>
              <Activity className="w-3.5 h-3.5" />
              <span>Next crank in</span>
              <span className="text-amber-400 font-medium">4h 12m</span>
            </div>

            <p className="text-gray-300 mb-6">
              KRONOS manages all economic operations: pricing adjustments, token launch conditions,
              revenue distribution, vesting releases, and buyback burns. Every action emits an
              on-chain proof before execution — no silent state changes.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Operations</p>
                <p className="text-sm font-semibold text-cyan-400">1,247</p>
              </div>
              <div className="bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                <p className="text-sm font-semibold text-emerald-400">99.8%</p>
              </div>
              <div className="bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Proofs Emitted</p>
                <p className="text-sm font-semibold text-amber-400">1,247</p>
              </div>
              <div className="bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Axioms</p>
                <p className="text-sm font-semibold text-white">7</p>
              </div>
            </div>
          </div>
        </div>

        {/* Axioms */}
        <div className="bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Governs Axioms A0-44 through A0-50 (7 axioms)
            </p>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              {expanded ? 'Collapse' : 'Expand'}
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {[
                    'A0-44: KRONOS runs only permissionless cranks with proof emission',
                    'A0-45: Burn budget never reduces emergency reserve below 25%',
                    'A0-46: Token launch requires KRONOS proof + 72h delay',
                    'A0-47: Vesting release permissionless after cliff',
                    'A0-48: Cannot modify pricing without cost oracle signature',
                    'A0-49: Revenue distribution requires epoch completion proof',
                    'A0-50: All actions emit proof BEFORE execution',
                  ].map((axiom, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                      <span>{axiom}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!expanded && (
            <div className="flex flex-wrap gap-2">
              {['A0-44', 'A0-45', 'A0-46', 'A0-47', 'A0-48', 'A0-49', 'A0-50'].map((a) => (
                <span key={a} className="text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-2 py-0.5">
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/economics')}>
            View Economics Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/token')}>
            View Token Status
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Secondary agent card data
// ---------------------------------------------------------------------------
const secondaryAgents = [
  {
    key: 'aeon',
    name: 'AEON',
    role: 'Sovereign Governor',
    tagline: 'Delegates, coordinates, decides',
    description:
      'AEON is the top-level authority: it creates and manages sub-agents (depth = 1, hard cap 100), coordinates the decision lifecycle, and delegates execution to authorized agents. AEON never executes directly — it governs.',
    status: 'Governing',
    statusVariant: 'success' as const,
    dotColor: 'bg-rose-400',
    gradient: 'rose' as const,
    accentColor: 'text-rose-400',
    tagColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    lastActionSecs: 300,
    metrics: [
      { label: 'Agents Managed', value: '3' },
      { label: 'Decisions Logged', value: '4,891' },
      { label: 'Pending Proposals', value: '0' },
      { label: 'Axioms', value: '5' },
    ],
    axiomTags: ['A0-1', 'A0-9', 'A0-28', 'A0-39', 'A0-43'],
    axiomDetail: [
      'A0-1: Only AEON creates sub-agents; depth = 1, hard cap 100',
      'A0-9: log_decision mandatory before any execution',
      'A0-28: Evaluation and execution never in same agent for the same domain',
      'A0-39: Auto-learning in production is prohibited',
      'A0-43: All AEON delegations are recorded on-chain',
    ],
    href: '/aeon',
    hrefLabel: 'View AEON Dashboard',
  },
  {
    key: 'apollo',
    name: 'APOLLO',
    role: 'DeFi Risk Evaluator',
    tagline: 'Evaluates — never executes',
    description:
      'APOLLO runs 3 risk modules: Pool Taxonomy, MLI (Mercenary Liquidity Index), and Effective APR. Its output feeds the Risk Engine at a weight capped at 40%. APOLLO never executes — its assessments are deposited into PDAs and audited.',
    status: 'Evaluating',
    statusVariant: 'info' as const,
    dotColor: 'bg-cyan-400',
    gradient: 'cyan' as const,
    accentColor: 'text-cyan-400',
    tagColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    lastActionSecs: 180,
    metrics: [
      { label: 'Pools Assessed', value: '128' },
      { label: 'Risk Engine Weight', value: '≤ 40%' },
      { label: 'Evidence Families', value: '5' },
      { label: 'Axioms', value: '4' },
    ],
    axiomTags: ['A0-4', 'A0-15', 'A0-16', 'A0-30'],
    axiomDetail: [
      'A0-4: APOLLO feeds Risk Engine only — never triggers execution',
      'A0-15: Pool Taxonomy module classifies liquidity risk deterministically',
      'A0-16: MLI requires ≥ 2 independent evidence families or ALERT-ONLY',
      'A0-30: Effective APR must account for impermanent loss and fee decay',
    ],
    href: null,
    hrefLabel: null,
  },
  {
    key: 'hermes',
    name: 'HERMES',
    role: 'DeFi Intelligence',
    tagline: 'Intelligence — never executes',
    description:
      'HERMES provides 5 external intelligence services: market data aggregation, protocol monitoring, on-chain analytics, sentiment feeds, and A2A intelligence marketplace. All outputs are terminal — they are consumed externally and never enter the execution chain.',
    status: 'Monitoring',
    statusVariant: 'warning' as const,
    dotColor: 'bg-purple-400',
    gradient: 'purple' as const,
    accentColor: 'text-purple-400',
    tagColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    lastActionSecs: 45,
    metrics: [
      { label: 'Active Services', value: '5' },
      { label: 'Data Points/min', value: '2,400' },
      { label: 'A2A Consumers', value: '0' },
      { label: 'Axioms', value: '3' },
    ],
    axiomTags: ['A0-22', 'A0-29', 'A0-35'],
    axiomDetail: [
      'A0-22: HERMES outputs are terminal — never enter execution chain',
      'A0-29: HERMES never holds custody of any asset',
      'A0-35: All intelligence feeds are versioned and auditable',
    ],
    href: null,
    hrefLabel: null,
  },
];

// ---------------------------------------------------------------------------
// Secondary Agent Card
// ---------------------------------------------------------------------------
function SecondaryAgentCard({ agent }: { agent: (typeof secondaryAgents)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const IllustrationMap: Record<string, React.FC> = {
    aeon: AEONIllustration,
    apollo: APOLLOIllustration,
    hermes: HERMESIllustration,
  };
  const Illustration = IllustrationMap[agent.key];

  return (
    <GlassCard gradient={agent.gradient} hover>
      <div
        className="p-6 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
      >
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <PulsingDot color={agent.dotColor} />
            <Badge variant={agent.statusVariant} className="text-xs px-2 py-0.5">
              {agent.status}
            </Badge>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>

        {/* Illustration */}
        <div className="w-28 h-28 mx-auto mb-4">
          <Illustration />
        </div>

        {/* Name & role */}
        <h3 className="text-xl font-bold text-white mb-1 text-center">{agent.name}</h3>
        <p className={`text-sm font-semibold mb-1 text-center ${agent.accentColor}`}>{agent.role}</p>
        <p className="text-xs text-gray-500 text-center mb-3 italic">{agent.tagline}</p>

        {/* Last action */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-4">
          <Clock className="w-3 h-3" />
          <span>Last action:</span>
          <span className={`font-medium ${agent.accentColor}`}>
            <RelativeTime secondsAgo={agent.lastActionSecs} />
          </span>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {agent.metrics.map((m) => (
            <div key={m.label} className="bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg p-2.5">
              <p className="text-[10px] text-gray-500 mb-0.5">{m.label}</p>
              <p className={`text-xs font-semibold ${agent.accentColor}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Axiom tags (always visible) */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {agent.axiomTags.map((tag) => (
            <span key={tag} className={`text-[10px] border rounded px-1.5 py-0.5 ${agent.tagColor}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-white/5 pt-4">
              <p className="text-sm text-gray-400 mb-4">{agent.description}</p>

              {/* Axiom details */}
              <div className="bg-[#0F1420]/60 backdrop-blur border border-white/5 rounded-lg p-3 mb-4">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Enforced Axioms</p>
                <div className="space-y-1.5">
                  {agent.axiomDetail.map((d, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              {agent.href && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(agent.href!);
                  }}
                >
                  {agent.hrefLabel}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AgentsPage() {
  const router = useRouter();
  return (
    <div className="space-y-8 relative">
      {/* Background gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Page Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            AI Agents
          </h1>
          <p className="text-gray-400 text-lg">
            4 autonomous agents — proof-before-action, zero silent state changes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">4 agents active</span>
          <Badge variant="info" className="text-sm px-4 py-2">
            v3.4.0
          </Badge>
        </div>
      </div>

      {/* Firewall Chain */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative z-10"
      >
        <FirewallChain />
      </motion.div>

      {/* KRONOS Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10"
      >
        <KRONOSCard />
      </motion.div>

      {/* Secondary Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {secondaryAgents.map((agent, idx) => (
          <motion.div
            key={agent.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + idx * 0.08 }}
          >
            <SecondaryAgentCard agent={agent} />
          </motion.div>
        ))}
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10"
      >
        <GlassCard gradient="cyan">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">AXIONBLADE v3.4.0 Economic System</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Complete economic autonomy with C1-C4 critical corrections implemented
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    'Cost Oracle (C1)',
                    'Monthly Credits (C2)',
                    'Deterministic Airdrop (C3)',
                    'Burn Budget (C4)',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        <GlassCard
          gradient="purple"
          hover
          onClick={() => router.push('/economics')}
          className="cursor-pointer"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Economics Dashboard</h3>
            <p className="text-sm text-gray-400">Live pricing, margins, revenue splits</p>
          </div>
        </GlassCard>

        <GlassCard
          gradient="amber"
          hover
          onClick={() => router.push('/token')}
          className="cursor-pointer"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Token Launch</h3>
            <p className="text-sm text-gray-400">Conditions, vesting, burn stats</p>
          </div>
        </GlassCard>

        <GlassCard
          gradient="emerald"
          hover
          onClick={() => router.push('/airdrop')}
          className="cursor-pointer"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Airdrop Eligibility</h3>
            <p className="text-sm text-gray-400">Points, breakdown, claim status</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
