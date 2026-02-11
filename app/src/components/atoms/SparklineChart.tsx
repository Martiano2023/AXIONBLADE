"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  showGradient?: boolean;
}

export function SparklineChart({
  data,
  width = 80,
  height = 30,
  color = "#a855f7",
  className,
  showGradient = true,
}: SparklineChartProps) {
  const gradientId = useMemo(
    () => `sparkline-gradient-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  const pathData = useMemo(() => {
    if (!data || data.length < 2) return { line: "", area: "" };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 1;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * usableWidth;
      const y = padding + usableHeight - ((value - min) / range) * usableHeight;
      return { x, y };
    });

    const line = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");

    const area =
      line +
      ` L ${points[points.length - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z`;

    return { line, area };
  }, [data, width, height]);

  if (!data || data.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        className={cn("shrink-0", className)}
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
      preserveAspectRatio="none"
    >
      {showGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}

      {/* Gradient fill area */}
      {showGradient && (
        <path d={pathData.area} fill={`url(#${gradientId})`} />
      )}

      {/* Line */}
      <path
        d={pathData.line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
