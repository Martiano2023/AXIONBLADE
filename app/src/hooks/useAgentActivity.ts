// ---------------------------------------------------------------------------
// AXIONBLADE useAgentActivity Hook — Real-Time Agent Activity Feed
// ---------------------------------------------------------------------------
// Fetches recent agent actions from AgentActionRecord PDAs:
// - AEON threat detections
// - APOLLO risk assessments
// - HERMES executions
// - Real-time updates via polling
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react';
import { PublicKey, Connection } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';

export interface AgentActivity {
  id: string;
  agent: 'AEON' | 'APOLLO' | 'HERMES';
  type: 'threat_detected' | 'risk_assessed' | 'action_executed' | 'permission_updated';
  title: string;
  description: string;
  timestamp: number;
  status: 'success' | 'warning' | 'error' | 'pending';
  metadata?: any;
  proofPDA?: string;
  txSignature?: string;
}

export function useAgentActivity(walletPubkey: PublicKey | null) {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const { connection } = useConnection();

  const fetchActivities = useCallback(async () => {
    if (!walletPubkey) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // In production, fetch from:
      // 1. AgentActionRecord PDAs (HERMES executions)
      // 2. DecisionLog PDAs (APOLLO assessments)
      // 3. Event logs from programs

      // For now, return mock data
      const mockActivities = generateMockActivities();
      setActivities(mockActivities);
    } catch (err) {
      console.error('Error fetching agent activities:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [walletPubkey, connection]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  return {
    activities,
    loading,
    refetch: fetchActivities,
  };
}

// ---------------------------------------------------------------------------
// Mock Data Generator
// ---------------------------------------------------------------------------

function generateMockActivities(): AgentActivity[] {
  const now = Date.now();

  return [
    {
      id: '1',
      agent: 'AEON',
      type: 'threat_detected',
      title: 'High IL Detected',
      description: 'Impermanent loss exceeded 12% in SOL-USDC pool on Raydium',
      timestamp: now - 120000, // 2 minutes ago
      status: 'warning',
      metadata: {
        pool: 'Raydium SOL-USDC',
        currentIL: 12.3,
        threshold: 10.0,
      },
    },
    {
      id: '2',
      agent: 'APOLLO',
      type: 'risk_assessed',
      title: 'Risk Assessment Complete',
      description: 'Analyzed Raydium SOL-USDC pool: Risk Score 72/100',
      timestamp: now - 180000, // 3 minutes ago
      status: 'success',
      metadata: {
        pool: 'Raydium SOL-USDC',
        riskScore: 72,
        recommendation: 'Monitor closely',
      },
      proofPDA: '0x1234...5678',
    },
    {
      id: '3',
      agent: 'AEON',
      type: 'threat_detected',
      title: 'Dangerous Approval Detected',
      description: 'Unlimited token approval to unverified contract 0x9876...4321',
      timestamp: now - 300000, // 5 minutes ago
      status: 'error',
      metadata: {
        contract: '0x9876...4321',
        token: 'USDC',
        autoRevoke: true,
      },
    },
    {
      id: '4',
      agent: 'HERMES',
      type: 'action_executed',
      title: 'Approval Revoked',
      description: 'Auto-revoked unlimited USDC approval to 0x9876...4321',
      timestamp: now - 240000, // 4 minutes ago
      status: 'success',
      metadata: {
        actionType: 'revoke_approval',
        contract: '0x9876...4321',
        token: 'USDC',
      },
      proofPDA: '0xabcd...ef01',
      txSignature: '0x5678...1234',
    },
    {
      id: '5',
      agent: 'APOLLO',
      type: 'risk_assessed',
      title: 'Portfolio Health Check',
      description: 'Assessed 5 positions: 2 healthy, 2 moderate risk, 1 high risk',
      timestamp: now - 900000, // 15 minutes ago
      status: 'success',
      metadata: {
        totalPositions: 5,
        healthy: 2,
        moderate: 2,
        highRisk: 1,
      },
      proofPDA: '0x2345...6789',
    },
    {
      id: '6',
      agent: 'AEON',
      type: 'threat_detected',
      title: 'Low Health Factor',
      description: 'Lending position on Kamino: Health Factor dropped to 1.15',
      timestamp: now - 1800000, // 30 minutes ago
      status: 'warning',
      metadata: {
        protocol: 'Kamino',
        healthFactor: 1.15,
        threshold: 1.20,
        autoUnstake: false,
      },
    },
  ];
}
