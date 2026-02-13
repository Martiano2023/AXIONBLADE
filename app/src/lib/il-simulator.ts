// ---------------------------------------------------------------------------
// AXIONBLADE IL Simulator — Deterministic Impermanent Loss Projections
// ---------------------------------------------------------------------------
// Monte Carlo simulation with fixed seed for reproducibility (auditability).
// Simulates 30/60/90 day IL scenarios based on historical volatility and correlation.
//
// IL Formula: IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
// where price_ratio = (P_B / P_A) at time T vs time 0
//
// For auditability: All simulations use deterministic seeding based on input hash.
// Same inputs always produce same outputs (critical for proof verification).
// ---------------------------------------------------------------------------

export interface ILSimulationParams {
  tokenASymbol: string;
  tokenBSymbol: string;
  tokenAPrice: number; // Current price in USD
  tokenBPrice: number;
  tokenAVolatility: number; // 30d historical volatility (decimal, e.g., 0.45 = 45%)
  tokenBVolatility: number;
  correlation: number; // Price correlation -1 to 1
  holdingPeriodDays: number; // 30, 60, or 90
}

export interface ILProjection {
  days: number;
  scenarios: {
    conservative: number; // 5th percentile (best case)
    expected: number; // 50th percentile (median)
    worst: number; // 95th percentile (worst case)
  };
  breakEvenAPR: number; // Fee APR needed to compensate expected IL
  confidenceLevel: number; // Always 95%
  simulationCount: number; // Always 10,000
}

