"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ScanSearch,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wallet,
  ArrowRight,
  BarChart3,
  Activity,
  Coins,
  Lock,
  Eye,
  TrendingDown,
  TrendingUp,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Crown,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePayment } from "@/hooks/usePayment";
import { InfoTooltip } from "@/components/atoms/Tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RiskCategory {
  name: string;
  score: number;
  weight: number;
  findings: string[];
}

interface TokenHolding {
  mint: string;
  symbol: string;
  balance: number;
  usdValue: number;
  riskFlag: string | null;
}

interface DeFiPosition {
  protocol: string;
  type: string;
  value: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  detail: string;
}

interface ScanResult {
  wallet: string;
  overallScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  confidence: number;
  categories: RiskCategory[];
  tokenHoldings: TokenHolding[];
  defiPositions: DeFiPosition[];
  riskDrivers: string[];
  recommendations: string[];
  transactionSummary: {
    totalTransactions: number;
    last30Days: number;
    uniqueProtocols: number;
    avgTxFrequency: string;
    largestSingleTx: number;
    suspiciousPatterns: number;
  };
  proofHash: string;
  timestamp: number;
  source: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCAN_PRICE_SOL = 0.05;
const SCANNER_SERVICE_ID = 4; // Wallet Scanner service on-chain (AEON Guardian)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function riskColor(level: string): string {
  switch (level) {
    case "Low": return "text-emerald-400";
    case "Medium": return "text-amber-400";
    case "High": return "text-orange-400";
    case "Critical": return "text-red-400";
    default: return "text-gray-400";
  }
}

function riskBg(level: string): string {
  switch (level) {
    case "Low": return "bg-emerald-500/10 border-emerald-500/20";
    case "Medium": return "bg-amber-500/10 border-amber-500/20";
    case "High": return "bg-orange-500/10 border-orange-500/20";
    case "Critical": return "bg-red-500/10 border-red-500/20";
    default: return "bg-gray-500/10 border-gray-500/20";
  }
}

