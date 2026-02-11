"use client";

import { cn } from "@/lib/utils";

type StatusLevel = "normal" | "degraded" | "halted" | "online" | "offline" | "warning";

interface StatusBadgeProps {
  status: StatusLevel;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const STATUS_CONFIG: Record<StatusLevel, { color: string; bg: string; text: string; defaultLabel: string }> = {
  normal: {
    color: "bg-emerald-400",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    defaultLabel: "All Clear",
  },
  online: {
    color: "bg-emerald-400",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    defaultLabel: "Online",
  },
  degraded: {
    color: "bg-amber-400",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    defaultLabel: "Degraded",
  },
  warning: {
    color: "bg-amber-400",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    defaultLabel: "Warning",
  },
  halted: {
    color: "bg-red-500",
    bg: "bg-red-500/15",
    text: "text-red-400",
    defaultLabel: "Halted",
  },
  offline: {
    color: "bg-gray-500",
    bg: "bg-gray-500/15",
    text: "text-gray-400",
    defaultLabel: "Offline",
  },
};

const SIZE_CONFIG = {
  sm: { dot: "h-1.5 w-1.5", text: "text-xs", gap: "gap-1.5", px: "px-2 py-0.5" },
  md: { dot: "h-2 w-2", text: "text-xs", gap: "gap-2", px: "px-2.5 py-1" },
  lg: { dot: "h-3 w-3", text: "text-sm", gap: "gap-2.5", px: "px-3 py-1.5" },
};

export function StatusBadge({
  status,
  label,
  size = "md",
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full",
        sizeConfig.gap,
        sizeConfig.px,
        config.bg,
        className
      )}
    >
      <span className={cn("inline-flex rounded-full shrink-0", sizeConfig.dot, config.color)} />
      <span className={cn("font-medium", sizeConfig.text, config.text)}>
        {displayLabel}
      </span>
    </span>
  );
}
