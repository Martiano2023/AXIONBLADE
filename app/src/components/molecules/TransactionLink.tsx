"use client";

import { cn } from "@/lib/utils";
import { truncateAddress } from "@/lib/format";

interface TransactionLinkProps {
  signature: string;
  status?: "confirmed" | "pending" | "failed";
  className?: string;
}

const statusConfig = {
  confirmed: {
    dot: "bg-success",
    label: "Confirmed",
  },
  pending: {
    dot: "bg-warning animate-pulse",
    label: "Pending",
  },
  failed: {
    dot: "bg-danger",
    label: "Failed",
  },
} as const;

export function TransactionLink({
  signature,
  status = "confirmed",
  className,
}: TransactionLinkProps) {
  const config = statusConfig[status];

  return (
    <a
      href={`https://solscan.io/tx/${signature}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-lg bg-bg-elevated px-2.5 py-1.5 text-sm font-mono transition-colors hover:bg-bg-surface group",
        className
      )}
      title={`${config.label} - ${signature}`}
    >
      <span
        className={cn("h-2 w-2 rounded-full shrink-0", config.dot)}
        aria-label={config.label}
      />

      <span className="text-text-primary">
        {truncateAddress(signature)}
      </span>

      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-text-secondary group-hover:text-accent-primary transition-colors shrink-0"
      >
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}
