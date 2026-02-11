"use client";

import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { useEffect, useState } from "react";

interface TimeAgoProps {
  timestamp: number;
  className?: string;
}

export function TimeAgo({ timestamp, className }: TimeAgoProps) {
  const [display, setDisplay] = useState(() => timeAgo(timestamp));

  useEffect(() => {
    setDisplay(timeAgo(timestamp));

    const interval = setInterval(() => {
      setDisplay(timeAgo(timestamp));
    }, 10_000);

    return () => clearInterval(interval);
  }, [timestamp]);

  const date = new Date(timestamp * 1000);

  return (
    <time
      dateTime={date.toISOString()}
      title={date.toLocaleString()}
      className={cn(
        "inline-flex items-center gap-1 text-sm text-text-secondary",
        className
      )}
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
        className="shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {display}
    </time>
  );
}
