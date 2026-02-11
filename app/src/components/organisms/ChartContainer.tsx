import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/atoms/Card";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  controls?: ReactNode;
  className?: string;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  controls,
  className,
}: ChartContainerProps) {
  return (
    <Card className={cn("flex flex-col gap-0 p-0", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border-default px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
          )}
        </div>
        {controls && (
          <div className="flex shrink-0 items-center gap-2">{controls}</div>
        )}
      </div>

      {/* Chart content */}
      <div className="flex-1 p-5">{children}</div>
    </Card>
  );
}
