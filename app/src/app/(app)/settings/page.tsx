"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { truncateAddress } from "@/lib/format";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
  Settings,
  Wallet,
  Monitor,
  Bell,
  Globe,
  Info,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  Unplug,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Toggle switch component                                            */
/* ------------------------------------------------------------------ */

function Toggle({
  enabled,
  onToggle,
  label,
  description,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/50",
          enabled
            ? "bg-[#00D4FF]"
            : "bg-[#1A2235] hover:bg-[#243049]"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-300",
            enabled ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */

function Section({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="bg-[#0F1420] border border-[#1A2235] rounded-xl p-5 divide-y divide-[#1A2235]">
        {children}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Copy button                                                        */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-[#1A2235] transition-colors text-gray-500 hover:text-gray-300 cursor-pointer"
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REFRESH_OPTIONS: { label: string; value: number }[] = [
  { label: "5s",  value: 5000  },
  { label: "10s", value: 10000 },
  { label: "30s", value: 30000 },
  { label: "60s", value: 60000 },
  { label: "Off", value: 0     },
];

const MOCK_WALLET_ADDRESS = "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy";
const MOCK_BALANCE = "42.5";

const PROGRAMS = [
  { name: "AEON Governor (noumen_core)",      address: "9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE" },
  { name: "APOLLO Risk Engine (noumen_apollo)", address: "92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee" },
  { name: "HERMES Intelligence (noumen_hermes)",address: "Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj" },
  { name: "Treasury (noumen_treasury)",       address: "EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu" },
  { name: "Service Layer (noumen_service)",   address: "9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY" },
  { name: "Proof Logger (noumen_proof)",      address: "3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV" },
  { name: "Auditor (noumen_auditor)",         address: "CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const {
    compactView,
    showTxLinks,
    refreshInterval,
    animations,
    circuitBreakerAlerts,
    axiomViolationAlerts,
    largeTransactionAlerts,
    newIntelligenceReports,
    toggleCompactView,
    toggleShowTxLinks,
    setRefreshInterval,
    toggleAnimations,
    toggleCircuitBreakerAlerts,
    toggleAxiomViolationAlerts,
    toggleLargeTransactionAlerts,
    toggleNewIntelligenceReports,
  } = useSettingsStore();

  const [isConnected] = useState(true);

  return (
    <div className="space-y-8 max-w-2xl">
      {/* ---- Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00D4FF]/15 text-[#00D4FF]">
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-400">
            Configure your AXIONBLADE dashboard
          </p>
        </div>
      </motion.div>

      {/* ---- Section 1: Wallet Connection ---- */}
      <Section
        title="Wallet"
        icon={<Wallet size={18} className="text-amber-400" />}
        delay={0.1}
      >
        {isConnected ? (
          <>
            {/* Address row */}
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-1">Connected Address</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-gray-200">
                    {truncateAddress(MOCK_WALLET_ADDRESS, 6)}
                  </p>
                  <CopyButton text={MOCK_WALLET_ADDRESS} />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">Connected</span>
              </div>
            </div>

            {/* Balance row */}
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-1">Balance</p>
                <p className="text-sm font-semibold text-gray-200">
                  {MOCK_BALANCE} SOL
                </p>
              </div>
            </div>

            {/* Network + Disconnect row */}
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-1">Network</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Localnet
                </span>
              </div>
              <button
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border border-rose-500/30 px-4 py-2",
                  "text-sm font-medium text-rose-400",
                  "hover:bg-rose-500/10 hover:border-rose-500/50 transition-all duration-300 cursor-pointer"
                )}
              >
                <Unplug size={14} />
                Disconnect
              </button>
            </div>
          </>
        ) : (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1A2235] border border-[#1A2235]">
              <Wallet size={24} className="text-gray-500" />
            </div>
            <p className="text-sm text-gray-400 text-center">
              Connect your Solana wallet to interact with AXIONBLADE
            </p>
            <button
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-6 py-2.5",
                "bg-[#00D4FF] text-white font-medium text-sm",
                "hover:bg-[#00B8D9]",
                "transition-colors duration-200 cursor-pointer"
              )}
            >
              <Zap size={16} />
              Connect Wallet
            </button>
          </div>
        )}
      </Section>

      {/* ---- Section 2: Display Preferences ---- */}
      <Section
        title="Display Preferences"
        icon={<Monitor size={18} className="text-cyan-400" />}
        delay={0.2}
      >
        <Toggle
          enabled={compactView}
          onToggle={toggleCompactView}
          label="Compact View"
          description="Reduce spacing and card sizes across the dashboard"
        />

        <Toggle
          enabled={showTxLinks}
          onToggle={toggleShowTxLinks}
          label="Show Transaction Links"
          description="Display Solscan links next to on-chain events"
        />

        {/* Auto-refresh interval dropdown */}
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200">
              Auto-refresh Interval
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              How often data is automatically refreshed
            </p>
          </div>
          <div className="relative">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className={cn(
                "h-9 appearance-none rounded-xl border border-[#1A2235] bg-[#1A2235]",
                "pl-3 pr-8 text-sm text-gray-300 cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/40",
                "hover:bg-[#1A2235] transition-colors duration-200"
              )}
            >
              {REFRESH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-gray-900 text-gray-300">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        <Toggle
          enabled={animations}
          onToggle={toggleAnimations}
          label="Animations"
          description="Enable motion effects and transitions"
        />
      </Section>

      {/* ---- Section 3: Notifications ---- */}
      <Section
        title="Notifications"
        icon={<Bell size={18} className="text-rose-400" />}
        delay={0.3}
      >
        <Toggle
          enabled={circuitBreakerAlerts}
          onToggle={toggleCircuitBreakerAlerts}
          label="Circuit Breaker Alerts"
          description="Notify when a circuit breaker is triggered in the execution chain"
        />

        <Toggle
          enabled={axiomViolationAlerts}
          onToggle={toggleAxiomViolationAlerts}
          label="Axiom Violation Alerts"
          description="Notify when any of the 50 axioms (49 active) detects a violation"
        />

        <Toggle
          enabled={largeTransactionAlerts}
          onToggle={toggleLargeTransactionAlerts}
          label="Large Transaction Alerts"
          description="Notify on transactions exceeding the configured threshold"
        />

        <Toggle
          enabled={newIntelligenceReports}
          onToggle={toggleNewIntelligenceReports}
          label="New Intelligence Reports"
          description="Notify when HERMES publishes new intelligence reports"
        />
      </Section>

      {/* ---- Section 4: Network ---- */}
      <Section
        title="Network"
        icon={<Globe size={18} className="text-emerald-400" />}
        delay={0.4}
      >
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-1">Current Network</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Localnet
            </span>
          </div>
          <span className="inline-flex items-center rounded-full bg-[#1A2235] border border-[#1A2235] px-2.5 py-0.5 text-xs font-medium text-gray-400">
            Cluster: localnet
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-1">RPC URL</p>
            <p className="font-mono text-sm text-gray-300">
              http://localhost:8899
            </p>
          </div>
          <CopyButton text="http://localhost:8899" />
        </div>
      </Section>

      {/* ---- Section 5: About ---- */}
      <Section
        title="About"
        icon={<Info size={18} className="text-[#00D4FF]" />}
        delay={0.5}
      >
        {/* Version */}
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-1">Version</p>
            <p className="text-sm font-semibold text-gray-200">v3.4.0</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-[#00D4FF]/15 border border-[#00D4FF]/30 px-2.5 py-0.5 text-xs font-medium text-[#00D4FF]">
            Latest
          </span>
        </div>

        {/* Programs */}
        <div className="py-4">
          <p className="text-xs text-gray-500 mb-3">Programs</p>
          <div className="space-y-2">
            {PROGRAMS.map((prog) => (
              <div
                key={prog.name}
                className="flex items-center justify-between gap-3 py-1.5 px-3 rounded-lg bg-[#0A0E17] hover:bg-[#1A2235] transition-colors"
              >
                <span className="text-xs font-medium text-gray-300">
                  {prog.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-gray-500">
                    {truncateAddress(prog.address, 4)}
                  </span>
                  <CopyButton text={prog.address} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="py-4">
          <p className="text-xs text-gray-500 mb-3">Links</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "GitHub", href: "#" },
              { label: "Documentation", href: "#" },
              { label: "Axioms Reference", href: "#" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border border-[#1A2235] px-3 py-2",
                  "text-xs font-medium text-gray-400",
                  "hover:border-[#243049] hover:text-gray-200 transition-colors duration-200"
                )}
              >
                {link.label}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>
      </Section>

      {/* Disclaimer */}
      <div className="border-t border-white/[0.04] pt-6 mt-8 space-y-2">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Settings are stored locally in your browser. AXIONBLADE is live on Solana mainnet-beta.
          Configuration changes take effect immediately.
          AXIONBLADE does not provide financial advice. All risk assessments are informational only.
        </p>
      </div>
    </div>
  );
}
