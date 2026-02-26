'use client';

// ---------------------------------------------------------------------------
// AXIONBLADE Services Hub — Organized by category, no tabs needed
// ---------------------------------------------------------------------------

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Coins,
  ScanSearch,
  TrendingUp,
  Droplet,
  Shield,
  Zap,
  Crown,
  Lock,
  Sparkles,
  ChevronRight,
  Percent,
  BarChart3,
  CheckCircle2,
  Star,
  Wrench,
  Bot,
  Code2,
  AlertTriangle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type TierLabel = 'Free' | 'Pro' | 'Institutional';

interface ServiceDef {
  id: string;
  name: string;
  description: string;
  detail: string;
  icon: React.ElementType;
  href: string;
  price: string;
  priceNote: string;
  tier: TierLabel;
  color: string;
  category: 'tools' | 'agents' | 'apis';
  features: string[];
  badge?: string;
  featured?: boolean;
}

const SERVICES: ServiceDef[] = [
  // ── TOOLS ────────────────────────────────────────────────────────────────
  {
    id: 'wallet-scanner',
    name: 'Wallet Scanner',
    description: 'Deep on-chain wallet risk analysis',
    detail: 'Scan any Solana wallet for risky token holdings, suspicious DeFi positions, and anomalous on-chain behaviour. Structured risk score with actionable findings.',
    icon: ScanSearch,
    href: '/wallet-scanner',
    price: '0.009 SOL',
    priceNote: 'per scan',
    tier: 'Pro',
    color: 'cyan',
    category: 'tools',
    features: ['Token risk classification', 'DeFi position exposure', 'Behavioural anomaly detection', 'Risk score 0–100'],
    badge: 'Most Used',
    featured: true,
  },
  {
    id: 'protocol-auditor',
    name: 'Protocol Auditor',
    description: 'Instant DeFi protocol safety check',
    detail: 'Audit any DeFi protocol against 50 active axioms. Verify contracts, liquidity health, admin privileges, and upgrade risk.',
    icon: ShieldCheck,
    href: '/protocol-auditor',
    price: '0.0024 SOL',
    priceNote: 'per audit',
    tier: 'Pro',
    color: 'emerald',
    category: 'tools',
    features: ['Contract verification', 'Admin key risk', 'Upgrade proxy detection', 'Axiom compliance score'],
  },
  {
    id: 'token-deep-dive',
    name: 'Token Deep Dive',
    description: 'Full token intelligence report',
    detail: 'Comprehensive SPL token analysis: holder distribution, wash trading signals, team wallet concentration, and tokenomics red flags.',
    icon: Coins,
    href: '/token-deep-dive',
    price: '0.003 SOL',
    priceNote: 'per report',
    tier: 'Pro',
    color: 'amber',
    category: 'tools',
    features: ['Holder concentration map', 'Wash trading signals', 'Liquidity depth analysis', 'Tokenomics red flags'],
  },
  {
    id: 'yield-optimizer',
    name: 'Yield Optimizer',
    description: 'Risk-adjusted yield opportunities',
    detail: 'Compare yield farming across Solana protocols. Each position scored for risk-adjusted return using APOLLO\'s multi-layer framework.',
    icon: TrendingUp,
    href: '/yield-optimizer',
    price: '0.0018 SOL',
    priceNote: 'per query',
    tier: 'Pro',
    color: 'purple',
    category: 'tools',
    features: ['Risk-adjusted APR', 'IL estimation', 'Protocol safety score', 'Exit liquidity depth'],
  },
  {
    id: 'pool-analyzer',
    name: 'Pool Analyzer',
    description: 'Liquidity pool deep analysis',
    detail: 'Dissect any AMM pool: fee tiers, TVL stability, volume patterns, impermanent loss estimation, and whale concentration risk.',
    icon: Droplet,
    href: '/pool-analyzer',
    price: '0.0012 SOL',
    priceNote: 'per analysis',
    tier: 'Pro',
    color: 'blue',
    category: 'tools',
    features: ['TVL stability score', 'Volume/TVL ratio', 'Whale concentration', 'IL simulation'],
    badge: 'Best Value',
    featured: true,
  },
  {
    id: 'liquidation-scanner',
    name: 'Liquidation Scanner',
    description: 'Loan health monitoring & liquidation risk',
    detail: 'Monitor your DeFi loan positions across MarginFi, Kamino, Solend, and Drift. Real-time health factor, volatility analysis over 7/14/30 days, and stress test simulations for -10% to -60% price crashes.',
    icon: AlertTriangle,
    href: '/liquidation-scanner',
    price: '0.006 SOL',
    priceNote: 'per scan',
    tier: 'Pro',
    color: 'rose',
    category: 'tools',
    features: ['Health factor monitoring', 'Volatility 7/14/30d analysis', 'Stress test simulations', 'Liquidation price alerts'],
    badge: 'New',
    featured: true,
  },

  // ── AGENTS ───────────────────────────────────────────────────────────────
  {
    id: 'apollo',
    name: 'APOLLO',
    description: 'Autonomous DeFi risk evaluator — 3 modules',
    detail: 'Continuous risk assessment across monitored pools via Pool Taxonomy, MLI, and Effective APR modules. Weight capped at 40% in the risk engine.',
    icon: Shield,
    href: '/apollo',
    price: 'Included',
    priceNote: 'protocol access',
    tier: 'Free',
    color: 'cyan',
    category: 'agents',
    features: ['Pool Taxonomy module', 'MLI scoring (≤40% weight)', 'Effective APR calculation', 'NEVER executes'],
    featured: true,
  },
  {
    id: 'hermes',
    name: 'HERMES',
    description: '5 DeFi intelligence services, terminal output',
    detail: 'Pool Comparison, Effective APR Calculator, Risk Decomposition Vector, Yield Trap Intelligence, and Protocol Health Snapshot. Never feeds the execution chain.',
    icon: Zap,
    href: '/hermes',
    price: '0.0024 SOL',
    priceNote: 'per call',
    tier: 'Free',
    color: 'purple',
    category: 'agents',
    features: ['Pool Comparison', 'Effective APR Calculator', 'Risk Decomposition Vector', 'Yield Trap Intelligence', 'Protocol Health Snapshot'],
    badge: '5 Services',
  },
  {
    id: 'aeon',
    name: 'AEON',
    description: 'Sovereign governance — delegates, never executes',
    detail: 'AEON is the sovereign governor. Delegates, coordinates, and decides — never executes directly. All decisions are logged via log_decision before any action.',
    icon: Crown,
    href: '/aeon',
    price: '0.045 SOL',
    priceNote: 'per month',
    tier: 'Institutional',
    color: 'rose',
    category: 'agents',
    features: ['Agent lifecycle management', 'Policy change execution', 'Proof-of-decision log', 'Hard cap: 100 agents'],
  },

  // ── APIS ─────────────────────────────────────────────────────────────────
  {
    id: 'risk-score-api',
    name: 'Risk Score API',
    description: 'Embed APOLLO risk scores in your product',
    detail: 'REST API to fetch risk scores for any Solana address. HMAC-signed responses, webhook support, rate-limited by tier.',
    icon: BarChart3,
    href: '/integrations',
    price: '0.001 SOL',
    priceNote: 'per 1k calls',
    tier: 'Pro',
    color: 'indigo',
    category: 'apis',
    features: ['HMAC-signed responses', 'Webhook support', '100 req/hr (Pro)', '10k req/mo (Protocol)'],
  },
  {
    id: 'effective-apr-api',
    name: 'Effective APR API',
    description: 'Real APR after fees, IL, and gas',
    detail: 'Programmatic access to HERMES Effective APR calculations. APR, fee drag, and IL estimates for any Solana pool. Used by bots and dashboards.',
    icon: Percent,
    href: '/integrations',
    price: '0.0008 SOL',
    priceNote: 'per 1k calls',
    tier: 'Pro',
    color: 'teal',
    category: 'apis',
    features: ['Fee drag calculation', 'IL estimation', 'Historical APR', 'WebSocket streaming'],
  },
];

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

