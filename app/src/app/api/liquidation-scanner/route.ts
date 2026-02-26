// ---------------------------------------------------------------------------
// AXIONBLADE Liquidation Scanner API — Loan Health & Liquidation Risk
// ---------------------------------------------------------------------------
// Scans DeFi loan positions across MarginFi, Kamino, Solend, and Drift.
// Returns health factor, volatility analysis (7/14/30d), stress tests,
// and a SHA-256 proof hash of the result payload.
//
// Price: 0.006 SOL per scan (cost 0.002 × 3.0 margin)
// Proof: noumen_proof::log_decision (simulation in mock mode)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getCorsHeaders, isValidSolanaAddress } from "../_shared/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Protocol = "marginfi" | "kamino" | "solend" | "drift";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface LoanPosition {
  asset: string;
  collateralUSD: number;
  debtUSD: number;
  ltv: number; // current loan-to-value as decimal (e.g. 0.62 = 62%)
  liquidationThreshold: number; // e.g. 0.85 for 85%
  healthFactor: number; // > 1 = safe, < 1 = liquidatable
  priceDropToLiquidation: number; // % price drop that triggers liquidation
}

export interface StressTest {
  scenario: string;
  priceDropPct: number;
  resultingLTV: number;
  liquidated: boolean;
  estimatedLoss: number; // USD
  survivingPositions: number;
}

export interface LiquidationAlert {
  severity: "warning" | "critical";
  message: string;
  asset: string;
  healthFactor: number;
}

export interface VolatilityWindow {
  avgVolatility: number;
  maxDrawdown: number;
  liquidationRisk: RiskLevel;
}

export interface LiquidationScanResult {
  walletAddress: string;
  protocol: Protocol;
  positions: LoanPosition[];
  portfolioHealth: number; // 0–100
  totalCollateralUSD: number;
  totalDebtUSD: number;
  globalLTV: number; // current loan-to-value %
  liquidationLTV: number; // threshold where liquidation triggers
  safetyBuffer: number; // % distance from liquidation (positive = safe)
  volatilityAnalysis: {
    "7d": VolatilityWindow;
    "14d": VolatilityWindow;
    "30d": VolatilityWindow;
  };
  stressTests: StressTest[];
  alerts: LiquidationAlert[];
  scanTimestamp: number;
  proofHash: string;
}

// ---------------------------------------------------------------------------
// Deterministic seeding helpers
// ---------------------------------------------------------------------------

/** Cheap 32-bit hash from a string seed. */
function seedHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0; // unsigned
}

/** Returns a float in [min, max] deterministically from seed + tag. */
function seedFloat(seed: string, tag: string, min: number, max: number): number {
  const h = seedHash(seed + "|" + tag);
  return min + (h / 0xffffffff) * (max - min);
}

/** Returns an integer in [min, max] deterministically. */
function seedInt(seed: string, tag: string, min: number, max: number): number {
  return Math.round(seedFloat(seed, tag, min, max));
}

// ---------------------------------------------------------------------------
// Protocol-specific parameters
// ---------------------------------------------------------------------------

interface ProtocolParams {
  name: string;
  liqThresholds: Record<string, number>; // asset → liquidation threshold
  baseCollateralMulti: number; // realistic collateral range factor
}

const PROTOCOL_PARAMS: Record<Protocol, ProtocolParams> = {
  marginfi: {
    name: "MarginFi",
    liqThresholds: { SOL: 0.80, ETH: 0.82, BTC: 0.85, USDC: 0.90 },
    baseCollateralMulti: 1.0,
  },
  kamino: {
    name: "Kamino",
    liqThresholds: { SOL: 0.82, ETH: 0.83, BTC: 0.86, USDC: 0.92 },
    baseCollateralMulti: 1.1,
  },
  solend: {
    name: "Solend",
    liqThresholds: { SOL: 0.78, ETH: 0.80, BTC: 0.83, USDC: 0.90 },
    baseCollateralMulti: 0.95,
  },
  drift: {
    name: "Drift",
    liqThresholds: { SOL: 0.83, ETH: 0.85, BTC: 0.87, USDC: 0.93 },
    baseCollateralMulti: 1.05,
  },
};

// Realistic price reference (USD) — deterministic mock prices
const ASSET_PRICES: Record<string, number> = {
  SOL: 148.5,
  ETH: 3220.0,
  BTC: 67400.0,
  USDC: 1.0,
};

// ---------------------------------------------------------------------------
// Core mock data generator
// ---------------------------------------------------------------------------

