"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSpring, useMotionValue, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedNumber({
  value,
  format,
  duration = 0.5,
  className,
  prefix,
  suffix,
  decimals,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 200,
    damping: 30,
    mass: 0.8,
    duration,
  });

  const formatValue = useCallback(
    (n: number): string => {
      if (format) return format(n);
      if (decimals !== undefined) {
        return n.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }
      return n.toLocaleString();
    },
    [format, decimals]
  );

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });
    return unsubscribe;
  }, [springValue, formatValue]);

  return (
    <span className={cn("tabular-nums inline-flex items-baseline gap-0.5", className)}>
      {prefix && (
        <span className="text-text-secondary text-[0.85em]">{prefix}</span>
      )}
      <motion.span ref={ref}>{formatValue(value)}</motion.span>
      {suffix && (
        <span className="text-text-secondary text-[0.85em]">{suffix}</span>
      )}
    </span>
  );
}
