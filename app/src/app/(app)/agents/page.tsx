// ---------------------------------------------------------------------------
// AXIONBLADE AI Agents Dashboard — Autonomous Agent Control Center
// ---------------------------------------------------------------------------
// Main control panel for managing 3 AI agents:
// - AEON Guardian: 24/7 monitoring, threat detection, auto-defensive actions
// - APOLLO Analyst: Deep risk analysis, template-based AI reports
// - HERMES Executor: Autonomous trading, rebalancing, DCA
//
// Features:
// - Agent activation toggles
// - Permission configuration modals
// - Real-time activity feed
// - Performance tracking
// - Proof-before-action compliance
// ---------------------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Bot, Crown, Brain, Zap, Settings, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { useAgentPermissions } from '@/hooks/useAgentPermissions';
import { useAgentActivity } from '@/hooks/useAgentActivity';
import { useAgentPerformance } from '@/hooks/useAgentPerformance';
import { AgentCard } from '@/components/organisms/AgentCard';
import { AgentSettingsModal } from '@/components/organisms/AgentSettingsModal';
import { AgentActivityFeed } from '@/components/organisms/AgentActivityFeed';
import { AgentPerformancePanel } from '@/components/organisms/AgentPerformancePanel';

export default function AgentsPage() {
  const { publicKey, connected } = useWallet();
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [settingsModalOpen, setSettingsModalOpen] = useState<string | null>(null);

  const { permissions, updatePermissions, loading: permissionsLoading } = useAgentPermissions(publicKey);
  const { activities, loading: activitiesLoading } = useAgentActivity(publicKey);
  const { performance, loading: performanceLoading } = useAgentPerformance(publicKey);

  // Initialize active agents from permissions
  useEffect(() => {
    if (permissions) {
      const active = new Set<string>();
      if (permissions.aeon_monitoring_enabled) active.add('AEON');
      if (permissions.apollo_auto_analysis_enabled) active.add('APOLLO');
      if (permissions.hermes_enabled) active.add('HERMES');
      setActiveAgents(active);
    }
  }, [permissions]);

  const toggleAgent = async (agent: string) => {
    if (!publicKey) return;

    const isActive = activeAgents.has(agent);
    const newActiveAgents = new Set(activeAgents);

    if (isActive) {
      newActiveAgents.delete(agent);
    } else {
      newActiveAgents.add(agent);
    }

    setActiveAgents(newActiveAgents);

    // Update on-chain permissions
    const updates: any = {};
    if (agent === 'AEON') {
      updates.aeon_monitoring_enabled = !isActive;
    } else if (agent === 'APOLLO') {
      updates.apollo_auto_analysis_enabled = !isActive;
    } else if (agent === 'HERMES') {
      updates.hermes_enabled = !isActive;
    }

    await updatePermissions(updates);
  };

  const openSettingsModal = (agent: string) => {
    setSettingsModalOpen(agent);
  };

  const closeSettingsModal = () => {
    setSettingsModalOpen(null);
  };

  const saveSettings = async (agent: string, settings: any) => {
    await updatePermissions(settings);
    closeSettingsModal();
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
          <p className="text-gray-400">
            Connect your wallet to access AI agents and configure autonomous operations.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Agents</h1>
          <p className="text-gray-400">
            Autonomous agents that monitor, analyze, and execute on your behalf
          </p>
        </div>
        <Badge variant="info" className="text-sm">
          v3.3.0
        </Badge>
      </div>

      {/* Warning Banner (if no agents active) */}
      {activeAgents.size === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-400">No Active Agents</h3>
            <p className="text-sm text-gray-300 mt-1">
              Enable at least one agent below to start autonomous monitoring and execution.
            </p>
          </div>
        </motion.div>
      )}

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AgentCard
          agent="AEON"
          title="Guardian"
          description="24/7 monitoring, threat detection, auto-defensive actions"
          pricing="0.02 SOL/month"
          icon={Crown}
          isActive={activeAgents.has('AEON')}
          onToggle={() => toggleAgent('AEON')}
          permissions={permissions}
          onConfigure={() => openSettingsModal('AEON')}
          loading={permissionsLoading}
        />

        <AgentCard
          agent="APOLLO"
          title="Analyst"
          description="Deep risk analysis, template-based AI reports"
          pricing="Included with scans"
          icon={Brain}
          isActive={activeAgents.has('APOLLO')}
          onToggle={() => toggleAgent('APOLLO')}
          permissions={permissions}
          onConfigure={() => openSettingsModal('APOLLO')}
          loading={permissionsLoading}
        />

        <AgentCard
          agent="HERMES"
          title="Executor"
          description="Autonomous trading, rebalancing, DCA"
          pricing="0.1% per tx (min 0.001 SOL)"
          icon={Zap}
          isActive={activeAgents.has('HERMES')}
          onToggle={() => toggleAgent('HERMES')}
          permissions={permissions}
          onConfigure={() => openSettingsModal('HERMES')}
          loading={permissionsLoading}
        />
      </div>

      {/* Activity Feed */}
      {activeAgents.size > 0 && (
        <AgentActivityFeed
          activities={activities}
          loading={activitiesLoading}
        />
      )}

      {/* Performance Panel */}
      {activeAgents.size > 0 && (
        <AgentPerformancePanel
          performance={performance}
          loading={performanceLoading}
          activeAgents={Array.from(activeAgents)}
        />
      )}

      {/* Settings Modal */}
      {settingsModalOpen && (
        <AgentSettingsModal
          agent={settingsModalOpen as 'AEON' | 'APOLLO' | 'HERMES'}
          permissions={permissions}
          onSave={(settings) => saveSettings(settingsModalOpen, settings)}
          onClose={closeSettingsModal}
        />
      )}
    </div>
  );
}
