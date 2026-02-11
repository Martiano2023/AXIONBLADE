"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface ColorStop {
  stop: number;
  color: string;
}

interface CircularGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  colorStops?: ColorStop[];
  className?: string;
}

const defaultColorStops: ColorStop[] = [
  { stop: 0, color: "#f43f5e" },
  { stop: 50, color: "#fbbf24" },
  { stop: 80, color: "#34d399" },
];

function getColorForValue(value: number, stops: ColorStop[]): string {
  const sorted = [...stops].sort((a, b) => a.stop - b.stop);

  for (let i = sorted.length - 1; i >= 0; i--) {
    if (value >= sorted[i].stop) {
      return sorted[i].color;
    }
  }

  return sorted[0].color;
}

export function CircularGauge({
  value,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
  colorStops = defaultColorStops,
  className,
}: CircularGaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeColor = useMemo(
    () => getColorForValue(clampedValue, colorStops),
    [clampedValue, colorStops]
  );

  const center = size / 2;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />

        {/* Animated progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset:
              circumference - (clampedValue / 100) * circumference,
          }}
          transition={{
            duration: 1,
            delay: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            filter: `drop-shadow(0 0 6px ${strokeColor}40)`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-semibold tabular-nums"
          style={{
            fontSize: size * 0.22,
            color: strokeColor,
            textShadow: `0 0 20px ${strokeColor}30`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {Math.round(clampedValue)}
        </motion.span>
        {label && (
          <span
            className="text-text-secondary font-medium"
            style={{ fontSize: size * 0.09 }}
          >
            {label}
          </span>
        )}
        {sublabel && (
          <span
            className="text-text-muted"
            style={{ fontSize: size * 0.075 }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
