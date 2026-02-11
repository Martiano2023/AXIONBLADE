"use client";

// ---------------------------------------------------------------------------
// NOUMEN useRiskScores Hook — Composite risk scoring
// ---------------------------------------------------------------------------
// Combines pool data (usePoolData) and token prices (usePrices) to compute
// per-pool risk scores using the 5-family APOLLO-compatible risk engine.
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import { calculateRiskScore, type PoolMetrics, type RiskBreakdown } from "@/lib/risk-engine";
import { usePoolData } from "./usePoolData";
import { usePrices } from "./usePrices";

// ---------------------------------------------------------------------------
// Static protocol metadata — enriches pool data for risk scoring
// ---------------------------------------------------------------------------

interface ProtocolMeta {
  programAgeDays: number;
  upgradeAuthorityLocked: boolean;
  verifiedInstructions: number;
  hasExploitHistory: boolean;
  teamDoxxed: boolean;
  audited: boolean;
  auditCount: number;
  governanceModel: "multisig" | "dao" | "single" | "none";
}

const PROTOCOL_META: Record<string, ProtocolMeta> = {
  raydium: {
    programAgeDays: 1100,
    upgradeAuthorityLocked: true,
    verifiedInstructions: 28,
    hasExploitHistory: false,
    teamDoxxed: true,
    audited: true,
    auditCount: 3,
    governanceModel: "dao",
  },
  orca: {
    programAgeDays: 1050,
    upgradeAuthorityLocked: true,
    verifiedInstructions: 22,
    hasExploitHistory: false,
    teamDoxxed: true,
    audited: true,
    auditCount: 3,
    governanceModel: "multisig",
  },
  marinade: {
    programAgeDays: 950,
    upgradeAuthorityLocked: true,
    verifiedInstructions: 18,
    hasExploitHistory: false,
    teamDoxxed: true,
    audited: true,
    auditCount: 2,
    governanceModel: "dao",
  },
  jito: {
    programAgeDays: 600,
    upgradeAuthorityLocked: true,
    verifiedInstructions: 15,
    hasExploitHistory: false,
    teamDoxxed: true,
    audited: true,
    auditCount: 2,
    governanceModel: "dao",
  },
  drift: {
    programAgeDays: 800,
    upgradeAuthorityLocked: false,
    verifiedInstructions: 32,
    hasExploitHistory: true,
    teamDoxxed: true,
    audited: true,
    auditCount: 2,
    governanceModel: "dao",
  },
};

/** Default metadata for protocols not in our database */
const DEFAULT_META: ProtocolMeta = {
  programAgeDays: 180,
  upgradeAuthorityLocked: false,
  verifiedInstructions: 8,
  hasExploitHistory: false,
  teamDoxxed: false,
  audited: false,
  auditCount: 0,
  governanceModel: "none",
};

// ---------------------------------------------------------------------------
// TVL rank computation — sorted by protocol
// ---------------------------------------------------------------------------

function computeTvlRanks(
  pools: { address: string; protocol: string; tvl: number }[]
): Record<string, number> {
  // Group pools by protocol, sort by TVL descending, assign rank
  const grouped: Record<string, { address: string; tvl: number }[]> = {};
  for (const pool of pools) {
    if (!grouped[pool.protocol]) grouped[pool.protocol] = [];
    grouped[pool.protocol].push({ address: pool.address, tvl: pool.tvl });
  }

  const ranks: Record<string, number> = {};
  for (const protocol of Object.keys(grouped)) {
    grouped[protocol]
      .sort((a, b) => b.tvl - a.tvl)
      .forEach((p, i) => {
        ranks[p.address] = i + 1;
      });
  }

  return ranks;
}

// ---------------------------------------------------------------------------
// Simulated volatility estimates — derived from token price data
// ---------------------------------------------------------------------------

