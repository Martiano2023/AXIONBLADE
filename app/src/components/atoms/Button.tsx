"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { forwardRef } from "react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-[#00D4FF] text-white hover:bg-[#00B8D9] transition-colors duration-200",
  secondary:
    "bg-[#0F1420] text-text-primary hover:bg-[#1A2235] transition-colors duration-200",
  outline:
    "border border-[#1A2235] text-text-primary hover:bg-[#1A2235] hover:border-[#243049] transition-colors duration-200",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-[#1A2235] transition-colors duration-200",
  danger:
    "bg-[#EF4444] text-white hover:bg-[#DC2626] transition-colors duration-200",
};

const sizeStyles: Record<string, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      icon,
      children,
      disabled,
      onClick,
      type = "button",
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        whileTap={disabled || loading ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0E17] cursor-pointer select-none",
          variantStyles[variant],
          sizeStyles[size],
          (disabled || loading) && "opacity-50 pointer-events-none",
          className
        )}
        onClick={disabled || loading ? undefined : onClick}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {icon && !loading && <span className="shrink-0">{icon}</span>}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