export interface ILSimulationResult {
  params: ILSimulationParams;
  projections: {
    days30: ILProjection;
    days60: ILProjection;
    days90: ILProjection;
  };
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

/**
 * Simulate IL for 30/60/90 day horizons
 * Uses deterministic seeding for auditability
 */
export function simulateIL(params: ILSimulationParams): ILSimulationResult {
  // Validate inputs
  if (params.tokenAPrice <= 0 || params.tokenBPrice <= 0) {
    throw new Error('Token prices must be positive');
  }
  if (params.tokenAVolatility < 0 || params.tokenBVolatility < 0) {
    throw new Error('Volatility must be non-negative');
  }
  if (params.correlation < -1 || params.correlation > 1) {
    throw new Error('Correlation must be between -1 and 1');
  }

  // Run simulations for 30/60/90 days
  const projections = {
    days30: runMonteCarlo({ ...params, holdingPeriodDays: 30 }),
    days60: runMonteCarlo({ ...params, holdingPeriodDays: 60 }),
    days90: runMonteCarlo({ ...params, holdingPeriodDays: 90 }),
  };

  // Determine risk level based on expected IL
  const expectedIL90d = Math.abs(projections.days90.scenarios.expected);
  let riskLevel: ILSimulationResult['riskLevel'];
  if (expectedIL90d < 0.05) riskLevel = 'low';
  else if (expectedIL90d < 0.15) riskLevel = 'medium';
  else if (expectedIL90d < 0.30) riskLevel = 'high';
  else riskLevel = 'extreme';

  // Generate recommendation
  const recommendation = generateRecommendation(projections, params);

  return {
    params,
    projections,
    recommendation,
    riskLevel,
  };
}

/**
 * Run Monte Carlo simulation for a specific holding period
 */
function runMonteCarlo(params: ILSimulationParams): ILProjection {
  const SIMULATION_COUNT = 10000;
  const results: number[] = [];

  // Deterministic seed based on input parameters (for auditability)
  const seed = hashParams(params);
  const rng = createSeededRNG(seed);

  for (let i = 0; i < SIMULATION_COUNT; i++) {
    // Simulate correlated price movements using Cholesky decomposition
    const [returnA, returnB] = simulateCorrelatedReturns(
      params.tokenAVolatility,
      params.tokenBVolatility,
      params.correlation,
      params.holdingPeriodDays,
      rng
    );

    // Calculate final prices
    const finalPriceA = params.tokenAPrice * Math.exp(returnA);
    const finalPriceB = params.tokenBPrice * Math.exp(returnB);

    // Calculate price ratio change
    const initialRatio = params.tokenBPrice / params.tokenAPrice;
    const finalRatio = finalPriceB / finalPriceA;
    const priceRatioChange = finalRatio / initialRatio;

    // Calculate IL
    const il = calculateILFromPriceRatio(priceRatioChange);
    results.push(il);
  }

  // Sort results for percentile calculations
  results.sort((a, b) => a - b);

  // Extract percentiles
  const conservative = results[Math.floor(SIMULATION_COUNT * 0.05)]; // 5th percentile (least negative)
  const expected = results[Math.floor(SIMULATION_COUNT * 0.50)]; // 50th percentile (median)
  const worst = results[Math.floor(SIMULATION_COUNT * 0.95)]; // 95th percentile (most negative)

  // Calculate break-even APR (fee APR needed to offset expected IL)
  const breakEvenAPR = calculateBreakEvenAPR(expected, params.holdingPeriodDays);

  return {
    days: params.holdingPeriodDays,
    scenarios: {
      conservative,
      expected,
      worst,
    },
    breakEvenAPR,
    confidenceLevel: 95,
    simulationCount: SIMULATION_COUNT,
  };
}

/**
 * Simulate correlated returns using Cholesky decomposition
 */
function simulateCorrelatedReturns(
  volA: number,
  volB: number,
  correlation: number,
  days: number,
  rng: () => number
): [number, number] {
  // Generate two independent standard normal variables
  const z1 = boxMullerTransform(rng);
  const z2 = boxMullerTransform(rng);

  // Apply Cholesky decomposition for correlation
  const returnA = volA * Math.sqrt(days / 365) * z1;
  const returnB = volB * Math.sqrt(days / 365) * (correlation * z1 + Math.sqrt(1 - correlation * correlation) * z2);

  return [returnA, returnB];
}

/**
 * Calculate IL from price ratio change
 * IL = 2 * sqrt(k) / (1 + k) - 1
 * where k = price_ratio_final / price_ratio_initial
 */
function calculateILFromPriceRatio(priceRatioChange: number): number {
  const k = priceRatioChange;
  return 2 * Math.sqrt(k) / (1 + k) - 1;
}

/**
 * Calculate break-even APR needed to offset IL
 */
function calculateBreakEvenAPR(expectedIL: number, days: number): number {
  // Annualize the IL and convert to positive APR requirement
  const annualizedIL = Math.abs(expectedIL) * (365 / days);
  return annualizedIL * 100; // Convert to percentage
}

/**
 * Generate recommendation based on simulation results
 */
function generateRecommendation(
  projections: ILSimulationResult['projections'],
  params: ILSimulationParams
): string {
  const il90d = Math.abs(projections.days90.scenarios.expected);
  const breakEven = projections.days90.breakEvenAPR;

  if (il90d < 0.05) {
    return `Low IL risk (${(il90d * 100).toFixed(1)}% expected over 90 days). ${params.tokenASymbol}-${params.tokenBSymbol} pair shows stable correlation. Fee APR of ${breakEven.toFixed(1)}% or higher makes this profitable.`;
  } else if (il90d < 0.15) {
    return `Moderate IL risk (${(il90d * 100).toFixed(1)}% expected over 90 days). Requires fee APR of ${breakEven.toFixed(1)}% to break even. Monitor price divergence closely.`;
  } else if (il90d < 0.30) {
    return `High IL risk (${(il90d * 100).toFixed(1)}% expected over 90 days). Only profitable if fee APR exceeds ${breakEven.toFixed(1)}%. Consider shorter holding periods or more correlated pairs.`;
  } else {
    return `Extreme IL risk (${(il90d * 100).toFixed(1)}% expected over 90 days). Break-even requires ${breakEven.toFixed(1)}% APR. Strongly consider alternatives unless you have high conviction on price convergence.`;
  }
}

// ---------------------------------------------------------------------------
// Deterministic Random Number Generation (for auditability)
// ---------------------------------------------------------------------------

/**
 * Create seeded RNG using Mulberry32 algorithm
 * Always produces same sequence for same seed (critical for proofs)
 */
function createSeededRNG(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash parameters to create deterministic seed
 */
function hashParams(params: ILSimulationParams): number {
  const str = JSON.stringify({
    tokenASymbol: params.tokenASymbol,
    tokenBSymbol: params.tokenBSymbol,
    tokenAPrice: Math.round(params.tokenAPrice * 1000),
    tokenBPrice: Math.round(params.tokenBPrice * 1000),
    tokenAVolatility: Math.round(params.tokenAVolatility * 1000),
    tokenBVolatility: Math.round(params.tokenBVolatility * 1000),
    correlation: Math.round(params.correlation * 1000),
    holdingPeriodDays: params.holdingPeriodDays,
  });

  // Simple hash (in production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Box-Muller transform to generate standard normal from uniform
 */
function boxMullerTransform(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Calculate current IL for an existing position
 */
export function calculateCurrentIL(
  entryPriceA: number,
  entryPriceB: number,
  currentPriceA: number,
  currentPriceB: number
): number {
  const initialRatio = entryPriceB / entryPriceA;
  const currentRatio = currentPriceB / currentPriceA;
  const priceRatioChange = currentRatio / initialRatio;
  return calculateILFromPriceRatio(priceRatioChange);
}

/**
 * Format IL as percentage string
 */
export function formatIL(il: number): string {
  return `${(il * 100).toFixed(2)}%`;
}

/**
 * Get IL severity label
 */
export function getILSeverity(il: number): 'low' | 'medium' | 'high' | 'extreme' {
  const absIL = Math.abs(il);
  if (absIL < 0.05) return 'low';
  if (absIL < 0.15) return 'medium';
  if (absIL < 0.30) return 'high';
  return 'extreme';
}
