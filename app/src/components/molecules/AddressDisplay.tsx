"use client";

import { cn } from "@/lib/utils";
import { truncateAddress } from "@/lib/format";
import { useCallback, useState } from "react";

interface AddressDisplayProps {
  address: string;
  className?: string;
}

export function AddressDisplay({ address, className }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }, [address]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg bg-bg-elevated px-2.5 py-1.5 text-sm font-mono",
        className
      )}
    >
      <span className="text-text-primary">{truncateAddress(address)}</span>

      <button
        type="button"
        onClick={handleCopy}
        className="text-text-secondary hover:text-text-primary transition-colors p-0.5 rounded"
        aria-label={copied ? "Copied" : "Copy address"}
      >
        {copied ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        )}
      </button>

      <a
        href={`https://solscan.io/account/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-text-secondary hover:text-accent-primary transition-colors p-0.5 rounded"
        aria-label="View on Solscan"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}
