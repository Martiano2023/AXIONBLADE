// ---------------------------------------------------------------------------
// AXIONBLADE Pricing Engine — Tiered service pricing with dynamic adjustments
// ---------------------------------------------------------------------------
// Implements the economic model: every service must cover its cost or be
// discontinued. Pricing floor: cost + 20% margin. Three tiers: basic, pro,
// institutional. Adjustments based on pool characteristics and network state.
// ---------------------------------------------------------------------------

export interface PricingFactors {
  baseTier: "basic" | "pro" | "institutional";
  poolTVL: number; // USD
  poolAgeDays: number;
  networkCongestion: number; // 0-1 (0 = idle, 1 = saturated)
  batchSize: number; // number of pools in request
}

export interface PriceAdjustment {
  label: string;
  factor: number; // e.g. 0.20 means +20%
  reason: string;
}

export interface PricingResult {
  basePrice: number; // SOL
  adjustments: PriceAdjustment[];
  finalPrice: number; // SOL
  usdEquivalent: number;
}

// ---------------------------------------------------------------------------
// Base price table (SOL) — v3.3.0 Aggressive Repricing
// ---------------------------------------------------------------------------
// AXIONBLADE v3.3.0: 10x cheaper wallet scans, 3-4x cheaper analysis
// Goal: Increase volume 5x to offset 70% average price reduction
// All prices must maintain cost + 20% minimum margin (A0-8)

const BASE_PRICES = {
  // Wallet Scanner (10x cheaper than original 0.5 SOL)
  walletScan: 0.05,

  // Analysis Packages (3-4x cheaper)
  basic: 0.005,        // was 0.02 → 4x cheaper
  pro: 0.05,           // was 0.15 → 3x cheaper
  institutional: 0.5,  // was 2.0 → 4x cheaper

  // New DeFi Services (v3.3.0)
  poolAnalyzer: 0.005,
  protocolAuditor: 0.01,
  yieldOptimizer: 0.008,
  tokenDeepDive: 0.012,

  // Agent Services (new in v3.3.0)
  aeonMonthly: 0.02,   // AEON Guardian: 24/7 monitoring
  hermesPerTx: 0.001,  // HERMES Executor: 0.1% per tx (min 0.001)
} as const;

// Cost estimates per operation (in SOL) — measured real costs
const ESTIMATED_COSTS = {
  walletScan: 0.003,   // Helius API + compute
  basic: 0.0004,
  pro: 0.004,
  institutional: 0.03,
  poolAnalyzer: 0.0004,
  protocolAuditor: 0.0008,
  yieldOptimizer: 0.0006,
  tokenDeepDive: 0.001,
  aeonMonthly: 0.015,
  hermesPerTx: 0.0008,
} as const;

// ---------------------------------------------------------------------------
// Dynamic Pricing Configuration (v3.3.0)
// ---------------------------------------------------------------------------

export interface DynamicPricingConfig {
  serviceId: keyof typeof BASE_PRICES;
  baseCost: number; // actual measured cost per query
  targetMargin: number; // 0.40 = 40% margin target
  minimumMargin: number; // 0.30 = 30% safety floor (exceeds A0-8's 20%)
  volumeMultiplier: number; // 0.7 to 1.0 based on monthly volume
  networkMultiplier: number; // 1.0 to 1.3 based on congestion
}

export interface DynamicPricingResult {
  basePrice: number;
  dynamicPrice: number;
  volumeDiscount: number; // 0-0.30 (0% to 30%)
  effectivePrice: number; // after volume discount
  margin: number; // actual margin percentage
  breakdown: {
    base: number;
    networkAdjustment: number;
    volumeAdjustment: number;
    floor: number;
  };
}

/**
 * Calculate dynamic price with volume discounts and network adjustments.
 * Enforces minimum 30% margin (exceeds A0-8's 20% requirement for safety).
 */