function scoreGradient(score: number): string {
  if (score >= 80) return "from-emerald-500 to-emerald-400";
  if (score >= 60) return "from-amber-500 to-amber-400";
  if (score >= 30) return "from-orange-500 to-orange-400";
  return "from-red-500 to-red-400";
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// ---------------------------------------------------------------------------
// Component: Score Ring
// ---------------------------------------------------------------------------

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const level = score >= 80 ? "Low" : score >= 60 ? "Medium" : score >= 30 ? "High" : "Critical";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          className="text-white/[0.06]" strokeWidth={8}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          className={cn(
            score >= 80 ? "text-emerald-400" :
            score >= 60 ? "text-amber-400" :
            score >= 30 ? "text-orange-400" : "text-red-400"
          )}
          stroke="currentColor" strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className={cn("text-sm font-medium", riskColor(level))}>{level} Risk</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Category Bar
// ---------------------------------------------------------------------------

function CategoryBar({ category }: { category: RiskCategory }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">{category.name}</span>
        <span className="text-sm font-mono text-gray-400">{category.score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", scoreGradient(category.score))}
          initial={{ width: 0 }}
          animate={{ width: `${category.score}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </div>
      <ul className="space-y-1">
        {category.findings.map((finding, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
            <span className="mt-1 shrink-0">
              {category.score >= 70 ? (
                <CheckCircle2 size={12} className="text-emerald-500" />
              ) : category.score >= 40 ? (
                <AlertTriangle size={12} className="text-amber-500" />
              ) : (
                <XCircle size={12} className="text-red-500" />
              )}
            </span>
            {finding}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function WalletScannerPage() {
  const { connected, publicKey } = useWallet();
  const { pay, processing: paymentProcessing } = usePayment();

  const [targetWallet, setTargetWallet] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"input" | "paying" | "scanning" | "results">("input");

  const handleScanMyWallet = useCallback(() => {
    if (publicKey) {
      setTargetWallet(publicKey.toBase58());
    }
  }, [publicKey]);

  const handleCopyProof = useCallback(() => {
    if (scanResult?.proofHash) {
      navigator.clipboard.writeText(scanResult.proofHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [scanResult]);

  const handleScan = useCallback(async () => {
    if (!targetWallet) {
      setError("Please enter a wallet address");
      return;
    }

    // Validate address format (base58, 32-44 chars)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(targetWallet)) {
      setError("Invalid Solana wallet address");
      return;
    }

    if (!connected) {
      setError("Please connect your wallet to pay for the scan");
      return;
    }

    setError(null);
    setScanResult(null);

    // Step 1: Process payment
    setStep("paying");
    const payResult = await pay(SCAN_PRICE_SOL, SCANNER_SERVICE_ID, "wallet-scan");

    if (!payResult.success) {
      setError(payResult.error || "Payment failed");
      setStep("input");
      return;
    }

    // Step 2: Call scanner API
    setStep("scanning");
    setScanning(true);

    try {
      const res = await fetch("/api/wallet-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: targetWallet,
          paymentSignature: payResult.signature,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Scan failed");
      }

      const result: ScanResult = await res.json();
      setScanResult(result);
      setStep("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setStep("input");
    } finally {
      setScanning(false);
    }
  }, [targetWallet, connected, pay]);

  const handleReset = useCallback(() => {
    setScanResult(null);
    setError(null);
    setStep("input");
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Agent Branding */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Crown className="text-amber-400" size={20} />
              </div>
              <div>
                <div className="text-xs text-amber-400 font-medium">AEON Guardian Service</div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Wallet Risk Scanner
                </h1>
              </div>
            </div>
            <p className="text-sm text-gray-400 max-w-2xl">
              Comprehensive 8-section risk analysis with threat detection, portfolio x-ray, stress testing, and actionable recommendations. Powered by AEON's 24/7 monitoring engine.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center rounded-full px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold">
              <Coins size={14} className="mr-1.5" />
              {SCAN_PRICE_SOL} SOL
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-1 bg-white/[0.05] text-gray-400 text-[10px] font-medium">
              ⚡ Instant Results
            </span>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <AnimatePresence mode="wait">
        {step !== "results" && (
          <motion.div
            key="input-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card rounded-2xl border border-[#1A2235] p-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wallet Address to Scan
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="text"
                      value={targetWallet}
                      onChange={(e) => { setTargetWallet(e.target.value); setError(null); }}
                      placeholder="Enter any Solana wallet address..."
                      className="w-full rounded-xl bg-[#0A0E17] border border-[#1A2235] pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/30 transition-all font-mono"
                      disabled={step !== "input"}
                    />
                  </div>
                  {connected && (
                    <button
                      type="button"
                      onClick={handleScanMyWallet}
                      className="shrink-0 rounded-xl bg-white/[0.05] border border-[#1A2235] px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all"
                    >
                      My Wallet
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
                >
                  <XCircle size={16} />
                  {error}
                </motion.div>
              )}

              {/* Scan button / progress */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={!targetWallet || step !== "input" || !connected}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all",
                    targetWallet && step === "input" && connected
                      ? "bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-[#0A0E17] font-semibold"
                      : "bg-white/[0.05] text-gray-600 cursor-not-allowed"
                  )}
                >
                  {step === "paying" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing Payment...
                    </>
                  ) : step === "scanning" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Scanning Wallet...
                    </>
                  ) : (
                    <>
                      <ScanSearch size={16} />
                      Scan Wallet ({SCAN_PRICE_SOL} SOL)
                    </>
                  )}
                </button>

                {!connected && (
                  <span className="text-xs text-gray-500">
                    Connect wallet to pay for scan
                  </span>
                )}
              </div>

              {/* Step indicators */}
              {(step === "paying" || step === "scanning") && (
                <div className="flex items-center gap-6 text-xs text-gray-500">
                  <div className={cn("flex items-center gap-2", step === "paying" ? "text-[#00D4FF]" : "text-emerald-400")}>
                    {step === "paying" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    1. Payment ({SCAN_PRICE_SOL} SOL)
                  </div>
                  <ArrowRight size={12} />
                  <div className={cn("flex items-center gap-2", step === "scanning" ? "text-[#00D4FF]" : "text-gray-600")}>
                    {step === "scanning" ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                    2. On-chain Analysis
                  </div>
                  <ArrowRight size={12} />
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield size={12} />
                    3. Risk Report
                  </div>
                </div>
              )}
            </div>

            {/* Feature pills */}
            <div className="mt-6 pt-4 border-t border-white/[0.04] flex flex-wrap gap-2">
              {[
                "Transaction Pattern Analysis",
                "Token Holdings Audit",
                "DeFi Exposure Mapping",
                "Counterparty Risk Scoring",
                "Behavioral Profiling",
                "On-chain Proof",
              ].map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center rounded-full px-3 py-1 bg-white/[0.03] border border-white/[0.06] text-xs text-gray-500"
                >
                  <CheckCircle2 size={10} className="mr-1.5 text-[#00D4FF]" />
                  {feature}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <AnimatePresence>
        {scanResult && step === "results" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Back / New scan button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                &larr; New Scan
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600 font-mono">
                  {new Date(scanResult.timestamp).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={handleCopyProof}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#00D4FF] transition-colors"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy Proof Hash"}
                </button>
              </div>
            </div>

            {/* Overview card */}
            <div className="glass-card rounded-2xl border border-[#1A2235] p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                <ScoreRing score={scanResult.overallScore} />

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-semibold text-white">Risk Assessment</h2>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border",
                        riskBg(scanResult.riskLevel), riskColor(scanResult.riskLevel)
                      )}>
                        {scanResult.riskLevel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 font-mono">
                      {scanResult.wallet}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Confidence</p>
                      <p className="text-lg font-semibold text-white">{scanResult.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Transactions</p>
                      <p className="text-lg font-semibold text-white">{scanResult.transactionSummary.totalTransactions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Protocols Used</p>
                      <p className="text-lg font-semibold text-white">{scanResult.transactionSummary.uniqueProtocols}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Suspicious Patterns</p>
                      <p className={cn(
                        "text-lg font-semibold",
                        scanResult.transactionSummary.suspiciousPatterns > 0 ? "text-orange-400" : "text-emerald-400"
                      )}>
                        {scanResult.transactionSummary.suspiciousPatterns}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Categories */}
            <div className="glass-card rounded-2xl border border-[#1A2235] p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-[#00D4FF]" />
                Risk Categories
                <InfoTooltip term="Risk Categories" definition="Each category is independently scored and weighted to compute the overall risk assessment." />
              </h3>
              <div className="space-y-5">
                {scanResult.categories.map((cat) => (
                  <CategoryBar key={cat.name} category={cat} />
                ))}
              </div>
            </div>

            {/* Two-column: Token Holdings & DeFi Positions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Token Holdings */}
              <div className="glass-card rounded-2xl border border-[#1A2235] p-6">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Coins size={18} className="text-amber-400" />
                  Token Holdings
                </h3>
                <div className="space-y-3">
                  {scanResult.tokenHoldings.map((token) => (
                    <div key={token.mint} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-bold text-gray-400">
                          {token.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{token.symbol}</p>
                          <p className="text-xs text-gray-500 font-mono">{truncateAddress(token.mint)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {token.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${token.usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        {token.riskFlag && (
                          <p className="text-xs text-orange-400 mt-0.5">
                            <AlertTriangle size={10} className="inline mr-1" />
                            {token.riskFlag}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DeFi Positions */}
              <div className="glass-card rounded-2xl border border-[#1A2235] p-6">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-purple-400" />
                  DeFi Positions
                </h3>
                {scanResult.defiPositions.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">No active DeFi positions detected</p>
                ) : (
                  <div className="space-y-3">
                    {scanResult.defiPositions.map((pos, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{pos.protocol}</p>
                            <span className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border",
                              riskBg(pos.riskLevel), riskColor(pos.riskLevel)
                            )}>
                              {pos.riskLevel}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{pos.type} — {pos.detail}</p>
                        </div>
                        <p className="text-sm font-medium text-white">
                          ${pos.value.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Risk Drivers & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card rounded-2xl border border-[#1A2235] p-6">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingDown size={18} className="text-orange-400" />
                  Risk Drivers
                </h3>
                <ul className="space-y-2">
                  {scanResult.riskDrivers.map((driver, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-orange-500" />
                      {driver}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card rounded-2xl border border-[#1A2235] p-6">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-400" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {scanResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Proof footer */}
            <div className="glass-card rounded-2xl border border-[#1A2235] p-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Lock size={12} className="text-[#00D4FF]" />
                    Proof: <span className="font-mono text-gray-400">{scanResult.proofHash}</span>
                  </span>
                </div>
                <span className="text-gray-600">
                  {scanResult.source}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info cards (shown when no results) */}
      {step === "input" && !scanResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl border border-[#1A2235] p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center">
              <ScanSearch size={20} className="text-[#00D4FF]" />
            </div>
            <h3 className="text-sm font-semibold text-white">Deep Analysis</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Full transaction history scan, token holdings audit, and behavioral pattern recognition across 5 risk dimensions.
            </p>
          </div>
          <div className="glass-card rounded-2xl border border-[#1A2235] p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Shield size={20} className="text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Counterparty Intelligence</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Identify interactions with flagged addresses, mixer services, and known exploit wallets. Protect your protocol.
            </p>
          </div>
          <div className="glass-card rounded-2xl border border-[#1A2235] p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Lock size={20} className="text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Verifiable Proof</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Every scan generates an on-chain proof hash. Verify results independently at any time. Proof Before Action.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