function estimateVolatility(tokenA: string, tokenB: string): {
  priceVolatility7d: number;
  impermanentLossEstimate: number;
  maxDrawdown30d: number;
  rewardTokenPriceTrend30d: number;
  emissionSustainability: number;
} {
  // Stablecoin pairs have minimal volatility
  const stables = ["USDC", "USDT", "USDH", "DAI"];
  const isStablePair =
    stables.includes(tokenA) && stables.includes(tokenB);
  const hasStable = stables.includes(tokenA) || stables.includes(tokenB);

  // LST-SOL pairs (mSOL-SOL, JitoSOL-SOL) have very low relative volatility
  const lstTokens = ["mSOL", "JTO", "jitoSOL"];
  const isLstSolPair =
    (lstTokens.includes(tokenA) && tokenB === "SOL") ||
    (tokenA === "SOL" && lstTokens.includes(tokenB));

  if (isStablePair) {
    return {
      priceVolatility7d: 0.1,
      impermanentLossEstimate: 0.01,
      maxDrawdown30d: 0.5,
      rewardTokenPriceTrend30d: -2,
      emissionSustainability: 0.9,
    };
  }

  if (isLstSolPair) {
    return {
      priceVolatility7d: 1.5,
      impermanentLossEstimate: 0.3,
      maxDrawdown30d: 3.0,
      rewardTokenPriceTrend30d: -1,
      emissionSustainability: 0.85,
    };
  }

  if (hasStable) {
    // Token / stablecoin pair — moderate volatility
    const isMeme = ["BONK", "WIF", "POPCAT"].includes(tokenA) || ["BONK", "WIF", "POPCAT"].includes(tokenB);
    return {
      priceVolatility7d: isMeme ? 18.5 : 8.2,
      impermanentLossEstimate: isMeme ? 12.3 : 4.5,
      maxDrawdown30d: isMeme ? 28.0 : 12.0,
      rewardTokenPriceTrend30d: isMeme ? -22 : -8,
      emissionSustainability: isMeme ? 0.35 : 0.65,
    };
  }

  // Two volatile tokens
  return {
    priceVolatility7d: 14.0,
    impermanentLossEstimate: 8.0,
    maxDrawdown30d: 20.0,
    rewardTokenPriceTrend30d: -15,
    emissionSustainability: 0.5,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRiskScores(): {
  scores: Record<string, RiskBreakdown>;
  loading: boolean;
  lastUpdated: number | null;
} {
  const { pools, loading: poolsLoading, lastUpdated: poolsUpdated } = usePoolData();
  const { loading: pricesLoading, lastUpdated: pricesUpdated } = usePrices();

  const loading = poolsLoading || pricesLoading;

  const scores = useMemo(() => {
    if (pools.length === 0) return {};

    const tvlRanks = computeTvlRanks(pools);
    const result: Record<string, RiskBreakdown> = {};

    for (const pool of pools) {
      const meta = PROTOCOL_META[pool.protocol] ?? DEFAULT_META;
      const volatility = estimateVolatility(pool.tokenA, pool.tokenB);

      const metrics: PoolMetrics = {
        // Liquidity family
        tvl: pool.tvl,
        tvlChange24h: pool.tvlChange24h,
        liquidityDepth: pool.liquidity / Math.max(pool.tvl, 1),
        topLPConcentration: pool.topLPConcentration,

        // Volatility family
        priceVolatility7d: volatility.priceVolatility7d,
        impermanentLossEstimate: volatility.impermanentLossEstimate,
        maxDrawdown30d: volatility.maxDrawdown30d,

        // Incentive family
        headlineAPR: pool.headlineAPR,
        effectiveAPR: pool.effectiveAPR,
        rewardTokenPriceTrend30d: volatility.rewardTokenPriceTrend30d,
        emissionSustainability: volatility.emissionSustainability,

        // Smart contract family
        programAgeDays: meta.programAgeDays,
        upgradeAuthorityLocked: meta.upgradeAuthorityLocked,
        verifiedInstructions: meta.verifiedInstructions,
        hasExploitHistory: meta.hasExploitHistory,

        // Protocol family
        teamDoxxed: meta.teamDoxxed,
        audited: meta.audited,
        auditCount: meta.auditCount,
        tvlRankInCategory: tvlRanks[pool.address] ?? 10,
        governanceModel: meta.governanceModel,
      };

      result[pool.address] = calculateRiskScore(metrics);
    }

    return result;
  }, [pools]);

  // Use the most recent update time from either data source
  const lastUpdated = useMemo(() => {
    if (poolsUpdated && pricesUpdated) {
      return Math.max(poolsUpdated, pricesUpdated);
    }
    return poolsUpdated ?? pricesUpdated ?? null;
  }, [poolsUpdated, pricesUpdated]);

  return { scores, loading, lastUpdated };
}
