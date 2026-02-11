import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  fetchAeonConfig,
  fetchTreasuryVault,
  fetchHermesConfig,
} from "@/lib/program";
import { findTreasuryVaultPDA } from "@/lib/pda";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProtocolStats {
  treasuryHealth: number;
  totalDecisions: number;
  activeServices: number;
  activeAgents: number;
  treasuryBalanceLamports: number;
}

// ---------------------------------------------------------------------------
// Mock data (fallback when on-chain programs are not deployed)
// ---------------------------------------------------------------------------

const MOCK_STATS: ProtocolStats = {
  treasuryHealth: 85,
  totalDecisions: 1247,
  activeServices: 4,
  activeAgents: 2,
  treasuryBalanceLamports: 42_500_000_000,
};

// ---------------------------------------------------------------------------
// Hook: reads on-chain data with mock fallback
// ---------------------------------------------------------------------------

export function useProtocolStats() {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["protocolStats"],
    queryFn: async (): Promise<ProtocolStats> => {
      try {
        const [aeonConfig, treasuryVault, hermesConfig] = await Promise.all([
          fetchAeonConfig(connection),
          fetchTreasuryVault(connection),
          fetchHermesConfig(connection),
        ]);

        // If we got no data at all, fall back to mocks
        if (!aeonConfig && !treasuryVault) {
          return MOCK_STATS;
        }

        // Compute treasury health as a percentage.
        // If treasuryVault is available, derive from balance;
        // otherwise use the mock value.
        let treasuryHealth = MOCK_STATS.treasuryHealth;
        let treasuryBalanceLamports = MOCK_STATS.treasuryBalanceLamports;

        if (treasuryVault) {
          treasuryBalanceLamports = treasuryVault.totalBalance.toNumber();
          // Health = free balance / total balance * 100
          const total = treasuryVault.totalBalance.toNumber();
          const free = treasuryVault.freeBalance.toNumber();
          treasuryHealth =
            total > 0 ? Math.round((free / total) * 100) : 0;
        } else {
          // Try to read the raw SOL balance of the vault PDA
          try {
            const [vaultPDA] = findTreasuryVaultPDA();
            const balance = await connection.getBalance(vaultPDA);
            if (balance > 0) {
              treasuryBalanceLamports = balance;
              treasuryHealth = Math.round(
                (balance / LAMPORTS_PER_SOL / 100) * 100,
              );
            }
          } catch {
            // Ignore - use mock values
          }
        }

        return {
          treasuryHealth,
          totalDecisions: aeonConfig
            ? aeonConfig.totalDecisions.toNumber()
            : MOCK_STATS.totalDecisions,
          activeServices: hermesConfig
            ? hermesConfig.activeServiceCount
            : MOCK_STATS.activeServices,
          activeAgents: aeonConfig
            ? aeonConfig.activeAgentCount
            : MOCK_STATS.activeAgents,
          treasuryBalanceLamports,
        };
      } catch {
        // Any unexpected error: degrade gracefully to mock data
        return MOCK_STATS;
      }
    },
    refetchInterval: 10_000,
  });
}

// ---------------------------------------------------------------------------
// Re-export mock stats for testing purposes
// ---------------------------------------------------------------------------

export { MOCK_STATS };
