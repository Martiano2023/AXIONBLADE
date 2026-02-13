// ---------------------------------------------------------------------------
// AXIONBLADE useAgentPerformance Hook — Agent Performance Metrics
// ---------------------------------------------------------------------------
// Tracks agent performance metrics:
// - AEON: Threats detected, auto-actions taken, false positives
// - APOLLO: Assessments completed, average risk scores, accuracy
// - HERMES: Actions executed, success rate, value saved/earned
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';

export interface AgentPerformance {
  aeon: {
    threatsDetected24h: number;
    threatsDetected7d: number;
    autoActionsExecuted: number;
    falsePositiveRate: number;
    averageResponseTime: number; // seconds
    uptime: number; // percentage
  };
  apollo: {
    assessmentsCompleted24h: number;
    assessmentsCompleted7d: number;
    averageRiskScore: number;
    highRiskDetected: number;
    evidenceFamiliesUsed: number[]; // count per family
  };
  hermes: {
    actionsExecuted24h: number;
    actionsExecuted7d: number;
    successRate: number; // percentage
    totalValueProcessed: number; // USD
    averageExecutionTime: number; // seconds
    gasSaved: number; // SOL
  };
  overall: {
    totalProofsGenerated: number;
    proofVerificationRate: number;
    costSavings: number; // USD
    userSatisfactionScore: number; // 0-100
  };
}

export function useAgentPerformance(walletPubkey: PublicKey | null) {
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  const { connection } = useConnection();

  const fetchPerformance = useCallback(async () => {
    if (!walletPubkey) {
      setPerformance(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // In production, aggregate from:
      // 1. AgentActionRecord PDAs (execution stats)
      // 2. DecisionLog PDAs (proof stats)
      // 3. Historical event logs

      // For now, return mock performance data
      const mockPerformance = generateMockPerformance();
      setPerformance(mockPerformance);
    } catch (err) {
      console.error('Error fetching agent performance:', err);
      setPerformance(null);
    } finally {
      setLoading(false);
    }
  }, [walletPubkey, connection]);

  // Initial fetch
  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchPerformance, 30000);
    return () => clearInterval(interval);
  }, [fetchPerformance]);

  return {
    performance,
    loading,
    refetch: fetchPerformance,
  };
}

// ---------------------------------------------------------------------------
// Mock Data Generator
// ---------------------------------------------------------------------------

function generateMockPerformance(): AgentPerformance {
  return {
    aeon: {
      threatsDetected24h: 12,
      threatsDetected7d: 87,
      autoActionsExecuted: 5,
      falsePositiveRate: 3.2, // 3.2%
      averageResponseTime: 2.1, // 2.1 seconds
      uptime: 99.8,
    },
    apollo: {
      assessmentsCompleted24h: 24,
      assessmentsCompleted7d: 156,
      averageRiskScore: 74.5,
      highRiskDetected: 8,
      evidenceFamiliesUsed: [24, 24, 18, 22, 20], // Price/Volume, Liquidity, Behavior, Incentive, Protocol
    },
    hermes: {
      actionsExecuted24h: 3,
      actionsExecuted7d: 18,
      successRate: 94.4, // 94.4% success
      totalValueProcessed: 12450, // $12,450 USD
      averageExecutionTime: 1.8, // 1.8 seconds
      gasSaved: 0.035, // 0.035 SOL
    },
    overall: {
      totalProofsGenerated: 178,
      proofVerificationRate: 100, // 100% verified
      costSavings: 450, // $450 saved from IL avoidance, better entry/exit
      userSatisfactionScore: 92,
    },
  };
}
