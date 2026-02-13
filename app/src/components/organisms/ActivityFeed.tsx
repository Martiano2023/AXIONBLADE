"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

export interface ActivityEvent {
  id: string;
  timestamp: number;
  type: string;
  agentId?: string;
  description: string;
  txSignature?: string;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  className?: string;
  maxItems?: number;
  showViewAll?: boolean;
}

const typeDotColor: Record<string, string> = {
  decision: "bg-purple-500",
  execution: "bg-emerald-400",
  payment: "bg-amber-400",
  assessment: "bg-cyan-400",
  report: "bg-[#00D4FF]/80",
  incident: "bg-rose-500",
  alert: "bg-amber-400",
  error: "bg-rose-500",
  delegation: "bg-purple-400",
  governance: "bg-gray-400",
};

function getDotColor(type: string): string {
  return typeDotColor[type.toLowerCase()] ?? "bg-gray-400";
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function ActivityFeed({
  events,
  className,
  maxItems = 10,
  showViewAll = true,
}: ActivityFeedProps) {
  const displayEvents = events.slice(0, maxItems);

  if (displayEvents.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-12 text-gray-500",
          className
        )}
      >
        No activity recorded
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col", className)}
      role="log"
      aria-label="Activity feed"
    >
      <div className="overflow-y-auto max-h-[480px] space-y-1.5 pr-1">
        {displayEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className="group bg-white/[0.02] rounded-lg p-3 hover:bg-white/[0.04] transition-all duration-200 cursor-default"
          >
            <div className="flex items-start gap-3">
              {/* Colored dot indicator */}
              <span
                className={cn(
                  "mt-1.5 w-2 h-2 rounded-full shrink-0",
                  getDotColor(event.type)
                )}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {event.agentId && (
                    <span className="text-xs font-semibold text-white">
                      {event.agentId}
                    </span>
                  )}
                  <span className="text-[10px] uppercase tracking-wider text-gray-600 font-medium">
                    {event.type}
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed truncate">
                  {event.description}
                </p>
              </div>

              {/* Time */}
              <span className="text-xs text-gray-600 shrink-0 mt-0.5">
                {formatRelativeTime(event.timestamp)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All link */}
      {showViewAll && events.length > maxItems && (
        <Link
          href="/activity"
          className="mt-3 text-center text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200"
        >
          View All Activity
        </Link>
      )}
    </div>
  );
}
