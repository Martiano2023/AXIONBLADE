// ---------------------------------------------------------------------------
// AXIONBLADE Confidence Badge Component
// ---------------------------------------------------------------------------
// Displays analysis confidence level with visual indicator
// ---------------------------------------------------------------------------

import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, Info } from 'lucide-react';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
}

const CONFIDENCE_CONFIG = {
  high: {
    label: 'High Confidence',
    description: 'Based on comprehensive on-chain data and multiple evidence sources',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: Shield,
  },
  medium: {
    label: 'Medium Confidence',
    description: 'Based on available on-chain data, some sources may be incomplete',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: Info,
  },
  low: {
    label: 'Low Confidence',
    description: 'Limited data available, use with caution and verify independently',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: AlertTriangle,
  },
};

export function ConfidenceBadge({
  level,
  className,
  showIcon = true,
  showLabel = true,
}: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[level];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border',
        config.bgColor,
        config.borderColor,
        className
      )}
      title={config.description}
    >
      {showIcon && <Icon size={14} className={config.color} />}
      {showLabel && (
        <span className={cn('text-sm font-medium', config.color)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Compact dot indicator version
export function ConfidenceDot({ level }: { level: ConfidenceLevel }) {
  const config = CONFIDENCE_CONFIG[level];

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          level === 'high' && 'bg-green-400',
          level === 'medium' && 'bg-amber-400',
          level === 'low' && 'bg-orange-400'
        )}
        title={config.description}
      />
      <span className="text-xs text-gray-400">{config.label}</span>
    </div>
  );
}
