"use client";

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TechnicalDetailsProps {
  children: ReactNode;
  label?: string;
  className?: string;
  defaultOpen?: boolean;
}

export function TechnicalDetails({
  children,
  label = "Technical Details",
  className,
  defaultOpen = false,
}: TechnicalDetailsProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("mt-3", className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300",
          "transition-colors duration-200 group"
        )}
      >
        <Code2 className="w-3 h-3" />
        <span>{label}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3 h-3" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "mt-2 p-3 rounded-lg text-xs",
                "bg-white/[0.02] border border-white/[0.05]",
                "text-gray-500 font-mono leading-relaxed"
              )}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// DisclosureAccordion is the canonical reusable primitive name
export const DisclosureAccordion = TechnicalDetails;
