// ---------------------------------------------------------------------------
// AXIONBLADE AgentActivityFeed Component — Real-Time Activity Stream
// ---------------------------------------------------------------------------
// Terminal-style activity feed showing:
// - Recent agent actions (AEON, APOLLO, HERMES)
// - Threat detections, risk assessments, executions
// - Proof PDAs and transaction signatures
// - Color-coded by agent and status
// ---------------------------------------------------------------------------

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Brain, Zap, ExternalLink, Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { AgentActivity } from '@/hooks/useAgentActivity';
import { formatDistanceToNow } from 'date-fns';

interface AgentActivityFeedProps {
  activities: AgentActivity[];
  loading?: boolean;
}

export function AgentActivityFeed({ activities, loading = false }: AgentActivityFeedProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Agent Activity Feed
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-800/50 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Agent Activity Feed
        </h3>
        <Badge variant="neutral" className="text-xs">
          Last {activities.length} actions
        </Badge>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {activities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No agent activity yet</p>
              <p className="text-sm mt-1">Activate agents to start monitoring</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <ActivityItem activity={activity} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Activity Item Component
// ---------------------------------------------------------------------------

function ActivityItem({ activity }: { activity: AgentActivity }) {
  const agentConfig = {
    AEON: {
      icon: Crown,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    APOLLO: {
      icon: Brain,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    HERMES: {
      icon: Zap,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
  };

  const statusConfig = {
    success: {
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    error: {
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    pending: {
      icon: Clock,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
    },
  };

  const agent = agentConfig[activity.agent];
  const status = statusConfig[activity.status];
  const AgentIcon = agent.icon;
  const StatusIcon = status.icon;

  return (
    <div
      className={`p-3 rounded-lg border ${agent.borderColor} ${agent.bgColor} hover:bg-opacity-20 transition-colors`}
    >
      <div className="flex items-start gap-3">
        {/* Agent Icon */}
        <div className={`w-8 h-8 rounded-lg ${agent.bgColor} border ${agent.borderColor} flex items-center justify-center flex-shrink-0`}>
          <AgentIcon className={`w-4 h-4 ${agent.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`font-semibold text-sm ${agent.color}`}>
                {activity.agent}
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-sm text-gray-300 truncate">
                {activity.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-400 mb-2">{activity.description}</p>

          {/* Metadata & Links */}
          <div className="flex items-center gap-3 flex-wrap text-xs">
            {activity.proofPDA && (
              <a
                href={`https://explorer.solana.com/address/${activity.proofPDA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Shield className="w-3 h-3" />
                Proof PDA
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {activity.txSignature && (
              <a
                href={`https://explorer.solana.com/tx/${activity.txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
              >
                TX Signature
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <div className="flex items-center gap-2 text-gray-500">
                {Object.entries(activity.metadata).slice(0, 3).map(([key, value]) => (
                  <span key={key}>
                    {key}: <span className="font-mono text-gray-400">{String(value)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom scrollbar styles (add to globals.css if not already present)
const styles = `
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgb(17, 24, 39);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(55, 65, 81);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(75, 85, 99);
}
`;
