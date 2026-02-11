// ---------------------------------------------------------------------------
// NOUMEN Pricing Engine — Tiered service pricing with dynamic adjustments
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
// Base price table (SOL)
// ---------------------------------------------------------------------------

const BASE_PRICES: Record<PricingFactors["baseTier"], number> = {
  basic: 0.05,
  pro: 0.25,
  institutional: 5.0,
};

// ---------------------------------------------------------------------------
// Main pricing function
// ---------------------------------------------------------------------------

export function calculatePrice(
  factors: PricingFactors,
  solPrice: number
): PricingResult {
  const basePrice = BASE_PRICES[factors.baseTier];
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
  const finalPrice = roundSol(basePrice * multiplier);
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
