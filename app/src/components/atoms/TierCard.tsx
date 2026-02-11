"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tier = 1 | 2 | 3;

interface TierCardProps {
  tier: Tier;
  children: ReactNode;
  delay?: number;
  className?: string;
}

const TIER_PADDING: Record<Tier, string> = {
  1: "p-8",
  2: "p-6",
  3: "p-4",
};

export function TierCard({ tier, children, delay = 0, className }: TierCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl",
        "hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300",
        TIER_PADDING[tier],
        className
      )}
    >
      {children}
    </motion.div>
  );
}
