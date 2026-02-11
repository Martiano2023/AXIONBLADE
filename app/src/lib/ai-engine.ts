// ---------------------------------------------------------------------------
// NOUMEN AI Engine — Deterministic template-based risk narrative generator
// ---------------------------------------------------------------------------
// Generates human-readable risk narratives from structured risk breakdown
// data. No LLM API calls — fully deterministic, auditable, and reproducible.
// Compliant with axiom: LLMs never make final decisions in NOUMEN.
// ---------------------------------------------------------------------------

import type { RiskBreakdown, PoolMetrics, RiskDriver } from "./risk-engine";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface RiskNarrative {
  summary: string;
  keyFindings: string[];
  recommendation: string;
  generatedAt: number;
}

// ---------------------------------------------------------------------------
// Narrative generation
// ---------------------------------------------------------------------------

export function generateRiskNarrative(
  poolName: string,
  protocol: string,
  breakdown: RiskBreakdown,
  metrics: PoolMetrics
): RiskNarrative {
  const summary = buildSummary(poolName, protocol, breakdown, metrics);
  const keyFindings = extractKeyFindings(breakdown);
  const recommendation = buildRecommendation(breakdown, metrics);

  return {
    summary,
    keyFindings,
    recommendation,
    generatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Summary builder
// ---------------------------------------------------------------------------

function buildSummary(
  poolName: string,
  protocol: string,
  breakdown: RiskBreakdown,
  metrics: PoolMetrics
): string {
  const parts: string[] = [];

  // Opening statement
  parts.push(
    `${poolName} on ${protocol} shows ${breakdown.riskLevel.toLowerCase()} risk with an overall score of ${breakdown.overallScore}/100.`
  );

  // Liquidity narrative
  const liq = breakdown.families.liquidity;
  if (liq.score < 60) {
    parts.push(
      `Liquidity conditions are concerning (${liq.score}/100) — ${describeTvl(metrics.tvl)} with ${describeConcentration(metrics.topLPConcentration)}.`
    );
  } else if (liq.score < 80) {
    parts.push(
      `Liquidity is adequate but not robust (${liq.score}/100), with a TVL of ${formatUsd(metrics.tvl)}.`
    );
  } else {
    parts.push(
      `Liquidity is strong (${liq.score}/100) with ${formatUsd(metrics.tvl)} in TVL and well-distributed LP positions.`
    );
  }

  // Volatility narrative
  const vol = breakdown.families.volatility;
  if (vol.score < 60) {
    parts.push(
      `Price volatility is elevated at ${metrics.priceVolatility7d.toFixed(1)}% over 7 days, with estimated impermanent loss of ${metrics.impermanentLossEstimate.toFixed(1)}%.`
    );
  } else if (vol.score < 80) {
    parts.push(
      `Volatility is moderate (${vol.score}/100) — manageable but worth monitoring.`
    );
  }

  // Incentive narrative
  const inc = breakdown.families.incentive;
  if (inc.score < 60) {
    const aprGap = metrics.headlineAPR - metrics.effectiveAPR;
    parts.push(
      `Incentive structure raises flags (${inc.score}/100) — headline APR of ${metrics.headlineAPR.toFixed(0)}% masks an effective return of only ${metrics.effectiveAPR.toFixed(0)}% (gap: ${aprGap.toFixed(0)}pp).`
    );
  } else if (inc.score >= 80) {
    parts.push(
      `Yield appears sustainable with headline APR of ${metrics.headlineAPR.toFixed(0)}% closely matching effective APR of ${metrics.effectiveAPR.toFixed(0)}%.`
    );
  }

  // Smart contract narrative
  const sc = breakdown.families.smartContract;
  if (sc.score < 60) {
    parts.push(
      `Smart contract risk is elevated (${sc.score}/100) — ${describeContractRisk(metrics)}.`
    );
  }

  // Protocol narrative
  const proto = breakdown.families.protocol;
  if (proto.score < 60) {
    parts.push(
      `Protocol trust signals are weak (${proto.score}/100) — ${describeProtocolRisk(metrics)}.`
    );
  }

  // Confidence disclaimer
  if (breakdown.confidence < 70) {
    parts.push(
      `Note: assessment confidence is ${breakdown.confidence}% due to incomplete data — treat this score with caution.`
    );
  }

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Key findings extraction — top 3 drivers by absolute impact
// ---------------------------------------------------------------------------

function extractKeyFindings(breakdown: RiskBreakdown): string[] {
  const allDrivers: (RiskDriver & { family: string })[] = [];

  const familyEntries = Object.entries(breakdown.families) as [
    string,
    { score: number; weight: number; drivers: RiskDriver[] },
  ][];

  for (const [familyName, family] of familyEntries) {
    for (const driver of family.drivers) {
      allDrivers.push({ ...driver, family: familyName });
    }
  }

  // Sort by absolute impact (highest risk first)
  allDrivers.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  // Take top 3, format as findings
  const top = allDrivers.slice(0, 3);

  if (top.length === 0) {
    return ["No significant risk drivers identified across all five evidence families."];
  }

  return top.map(
    (d) =>
      `[${formatFamilyName(d.family)}] ${d.name} (impact: ${d.impact > 0 ? "+" : ""}${d.impact}): ${d.description}`
  );
}

// ---------------------------------------------------------------------------
// Recommendation builder
// ---------------------------------------------------------------------------

function buildRecommendation(
  breakdown: RiskBreakdown,
  metrics: PoolMetrics
): string {
  const { riskLevel, overallScore } = breakdown;

  switch (riskLevel) {
    case "Critical":
      return `ALERT-ONLY: This pool scores ${overallScore}/100, placing it in the Critical risk tier. NOUMEN recommends against any new allocation. ${getCriticalDetail(breakdown, metrics)} Current positions should be reviewed for exit timing.`;

    case "High":
      return `CAUTION: This pool scores ${overallScore}/100 (High risk). Consider reducing exposure or limiting allocation to no more than 5% of portfolio. ${getHighDetail(breakdown)} Active monitoring recommended with 24-hour reassessment cycle.`;

    case "Medium":
      return `MONITOR: This pool scores ${overallScore}/100 (Medium risk). Suitable for moderate allocation with active monitoring. ${getMediumDetail(breakdown)} Reassess weekly or on significant metric changes.`;

    case "Low":
      return `FAVORABLE: This pool scores ${overallScore}/100 (Low risk). Safe for current allocation levels. ${getLowDetail(breakdown)} Standard monitoring cadence (weekly) is sufficient.`;
  }
}

// ---------------------------------------------------------------------------
// Detail generators per risk level
// ---------------------------------------------------------------------------

function getCriticalDetail(
  breakdown: RiskBreakdown,
  metrics: PoolMetrics
): string {
  const weakest = getWeakestFamily(breakdown);
  const parts: string[] = [];

  parts.push(
    `Primary concern: ${formatFamilyName(weakest.name)} family scoring only ${weakest.score}/100.`
  );

  if (metrics.hasExploitHistory) {
    parts.push("Protocol has prior exploit history.");
  }

  if (metrics.headlineAPR > 100 && metrics.effectiveAPR < metrics.headlineAPR * 0.5) {
    parts.push("Yield trap characteristics detected.");
  }

  return parts.join(" ");
}

function getHighDetail(breakdown: RiskBreakdown): string {
  const weakest = getWeakestFamily(breakdown);
  return `Key concern: ${formatFamilyName(weakest.name)} family at ${weakest.score}/100. Address this risk factor before increasing exposure.`;
}

function getMediumDetail(breakdown: RiskBreakdown): string {
  const weakest = getWeakestFamily(breakdown);
  return `Weakest area: ${formatFamilyName(weakest.name)} (${weakest.score}/100). Overall profile is acceptable but not without risk.`;
}

function getLowDetail(breakdown: RiskBreakdown): string {
  const strongest = getStrongestFamily(breakdown);
  return `Strongest area: ${formatFamilyName(strongest.name)} (${strongest.score}/100). All five evidence families are within acceptable ranges.`;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function getWeakestFamily(
  breakdown: RiskBreakdown
): { name: string; score: number } {
  let weakest = { name: "", score: 101 };
  for (const [name, family] of Object.entries(breakdown.families)) {
    if (family.score < weakest.score) {
      weakest = { name, score: family.score };
    }
  }
  return weakest;
}

function getStrongestFamily(
  breakdown: RiskBreakdown
): { name: string; score: number } {
  let strongest = { name: "", score: -1 };
  for (const [name, family] of Object.entries(breakdown.families)) {
    if (family.score > strongest.score) {
      strongest = { name, score: family.score };
    }
  }
  return strongest;
}

function formatFamilyName(name: string): string {
  const map: Record<string, string> = {
    liquidity: "Liquidity",
    volatility: "Volatility",
    incentive: "Incentive",
    smartContract: "Smart Contract",
    protocol: "Protocol",
  };
  return map[name] ?? name;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function describeTvl(tvl: number): string {
  if (tvl < 50_000) return `very low TVL of ${formatUsd(tvl)}`;
  if (tvl < 100_000) return `thin TVL of ${formatUsd(tvl)}`;
  if (tvl < 500_000) return `modest TVL of ${formatUsd(tvl)}`;
  return `TVL of ${formatUsd(tvl)}`;
}

function describeConcentration(herfindahl: number): string {
  if (herfindahl > 0.5) return "highly concentrated LP ownership";
  if (herfindahl > 0.3) return "moderately concentrated LP base";
  return "well-distributed liquidity providers";
}

function describeContractRisk(metrics: PoolMetrics): string {
  const issues: string[] = [];
  if (metrics.programAgeDays < 30) issues.push("very new deployment");
  if (metrics.programAgeDays < 90) issues.push("limited battle-testing");
  if (!metrics.upgradeAuthorityLocked) issues.push("mutable program");
  if (metrics.hasExploitHistory) issues.push("prior exploit on record");
  return issues.length > 0 ? issues.join(", ") : "multiple contract-level concerns";
}

function describeProtocolRisk(metrics: PoolMetrics): string {
  const issues: string[] = [];
  if (!metrics.audited) issues.push("no audit");
  if (!metrics.teamDoxxed) issues.push("anonymous team");
  if (metrics.governanceModel === "none") issues.push("no governance");
  return issues.length > 0 ? issues.join(", ") : "limited trust signals";
}
