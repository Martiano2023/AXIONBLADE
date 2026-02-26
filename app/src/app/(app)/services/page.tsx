'use client';

// ---------------------------------------------------------------------------
// AXIONBLADE Services Hub — All available services in one place
// ---------------------------------------------------------------------------

import { useState } from 'react';
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
  Activity,
  BarChart3,
  CheckCircle2,
  Star,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type Category = 'all' | 'tools' | 'agents' | 'apis';
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
  color: string;         // tailwind colour token (e.g. "cyan")
  category: Exclude<Category, 'all'>;
  features: string[];
  badge?: string;
}

const SERVICES: ServiceDef[] = [
  // ── TOOLS ────────────────────────────────────────────────────────────────
  {
    id: 'wallet-scanner',
    name: 'Wallet Scanner',
    description: 'Deep on-chain wallet risk analysis',
    detail: 'Scan any Solana wallet for risky token holdings, suspicious DeFi positions, and anomalous on-chain behaviour. Receive a structured risk score with actionable findings.',
    icon: ScanSearch,
    href: '/wallet-scanner',
    price: '0.05 SOL',
    priceNote: 'per scan',
    tier: 'Pro',
    color: 'cyan',
    category: 'tools',
    features: ['Token risk classification', 'DeFi position exposure', 'Behavioural anomaly detection', 'Risk score (0–100)'],
    badge: 'Most Used',
  },
  {
    id: 'protocol-auditor',
    name: 'Protocol Auditor',
    description: 'Instant DeFi protocol safety check',
    detail: 'Audit any DeFi protocol against AXIONBLADE\'s 29-axiom safety framework. Verify contract addresses, liquidity health, admin privileges, and upgrade risk.',
    icon: ShieldCheck,
    href: '/protocol-auditor',
    price: '0.01 SOL',
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
    detail: 'Comprehensive analysis of any SPL token: liquidity depth, holder distribution, wash trading signals, team wallet concentration, and tokenomics red flags.',
    icon: Coins,
    href: '/token-deep-dive',
    price: '0.012 SOL',
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
    detail: 'Compare yield farming opportunities across Solana DeFi protocols. Each position is scored for risk-adjusted return using APOLLO\'s multi-layer intelligence framework.',
    icon: TrendingUp,
    href: '/yield-optimizer',
    price: '0.008 SOL',
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
    detail: 'Dissect any AMM liquidity pool: fee tiers, TVL stability, volume patterns, impermanent loss estimation, and whale concentration risk.',
    icon: Droplet,
    href: '/pool-analyzer',
    price: '0.005 SOL',
    priceNote: 'per analysis',
    tier: 'Pro',
    color: 'blue',
    category: 'tools',
    features: ['TVL stability score', 'Volume/TVL ratio', 'Whale concentration', 'IL simulation'],
    badge: 'Best Value',
  },

  // ── AGENTS ───────────────────────────────────────────────────────────────
  {
    id: 'apollo',
    name: 'APOLLO',
    description: 'Autonomous DeFi risk evaluator',
    detail: 'APOLLO runs continuous 3-module risk assessment across monitored pools — Pool Taxonomy, Multi-Layer Intelligence (MLI), and Effective APR. Weight capped at 40% in the risk engine to prevent single-agent dominance.',
    icon: Shield,
    href: '/apollo',
    price: 'Included',
    priceNote: 'with protocol access',
    tier: 'Free',
    color: 'cyan',
    category: 'agents',
    features: ['Pool Taxonomy module', 'MLI scoring (≤40% weight)', 'Effective APR calculation', 'NEVER executes transactions'],
  },
  {
    id: 'hermes',
    name: 'HERMES',
    description: '5 DeFi intelligence services',
    detail: 'HERMES provides terminal intelligence output across 5 services: Pool Comparison, Effective APR Calculator, Risk Decomposition Vector, Yield Trap Intelligence, and Protocol Health Snapshot. Never feeds the execution chain.',
    icon: Zap,
    href: '/hermes',
    price: '0.001 SOL',
    priceNote: 'per service call',
    tier: 'Free',
    color: 'purple',
    category: 'agents',
    features: ['Pool Comparison', 'Effective APR Calculator', 'Risk Decomposition Vector', 'Yield Trap Intelligence', 'Protocol Health Snapshot'],
    badge: '5 Services',
  },
  {
    id: 'aeon',
    name: 'AEON',
    description: 'Sovereign governance layer',
    detail: 'AEON is the sovereign governor of AXIONBLADE. It delegates, coordinates, and decides — but NEVER executes directly. All decisions are logged via log_decision before any action is taken.',
    icon: Crown,
    href: '/aeon',
    price: '0.02 SOL',
    priceNote: 'monthly access',
    tier: 'Institutional',
    color: 'rose',
    category: 'agents',
    features: ['Agent lifecycle management', 'Policy change execution', 'Proof-of-decision log', 'Hard cap: 100 agents'],
  },

  // ── APIS ─────────────────────────────────────────────────────────────────
  {
    id: 'risk-score-api',
    name: 'Risk Score API',
    description: 'Embed risk scores in your app',
    detail: 'REST API to fetch APOLLO risk scores for any Solana address. HMAC-signed responses ensure data integrity. Rate-limited by tier.',
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
    description: 'Real APR after fees and IL',
    detail: 'Programmatic access to HERMES Effective APR calculations. Returns APR, fee drag, and IL estimates for any pool on Solana. Used by trading bots and dashboards.',
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
// Colour helpers
// ---------------------------------------------------------------------------

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string; badge: string }> = {
  cyan:    { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    text: 'text-cyan-400',    glow: 'hover:border-cyan-500/40',    badge: 'bg-cyan-500/20 text-cyan-300' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'hover:border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   glow: 'hover:border-amber-500/40',   badge: 'bg-amber-500/20 text-amber-300' },
  purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  text: 'text-purple-400',  glow: 'hover:border-purple-500/40',  badge: 'bg-purple-500/20 text-purple-300' },
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400',    glow: 'hover:border-blue-500/40',    badge: 'bg-blue-500/20 text-blue-300' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    text: 'text-rose-400',    glow: 'hover:border-rose-500/40',    badge: 'bg-rose-500/20 text-rose-300' },
  indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  text: 'text-indigo-400',  glow: 'hover:border-indigo-500/40',  badge: 'bg-indigo-500/20 text-indigo-300' },
  teal:    { bg: 'bg-teal-500/10',    border: 'border-teal-500/20',    text: 'text-teal-400',    glow: 'hover:border-teal-500/40',    badge: 'bg-teal-500/20 text-teal-300' },
};

