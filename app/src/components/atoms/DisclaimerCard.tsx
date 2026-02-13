// ---------------------------------------------------------------------------
// AXIONBLADE Disclaimer Card Component
// ---------------------------------------------------------------------------
// Displays financial disclaimer consistently across all analysis pages
// ---------------------------------------------------------------------------

import { AlertTriangle, Info, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DisclaimerCardProps {
  variant?: 'default' | 'compact';
  timestamp?: number;
  proofHash?: string;
  version?: string;
}

export function DisclaimerCard({
  variant = 'default',
  timestamp,
  proofHash,
  version = 'v3.3.0',
}: DisclaimerCardProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-2 text-xs text-gray-500 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <p>
          <strong>Disclaimer:</strong> This analysis is algorithmically generated and does not
          constitute financial advice. Always do your own research.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 space-y-3">
      {/* Warning Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-amber-400" size={20} />
        <h3 className="text-sm font-semibold text-amber-400">
          Important Notice
        </h3>
      </div>

      {/* Disclaimer Text */}
      <div className="text-sm text-gray-300 space-y-2">
        <p>
          This analysis is <strong>algorithmically generated</strong> using on-chain data and
          deterministic algorithms. It is provided for informational purposes only and{' '}
          <strong>does not constitute financial advice</strong>.
        </p>
        <p>
          DeFi investments carry significant risks including smart contract vulnerabilities,
          impermanent loss, and market volatility. Always conduct your own research and never
          invest more than you can afford to lose.
        </p>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 pt-2 border-t border-amber-500/20 text-xs text-gray-400">
        {timestamp && (
          <div className="flex items-center gap-1.5">
            <Shield size={12} />
            <span>
              Generated: {new Date(timestamp).toLocaleString()}
            </span>
          </div>
        )}
        {proofHash && (
          <div className="flex items-center gap-1.5">
            <Shield size={12} />
            <span className="font-mono" title={proofHash}>
              Proof: {proofHash.slice(0, 8)}...
            </span>
          </div>
        )}
        <div className="ml-auto">
          AXIONBLADE {version}
        </div>
      </div>
    </div>
  );
}
