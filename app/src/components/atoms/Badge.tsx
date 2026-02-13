"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  style?: "filled" | "outline";
  children: React.ReactNode;
  className?: string;
}

const filledVariantStyles: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  danger: "bg-red-500/15 text-red-400 border-red-500/30",
  info: "bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/30",
  neutral: "bg-white/5 text-text-secondary border-white/10",
};

const outlineVariantStyles: Record<string, string> = {
  success: "bg-transparent text-emerald-400 border-emerald-500/50",
  warning: "bg-transparent text-amber-400 border-amber-400/50",
  danger: "bg-transparent text-red-400 border-red-500/50",
  info: "bg-transparent text-[#00D4FF] border-[#00D4FF]/50",
  neutral: "bg-transparent text-text-secondary border-white/20",
};

export function Badge({
  variant = "neutral",
  style = "filled",
  children,
  className,
}: BadgeProps) {
  const styles =
    style === "outline" ? outlineVariantStyles : filledVariantStyles;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-200",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
