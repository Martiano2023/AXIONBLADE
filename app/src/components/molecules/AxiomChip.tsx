import { cn } from "@/lib/utils";

interface AxiomChipProps {
  axiomNumber: string;
  status: "compliant" | "warning" | "violated";
  className?: string;
}

const statusConfig = {
  compliant: {
    dot: "bg-success",
    bg: "bg-success/10",
    border: "border-success/25",
    text: "text-success",
  },
  warning: {
    dot: "bg-warning",
    bg: "bg-warning/10",
    border: "border-warning/25",
    text: "text-warning",
  },
  violated: {
    dot: "bg-danger",
    bg: "bg-danger/10",
    border: "border-danger/25",
    text: "text-danger",
  },
} as const;

export function AxiomChip({ axiomNumber, status, className }: AxiomChipProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-mono font-medium",
        config.bg,
        config.border,
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full shrink-0", config.dot)} />
      <span className="text-text-primary">{axiomNumber}</span>
    </span>
  );
}
