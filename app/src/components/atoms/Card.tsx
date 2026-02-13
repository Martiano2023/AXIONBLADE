"use client";

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

interface CardProps {
  variant?: "default" | "elevated";
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

const variantStyles: Record<string, string> = {
  default: "bg-[#0F1420] border border-[#1A2235] rounded-xl",
  elevated: "bg-[#1A2235] border border-[#243049] rounded-xl",
};

export function Card({
  variant = "default",
  children,
  className,
  animate = true,
  onClick,
}: CardProps) {
  const motionProps: HTMLMotionProps<"div"> = animate
    ? {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
      }
    : {};

  return (
    <motion.div
      {...motionProps}
      className={cn(
        "rounded-xl p-5 hover:border-[#243049] transition-colors duration-200",
        variantStyles[variant],
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
