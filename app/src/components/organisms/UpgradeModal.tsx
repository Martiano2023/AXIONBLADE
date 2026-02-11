"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTierStore } from "@/stores/useTierStore";
import { InfoTooltip } from "@/components/atoms/Tooltip";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Feature row types ────────────────────────────────────────
type CellValue = "check" | "dash" | string;

interface FeatureRow {
  label: string;
  free: CellValue;
  pro: CellValue;
  institutional: CellValue;
}

interface SectionHeader {
  section: string;
}

type TableRow = FeatureRow | SectionHeader;

function isSectionHeader(row: TableRow): row is SectionHeader {
  return "section" in row;
}

// ── Table data ───────────────────────────────────────────────
const tableRows: TableRow[] = [
  { section: "APOLLO" },
  { label: "Risk assessments/day", free: "1", pro: "Unlimited", institutional: "Unlimited" },
  { label: "Risk score + level", free: "check", pro: "check", institutional: "check" },
  { label: "Risk breakdown", free: "dash", pro: "check", institutional: "check" },
  { label: "Risk drivers", free: "dash", pro: "check", institutional: "check" },
  { label: "Confidence %", free: "dash", pro: "check", institutional: "check" },
  { label: "7d trend chart", free: "dash", pro: "check", institutional: "check" },
  { label: "Proof hash + on-chain", free: "dash", pro: "check", institutional: "check" },
  { label: "JSON + PDF export", free: "dash", pro: "dash", institutional: "check" },
  { label: "Comparative analysis", free: "dash", pro: "dash", institutional: "check" },
  { label: "AI risk narrative", free: "dash", pro: "dash", institutional: "check" },
  { section: "HERMES" },
  { label: "Reports/day", free: "3", pro: "Unlimited", institutional: "Unlimited" },
  { label: "Report types", free: "2 of 5", pro: "All 5", institutional: "All 5" },
  { label: "Report delay", free: "24h", pro: "Real-time", institutional: "Real-time" },
  { label: "Download reports", free: "dash", pro: "check", institutional: "check" },
  { label: "API access", free: "dash", pro: "dash", institutional: "check" },
  { label: "Webhook alerts", free: "dash", pro: "dash", institutional: "check" },
];

// ── Cell renderer ────────────────────────────────────────────
function CellContent({ value }: { value: CellValue }) {
  if (value === "check") {
    return <Check size={16} className="text-emerald-400 mx-auto" />;
  }
  if (value === "dash") {
    return <Minus size={16} className="text-gray-600 mx-auto" />;
  }
  return <span className="text-sm text-gray-300">{value}</span>;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const setApolloTier = useTierStore((s) => s.setApolloTier);
  const setHermesTier = useTierStore((s) => s.setHermesTier);
  const apolloTier = useTierStore((s) => s.apolloTier);
  const hermesTier = useTierStore((s) => s.hermesTier);

  const isCurrentlyFree =
    (apolloTier === "free" || apolloTier === "basic") && hermesTier === "free";
  const isCurrentlyPro =
    (apolloTier === "pro" && hermesTier === "pro");

  function handleUpgradePro() {
    setApolloTier("pro");
    setHermesTier("pro");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-[#0f0f23] border border-white/[0.08] rounded-2xl max-w-4xl w-full mx-4 p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
                <p className="text-gray-400 mt-1">
                  Unlock the full power of NOUMEN&apos;s risk intelligence
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.05] transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 pr-4 w-[40%]">
                      Feature
                    </th>
                    <th className="text-center text-xs text-gray-500 uppercase tracking-wider py-3 px-4 w-[20%]">
                      Free
                    </th>
                    <th className="text-center text-xs uppercase tracking-wider py-3 px-4 w-[20%] text-purple-400">
                      Pro
                    </th>
                    <th className="text-center text-xs uppercase tracking-wider py-3 px-4 w-[20%] text-amber-400">
                      Institutional
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, idx) => {
                    if (isSectionHeader(row)) {
                      return (
                        <tr key={`section-${idx}`}>
                          <td
                            colSpan={4}
                            className="pt-5 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                          >
                            {row.section}
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr
                        key={row.label}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-2.5 pr-4 text-sm text-gray-400">
                          {row.label}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <CellContent value={row.free} />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <CellContent value={row.pro} />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <CellContent value={row.institutional} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pricing + CTA row */}
            <div className="grid grid-cols-[40%_20%_20%_20%] mt-8 pt-6 border-t border-white/[0.06]">
              {/* Label column */}
              <div />

              {/* Free */}
              <div className="flex flex-col items-center gap-3 px-4">
                <span className="text-lg font-semibold text-white">Free</span>
                <button
                  type="button"
                  disabled
                  className={cn(
                    "w-full py-2 rounded-lg text-xs font-medium transition-all",
                    isCurrentlyFree
                      ? "bg-white/[0.05] text-gray-500 cursor-default"
                      : "bg-white/[0.05] text-gray-500 cursor-default"
                  )}
                >
                  {isCurrentlyFree ? "Current Plan" : "Free Tier"}
                </button>
              </div>

              {/* Pro */}
              <div className="flex flex-col items-center gap-3 px-4">
                <div className="text-center">
                  <span className="text-lg font-semibold text-purple-400">
                    Starting at 0.30 SOL/assessment
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">(Pro) or 1.5 SOL/month (HERMES Pro)</p>
                </div>
                <button
                  type="button"
                  onClick={handleUpgradePro}
                  disabled={isCurrentlyPro}
                  className={cn(
                    "w-full py-2 rounded-lg text-xs font-medium transition-all",
                    isCurrentlyPro
                      ? "bg-white/[0.05] text-gray-500 cursor-default"
                      : "bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/20"
                  )}
                >
                  {isCurrentlyPro ? "Current Plan" : "Upgrade to Pro"}
                </button>
              </div>

              {/* Institutional */}
              <div className="flex flex-col items-center gap-3 px-4">
                <div className="text-center">
                  <span className="text-lg font-semibold text-amber-400 inline-flex items-center gap-1">
                    Starting at 5 SOL/assessment + 15 SOL/month API
                    <InfoTooltip
                      term="AI-adjusted pricing"
                      definition="Pricing is dynamically adjusted based on usage volume, protocol complexity, and market conditions."
                    />
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    (AI-adjusted pricing)
                  </p>
                </div>
                <button
                  type="button"
                  className="w-full py-2 rounded-lg text-xs font-medium border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all"
                >
                  Contact for Access
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
