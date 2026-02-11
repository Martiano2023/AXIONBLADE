// ---------------------------------------------------------------------------
// NOUMEN Risk Engine — 5-family evidence-based risk scoring
// ---------------------------------------------------------------------------
// Implements APOLLO-compatible risk assessment with weighted evidence families.
// Axiom-compliant: deterministic, auditable, no LLM in the loop.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PoolMetrics {
  // Liquidity family
  tvl: number;
  tvlChange24h: number; // percentage (negative = outflow)
  liquidityDepth: number; // ratio of depth vs TVL (0-1)
  topLPConcentration: number; // Herfindahl index 0-1

  // Volatility family
  priceVolatility7d: number; // standard deviation as percentage
  impermanentLossEstimate: number; // percentage
  maxDrawdown30d: number; // percentage (positive = loss)

  // Incentive family
  headlineAPR: number; // percentage
  effectiveAPR: number; // percentage after fees/IL
  rewardTokenPriceTrend30d: number; // percentage change (negative = declining)
  emissionSustainability: number; // 0-1 score

  // Smart Contract family
  programAgeDays: number;
  upgradeAuthorityLocked: boolean;
  verifiedInstructions: number;
  hasExploitHistory: boolean;

  // Protocol family
  teamDoxxed: boolean;
  audited: boolean;
  auditCount: number;
  tvlRankInCategory: number; // 1 = top
  governanceModel: "multisig" | "dao" | "single" | "none";
}

export interface RiskDriver {
  name: string;
  impact: number; // negative = reduces score (adds risk), positive = neutral/safe
  description: string;
}

export interface FamilyResult {
  score: number;
  weight: number;
  drivers: RiskDriver[];
}

