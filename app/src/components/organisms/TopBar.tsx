"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import { useTierStore } from "@/stores/useTierStore";
import { useBalance } from "@/hooks/useBalance";
import { CLUSTER } from "@/lib/constants";

const WalletButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton
    ),
  { ssr: false }
);

const routeLabels: Record<string, string> = {
  dashboard: "Overview",
  aeon: "AEON",
  apollo: "APOLLO",
  hermes: "HERMES",
  treasury: "Treasury",
  axioms: "Axioms",
  activity: "Activity",
  alerts: "Risk Alerts",
  settings: "Settings",
  security: "Security",
  integrations: "Integrations",
};

const tickerItems = [
  { label: "Treasury", value: "42.5 SOL", color: "bg-emerald-400" },
  { label: "Proofs", value: "1,247", color: "bg-[#00D4FF]" },
  { label: "Uptime", value: "99.9%", color: "bg-cyan-400" },
  { label: "Agents", value: "2/100", color: "bg-amber-400" },
  { label: "Services", value: "7", color: "bg-[#00D4FF]/80" },
];

const tierConfig = {
  free: { label: "Free", className: "bg-white/[0.05] text-gray-500" },
  pro: { label: "Pro", className: "bg-[#00D4FF]/15 text-[#00D4FF]" },
  institutional: { label: "Institutional", className: "bg-amber-500/15 text-amber-400" },
} as const;

function TierBadge() {
  const apolloTier = useTierStore((s) => s.apolloTier);
  const hermesTier = useTierStore((s) => s.hermesTier);

  const highestTier =
    apolloTier === "institutional" || hermesTier === "protocol"
      ? "institutional"
      : apolloTier === "pro" || hermesTier === "pro"
        ? "pro"
        : "free";

  const { label, className } = tierConfig[highestTier];

  return (
    <span
      className={cn(
        "hidden md:flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}

function NetworkBadge() {
  const isMainnet = CLUSTER === "mainnet-beta";
  return (
    <span
      className={cn(
        "hidden md:flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium",
        isMainnet
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-orange-500/15 text-orange-400",
      )}
    >
      {isMainnet ? "Mainnet" : "Devnet"}
    </span>
  );
}

function WalletBalance() {
  const { balance, loading } = useBalance();

  if (balance === null) return null;

  return (
    <span className="hidden md:block text-xs text-gray-400">
      {loading ? "..." : `${balance.toFixed(2)} SOL`}
    </span>
  );
}

export function TopBar() {
  const pathname = usePathname();

  const pageTitle = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Overview";
    const lastSegment = segments[segments.length - 1];
    return routeLabels[lastSegment] ?? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  }, [pathname]);

  // Duplicate ticker items for seamless loop
  const tickerContent = [...tickerItems, ...tickerItems];

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center justify-between gap-4",
        "border-b border-[#1A2235] bg-[#0A0E17] pl-14 pr-4 sm:px-6 lg:px-6"
      )}
    >
      {/* Left: page title */}
      <div className="shrink-0">
        <h1 className="text-lg font-bold text-white">{pageTitle}</h1>
      </div>

      {/* Center: Live stats ticker */}
      <div className="hidden md:flex flex-1 max-w-xl mx-8 overflow-hidden relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0A0E17] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0A0E17] to-transparent z-10 pointer-events-none" />

        <div className="flex items-center gap-6 animate-ticker whitespace-nowrap">
          {tickerContent.map((item, i) => (
            <div key={`${item.label}-${i}`} className="flex items-center gap-1.5 shrink-0">
              <span className={cn("w-1.5 h-1.5 rounded-full", item.color)} />
              <span className="text-xs text-gray-400">
                {item.label}:{" "}
                <span className="text-gray-300 font-medium">{item.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: network + tier badge + notification bell + balance + wallet */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Network badge */}
        <NetworkBadge />

        {/* Tier badge */}
        <TierBadge />

        {/* Notification bell */}
        <button
          type="button"
          className="relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-white hover:bg-[#0F1420] transition-colors duration-200"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {/* Red dot badge */}
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0A0E17]" />
        </button>

        {/* SOL balance */}
        <WalletBalance />

        {/* Wallet button */}
        <WalletButton
          style={{
            height: "40px",
            fontSize: "14px",
            borderRadius: "12px",
            background: "#0F1420",
            border: "1px solid #1A2235",
          }}
        />
      </div>

    </header>
  );
}
