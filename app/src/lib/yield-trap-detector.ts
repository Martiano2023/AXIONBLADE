// ---------------------------------------------------------------------------
// AXIONBLADE Yield Trap Detector — Identifies misleading DeFi yield opportunities
// ---------------------------------------------------------------------------
// Deterministic detection of yield traps based on the relationship between
// headline APR, effective APR, reward token health, and TVL dynamics.
// Core principle: if the yield looks too good to be true, prove it isn't.
// ---------------------------------------------------------------------------

export interface YieldTrapResult {
  status: "trap" | "suspicious" | "healthy";
  confidence: number; // 0-100
  reasons: string[];
  headlineAPR: number;
  effectiveAPR: number;
  rewardTokenTrend: number;
  tvlTrend: string;
}

export interface YieldTrapParams {
  headlineAPR: number; // percentage
  effectiveAPR: number; // percentage
  rewardTokenPriceChange30d: number; // percentage (negative = decline)
  tvlChange7d: number; // percentage (negative = outflow)
  emissionRate: number; // tokens per day
  tokenPrice: number; // USD price of reward token
}

// ---------------------------------------------------------------------------
// Detection logic
// ---------------------------------------------------------------------------

export function detectYieldTrap(params: YieldTrapParams): YieldTrapResult {
  const reasons: string[] = [];
  let status: YieldTrapResult["status"] = "healthy";
  let confidence = 50; // baseline

  const aprDelta =
    params.headlineAPR > 0
      ? ((params.headlineAPR - params.effectiveAPR) / params.headlineAPR) * 100
      : 0;

  const tvlTrend = categorizeTvlTrend(params.tvlChange7d);

  // -------------------------------------------------------------------------
  // Rule 1: High headline APR + collapsing reward token = TRAP
  // -------------------------------------------------------------------------
  if (
    params.headlineAPR > 100 &&
    params.rewardTokenPriceChange30d < -30
  ) {
    status = "trap";
    confidence = 90;
    reasons.push(
      `Headline APR of ${params.headlineAPR.toFixed(0)}% is propped up by a reward token that has lost ${Math.abs(params.rewardTokenPriceChange30d).toFixed(0)}% of its value in 30 days. Farming rewards are being printed on a depreciating asset.`
    );
  }

  // -------------------------------------------------------------------------
  // Rule 2: Moderate APR + TVL exodus while APR stays high = SUSPICIOUS
  // -------------------------------------------------------------------------
  if (
    status !== "trap" &&
    params.headlineAPR > 50 &&
    params.tvlChange7d < -10 &&
    params.headlineAPR > params.effectiveAPR * 1.2
  ) {
    status = "suspicious";
    confidence = Math.max(confidence, 75);
    reasons.push(
      `APR of ${params.headlineAPR.toFixed(0)}% persists while TVL is declining (${params.tvlChange7d.toFixed(1)}% in 7d). Smart money may be exiting — high APR is a mathematical artifact of shrinking denominator.`
    );
  }

  // -------------------------------------------------------------------------
  // Rule 3: Large headline/effective APR gap = SUSPICIOUS
  // -------------------------------------------------------------------------
  if (aprDelta > 40) {
    if (status === "healthy") {
      status = "suspicious";
    }
    confidence = Math.max(confidence, 70);
    reasons.push(
      `${aprDelta.toFixed(0)}% gap between headline APR (${params.headlineAPR.toFixed(0)}%) and effective APR (${params.effectiveAPR.toFixed(0)}%). Real returns are significantly lower than advertised due to fees, IL, and token depreciation.`
    );
  }

  // -------------------------------------------------------------------------
  // Rule 4: Extreme emission rate relative to token price = SUSPICIOUS
  // -------------------------------------------------------------------------
  const dailyEmissionValue = params.emissionRate * params.tokenPrice;
  if (
    dailyEmissionValue > 0 &&
    params.rewardTokenPriceChange30d < -20 &&
    params.headlineAPR > 80
  ) {
    if (status === "healthy") {
      status = "suspicious";
    }
    confidence = Math.max(confidence, 65);
    reasons.push(
      `Daily emission value of $${dailyEmissionValue.toFixed(0)} with a declining reward token (${params.rewardTokenPriceChange30d.toFixed(0)}% in 30d) suggests unsustainable yield. Emissions are diluting the reward token faster than demand can absorb.`
    );
  }

  // -------------------------------------------------------------------------
  // Rule 5: Stable APR + growing TVL = HEALTHY
  // -------------------------------------------------------------------------
  if (
    status === "healthy" &&
    aprDelta < 20 &&
    params.tvlChange7d > 0 &&
    params.rewardTokenPriceChange30d > -10
  ) {
    confidence = 85;
    reasons.push(
      `Stable effective APR of ${params.effectiveAPR.toFixed(0)}% with growing TVL (+${params.tvlChange7d.toFixed(1)}% in 7d) and stable reward token. Yield appears organic and sustainable.`
    );
  }

  // -------------------------------------------------------------------------
  // Rule 6: Very low effective APR despite high headline = WARNING
  // -------------------------------------------------------------------------
  if (params.effectiveAPR < 2 && params.headlineAPR > 30) {
    if (status === "healthy") {
      status = "suspicious";
    }
    confidence = Math.max(confidence, 80);
    reasons.push(
      `Effective APR is only ${params.effectiveAPR.toFixed(1)}% despite headline of ${params.headlineAPR.toFixed(0)}%. After accounting for impermanent loss, fees, and token depreciation, this pool is barely profitable.`
    );
  }

  // If no specific reasons were added for healthy status, add a default
  if (status === "healthy" && reasons.length === 0) {
    confidence = 60;
    reasons.push(
      `No significant yield trap indicators detected. Headline APR of ${params.headlineAPR.toFixed(0)}% with effective APR of ${params.effectiveAPR.toFixed(0)}% falls within acceptable parameters.`
    );
  }

  return {
    status,
    confidence,
    reasons,
    headlineAPR: params.headlineAPR,
    effectiveAPR: params.effectiveAPR,
    rewardTokenTrend: params.rewardTokenPriceChange30d,
    tvlTrend,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categorizeTvlTrend(change7d: number): string {
  if (change7d > 10) return "Growing rapidly";
  if (change7d > 2) return "Growing";
  if (change7d > -2) return "Stable";
  if (change7d > -10) return "Declining";
  return "Declining rapidly";
}

export function getYieldTrapColor(
  status: YieldTrapResult["status"]
): string {
  switch (status) {
    case "trap":
      return "text-red-400";
    case "suspicious":
      return "text-orange-400";
    case "healthy":
      return "text-green-400";
  }
}

export function getYieldTrapBgColor(
  status: YieldTrapResult["status"]
): string {
  switch (status) {
    case "trap":
      return "bg-red-400/10 border-red-400/30";
    case "suspicious":
      return "bg-orange-400/10 border-orange-400/30";
    case "healthy":
      return "bg-green-400/10 border-green-400/30";
  }
}

export function getYieldTrapLabel(
  status: YieldTrapResult["status"]
): string {
  switch (status) {
    case "trap":
      return "YIELD TRAP DETECTED";
    case "suspicious":
      return "SUSPICIOUS YIELD";
    case "healthy":
      return "HEALTHY YIELD";
  }
}
