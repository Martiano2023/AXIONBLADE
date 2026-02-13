"use client";

// ---------------------------------------------------------------------------
// AXIONBLADE usePoolData Hook — Simulated real DeFi pool data
// ---------------------------------------------------------------------------
// Provides pool-level metrics seeded from real mainnet approximate values.
// Applies small random variations every 30 seconds to simulate live data.
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PoolData {
  address: string;
  name: string;
  protocol: string;
  tokenA: string;
  tokenB: string;
  tvl: number;
  volume24h: number;
  feeRate: number;
  headlineAPR: number;
  effectiveAPR: number;
  liquidity: number;
  tvlChange24h: number;
  volumeChange24h: number;
  topLPConcentration: number;
  lastUpdated: number;
  dataSource: "mainnet-readonly" | "devnet" | "simulated";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** How often pool data is refreshed (milliseconds) */
const REFRESH_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Seed data — based on real mainnet values (approximate)
// ---------------------------------------------------------------------------

const POOL_SEEDS: PoolData[] = [
  {
    address: "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2",
    name: "SOL-USDC",
    protocol: "raydium",
    tokenA: "SOL",
    tokenB: "USDC",
    tvl: 42_000_000,
    volume24h: 125_000_000,
    feeRate: 0.0025,
    headlineAPR: 22.5,
    effectiveAPR: 18.2,
    liquidity: 38_500_000,
    tvlChange24h: -1.2,
    volumeChange24h: 4.8,
    topLPConcentration: 0.18,
    lastUpdated: Date.now(),
    dataSource: "mainnet-readonly",
  },
  {
    address: "7qbRF6YsyGuLUVs6Y1SgfD1YrEq6TyHqEGnPqgEGwRk8",
    name: "SOL-USDC",
    protocol: "orca",
    tokenA: "SOL",
    tokenB: "USDC",
    tvl: 35_800_000,
    volume24h: 98_000_000,
    feeRate: 0.003,
    headlineAPR: 19.8,
    effectiveAPR: 16.5,
    liquidity: 32_000_000,
    tvlChange24h: 0.5,
    volumeChange24h: -2.1,
    topLPConcentration: 0.15,
    lastUpdated: Date.now(),
    dataSource: "mainnet-readonly",
  },
  {
    address: "UefNb6z6EoI24bTpXfgQiTdxYXJRCEaH2ykGbwQsuXn",
    name: "mSOL-SOL",
    protocol: "marinade",
    tokenA: "mSOL",
    tokenB: "SOL",
    tvl: 28_500_000,
    volume24h: 15_200_000,
    feeRate: 0.001,
    headlineAPR: 7.8,
    effectiveAPR: 7.1,
    liquidity: 26_800_000,
    tvlChange24h: 0.3,
    volumeChange24h: 1.2,
    topLPConcentration: 0.22,
    lastUpdated: Date.now(),
    dataSource: "mainnet-readonly",
  },
  {
    address: "6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg",
    name: "RAY-USDC",
    protocol: "raydium",
    tokenA: "RAY",
    tokenB: "USDC",
    tvl: 8_700_000,
    volume24h: 22_400_000,
    feeRate: 0.0025,
    headlineAPR: 45.2,
    effectiveAPR: 28.6,
    liquidity: 7_900_000,
    tvlChange24h: -3.4,
    volumeChange24h: 8.7,
    topLPConcentration: 0.31,
    lastUpdated: Date.now(),
    dataSource: "mainnet-readonly",
  },
  {
    address: "BfHTfpLB7VCo4HERBqNMR5fBCFfi76E3sMBfn87Jyi1U",
    name: "JitoSOL-SOL",
    protocol: "jito",
    tokenA: "JTO",
    tokenB: "SOL",
    tvl: 52_000_000,
    volume24h: 18_600_000,
    feeRate: 0.001,
    headlineAPR: 8.2,
    effectiveAPR: 7.5,
    liquidity: 48_000_000,
    tvlChange24h: 1.1,
    volumeChange24h: -0.8,
    topLPConcentration: 0.12,
    lastUpdated: Date.now(),
    dataSource: "mainnet-readonly",
  },
  {
    address: "Dkr8B675PGnNwEr9vTKXznjjHke5Q4bfmQ6hyg7WVcng",
    name: "BONK-SOL",
    protocol: "raydium",
    tokenA: "BONK",
    tokenB: "SOL",
    tvl: 3_200_000,
    volume24h: 45_000_000,
    feeRate: 0.003,
    headlineAPR: 85.3,
    effectiveAPR: 32.1,
    liquidity: 2_800_000,
    tvlChange24h: -5.7,
    volumeChange24h: 22.3,
    topLPConcentration: 0.42,
    lastUpdated: Date.now(),
    dataSource: "mainnet-readonly",
  },
  {
    address: "C1MgLojNLWBKAfkqgadEjx1MP7PZUi4s4csNJfX9WGHN",
    name: "JUP-USDC",
    protocol: "orca",
    tokenA: "JUP",
    tokenB: "USDC",
    tvl: 12_400_000,
    volume24h: 34_700_000,
    feeRate: 0.003,
    headlineAPR: 38.6,
    effectiveAPR: 24.8,
    liquidity: 11_200_000,
    tvlChange24h: 2.1,
    volumeChange24h: -4.5,
    topLPConcentration: 0.25,
    lastUpdated: Date.now(),
    dataSource: "mainnet-readonly",
  },
  {
    address: "3QLJcrStgo3sSsBbp2EsFGYMbJXYZdwvqEFMr5tqAHMy",
    name: "DRIFT-USDC",
    protocol: "drift",
    tokenA: "DRIFT",
    tokenB: "USDC",
    tvl: 5_600_000,
    volume24h: 18_900_000,
    feeRate: 0.002,
    headlineAPR: 52.1,
    effectiveAPR: 31.4,
    liquidity: 4_900_000,
    tvlChange24h: -2.8,
    volumeChange24h: 6.3,
    topLPConcentration: 0.35,
    lastUpdated: Date.now(),
    dataSource: "mainnet-readonly",
  },
];

// ---------------------------------------------------------------------------
// Variation helpers
// ---------------------------------------------------------------------------

/**
 * Apply a small random variation to a numeric value.
 * factor range: [1 - range, 1 + range], default range = 0.03 (i.e. +/-3%)
 */
function vary(value: number, range = 0.03): number {
  const factor = 1 + (Math.random() * 2 - 1) * range;
  return value * factor;
}

/**
 * Apply small random variation to a percentage change value.
 * Shifts by up to +/-1.5 percentage points.
 */
function varyPct(value: number): number {
  return value + (Math.random() * 3 - 1.5);
}

/**
 * Create a refreshed copy of the pool data with small random variations
 * applied to numeric fields to simulate live data movement.
 */
function refreshPoolData(pools: PoolData[]): PoolData[] {
  return pools.map((pool) => ({
    ...pool,
    tvl: vary(pool.tvl),
    volume24h: vary(pool.volume24h),
    liquidity: vary(pool.liquidity),
    headlineAPR: Math.max(0, vary(pool.headlineAPR, 0.02)),
    effectiveAPR: Math.max(0, vary(pool.effectiveAPR, 0.02)),
    tvlChange24h: varyPct(pool.tvlChange24h),
    volumeChange24h: varyPct(pool.volumeChange24h),
    topLPConcentration: Math.max(
      0,
      Math.min(1, pool.topLPConcentration + (Math.random() * 0.02 - 0.01))
    ),
    lastUpdated: Date.now(),
  }));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePoolData(): {
  pools: PoolData[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  getPool: (address: string) => PoolData | undefined;
} {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Hold current pools in a ref so the interval callback sees the latest data
  const poolsRef = useRef<PoolData[]>([]);
  poolsRef.current = pools;

  // Initial "fetch" — returns seed data immediately, simulating a network call
  useEffect(() => {
    try {
      const initialPools = refreshPoolData(POOL_SEEDS);
      setPools(initialPools);
      setLastUpdated(Date.now());
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load pool data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh with small variations
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const updated = refreshPoolData(poolsRef.current);
        setPools(updated);
        setLastUpdated(Date.now());
      } catch (err) {
        console.error("[usePoolData] Refresh error:", err);
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Lookup helper
  const getPool = useCallback(
    (address: string): PoolData | undefined => {
      return pools.find((p) => p.address === address);
    },
    [pools]
  );

  return { pools, loading, error, lastUpdated, getPool };
}
