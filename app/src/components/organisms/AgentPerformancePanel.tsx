// ---------------------------------------------------------------------------
// AXIONBLADE AgentPerformancePanel Component — Agent Performance Metrics
// ---------------------------------------------------------------------------
// Displays performance metrics for active agents:
// - AEON: Threat detection stats, uptime, false positive rate
// - APOLLO: Assessment stats, average risk scores, evidence families
// - HERMES: Execution stats, success rate, value processed
// - Overall: Total proofs, verification rate, cost savings
// ---------------------------------------------------------------------------

'use client';

import { motion } from 'framer-motion';
import {
  Crown,
  Brain,
  Zap,
  TrendingUp,
  Activity,
  Shield,
  Clock,
  DollarSign,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { AgentPerformance } from '@/hooks/useAgentPerformance';

interface AgentPerformancePanelProps {
  performance: AgentPerformance | null;
  loading?: boolean;
  activeAgents: string[];
}

export function AgentPerformancePanel({
  performance,
  loading = false,
  activeAgents,
}: AgentPerformancePanelProps) {
  if (loading || !performance) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-800/50 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Overall Performance
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Shield}
            label="Total Proofs"
            value={performance.overall.totalProofsGenerated.toString()}
            color="text-cyan-400"
            bgColor="bg-cyan-500/10"
          />

          <MetricCard
            icon={CheckCircle2}
            label="Proof Verification"
            value={`${performance.overall.proofVerificationRate.toFixed(1)}%`}
            color="text-green-400"
            bgColor="bg-green-500/10"
          />

          <MetricCard
            icon={DollarSign}
            label="Cost Savings"
            value={`$${performance.overall.costSavings.toLocaleString()}`}
            color="text-emerald-400"
            bgColor="bg-emerald-500/10"
          />

          <MetricCard
            icon={Target}
            label="Satisfaction Score"
            value={`${performance.overall.userSatisfactionScore}/100`}
            color="text-purple-400"
            bgColor="bg-purple-500/10"
          />
        </div>
      </Card>

      {/* Agent-Specific Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AEON Guardian */}
        {activeAgents.includes('AEON') && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold">AEON Guardian</h4>
                <p className="text-xs text-gray-400">24/7 Monitoring</p>
              </div>
            </div>

            <div className="space-y-3">
              <MetricRow
                label="Threats Detected (24h)"
                value={performance.aeon.threatsDetected24h.toString()}
                trend="+3 from yesterday"
              />

              <MetricRow
                label="Threats Detected (7d)"
                value={performance.aeon.threatsDetected7d.toString()}
              />

              <MetricRow
                label="Auto-Actions Executed"
                value={performance.aeon.autoActionsExecuted.toString()}
                badge="success"
              />

              <MetricRow
                label="False Positive Rate"
                value={`${performance.aeon.falsePositiveRate.toFixed(1)}%`}
                badge={performance.aeon.falsePositiveRate < 5 ? 'success' : 'warning'}
              />

              <MetricRow
                label="Avg Response Time"
                value={`${performance.aeon.averageResponseTime.toFixed(1)}s`}
              />

              <MetricRow
                label="Uptime"
                value={`${performance.aeon.uptime.toFixed(1)}%`}
                badge="success"
              />
            </div>
          </Card>
        )}

        {/* APOLLO Analyst */}
        {activeAgents.includes('APOLLO') && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold">APOLLO Analyst</h4>
                <p className="text-xs text-gray-400">Risk Assessment</p>
              </div>
            </div>

            <div className="space-y-3">
              <MetricRow
                label="Assessments (24h)"
                value={performance.apollo.assessmentsCompleted24h.toString()}
              />

              <MetricRow
                label="Assessments (7d)"
                value={performance.apollo.assessmentsCompleted7d.toString()}
              />

              <MetricRow
                label="Avg Risk Score"
                value={`${performance.apollo.averageRiskScore.toFixed(1)}/100`}
              />

              <MetricRow
                label="High Risk Detected"
                value={performance.apollo.highRiskDetected.toString()}
                badge={performance.apollo.highRiskDetected > 0 ? 'warning' : 'success'}
              />

              <div className="pt-2 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-2">Evidence Families Used</p>
                <div className="flex items-center gap-1">
                  {performance.apollo.evidenceFamiliesUsed.map((count, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden"
                      title={`Family ${idx + 1}: ${count} uses`}
                    >
                      <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / Math.max(...performance.apollo.evidenceFamiliesUsed)) * 100}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* HERMES Executor */}
        {activeAgents.includes('HERMES') && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold">HERMES Executor</h4>
                <p className="text-xs text-gray-400">Autonomous Actions</p>
              </div>
            </div>

            <div className="space-y-3">
              <MetricRow
                label="Actions Executed (24h)"
                value={performance.hermes.actionsExecuted24h.toString()}
              />

              <MetricRow
                label="Actions Executed (7d)"
                value={performance.hermes.actionsExecuted7d.toString()}
              />

              <MetricRow
                label="Success Rate"
                value={`${performance.hermes.successRate.toFixed(1)}%`}
                badge={performance.hermes.successRate > 90 ? 'success' : 'warning'}
              />

              <MetricRow
                label="Value Processed"
                value={`$${performance.hermes.totalValueProcessed.toLocaleString()}`}
              />

              <MetricRow
                label="Avg Execution Time"
                value={`${performance.hermes.averageExecutionTime.toFixed(1)}s`}
              />

              <MetricRow
                label="Gas Saved"
                value={`${performance.hermes.gasSaved.toFixed(3)} SOL`}
                badge="success"
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`p-4 rounded-lg ${bgColor} border border-gray-800`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  trend,
  badge,
}: {
  label: string;
  value: string;
  trend?: string;
  badge?: 'success' | 'warning' | 'danger';
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-semibold font-mono">{value}</span>
        {badge && (
          <Badge
            variant={badge}
            className="text-xs px-1.5 py-0.5"
          >
            {badge === 'success' && '✓'}
            {badge === 'warning' && '⚠'}
            {badge === 'danger' && '✗'}
          </Badge>
        )}
        {trend && (
          <span className="text-xs text-gray-500">{trend}</span>
        )}
      </div>
    </div>
  );
}