const colorMap: Record<string, { bg: string; border: string; text: string; hover: string; badge: string }> = {
  cyan:    { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    text: 'text-cyan-400',    hover: 'hover:border-cyan-500/40',    badge: 'bg-cyan-500/20 text-cyan-300' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', hover: 'hover:border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   hover: 'hover:border-amber-500/40',   badge: 'bg-amber-500/20 text-amber-300' },
  purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  text: 'text-purple-400',  hover: 'hover:border-purple-500/40',  badge: 'bg-purple-500/20 text-purple-300' },
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400',    hover: 'hover:border-blue-500/40',    badge: 'bg-blue-500/20 text-blue-300' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    text: 'text-rose-400',    hover: 'hover:border-rose-500/40',    badge: 'bg-rose-500/20 text-rose-300' },
  indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  text: 'text-indigo-400',  hover: 'hover:border-indigo-500/40',  badge: 'bg-indigo-500/20 text-indigo-300' },
  teal:    { bg: 'bg-teal-500/10',    border: 'border-teal-500/20',    text: 'text-teal-400',    hover: 'hover:border-teal-500/40',    badge: 'bg-teal-500/20 text-teal-300' },
};

const tierStyle: Record<TierLabel, string> = {
  Free:         'bg-white/5 text-gray-400 border border-white/10',
  Pro:          'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
  Institutional:'bg-amber-500/15 text-amber-400 border border-amber-500/25',
};

