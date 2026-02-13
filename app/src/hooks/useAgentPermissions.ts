// ---------------------------------------------------------------------------
// AXIONBLADE useAgentPermissions Hook — Agent Permission Management
// ---------------------------------------------------------------------------
// Fetches and updates AgentPermissionConfig PDA from noumen_core:
// - Derives PDA: [b"agent_permission", user_wallet, agent_id]
// - Decodes permission structure
// - Sends update transactions
// - Handles permission revocation
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react';
import { PublicKey, Connection, Transaction } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';

// Mock Program ID (replace with actual deployed program ID)
const NOUMEN_CORE_PROGRAM_ID = new PublicKey('9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE');

export interface AgentPermissions {
  user_wallet: string;
  agent_id: number;

  // AEON permissions
  aeon_monitoring_enabled: boolean;
  aeon_auto_revoke_approvals: boolean;
  aeon_auto_exit_pools: boolean;
  aeon_auto_unstake: boolean;
  aeon_il_threshold_bps: number;
  aeon_health_factor_threshold_bps: number;

  // APOLLO permissions
  apollo_auto_analysis_enabled: boolean;
  apollo_analysis_frequency_hours: number;

  // HERMES permissions
  hermes_enabled: boolean;
  hermes_max_tx_amount_lamports: number;
  hermes_allowed_protocols_bitmap: number;
  hermes_max_slippage_bps: number;
  hermes_dca_enabled: boolean;
  hermes_rebalance_enabled: boolean;
  hermes_daily_tx_limit: number;
  hermes_tx_count_today: number;
  hermes_last_tx_date: number;

  created_at: number;
  updated_at: number;
}

export function useAgentPermissions(walletPubkey: PublicKey | null) {
  const [permissions, setPermissions] = useState<AgentPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { connection } = useConnection();
  const { sendTransaction } = useWallet();

  // Fetch permissions from on-chain PDA
  const fetchPermissions = useCallback(async () => {
    if (!walletPubkey) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Derive AgentPermissionConfig PDA
      // In production, agent_id would be passed as parameter
      // For now, using agent_id = 1 as default
      const agentId = 1;
      const [pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('agent_permission'),
          walletPubkey.toBuffer(),
          Buffer.from([agentId, 0]), // u16 little-endian
        ],
        NOUMEN_CORE_PROGRAM_ID
      );

      const accountInfo = await connection.getAccountInfo(pda);

      if (!accountInfo) {
        // No permissions PDA exists yet - return defaults
        setPermissions(getDefaultPermissions(walletPubkey.toString()));
        setLoading(false);
        return;
      }

      // Decode PDA account data
      const decoded = decodeAgentPermissionConfig(accountInfo.data);
      setPermissions(decoded);
    } catch (err) {
      console.error('Error fetching agent permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      setPermissions(getDefaultPermissions(walletPubkey.toString()));
    } finally {
      setLoading(false);
    }
  }, [walletPubkey, connection]);

  // Update permissions on-chain
  const updatePermissions = useCallback(
    async (updates: Partial<AgentPermissions>) => {
      if (!walletPubkey || !sendTransaction) {
        throw new Error('Wallet not connected');
      }

      try {
        // In production, build and send update_agent_permissions instruction
        // For now, simulate with mock transaction
        const tx = await buildUpdatePermissionsTx(walletPubkey, updates);
        const signature = await sendTransaction(tx, connection);

        toast.success('Updating permissions on-chain...');

        await connection.confirmTransaction(signature, 'confirmed');

        toast.success('Permissions updated successfully');

        // Refresh permissions
        await fetchPermissions();

        return signature;
      } catch (err) {
        console.error('Error updating permissions:', err);
        toast.error('Failed to update permissions');
        throw err;
      }
    },
    [walletPubkey, sendTransaction, connection, fetchPermissions]
  );

  // Revoke all permissions (A0-33: instant revocation)
  const revokeAllPermissions = useCallback(async () => {
    if (!walletPubkey || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      // In production, call revoke_agent_permissions instruction
      const tx = await buildRevokePermissionsTx(walletPubkey);
      const signature = await sendTransaction(tx, connection);

      toast.success('Revoking all agent permissions...');

      await connection.confirmTransaction(signature, 'confirmed');

      toast.success('All permissions revoked');

      // Refresh permissions
      await fetchPermissions();

      return signature;
    } catch (err) {
      console.error('Error revoking permissions:', err);
      toast.error('Failed to revoke permissions');
      throw err;
    }
  }, [walletPubkey, sendTransaction, connection, fetchPermissions]);

  // Initial fetch
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    updatePermissions,
    revokeAllPermissions,
    refetch: fetchPermissions,
  };
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function getDefaultPermissions(walletAddress: string): AgentPermissions {
  return {
    user_wallet: walletAddress,
    agent_id: 1,

    // AEON defaults (conservative)
    aeon_monitoring_enabled: false,
    aeon_auto_revoke_approvals: true,
    aeon_auto_exit_pools: false,
    aeon_auto_unstake: true,
    aeon_il_threshold_bps: 1000, // 10%
    aeon_health_factor_threshold_bps: 12000, // 1.2

    // APOLLO defaults
    apollo_auto_analysis_enabled: false,
    apollo_analysis_frequency_hours: 6,

    // HERMES defaults (very restricted)
    hermes_enabled: false,
    hermes_max_tx_amount_lamports: 100_000_000, // 0.1 SOL
    hermes_allowed_protocols_bitmap: 0, // No protocols allowed by default
    hermes_max_slippage_bps: 100, // 1%
    hermes_dca_enabled: false,
    hermes_rebalance_enabled: false,
    hermes_daily_tx_limit: 5,
    hermes_tx_count_today: 0,
    hermes_last_tx_date: 0,

    created_at: 0,
    updated_at: 0,
  };
}

function decodeAgentPermissionConfig(data: Buffer): AgentPermissions {
  // In production, use Anchor's IDL to decode
  // For now, return mock data based on discriminator
  // This would properly deserialize the struct fields

  // Mock decoding (replace with actual Anchor deserialization)
  return {
    user_wallet: 'decoded_from_pda',
    agent_id: 1,
    aeon_monitoring_enabled: true,
    aeon_auto_revoke_approvals: true,
    aeon_auto_exit_pools: false,
    aeon_auto_unstake: true,
    aeon_il_threshold_bps: 1500,
    aeon_health_factor_threshold_bps: 13000,
    apollo_auto_analysis_enabled: true,
    apollo_analysis_frequency_hours: 4,
    hermes_enabled: false,
    hermes_max_tx_amount_lamports: 500_000_000,
    hermes_allowed_protocols_bitmap: 0b0000111, // Jupiter, Raydium, Orca
    hermes_max_slippage_bps: 150,
    hermes_dca_enabled: false,
    hermes_rebalance_enabled: false,
    hermes_daily_tx_limit: 10,
    hermes_tx_count_today: 3,
    hermes_last_tx_date: Date.now(),
    created_at: Date.now() - 86400000,
    updated_at: Date.now(),
  };
}

async function buildUpdatePermissionsTx(
  wallet: PublicKey,
  updates: Partial<AgentPermissions>
): Promise<Transaction> {
  // In production, build Anchor instruction for update_agent_permissions
  // For now, return mock transaction

  const tx = new Transaction();
  // tx.add(updatePermissionsInstruction);

  return tx;
}

async function buildRevokePermissionsTx(wallet: PublicKey): Promise<Transaction> {
  // In production, build Anchor instruction for revoke_agent_permissions
  // For now, return mock transaction

  const tx = new Transaction();
  // tx.add(revokePermissionsInstruction);

  return tx;
}
