"use client";

import { cn } from "@/lib/utils";
import { type ReactNode, useMemo } from "react";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/atoms/AnimatedNumber";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  sparklineData?: number[];
  icon?: ReactNode;
  className?: string;
}

function Sparkline({ data }: { data: number[] }) {
  const width = 64;
  const height = 24;
  const padding = 2;

  const path = useMemo(() => {
    if (data.length < 2) return "";

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return { x, y };
    });

    return points
      .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(" ");
  }, [data]);

  const trending = data.length >= 2 && data[data.length - 1] >= data[0];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="shrink-0"
    >
      <path
        d={path}
        stroke={trending ? "var(--color-success)" : "var(--color-danger)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MetricCard({
  title,
  value,
  change,
  sparklineData,
  icon,
  className,
}: MetricCardProps) {
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
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="text-text-secondary shrink-0">{icon}</span>
            )}
            <p className="text-sm text-text-secondary truncate">{title}</p>
          </div>

          <p className="mt-2 text-2xl font-semibold text-text-primary tracking-tight">
            {typeof value === "number" ? (
              <AnimatedNumber value={value} />
            ) : (
              value
            )}
          </p>

          {change !== undefined && (
            <span
              className={cn(
                "mt-1.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                change >= 0
                  ? "bg-success/15 text-success"
                  : "bg-danger/15 text-danger"
              )}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                className={cn(change < 0 && "rotate-180")}
              >
                <path
                  d="M5 2L8 6H2L5 2Z"
                  fill="currentColor"
                />
              </svg>
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}%
            </span>
          )}
        </div>

        {sparklineData && sparklineData.length >= 2 && (
          <div className="ml-4 mt-2">
            <Sparkline data={sparklineData} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