const tierStyle: Record<TierLabel, string> = {
  Free:        'bg-white/5 text-gray-400 border border-white/10',
  Pro:         'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
  Institutional:'bg-amber-500/15 text-amber-400 border border-amber-500/25',
};

const TABS: { key: Category; label: string; icon: React.ElementType }[] = [
  { key: 'all',    label: 'All',          icon: Sparkles },
  { key: 'tools',  label: 'Tools',        icon: ScanSearch },
  { key: 'agents', label: 'Agents',       icon: Shield },
  { key: 'apis',   label: 'APIs',         icon: Activity },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ServiceCard({ svc, index }: { svc: ServiceDef; index: number }) {
  const c = colorMap[svc.color] ?? colorMap.cyan;
  const Icon = svc.icon;
  const isFree = svc.tier === 'Free';
  const isInstitutional = svc.tier === 'Institutional';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={`group relative flex flex-col rounded-2xl border bg-[#0A0E17] p-5 transition-all duration-300 ${c.border} ${c.glow}`}
    >
      {/* Top badges */}
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${c.bg} ${c.border} border`}>
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

      {/* Name + description */}
      <h3 className="text-base font-bold text-white mb-1">{svc.name}</h3>
      <p className={`text-xs font-medium ${c.text} mb-2`}>{svc.description}</p>
      <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{svc.detail}</p>

      {/* Features */}
      <ul className="space-y-1.5 mb-5">
        {svc.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle2 size={11} className={`${c.text} flex-shrink-0`} />
            {f}
          </li>
        ))}
      </ul>

      {/* Price + CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
        <div>
          <span className={`text-lg font-bold ${isFree ? 'text-gray-300' : c.text}`}>
            {svc.price}
          </span>
          <span className="text-[10px] text-gray-600 ml-1">{svc.priceNote}</span>
        </div>
        <Link
          href={svc.href}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200 ${c.bg} ${c.text} hover:brightness-125 border ${c.border}`}
        >
          {isInstitutional ? <Lock size={11} /> : null}
          Launch
          <ChevronRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const STATS = [
  { label: 'Available Services', value: '9', icon: Sparkles, color: 'text-cyan-400' },
  { label: 'Active Agents', value: '3', icon: Shield, color: 'text-purple-400' },
  { label: 'Price Floor', value: 'Cost +20%', icon: ShieldCheck, color: 'text-emerald-400' },
  { label: 'Max Volume Discount', value: '30%', icon: Star, color: 'text-amber-400' },
];

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<Category>('all');

  const filtered = activeTab === 'all' ? SERVICES : SERVICES.filter((s) => s.category === activeTab);

  return (
    <div className="space-y-8">
      {/* Header */}
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
          Every service is priced to cover its cost, auditable on-chain, and subject to 50 active axioms.
        </motion.p>
      </div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center gap-3 bg-[#0A0E17] border border-white/[0.06] rounded-xl px-4 py-3"
            >
              <Icon size={16} className={s.color} />
              <div>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-600">{s.label}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Volume discount banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 flex-shrink-0">
          <Percent size={14} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-300">Volume Discounts — up to 30% off</p>
          <p className="text-xs text-gray-500">
            10 scans/month → 10% · 50 scans → 20% · 100+ scans → 30%. Tracked on-chain per wallet.
          </p>
        </div>
        <Link
          href="/economy"
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 flex-shrink-0"
        >
          Details <ChevronRight size={12} />
        </Link>
      </motion.div>

      {/* Category tabs */}
      <div className="flex items-center gap-1 bg-[#0A0E17] border border-white/[0.06] rounded-xl p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-[#1A2235] text-white border border-white/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-600'
              }`}>
                {tab.key === 'all' ? SERVICES.length : SERVICES.filter((s) => s.category === tab.key).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((svc, i) => (
          <ServiceCard key={svc.id} svc={svc} index={i} />
        ))}
      </div>

      {/* Revenue split footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="border-t border-white/[0.04] pt-6"
      >
        <p className="text-xs text-gray-600 text-center mb-3">Revenue distribution per service payment</p>
        <div className="flex items-center gap-0 rounded-xl overflow-hidden h-3 mb-3 max-w-lg mx-auto">
          <div className="h-full bg-blue-500" style={{ width: '50%' }} title="Operations 50%" />
          <div className="h-full bg-green-500" style={{ width: '25%' }} title="Reserve 25%" />
          <div className="h-full bg-purple-500" style={{ width: '15%' }} title="Treasury 15%" />
          <div className="h-full bg-amber-500" style={{ width: '10%' }} title="Creator 10%" />
        </div>
        <div className="flex items-center justify-center gap-6 text-[10px] text-gray-500">
          {[
            { label: 'Operations', pct: '50%', color: 'bg-blue-500' },
            { label: 'Reserve',    pct: '25%', color: 'bg-green-500' },
            { label: 'Treasury',   pct: '15%', color: 'bg-purple-500' },
            { label: 'Creator',    pct: '10%', color: 'bg-amber-500' },
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
