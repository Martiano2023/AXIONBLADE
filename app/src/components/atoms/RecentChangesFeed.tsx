"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RecentChange {
  amount: string;
  positive: boolean;
  description: string;
  time: string;
}

interface RecentChangesFeedProps {
  changes: RecentChange[];
  title?: string;
  className?: string;
}

export function RecentChangesFeed({
  changes,
  title = "Recent Changes",
  className,
}: RecentChangesFeedProps) {
  return (
    <div
      className={cn(
        "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-white">{title}</span>
      </div>
      <div className="space-y-0">
        {changes.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.1 + i * 0.06,
              ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
            }}
            className={cn(
              "flex items-center justify-between py-2.5",
              i < changes.length - 1 && "border-b border-white/[0.04]"
            )}
          >
            <span
              className={cn(
                "text-sm font-medium tabular-nums w-24 shrink-0",
                item.positive ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {item.amount}
            </span>
            <span className="text-sm text-gray-400 flex-1 text-center">
              {item.description}
            </span>
            <span className="text-xs text-gray-600 w-16 text-right shrink-0">
              {item.time}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