export interface RiskBreakdown {
  overallScore: number; // 0-100 (100 = safest)
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  families: {
    liquidity: FamilyResult & { weight: 0.25 };
    volatility: FamilyResult & { weight: 0.20 };
    incentive: FamilyResult & { weight: 0.20 };
    smartContract: FamilyResult & { weight: 0.20 };
    protocol: FamilyResult & { weight: 0.15 };
  };
  confidence: number; // 0-100
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Family scoring functions
// ---------------------------------------------------------------------------

function scoreLiquidity(m: PoolMetrics): FamilyResult {
  let score = 100;
  const drivers: RiskDriver[] = [];

  // TVL change 24h
  if (m.tvlChange24h <= -20) {
    score -= 30;
    drivers.push({
      name: "TVL Severe Outflow",
      impact: -30,
      description: `TVL dropped ${Math.abs(m.tvlChange24h).toFixed(1)}% in 24h — severe liquidity exodus`,
    });
  } else if (m.tvlChange24h <= -10) {
    score -= 15;
    drivers.push({
      name: "TVL Significant Outflow",
      impact: -15,
      description: `TVL dropped ${Math.abs(m.tvlChange24h).toFixed(1)}% in 24h — notable liquidity withdrawal`,
    });
  }

  // Top LP concentration (Herfindahl)
  if (m.topLPConcentration > 0.5) {
    score -= 20;
    drivers.push({
      name: "High LP Concentration",
      impact: -20,
      description: `Herfindahl index ${m.topLPConcentration.toFixed(2)} — liquidity dominated by few providers, rug risk elevated`,
    });
  } else if (m.topLPConcentration > 0.3) {
    score -= 10;
    drivers.push({
      name: "Moderate LP Concentration",
      impact: -10,
      description: `Herfindahl index ${m.topLPConcentration.toFixed(2)} — some concentration among top LPs`,
    });
  }

  // Absolute TVL threshold
  if (m.tvl < 100_000) {
    score -= 15;
    drivers.push({
      name: "Low TVL",
      impact: -15,
      description: `TVL $${(m.tvl / 1000).toFixed(1)}K is below $100K — thin liquidity, high slippage risk`,
    });
  }

  // Liquidity depth ratio
  if (m.liquidityDepth < 0.3) {
    score -= 10;
    drivers.push({
      name: "Shallow Liquidity Depth",
      impact: -10,
      description: `Depth ratio ${m.liquidityDepth.toFixed(2)} — order book depth insufficient for large trades`,
    });
  }

  return { score: clamp(score), weight: 0.25, drivers };
}

function scoreVolatility(m: PoolMetrics): FamilyResult {
  let score = 100;
  const drivers: RiskDriver[] = [];

  // Price volatility 7d
  if (m.priceVolatility7d > 15) {
    score -= 25;
    drivers.push({
      name: "Extreme Volatility",
      impact: -25,
      description: `7d volatility ${m.priceVolatility7d.toFixed(1)}% — extreme price swings significantly increase IL`,
    });
  } else if (m.priceVolatility7d > 8) {
    score -= 12;
    drivers.push({
      name: "Elevated Volatility",
      impact: -12,
      description: `7d volatility ${m.priceVolatility7d.toFixed(1)}% — above-average price movement`,
    });
  }

  // Impermanent loss estimate
  if (m.impermanentLossEstimate > 10) {
    score -= 20;
    drivers.push({
      name: "Severe Impermanent Loss",
      impact: -20,
      description: `Estimated IL ${m.impermanentLossEstimate.toFixed(1)}% — projected losses likely exceed farming rewards`,
    });
  } else if (m.impermanentLossEstimate > 5) {
    score -= 10;
    drivers.push({
      name: "Moderate Impermanent Loss",
      impact: -10,
      description: `Estimated IL ${m.impermanentLossEstimate.toFixed(1)}% — material but manageable divergence loss`,
    });
  }

  // Max drawdown 30d
  if (m.maxDrawdown30d > 30) {
    score -= 20;
    drivers.push({
      name: "Heavy Drawdown",
      impact: -20,
      description: `30d max drawdown ${m.maxDrawdown30d.toFixed(1)}% — capital preservation at risk`,
    });
  } else if (m.maxDrawdown30d > 15) {
    score -= 10;
    drivers.push({
      name: "Notable Drawdown",
      impact: -10,
      description: `30d max drawdown ${m.maxDrawdown30d.toFixed(1)}% — significant recent price decline`,
    });
  }

  return { score: clamp(score), weight: 0.20, drivers };
}

function scoreIncentive(m: PoolMetrics): FamilyResult {
  let score = 100;
  const drivers: RiskDriver[] = [];

  // Headline vs Effective APR delta
  const aprDelta =
    m.headlineAPR > 0
      ? ((m.headlineAPR - m.effectiveAPR) / m.headlineAPR) * 100
      : 0;

  if (aprDelta > 50) {
    score -= 30;
    drivers.push({
      name: "Yield Trap Territory",
      impact: -30,
      description: `Headline APR ${m.headlineAPR.toFixed(0)}% vs effective ${m.effectiveAPR.toFixed(0)}% — ${aprDelta.toFixed(0)}% delta indicates misleading yield`,
    });
  } else if (aprDelta > 25) {
    score -= 15;
    drivers.push({
      name: "APR Discrepancy",
      impact: -15,
      description: `Headline/effective APR gap of ${aprDelta.toFixed(0)}% — real returns significantly lower than advertised`,
    });
  }

  // Reward token price trend
  if (m.rewardTokenPriceTrend30d < -30) {
    score -= 25;
    drivers.push({
      name: "Reward Token Collapse",
      impact: -25,
      description: `Reward token down ${Math.abs(m.rewardTokenPriceTrend30d).toFixed(0)}% in 30d — farming rewards losing value rapidly`,
    });
  } else if (m.rewardTokenPriceTrend30d < -15) {
    score -= 12;
    drivers.push({
      name: "Reward Token Decline",
      impact: -12,
      description: `Reward token down ${Math.abs(m.rewardTokenPriceTrend30d).toFixed(0)}% in 30d — erosion of farming yield`,
    });
  }

  // Emission sustainability
  if (m.emissionSustainability < 0.3) {
    score -= 20;
    drivers.push({
      name: "Unsustainable Emissions",
      impact: -20,
      description: `Sustainability score ${m.emissionSustainability.toFixed(2)} — emission rate likely to decline sharply`,
    });
  } else if (m.emissionSustainability < 0.5) {
    score -= 10;
    drivers.push({
      name: "Questionable Emissions",
      impact: -10,
      description: `Sustainability score ${m.emissionSustainability.toFixed(2)} — emissions may not be maintained long-term`,
    });
  }

  return { score: clamp(score), weight: 0.20, drivers };
}

function scoreSmartContract(m: PoolMetrics): FamilyResult {
  let score = 100;
  const drivers: RiskDriver[] = [];

  // Program age
  if (m.programAgeDays < 30) {
    score -= 30;
    drivers.push({
      name: "Very New Program",
      impact: -30,
      description: `Program deployed ${m.programAgeDays} days ago — insufficient battle-testing, elevated exploit risk`,
    });
  } else if (m.programAgeDays < 90) {
    score -= 15;
    drivers.push({
      name: "Young Program",
      impact: -15,
      description: `Program deployed ${m.programAgeDays} days ago — still in early maturity phase`,
    });
  }

  // Upgrade authority
  if (!m.upgradeAuthorityLocked) {
    score -= 15;
    drivers.push({
      name: "Mutable Program",
      impact: -15,
      description: "Upgrade authority not locked — contract can be modified by deployer at any time",
    });
  }

  // Exploit history
  if (m.hasExploitHistory) {
    score -= 40;
    drivers.push({
      name: "Prior Exploit",
      impact: -40,
      description: "Protocol has been exploited before — historical vulnerability indicates structural risk",
    });
  }

  // Verified instructions
  if (m.verifiedInstructions < 5) {
    score -= 10;
    drivers.push({
      name: "Low Instruction Verification",
      impact: -10,
      description: `Only ${m.verifiedInstructions} verified instructions — limited code transparency`,
    });
  }

  return { score: clamp(score), weight: 0.20, drivers };
}

function scoreProtocol(m: PoolMetrics): FamilyResult {
  let score = 100;
  const drivers: RiskDriver[] = [];

  // Audit status
  if (!m.audited) {
    score -= 30;
    drivers.push({
      name: "No Audit",
      impact: -30,
      description: "Protocol has not been audited — no independent security review on record",
    });
  } else if (m.auditCount >= 2) {
    drivers.push({
      name: "Multiple Audits",
      impact: 0,
      description: `${m.auditCount} independent audits completed — strong security posture`,
    });
  }

  // Team status
  if (!m.teamDoxxed) {
    score -= 20;
    drivers.push({
      name: "Anonymous Team",
      impact: -20,
      description: "Team identity not publicly verified — reduced accountability",
    });
  }

  // Governance model
  if (m.governanceModel === "none") {
    score -= 15;
    drivers.push({
      name: "No Governance",
      impact: -15,
      description: "No governance mechanism — protocol decisions are unilateral",
    });
  } else if (m.governanceModel === "single") {
    score -= 10;
    drivers.push({
      name: "Single-signer Governance",
      impact: -10,
      description: "Single-key governance — single point of failure for protocol changes",
    });
  }

  // TVL rank in category
  if (m.tvlRankInCategory > 10) {
    score -= 10;
    drivers.push({
      name: "Low Category Rank",
      impact: -10,
      description: `Ranked #${m.tvlRankInCategory} in category by TVL — lower adoption increases risk`,
    });
  } else if (m.tvlRankInCategory > 5) {
    score -= 5;
    drivers.push({
      name: "Mid-tier Category Rank",
      impact: -5,
      description: `Ranked #${m.tvlRankInCategory} in category by TVL — moderate market position`,
    });
  }

  return { score: clamp(score), weight: 0.15, drivers };
}

// ---------------------------------------------------------------------------
// Confidence calculation
// ---------------------------------------------------------------------------

function calculateConfidence(m: PoolMetrics): number {
  const fields: unknown[] = [
    m.tvl,
    m.tvlChange24h,
    m.liquidityDepth,
    m.topLPConcentration,
    m.priceVolatility7d,
    m.impermanentLossEstimate,
    m.maxDrawdown30d,
    m.headlineAPR,
    m.effectiveAPR,
    m.rewardTokenPriceTrend30d,
    m.emissionSustainability,
    m.programAgeDays,
    m.upgradeAuthorityLocked,
    m.verifiedInstructions,
    m.hasExploitHistory,
    m.teamDoxxed,
    m.audited,
    m.auditCount,
    m.tvlRankInCategory,
    m.governanceModel,
  ];

  const total = fields.length;
  const populated = fields.filter(
    (f) => f !== null && f !== undefined && f !== ""
  ).length;

  return Math.round((populated / total) * 100);
}

// ---------------------------------------------------------------------------
// Risk level classification
// ---------------------------------------------------------------------------

function classifyRisk(score: number): "Low" | "Medium" | "High" | "Critical" {
  if (score >= 81) return "Low";
  if (score >= 61) return "Medium";
  if (score >= 41) return "High";
  return "Critical";
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

export function calculateRiskScore(metrics: PoolMetrics): RiskBreakdown {
  const liquidity = scoreLiquidity(metrics) as FamilyResult & { weight: 0.25 };
  const volatility = scoreVolatility(metrics) as FamilyResult & {
    weight: 0.20;
  };
  const incentive = scoreIncentive(metrics) as FamilyResult & { weight: 0.20 };
  const smartContract = scoreSmartContract(metrics) as FamilyResult & {
    weight: 0.20;
  };
  const protocol = scoreProtocol(metrics) as FamilyResult & { weight: 0.15 };

  // Weighted average
  const overallScore = clamp(
    Math.round(
      liquidity.score * 0.25 +
        volatility.score * 0.20 +
        incentive.score * 0.20 +
        smartContract.score * 0.20 +
        protocol.score * 0.15
    )
  );

  return {
    overallScore,
    riskLevel: classifyRisk(overallScore),
    families: {
      liquidity,
      volatility,
      incentive,
      smartContract,
      protocol,
    },
    confidence: calculateConfidence(metrics),
    timestamp: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Helper: risk score to Tailwind color class
// ---------------------------------------------------------------------------

export function getRiskColor(score: number): string {
  if (score >= 81) return "text-green-400";
  if (score >= 61) return "text-yellow-400";
  if (score >= 41) return "text-orange-400";
  return "text-red-400";
}

export function getRiskBgColor(score: number): string {
  if (score >= 81) return "bg-green-400/10 border-green-400/30";
  if (score >= 61) return "bg-yellow-400/10 border-yellow-400/30";
  if (score >= 41) return "bg-orange-400/10 border-orange-400/30";
  return "bg-red-400/10 border-red-400/30";
}

export function getRiskLabel(score: number): string {
  return classifyRisk(score);
}