// ---------------------------------------------------------------------------
// Featured card (large, vertical — used for top picks)
// ---------------------------------------------------------------------------

function FeaturedCard({ svc, index }: { svc: ServiceDef; index: number }) {
  const c = colorMap[svc.color] ?? colorMap.cyan;
  const Icon = svc.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className={`group relative flex flex-col rounded-2xl border bg-[#0A0E17] p-5 transition-all duration-300 ${c.border} ${c.hover}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${c.bg} border ${c.border}`}>
          <Icon size={20} className={c.text} />
        </div>
        <div className="flex items-center gap-2">
          {svc.badge && (
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${c.badge}`}>
              {svc.badge}
            </span>
          )}
          <span className={`text-[9px] font-semibold px-2 py-1 rounded-full ${tierStyle[svc.tier]}`}>
            {svc.tier}
          </span>
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-1">{svc.name}</h3>
      <p className={`text-xs font-medium ${c.text} mb-2`}>{svc.description}</p>
      <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{svc.detail}</p>

      <ul className="space-y-1.5 mb-5">
        {svc.features.slice(0, 4).map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle2 size={11} className={`${c.text} flex-shrink-0`} />
            {f}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
        <div>
          <span className={`text-lg font-bold ${svc.tier === 'Free' ? 'text-gray-300' : c.text}`}>
            {svc.price}
          </span>
          <span className="text-[10px] text-gray-600 ml-1">{svc.priceNote}</span>
        </div>
        <Link
          href={svc.href}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200 ${c.bg} ${c.text} hover:brightness-125 border ${c.border}`}
        >
          {svc.tier === 'Institutional' && <Lock size={11} />}
          Launch
          <ChevronRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Compact horizontal row card — for regular services
// ---------------------------------------------------------------------------

function ServiceRow({ svc, index }: { svc: ServiceDef; index: number }) {
  const c = colorMap[svc.color] ?? colorMap.cyan;
  const Icon = svc.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={`group flex items-center gap-4 rounded-xl border bg-[#0A0E17] px-4 py-3.5 transition-all duration-200 ${c.border} ${c.hover}`}
    >
      {/* Icon */}
      <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${c.bg} border ${c.border} flex-shrink-0`}>
        <Icon size={16} className={c.text} />
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{svc.name}</span>
          {svc.badge && (
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${c.badge}`}>
              {svc.badge}
            </span>
          )}
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${tierStyle[svc.tier]}`}>
            {svc.tier}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{svc.description}</p>
      </div>

      {/* Features preview — hidden on sm */}
      <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
        {svc.features.slice(0, 2).map((f) => (
          <span key={f} className="flex items-center gap-1 text-[10px] text-gray-600">
            <CheckCircle2 size={9} className={c.text} />
            {f}
          </span>
        ))}
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0 hidden sm:block">
        <p className={`text-sm font-bold ${svc.tier === 'Free' ? 'text-gray-300' : c.text}`}>{svc.price}</p>
        <p className="text-[10px] text-gray-600">{svc.priceNote}</p>
      </div>

      {/* CTA */}
      <Link
        href={svc.href}
        className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${c.bg} ${c.text} hover:brightness-125 border ${c.border} flex-shrink-0`}
      >
        {svc.tier === 'Institutional' && <Lock size={10} />}
        Open
        <ChevronRight size={11} />
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({
  icon: Icon,
  label,
  count,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.25 }}
      className="flex items-center gap-3"
    >
      <div className={`flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 border border-white/[0.06]`}>
        <Icon size={14} className={color} />
      </div>
      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">{label}</h2>
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-600 font-medium">{count}</span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const STATS = [
  { label: 'Available Services', value: '9',        icon: Sparkles,   color: 'text-cyan-400' },
  { label: 'Active Agents',      value: '4',        icon: Bot,        color: 'text-purple-400' },
  { label: 'Price Floor',        value: 'Cost +20%',icon: ShieldCheck,color: 'text-emerald-400' },
  { label: 'Max Discount',       value: '30%',      icon: Star,       color: 'text-amber-400' },
];