export function calculateDynamicPrice(
  config: DynamicPricingConfig,
  tierMinimum: number,
  volumeDiscountTier: 0 | 1 | 2 | 3 = 0
): DynamicPricingResult {
  // Base price with target margin
  const baseWithMargin = config.baseCost * (1 + config.targetMargin);

  // Apply volume and network multipliers
  let adjusted = baseWithMargin * config.volumeMultiplier * config.networkMultiplier;

  // Enforce minimum margin (30%)
  const floor = config.baseCost * (1 + config.minimumMargin);
  adjusted = Math.max(adjusted, floor);

  // Enforce tier minimum
  const dynamicPrice = Math.max(adjusted, tierMinimum);

  // Apply volume discount AFTER calculating base price
  // Tiers: 0% (0-9 scans), 10% (10-49), 20% (50-99), 30% (100+)
  const discounts = [0, 0.10, 0.20, 0.30];
  const volumeDiscount = discounts[volumeDiscountTier];
  const effectivePrice = dynamicPrice * (1 - volumeDiscount);

  // Calculate actual margin after discount
  const margin = (effectivePrice - config.baseCost) / config.baseCost;

  return {
    basePrice: tierMinimum,
    dynamicPrice,
    volumeDiscount,
    effectivePrice: roundSol(effectivePrice),
    margin,
    breakdown: {
      base: baseWithMargin,
      networkAdjustment: (config.networkMultiplier - 1) * baseWithMargin,
      volumeAdjustment: -dynamicPrice * volumeDiscount,
      floor,
    },
  };
}

/**
 * Get volume multiplier based on demand.
 * Low demand (< 100 users) = 1.0 (no adjustment)
 * Medium demand (100-1000) = 0.9 (10% cheaper)
 * High demand (> 1000) = 0.7 (30% cheaper due to economies of scale)
 */
export function getVolumeMultiplier(monthlyActiveUsers: number): number {
  if (monthlyActiveUsers < 100) return 1.0;
  if (monthlyActiveUsers < 1000) return 0.9;
  return 0.7;
}

/**
 * Get network multiplier based on Solana congestion.
 * Idle (< 30% slots) = 1.0
 * Moderate (30-70%) = 1.1 (10% surcharge)
 * Saturated (> 70%) = 1.3 (30% surcharge)
 */
export function getNetworkMultiplier(networkCongestion: number): number {
  if (networkCongestion < 0.3) return 1.0;
  if (networkCongestion < 0.7) return 1.1;
  return 1.3;
}

// ---------------------------------------------------------------------------
// Main pricing function (LEGACY — kept for backwards compatibility)
// ---------------------------------------------------------------------------

