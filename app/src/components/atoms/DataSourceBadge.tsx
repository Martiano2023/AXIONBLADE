"use client";

// ---------------------------------------------------------------------------
// NOUMEN DataSourceBadge — Tiny pill showing data provenance
// ---------------------------------------------------------------------------
// Displays the source of a data point (Pyth, Raydium, etc.) with an optional
// "Updated Xs ago" tooltip and a pulse animation for fresh data (< 2s).
// ---------------------------------------------------------------------------

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/atoms/Tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DataSourceBadgeProps {
  source:
    | "pyth"
    | "raydium"
    | "orca"
    | "noumen"
    | "mainnet-readonly"
    | "simulated";
  lastUpdated?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Source configuration
// ---------------------------------------------------------------------------

interface SourceConfig {
  label: string;
  icon: string;
  color: string;
}

const SOURCE_CONFIG: Record<DataSourceBadgeProps["source"], SourceConfig> = {
  pyth: {
    label: "Pyth",
    icon: "\u25C8",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  raydium: {
    label: "Raydium",
    icon: "\u2726",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  orca: {
    label: "Orca",
    icon: "\u25CF",
    color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  },
  noumen: {
    label: "NOUMEN",
    icon: "\u25C6",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  "mainnet-readonly": {
    label: "Mainnet",
    icon: "\u25A0",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  simulated: {
    label: "Simulated",
    icon: "\u25CB",
    color: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 1) return "Just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataSourceBadge({
  source,
  lastUpdated,
  className,
}: DataSourceBadgeProps) {
  const config = SOURCE_CONFIG[source];
  const [isRecent, setIsRecent] = useState(false);

  // Check if data was refreshed in the last 2 seconds
  useEffect(() => {
    if (!lastUpdated) {
      setIsRecent(false);
      return;
    }

    const elapsed = Date.now() - lastUpdated;
    if (elapsed < 2000) {
      setIsRecent(true);
      const timeout = setTimeout(() => setIsRecent(false), 2000 - elapsed);
      return () => clearTimeout(timeout);
    } else {
      setIsRecent(false);
    }
  }, [lastUpdated]);

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-px",
        "text-[9px] font-medium leading-tight select-none",
        config.color,
        isRecent && "animate-pulse",
        className
      )}
    >
      <span className="text-[8px]">{config.icon}</span>
      {config.label}
    </span>
  );

  // Wrap in tooltip if we have a lastUpdated timestamp
  if (lastUpdated) {
    return (
      <Tooltip content={formatTimeAgo(lastUpdated)} position="top">
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
