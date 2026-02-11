import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  score: number;
  className?: string;
}

function getRiskConfig(score: number) {
  if (score <= 30) {
    return {
      label: "Low",
      bg: "bg-success/15",
      text: "text-success",
      border: "border-success/30",
      dot: "bg-success",
    };
  }
  if (score <= 60) {
    return {
      label: "Medium",
      bg: "bg-warning/15",
      text: "text-warning",
      border: "border-warning/30",
      dot: "bg-warning",
    };
  }
  if (score <= 80) {
    return {
      label: "High",
      bg: "bg-orange-500/15",
      text: "text-orange-400",
      border: "border-orange-500/30",
      dot: "bg-orange-400",
    };
  }
  return {
    label: "Critical",
    bg: "bg-danger/15",
    text: "text-danger",
    border: "border-danger/30",
    dot: "bg-danger",
  };
}

export function RiskBadge({ score, className }: RiskBadgeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const config = getRiskConfig(clampedScore);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
      <span className="opacity-70">{clampedScore}</span>
    </span>
  );
}