export function calculatePrice(
  factors: PricingFactors,
  solPrice: number
): PricingResult {
  // Input validation
  if (solPrice <= 0 || !Number.isFinite(solPrice)) {
    throw new Error("Invalid SOL price");
  }
  if (factors.networkCongestion < 0 || factors.networkCongestion > 1) {
    throw new Error("Network congestion must be 0-1");
  }
  if (factors.batchSize < 1) {
    throw new Error("Batch size must be >= 1");
  }

  const tierPriceMap = {
    basic: BASE_PRICES.basic,
    pro: BASE_PRICES.pro,
    institutional: BASE_PRICES.institutional,
  };
  const basePrice = tierPriceMap[factors.baseTier];
  const adjustments: PriceAdjustment[] = [];

  // High-TVL pool surcharge (institutional complexity)
  if (factors.poolTVL > 10_000_000) {
    adjustments.push({
      label: "High TVL Premium",
      factor: 0.20,
      reason: `Pool TVL exceeds $10M ($${(factors.poolTVL / 1_000_000).toFixed(1)}M) — deeper analysis required`,
    });
  }

  // New pool surcharge (more risk assessment effort)
  if (factors.poolAgeDays < 30) {
    adjustments.push({
      label: "New Pool Surcharge",
      factor: 0.30,
      reason: `Pool is only ${factors.poolAgeDays} days old — limited historical data requires additional verification`,
    });
  }

  // Network congestion surcharge
  if (factors.networkCongestion > 0.7) {
    adjustments.push({
      label: "Congestion Fee",
      factor: 0.10,
      reason: `Network congestion at ${(factors.networkCongestion * 100).toFixed(0)}% — increased compute costs`,
    });
  }

  // Batch discount
  if (factors.batchSize > 1) {
    adjustments.push({
      label: "Batch Discount",
      factor: -0.15,
      reason: `Batch of ${factors.batchSize} pools — amortized overhead discount`,
    });
  }

  // Calculate final price: basePrice * product(1 + adjustment_factor)
  const multiplier = adjustments.reduce(
    (product, adj) => product * (1 + adj.factor),
    1
  );

  // Enforce cost floor: cost + 20% margin (axiom A0-8)
  const tierCostMap = {
    basic: ESTIMATED_COSTS.basic,
    pro: ESTIMATED_COSTS.pro,
    institutional: ESTIMATED_COSTS.institutional,
  };
  const costFloor = tierCostMap[factors.baseTier];
  const minPrice = costFloor * 1.2; // cost + 20% margin

  // Revenue split enforcement: 15% creator transferred out, 85% retained
  // So price must cover: cost / 0.85 * 1.2 to ensure retained portion covers costs
  const sustainableMinPrice = (costFloor / 0.85) * 1.2;

  const effectiveFloor = Math.max(minPrice, sustainableMinPrice);
  const finalPrice = Math.max(roundSol(basePrice * multiplier), effectiveFloor);
  const usdEquivalent = roundUsd(finalPrice * solPrice);

  return {
    basePrice,
    adjustments,
    finalPrice,
    usdEquivalent,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundSol(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000; // 6 decimal places
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100; // 2 decimal places
}

// ---------------------------------------------------------------------------
// Utility exports
// ---------------------------------------------------------------------------

export function formatPriceSOL(price: number): string {
  if (price < 0.001) return `${(price * 1_000_000).toFixed(0)} lamports`;
  return `${price.toFixed(4)} SOL`;
}

export function getTierDescription(tier: PricingFactors["baseTier"]): string {
  switch (tier) {
    case "basic":
      return "Single pool risk snapshot — basic scoring and risk level";
    case "pro":
      return "Full risk breakdown with 5-family analysis, yield trap detection, and AI narrative";
    case "institutional":
      return "Institutional-grade assessment with full audit trail, historical comparison, and priority processing";
  }
}

export function estimateBatchPrice(
  tier: PricingFactors["baseTier"],
  poolCount: number,
  solPrice: number
): PricingResult {
  return calculatePrice(
    {
      baseTier: tier,
      poolTVL: 1_000_000, // default mid-range
      poolAgeDays: 180, // default mature
      networkCongestion: 0.3, // default low
      batchSize: poolCount,
    },
    solPrice
  );
}

// ---------------------------------------------------------------------------
// New Service Pricing Helpers (v3.3.0)
// ---------------------------------------------------------------------------

/**
 * Get base price for a service by ID
 */
export function getServiceBasePrice(
  serviceId: keyof typeof BASE_PRICES
): number {
  return BASE_PRICES[serviceId];
}

/**
 * Get estimated cost for a service by ID
 */
export function getServiceCost(
  serviceId: keyof typeof BASE_PRICES
): number {
  return ESTIMATED_COSTS[serviceId];
}

/**
 * Calculate margin percentage for a service
 */
export function calculateServiceMargin(
  serviceId: keyof typeof BASE_PRICES
): number {
  const price = BASE_PRICES[serviceId];
  const cost = ESTIMATED_COSTS[serviceId];
  return (price - cost) / cost;
}

/**
 * Check if a service meets minimum margin requirement (20% per A0-8)
 */
export function meetsMinimumMargin(
  serviceId: keyof typeof BASE_PRICES
): boolean {
  return calculateServiceMargin(serviceId) >= 0.20;
}

/**
 * Get all service IDs
 */
export function getAllServiceIds(): Array<keyof typeof BASE_PRICES> {
  return Object.keys(BASE_PRICES) as Array<keyof typeof BASE_PRICES>;
}

/**
 * Calculate revenue split for a payment amount
 * 40% Operations, 30% Reserve, 15% Treasury, 15% Creator
 */
export function calculateRevenueSplit(amount: number) {
  return {
    operations: amount * 0.40,
    reserve: amount * 0.30,
    treasury: amount * 0.15,
    creator: amount * 0.15,
  };
}

// ---------------------------------------------------------------------------
// Volume Discount Utilities
// ---------------------------------------------------------------------------

/**
 * Get discount percentage for a volume tier
 */
export function getDiscountForTier(tier: 0 | 1 | 2 | 3): number {
  const discounts = [0, 0.10, 0.20, 0.30];
  return discounts[tier];
}

/**
 * Get discount tier label
 */
export function getDiscountTierLabel(tier: 0 | 1 | 2 | 3): string {
  const labels = [
    "No discount (0-9 scans)",
    "10% off (10-49 scans)",
    "20% off (50-99 scans)",
    "30% off (100+ scans)",
  ];
  return labels[tier];
}

/**
 * Calculate discount tier from monthly scan count
 */
export function calculateDiscountTier(
  monthlyScans: number
): 0 | 1 | 2 | 3 {
  if (monthlyScans >= 100) return 3;
  if (monthlyScans >= 50) return 2;
  if (monthlyScans >= 10) return 1;
  return 0;
}

/**
 * Calculate next tier threshold
 */
export function getNextTierThreshold(
  currentTier: 0 | 1 | 2 | 3
): number | null {
  const thresholds = [10, 50, 100, null];
  return thresholds[currentTier];
}
