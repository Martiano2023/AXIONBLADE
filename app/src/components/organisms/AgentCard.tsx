// ---------------------------------------------------------------------------
// AXIONBLADE AgentCard Component — Individual Agent Control Card
// ---------------------------------------------------------------------------
// Displays agent status with pulsing animation when active:
// - Agent icon and metadata
// - Active/inactive toggle
// - Configuration button
// - Real-time stats (when active)
// - Pricing information
// ---------------------------------------------------------------------------

'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Settings, Activity, CheckCircle2, Circle } from 'lucide-react';

interface AgentCardProps {
  agent: 'AEON' | 'APOLLO' | 'HERMES';
  title: string;
  description: string;
  pricing: string;
  icon: LucideIcon;
  isActive: boolean;
  onToggle: () => void;
  permissions: any;
  onConfigure: () => void;
  loading?: boolean;
}

export function AgentCard({
  agent,
  title,
  description,
  pricing,
  icon: Icon,
  isActive,
  onToggle,
  permissions,
  onConfigure,
  loading = false,
}: AgentCardProps) {
  const agentColors = {
    AEON: {
      from: 'from-amber-500/10',
      to: 'to-orange-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300',
    },
    APOLLO: {
      from: 'from-blue-500/10',
      to: 'to-cyan-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300',
    },
    HERMES: {
      from: 'from-purple-500/10',
      to: 'to-pink-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-300',
    },
  };

  const colors = agentColors[agent];

  return (
    <Card className="relative overflow-hidden group">
      {/* Pulsing glow when active */}
      {isActive && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${colors.from} via-transparent ${colors.to}`}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors.from} ${colors.to} border ${colors.border} flex items-center justify-center`}
            >
              <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{title}</h3>
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">{description}</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge
            variant={isActive ? 'success' : 'neutral'}
            className="text-xs"
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
          <span className="text-xs text-gray-500">{pricing}</span>
        </div>

        {/* Stats (when active) */}
        {isActive && !loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pt-2 border-t border-gray-800"
          >
            <AgentStats agent={agent} permissions={permissions} />
          </motion.div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={isActive ? 'outline' : 'primary'}
            size="sm"
            onClick={onToggle}
            disabled={loading}
            className="w-full"
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onConfigure}
            disabled={loading}
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-1.5" />
            Configure
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Agent-Specific Stats Display
// ---------------------------------------------------------------------------

function AgentStats({ agent, permissions }: { agent: string; permissions: any }) {
  if (!permissions) return null;

  if (agent === 'AEON') {
    return (
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-gray-500">IL Threshold</div>
          <div className="font-semibold text-amber-400">
            {(permissions.aeon_il_threshold_bps / 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-gray-500">Health Factor</div>
          <div className="font-semibold text-amber-400">
            {(permissions.aeon_health_factor_threshold_bps / 10000).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Auto-Revoke</div>
          <div className="font-semibold">
            {permissions.aeon_auto_revoke_approvals ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Auto-Exit</div>
          <div className="font-semibold">
            {permissions.aeon_auto_exit_pools ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>
    );
  }

  if (agent === 'APOLLO') {
    return (
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-gray-500">Analysis Frequency</div>
          <div className="font-semibold text-blue-400">
            Every {permissions.apollo_analysis_frequency_hours}h
          </div>
        </div>
        <div>
          <div className="text-gray-500">Mode</div>
          <div className="font-semibold">
            {permissions.apollo_auto_analysis_enabled ? 'Auto' : 'Manual'}
          </div>
        </div>
      </div>
    );
  }

  if (agent === 'HERMES') {
    return (
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-gray-500">Max TX Amount</div>
          <div className="font-semibold text-purple-400">
            {(permissions.hermes_max_tx_amount_lamports / 1e9).toFixed(2)} SOL
          </div>
        </div>
        <div>
          <div className="text-gray-500">Daily TX Limit</div>
          <div className="font-semibold">
            {permissions.hermes_tx_count_today}/{permissions.hermes_daily_tx_limit}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Max Slippage</div>
          <div className="font-semibold">
            {(permissions.hermes_max_slippage_bps / 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-gray-500">DCA</div>
          <div className="font-semibold">
            {permissions.hermes_dca_enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
