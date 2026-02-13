// ---------------------------------------------------------------------------
// useTokenLaunch Hook — Token launch status from TokenVaultConfig
// ---------------------------------------------------------------------------
// Fetches on-chain token vault data for /token dashboard
// Polls every 60 seconds for launch condition updates
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

const TOKEN_VAULT_PROGRAM_ID = new PublicKey(''); // TODO: Update after deployment

export interface LaunchCondition {
  label: string;
  met: boolean;
  current: string;
  target: string;
}

export interface VestingSchedule {
  allocation: string;
  percent: string;
  amount: string;
  cliff: string;
  vest: string;
  beneficiary: PublicKey | null;
}

export interface BurnStats {
  burnBudgetBps: number;
  minReserveRatioBps: number;
  totalBurnedTokens: number;
  nextBurnTimestamp: number | null;
}

export interface TokenLaunchData {
  isLaunched: boolean;
  launchStatus: 'pending' | 'approved' | 'launched';
  conditionsMetAt: number | null;
  launchExecutableAt: number | null; // 72h after approval
  totalSupply: number;
  mintAddress: PublicKey | null;
  conditions: LaunchCondition[];
  vestingSchedules: VestingSchedule[];
  burnStats: BurnStats;
  loading: boolean;
  error: string | null;
}

export function useTokenLaunch(): TokenLaunchData {
  const { connection } = useConnection();
  const [data, setData] = useState<TokenLaunchData>({
    isLaunched: false,
    launchStatus: 'pending',
    conditionsMetAt: null,
    launchExecutableAt: null,
    totalSupply: 1_000_000_000,
    mintAddress: null,
    conditions: [],
    vestingSchedules: [],
    burnStats: {
      burnBudgetBps: 500, // 5%
      minReserveRatioBps: 2500, // 25%
      totalBurnedTokens: 0,
      nextBurnTimestamp: null,
    },
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    const fetchTokenLaunchData = async () => {
      try {
        // Derive TokenVaultConfig PDA
        const [vaultConfigPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('token_vault_config')],
          TOKEN_VAULT_PROGRAM_ID
        );

        // Fetch account
        const vaultAccount = await connection.getAccountInfo(vaultConfigPDA);

        if (!vaultAccount) {
          // Token vault not initialized yet — show sample data
          if (mounted) {
            setData((prev) => ({
              ...prev,
              loading: false,
              conditions: getSampleConditions(),
              vestingSchedules: getSampleVestingSchedules(),
            }));
          }
          return;
        }

        // TODO: Decode using IDL
        // For now, return sample data
        if (mounted) {
          setData({
            isLaunched: false,
            launchStatus: 'pending' as const,
            conditionsMetAt: null,
            launchExecutableAt: null,
            totalSupply: 1_000_000_000,
            mintAddress: null,
            conditions: getSampleConditions(),
            vestingSchedules: getSampleVestingSchedules(),
            burnStats: {
              burnBudgetBps: 500,
              minReserveRatioBps: 2500,
              totalBurnedTokens: 0,
              nextBurnTimestamp: null,
            },
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error fetching token launch data:', error);
        if (mounted) {
          setData((prev) => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }));
        }
      }
    };

    fetchTokenLaunchData();

    // Poll every 60 seconds
    interval = setInterval(fetchTokenLaunchData, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [connection]);

  return data;
}

function getSampleConditions(): LaunchCondition[] {
  return [
    {
      label: 'Treasury ≥ $100,000 USD',
      met: false,
      current: '$87,234',
      target: '$100,000',
    },
    {
      label: '3 consecutive growth weeks',
      met: false,
      current: '2 weeks',
      target: '3 weeks',
    },
    {
      label: 'Market stability (30d)',
      met: true,
      current: 'Stable',
      target: 'Stable',
    },
    {
      label: 'No anomalies detected',
      met: true,
      current: 'Clean',
      target: 'Clean',
    },
  ];
}

function getSampleVestingSchedules(): VestingSchedule[] {
  return [
    {
      allocation: 'Team',
      percent: '20%',
      amount: '200M',
      cliff: '6 months',
      vest: '2 years',
      beneficiary: null,
    },
    {
      allocation: 'Treasury',
      percent: '30%',
      amount: '300M',
      cliff: '0',
      vest: 'Controlled by AEON',
      beneficiary: null,
    },
    {
      allocation: 'Community',
      percent: '30%',
      amount: '300M',
      cliff: '0',
      vest: 'Airdrop via C3',
      beneficiary: null,
    },
    {
      allocation: 'Liquidity',
      percent: '10%',
      amount: '100M',
      cliff: '0',
      vest: 'LP provision',
      beneficiary: null,
    },
    {
      allocation: 'Reserve',
      percent: '10%',
      amount: '100M',
      cliff: '0',
      vest: 'Emergency fund',
      beneficiary: null,
    },
  ];
}