function generateScanResult(
  walletAddress: string,
  protocol: Protocol
): LiquidationScanResult {
  const params = PROTOCOL_PARAMS[protocol];
  const seed = walletAddress + "|" + protocol;

  // Determine how many positions: 2 or 3
  const positionCount = seedInt(seed, "pos_count", 2, 3);

  const ASSET_POOL = ["SOL", "ETH", "BTC", "USDC"];

  // Pick unique assets for positions
  const assetIndices = new Set<number>();
  while (assetIndices.size < positionCount) {
    assetIndices.add(seedInt(seed + assetIndices.size, "asset_pick", 0, ASSET_POOL.length - 1));
  }
  const chosenAssets = Array.from(assetIndices).map((i) => ASSET_POOL[i]);

  // Build positions
  const positions: LoanPosition[] = chosenAssets.map((asset, idx) => {
    const liqThreshold = params.liqThresholds[asset] ?? 0.82;

    // Collateral USD in realistic range
    const collateralUSD = Math.round(
      seedFloat(seed, `coll_${idx}`, 3500, 32000) * params.baseCollateralMulti
    );

    // LTV between 45% and 78% of liq threshold (so most are not critical)
    const ltvFraction = seedFloat(seed, `ltv_${idx}`, 0.50, 0.88);
    const currentLTV = liqThreshold * ltvFraction;
    const debtUSD = Math.round(collateralUSD * currentLTV);

    // Health factor: collateral * liqThreshold / debt
    const healthFactor = parseFloat(
      ((collateralUSD * liqThreshold) / debtUSD).toFixed(3)
    );

    // % price drop to trigger liquidation:
    //   At liquidation: collateral * (1 - drop) * liqThreshold = debt
    //   => drop = 1 - debt / (collateral * liqThreshold)
    const priceDropToLiquidation = parseFloat(
      ((1 - debtUSD / (collateralUSD * liqThreshold)) * 100).toFixed(1)
    );

    return {
      asset,
      collateralUSD,
      debtUSD,
      ltv: parseFloat((currentLTV * 100).toFixed(2)), // store as %
      liquidationThreshold: liqThreshold,
      healthFactor,
      priceDropToLiquidation,
    };
  });

  // Portfolio aggregates
  const totalCollateralUSD = positions.reduce((s, p) => s + p.collateralUSD, 0);
  const totalDebtUSD = positions.reduce((s, p) => s + p.debtUSD, 0);
  const globalLTV = parseFloat(((totalDebtUSD / totalCollateralUSD) * 100).toFixed(2));

  // Weighted average liquidation threshold
  const liquidationLTV = parseFloat(
    (
      (positions.reduce((s, p) => s + p.collateralUSD * p.liquidationThreshold, 0) /
        totalCollateralUSD) *
      100
    ).toFixed(2)
  );

  // Safety buffer: how far current LTV is from liquidation LTV (%)
  const safetyBuffer = parseFloat((liquidationLTV - globalLTV).toFixed(2));

  // Portfolio health 0–100 based on safety buffer
  // safetyBuffer of 0 → health 0; safetyBuffer of 30+ → health 100
  const portfolioHealth = Math.max(0, Math.min(100, Math.round((safetyBuffer / 30) * 100)));

  // ---------------------------------------------------------------------------
  // Volatility analysis
  // ---------------------------------------------------------------------------
  function makeVolatilityWindow(tag: string, baseVol: number, baseDrawdown: number): VolatilityWindow {
    const avgVolatility = parseFloat(seedFloat(seed, `vol_${tag}`, baseVol * 0.85, baseVol * 1.20).toFixed(1));
    const maxDrawdown = parseFloat(seedFloat(seed, `dd_${tag}`, baseDrawdown * 0.80, baseDrawdown * 1.25).toFixed(1));

    let liquidationRisk: RiskLevel;
    if (maxDrawdown >= safetyBuffer * 0.9) {
      liquidationRisk = "critical";
    } else if (maxDrawdown >= safetyBuffer * 0.65) {
      liquidationRisk = "high";
    } else if (maxDrawdown >= safetyBuffer * 0.40) {
      liquidationRisk = "medium";
    } else {
      liquidationRisk = "low";
    }

    return { avgVolatility, maxDrawdown, liquidationRisk };
  }

  const volatilityAnalysis = {
    "7d": makeVolatilityWindow("7d", 18, 14),
    "14d": makeVolatilityWindow("14d", 25, 20),
    "30d": makeVolatilityWindow("30d", 34, 28),
  };

  // ---------------------------------------------------------------------------
  // Stress tests
  // ---------------------------------------------------------------------------
  const stressScenarios = [
    { scenario: "Moderate Correction -10%", priceDropPct: 10 },
    { scenario: "Flash Crash -20%",         priceDropPct: 20 },
    { scenario: "Bear Market -40%",         priceDropPct: 40 },
    { scenario: "Black Swan -60%",          priceDropPct: 60 },
  ];

  const stressTests: StressTest[] = stressScenarios.map(({ scenario, priceDropPct }) => {
    // After price drop, collateral value decreases proportionally for volatile assets
    // USDC is stable so its collateral doesn't decrease
    const newCollateral = positions.reduce((s, p) => {
      const drop = p.asset === "USDC" ? 0 : priceDropPct / 100;
      return s + p.collateralUSD * (1 - drop);
    }, 0);

    const resultingLTV = parseFloat(((totalDebtUSD / newCollateral) * 100).toFixed(2));
    const liquidated = resultingLTV >= liquidationLTV;

    // Surviving positions: those whose individual LTV after shock < their threshold
    const survivingPositions = positions.filter((p) => {
      const drop = p.asset === "USDC" ? 0 : priceDropPct / 100;
      const newColl = p.collateralUSD * (1 - drop);
      const newLTV = p.debtUSD / newColl;
      return newLTV < p.liquidationThreshold;
    }).length;

    // Estimated loss = liquidated debt discounted by penalty + bad debt
    const estimatedLoss = liquidated
      ? Math.round((totalDebtUSD - newCollateral * (liquidationLTV / 100)) * 1.08) // 8% penalty
      : 0;

    return {
      scenario,
      priceDropPct,
      resultingLTV,
      liquidated,
      estimatedLoss: Math.max(0, estimatedLoss),
      survivingPositions,
    };
  });

  // ---------------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------------
  const alerts: LiquidationAlert[] = [];

  for (const pos of positions) {
    if (pos.healthFactor < 1.1) {
      alerts.push({
        severity: "critical",
        message: `${pos.asset} position is near liquidation — health factor ${pos.healthFactor.toFixed(3)}. Immediate action required.`,
        asset: pos.asset,
        healthFactor: pos.healthFactor,
      });
    } else if (pos.healthFactor < 1.3) {
      alerts.push({
        severity: "warning",
        message: `${pos.asset} position approaching danger zone — health factor ${pos.healthFactor.toFixed(3)}. Consider adding collateral.`,
        asset: pos.asset,
        healthFactor: pos.healthFactor,
      });
    }
  }

  // Alert if any stress test at -20% triggers liquidation
  const flashCrashTest = stressTests.find((s) => s.priceDropPct === 20);
  if (flashCrashTest?.liquidated && !alerts.some((a) => a.severity === "critical")) {
    alerts.push({
      severity: "warning",
      message: "Portfolio would be liquidated in a -20% flash crash scenario. Increase safety buffer.",
      asset: "PORTFOLIO",
      healthFactor: parseFloat(((totalCollateralUSD * (liquidationLTV / 100)) / totalDebtUSD).toFixed(3)),
    });
  }

  // ---------------------------------------------------------------------------
  // Proof hash — SHA-256 of deterministic payload
  // ---------------------------------------------------------------------------
  const proofPayload = JSON.stringify({
    walletAddress,
    protocol,
    totalCollateralUSD,
    totalDebtUSD,
    globalLTV,
    liquidationLTV,
    safetyBuffer,
    scanTimestamp: Math.floor(Date.now() / 60000) * 60000, // minute-level determinism
  });
  const proofHash = createHash("sha256").update(proofPayload).digest("hex");

  return {
    walletAddress,
    protocol,
    positions,
    portfolioHealth,
    totalCollateralUSD,
    totalDebtUSD,
    globalLTV,
    liquidationLTV,
    safetyBuffer,
    volatilityAnalysis,
    stressTests,
    alerts,
    scanTimestamp: Date.now(),
    proofHash,
  };
}

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

// ---------------------------------------------------------------------------
// POST /api/liquidation-scanner
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  let body: { walletAddress?: string; protocol?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: corsHeaders }
    );
  }

  const { walletAddress, protocol } = body;

  // Validate wallet address
  if (!walletAddress || typeof walletAddress !== "string") {
    return NextResponse.json(
      { error: "Missing walletAddress parameter" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!isValidSolanaAddress(walletAddress)) {
    return NextResponse.json(
      { error: "Invalid Solana address format. Expected base-58, 32-44 characters." },
      { status: 400, headers: corsHeaders }
    );
  }

  // Validate protocol
  const validProtocols: Protocol[] = ["marginfi", "kamino", "solend", "drift"];
  if (!protocol || !validProtocols.includes(protocol as Protocol)) {
    return NextResponse.json(
      { error: `Invalid protocol. Must be one of: ${validProtocols.join(", ")}` },
      { status: 400, headers: corsHeaders }
    );
  }

  // Generate mock scan result (realistic, deterministic per wallet+protocol)
  const result = generateScanResult(walletAddress, protocol as Protocol);

  return NextResponse.json(result, {
    headers: {
      ...corsHeaders,
      "Cache-Control": "no-store",
    },
  });
}
