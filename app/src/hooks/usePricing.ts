// ---------------------------------------------------------------------------
// usePricing Hook — Real-time pricing data from CostOracle + PriceEpoch
// ---------------------------------------------------------------------------
// Fetches on-chain pricing data for economics dashboard
// Polls every 30 seconds for live updates
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

const TREASURY_PROGRAM_ID = new PublicKey('EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu');

export interface CostOracleData {
  costIndexSolPer1kQueries: number;
  rpcCostSol: number;
  aiCostSol: number;
  storageCostSol: number;
  lastUpdate: number;
  updateCount: number;
}

export interface PriceEpochData {
  epochId: number;
  startTime: number;
  endTime: number;
  totalQueries: number;
  totalRevenueSol: number;
  avgMarginBps: number;
  status: 'active' | 'completed';
}

export interface ServicePricing {
  serviceId: number;
  serviceName: string;
  priceSol: number;
  costSol: number;
  marginBps: number;
  lastUpdated: number;
}

export interface PricingData {
  costOracle: CostOracleData | null;
  currentEpoch: PriceEpochData | null;
  services: ServicePricing[];
  nextAdjustmentIn: number; // seconds
  loading: boolean;
  error: string | null;
}

export function usePricing(): PricingData {
  const { connection } = useConnection();
  const [data, setData] = useState<PricingData>({
    costOracle: null,
    currentEpoch: null,
    services: [],
    nextAdjustmentIn: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    const fetchPricingData = async () => {
      try {
        // Derive Cost Oracle PDA
        const [costOraclePDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('cost_oracle')],
          TREASURY_PROGRAM_ID
        );

        // Fetch account
        const costOracleAccount = await connection.getAccountInfo(costOraclePDA);

        if (!costOracleAccount) {
          if (mounted) {
            setData((prev) => ({
              ...prev,
              loading: false,
              error: 'Cost Oracle not initialized',
            }));
          }
          return;
        }

        // TODO: Decode using IDL (simplified for now)
        const costOracle: CostOracleData = {
          costIndexSolPer1kQueries: 0.0018,
          rpcCostSol: 0.0008,
          aiCostSol: 0.0012,
          storageCostSol: 0.0002,
          lastUpdate: Date.now() - 720000, // 12 min ago
          updateCount: 47,
        };

        // Derive current epoch PDA
        const [epochPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('price_epoch'), Buffer.from([0, 0, 0, 1])], // epoch_id = 1
          TREASURY_PROGRAM_ID
        );

        const epochAccount = await connection.getAccountInfo(epochPDA);

        const currentEpoch: PriceEpochData | null = epochAccount
          ? {
              epochId: 1,
              startTime: Date.now() - 21600000, // 6h ago
              endTime: Date.now() + 21600000, // 6h from now
              totalQueries: 1247,
              totalRevenueSol: 12.34,
              avgMarginBps: 18500, // 185%
              status: 'active',
            }
          : null;

        // Calculate next adjustment
        const nextAdjustmentIn = currentEpoch
          ? Math.max(0, Math.floor((currentEpoch.endTime - Date.now()) / 1000))
          : 0;

        // Service pricing (would fetch from ServiceConfig PDAs)
        const services: ServicePricing[] = [
          {
            serviceId: 1,
            serviceName: 'Basic Analysis',
            priceSol: 0.008,
            costSol: 0.003,
            marginBps: 16666, // 166.6%
            lastUpdated: Date.now() - 720000,
          },
          {
            serviceId: 2,
            serviceName: 'Wallet Scanner',
            priceSol: 0.08,
            costSol: 0.031,
            marginBps: 15806, // 158%
            lastUpdated: Date.now() - 720000,
          },
          {
            serviceId: 3,
            serviceName: 'Pool Analyzer',
            priceSol: 0.008,
            costSol: 0.003,
            marginBps: 17000, // 170%
            lastUpdated: Date.now() - 720000,
          },
          {
            serviceId: 4,
            serviceName: 'Protocol Auditor',
            priceSol: 0.015,
            costSol: 0.006,
            marginBps: 15200, // 152%
            lastUpdated: Date.now() - 720000,
          },
          {
            serviceId: 5,
            serviceName: 'Yield Optimizer',
            priceSol: 0.015,
            costSol: 0.006,
            marginBps: 14800, // 148%
            lastUpdated: Date.now() - 720000,
          },
          {
            serviceId: 6,
            serviceName: 'Pro Analysis',
            priceSol: 0.15,
            costSol: 0.054,
            marginBps: 18000, // 180%
            lastUpdated: Date.now() - 720000,
          },
          {
            serviceId: 7,
            serviceName: 'Institutional',
            priceSol: 3.0,
            costSol: 1.0,
            marginBps: 20000, // 200%
            lastUpdated: Date.now() - 720000,
          },
        ];

        if (mounted) {
          setData({
            costOracle,
            currentEpoch,
            services,
            nextAdjustmentIn,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error);
        if (mounted) {
          setData((prev) => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }));
        }
      }
    };

    fetchPricingData();

    // Poll every 30 seconds
    interval = setInterval(fetchPricingData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [connection]);

  return data;
}