export default function ServicesPage() {
  const featured = SERVICES.filter((s) => s.featured);
  const tools    = SERVICES.filter((s) => s.category === 'tools'  && !s.featured);
  const agents   = SERVICES.filter((s) => s.category === 'agents' && !s.featured);
  const allAgents = SERVICES.filter((s) => s.category === 'agents');
  const apis     = SERVICES.filter((s) => s.category === 'apis');

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 bg-clip-text text-transparent"
        >
          Services
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg"
        >
          Every service is priced above cost, auditable on-chain, and governed by 50 active axioms.
        </motion.p>
      </div>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3 bg-[#0A0E17] border border-white/[0.06] rounded-xl px-4 py-3">
              <Icon size={16} className={s.color} />
              <div>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-600">{s.label}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ── Volume discount banner ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 flex-shrink-0">
          <Percent size={14} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-300">Volume Discounts — up to 30% off</p>
          <p className="text-xs text-gray-500">
            10 calls/month → 10% · 50 calls → 20% · 100+ calls → 30%. Tracked on-chain per wallet.
          </p>
        </div>
        <Link
          href="/economy"
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 flex-shrink-0"
        >
          Details <ChevronRight size={12} />
        </Link>
      </motion.div>

      {/* ── Featured: top picks ─────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader icon={Star} label="Top Picks" count={featured.length} color="text-amber-400" delay={0.2} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((svc, i) => (
            <FeaturedCard key={svc.id} svc={svc} index={i} />
          ))}
        </div>
      </div>

      {/* ── Tools ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader icon={Wrench} label="Tools" count={SERVICES.filter(s => s.category === 'tools').length} color="text-blue-400" delay={0.25} />
        <div className="space-y-2">
          {tools.map((svc, i) => (
            <ServiceRow key={svc.id} svc={svc} index={i} />
          ))}
        </div>
      </div>

      {/* ── Agents ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader icon={Bot} label="Agents" count={allAgents.length} color="text-purple-400" delay={0.3} />
        <div className="space-y-2">
          {agents.map((svc, i) => (
            <ServiceRow key={svc.id} svc={svc} index={i} />
          ))}
        </div>
      </div>

      {/* ── APIs ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader icon={Code2} label="APIs" count={apis.length} color="text-indigo-400" delay={0.35} />
        <div className="space-y-2">
          {apis.map((svc, i) => (
            <ServiceRow key={svc.id} svc={svc} index={i} />
          ))}
        </div>
      </div>

      {/* ── Revenue split footer ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="border-t border-white/[0.04] pt-6"
      >
        <p className="text-xs text-gray-600 text-center mb-3">Revenue distribution per service payment</p>
        <div className="flex items-center gap-0 rounded-xl overflow-hidden h-2.5 mb-3 max-w-lg mx-auto">
          <div className="h-full bg-blue-500/70"    style={{ width: '40%' }} title="Operations 40%" />
          <div className="h-full bg-emerald-500/70" style={{ width: '45%' }} title="Treasury 45%" />
          <div className="h-full bg-amber-500/70"   style={{ width: '15%' }} title="Creator 15%" />
        </div>
        <div className="flex items-center justify-center gap-6 text-[10px] text-gray-500">
          {[
            { label: 'Operations', pct: '40%', color: 'bg-blue-500/70' },
            { label: 'Treasury',   pct: '45%', color: 'bg-emerald-500/70' },
            { label: 'Creator',    pct: '15%', color: 'bg-amber-500/70' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.color}`} />
              {s.label} <span className="text-gray-600">{s.pct}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
