"use client";

import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { motion } from "framer-motion";

interface AgentCardProps {
  agentId: number;
  type: string;
  status: string;
  level: string;
  budgetUsed: number;
  budgetTotal: number;
  className?: string;
}

const statusStyles: Record<string, { dot: string; badge: string }> = {
  active: {
    dot: "bg-success",
    badge: "bg-success/15 text-success border-success/30",
  },
  paused: {
    dot: "bg-warning",
    badge: "bg-warning/15 text-warning border-warning/30",
  },
  stopped: {
    dot: "bg-danger",
    badge: "bg-danger/15 text-danger border-danger/30",
  },
  idle: {
    dot: "bg-text-secondary",
    badge: "bg-bg-elevated text-text-secondary border-border-default",
  },
};

function getStatusStyle(status: string) {
  return (
    statusStyles[status.toLowerCase()] ?? {
      dot: "bg-text-secondary",
      badge: "bg-bg-elevated text-text-secondary border-border-default",
    }
  );
}

export function AgentCard({
  agentId,
  type,
  status,
  level,
  budgetUsed,
  budgetTotal,
  className,
}: AgentCardProps) {
  const budgetPercent =
    budgetTotal > 0
      ? Math.min(100, Math.round((budgetUsed / budgetTotal) * 100))
      : 0;

  const budgetColor =
    budgetPercent >= 90
      ? "bg-danger"
      : budgetPercent >= 70
        ? "bg-warning"
        : "bg-accent-primary";

  const style = getStatusStyle(status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border border-border-default bg-bg-surface p-5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-elevated">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent-primary"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Agent #{agentId}
            </p>
            <p className="text-xs text-text-secondary">{type}</p>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
            style.badge
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
          {status}
        </span>
      </div>

      {/* Info */}
      <div className="mt-4 flex items-center gap-4">
        <div>
          <p className="text-xs text-text-secondary">Level</p>
          <p className="text-sm font-medium text-text-primary">{level}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Budget</p>
          <p className="text-sm font-medium text-text-primary">
            {formatNumber(budgetUsed)}{" "}
            <span className="text-text-secondary">
              / {formatNumber(budgetTotal)}
            </span>
          </p>
        </div>
      </div>

      {/* Budget progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">Budget usage</span>
          <span className="text-xs font-medium text-text-primary">
            {budgetPercent}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-bg-elevated overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${budgetPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn("h-full rounded-full", budgetColor)}
          />
        </div>
      </div>
    </motion.div>
  );
}
