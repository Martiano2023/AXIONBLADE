// ---------------------------------------------------------------------------
// AXIONBLADE Yield Ranker — Risk-Adjusted Yield Opportunity Analysis
// ---------------------------------------------------------------------------
// Ranks DeFi yield opportunities by risk-adjusted returns (Sharpe-like ratio).
// Filters by user risk profile and minimum deposit requirements.
//
// Risk-Adjusted Return = Effective APR / (Risk Score / 100)
// where Risk Score is inverse (100 = safest, 0 = riskiest)
//
// Factors considered:
// - Protocol risk (audit status, TVL, age)
// - IL risk (for LP positions)
// - Liquidity risk (slippage, depth)
// - Smart contract risk (exploit history)
// - Emission sustainability (token inflation)
// ---------------------------------------------------------------------------

export interface YieldOpportunity {
  protocol: string;
  pool: string;
  type: 'LP' | 'Lending' | 'Staking' | 'Vault';

  // Returns
  nominalAPR: number; // Advertised APR
  effectiveAPR: number; // After fees, IL, inflation
  feeAPR: number; // Trading fees portion
  emissionAPR: number; // Token rewards portion

  // Risk metrics
  riskScore: number; // 0-100 (100 = safest)
  riskAdjustedReturn: number; // effectiveAPR / (riskScore/100)

  // Pool characteristics
  tvl: number; // USD
  volume24h: number; // USD
  liquidityDepth: number; // USD
  minDeposit: number; // USD
  lockPeriod: number; // days (0 = no lock)

  // Specific risks
  ilRisk: number; // 0-1 (0 = no IL, 1 = extreme IL)
  smartContractRisk: number; // 0-1
  liquidationRisk: number; // 0-1 (for lending)

  // Metadata
  hasAudit: boolean;
  auditFirms: string[];
  protocolAge: number; // days
  exploitHistory: boolean;

  // Recommendation
  recommendation: 'enter' | 'monitor' | 'avoid';
  reasonCode: string;
}

export interface RankingFilters {
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  minAmount: number; // USD
  maxAmount: number; // USD
  preferredTypes?: Array<YieldOpportunity['type']>;
  maxLockPeriod?: number; // days
  minAPR?: number;
  requireAudit?: boolean;
}

export interface RankingResult {
  opportunities: YieldOpportunity[];
  filters: RankingFilters;
  totalCount: number;
  avgRiskAdjustedReturn: number;
  timestamp: number;
}

/**
 * Rank yield opportunities by risk-adjusted returns
 * Filters by risk profile and user constraints
 */
export function rankYieldOpportunities(
  amount: number,
  filters: RankingFilters
): RankingResult {
  // Fetch all available pools (in production, query multiple protocols)
  const allOpportunities = fetchAllYieldOpportunities();

  // Apply risk profile filter
  const riskThresholds = {
    conservative: 80, // Only pools with risk score >= 80
    moderate: 60,
    aggressive: 40,
  };
  const minRiskScore = riskThresholds[filters.riskProfile];

  // Filter opportunities
  let filtered = allOpportunities.filter(opp => {
    // Risk score filter
    if (opp.riskScore < minRiskScore) return false;

    // Min/max amount
    if (opp.minDeposit > amount) return false;
    if (amount < filters.minAmount || amount > filters.maxAmount) return false;

    // Type filter
    if (filters.preferredTypes && !filters.preferredTypes.includes(opp.type)) return false;

    // Lock period filter
    if (filters.maxLockPeriod !== undefined && opp.lockPeriod > filters.maxLockPeriod) return false;

    // Min APR filter
    if (filters.minAPR !== undefined && opp.effectiveAPR < filters.minAPR) return false;

    // Audit requirement
    if (filters.requireAudit && !opp.hasAudit) return false;

    return true;
  });

  // Calculate risk-adjusted return for each
  filtered = filtered.map(opp => ({
    ...opp,
    riskAdjustedReturn: opp.effectiveAPR / (opp.riskScore / 100),
  }));

  // Sort by risk-adjusted return (descending)
  filtered.sort((a, b) => b.riskAdjustedReturn - a.riskAdjustedReturn);

  // Take top 20
  const top = filtered.slice(0, 20);

  // Calculate average risk-adjusted return
  const avgRiskAdjustedReturn = top.length > 0
    ? top.reduce((sum, opp) => sum + opp.riskAdjustedReturn, 0) / top.length
    : 0;

  return {
    opportunities: top,
    filters,
    totalCount: allOpportunities.length,
    avgRiskAdjustedReturn,
    timestamp: Date.now(),
  };
}

/**
 * Fetch all yield opportunities from multiple protocols
 * In production, aggregates from Jupiter, Raydium, Kamino, MarginFi, etc.
 */
function fetchAllYieldOpportunities(): YieldOpportunity[] {
  // Mock data for now - in production, fetch from:
  // - Jupiter: swap fee APRs
  // - Raydium: LP pool APRs
  // - Kamino: lending APRs
  // - MarginFi: lending APRs
  // - Drift: perp funding APRs
  // - Marinade/Jito: staking APRs

  return [
    {
      protocol: 'Raydium',
      pool: 'SOL-USDC',
      type: 'LP',
      nominalAPR: 25.5,
      effectiveAPR: 18.2, // After 15% expected IL
      feeAPR: 12.5,
      emissionAPR: 13.0,
      riskScore: 85,
      riskAdjustedReturn: 21.4,
      tvl: 50_000_000,
      volume24h: 15_000_000,
      liquidityDepth: 5_000_000,
      minDeposit: 100,
      lockPeriod: 0,
      ilRisk: 0.15,
      smartContractRisk: 0.10,
      liquidationRisk: 0,
      hasAudit: true,
      auditFirms: ['OtterSec', 'Neodyme'],
      protocolAge: 900,
      exploitHistory: false,
      recommendation: 'enter',
      reasonCode: 'high-volume-stable-pair',
    },
    {
      protocol: 'Kamino',
      pool: 'SOL Lending',
      type: 'Lending',
      nominalAPR: 8.5,
      effectiveAPR: 8.5, // No IL in lending
      feeAPR: 8.5,
      emissionAPR: 0,
      riskScore: 90,
      riskAdjustedReturn: 9.4,
      tvl: 120_000_000,
      volume24h: 8_000_000,
      liquidityDepth: 80_000_000,
      minDeposit: 10,
      lockPeriod: 0,
      ilRisk: 0,
      smartContractRisk: 0.08,
      liquidationRisk: 0.05,
      hasAudit: true,
      auditFirms: ['Certik', 'OtterSec'],
      protocolAge: 450,
      exploitHistory: false,
      recommendation: 'enter',
      reasonCode: 'low-risk-stable-yield',
    },
    {
      protocol: 'Marinade',
      pool: 'mSOL Staking',
      type: 'Staking',
      nominalAPR: 7.2,
      effectiveAPR: 7.2,
      feeAPR: 7.2,
      emissionAPR: 0,
      riskScore: 95,
      riskAdjustedReturn: 7.6,
      tvl: 800_000_000,
      volume24h: 5_000_000,
      liquidityDepth: 600_000_000,
      minDeposit: 0.01,
      lockPeriod: 0,
      ilRisk: 0,
      smartContractRisk: 0.02,
      liquidationRisk: 0,
      hasAudit: true,
      auditFirms: ['Certik', 'Kudelski'],
      protocolAge: 1100,
      exploitHistory: false,
      recommendation: 'enter',
      reasonCode: 'lowest-risk-liquid-staking',
    },
  ];
}

/**
 * Calculate effective APR after accounting for IL, fees, and inflation
 */
export function calculateEffectiveAPR(
  nominalAPR: number,
  feeAPR: number,
  emissionAPR: number,
  ilRisk: number,
  tokenInflation: number = 0
): number {
  // Effective APR = Fee APR + (Emission APR * (1 - inflation)) - Expected IL
  const effectiveEmissionAPR = emissionAPR * (1 - tokenInflation);
  const expectedILDrag = ilRisk * 100; // Convert to percentage
  return feeAPR + effectiveEmissionAPR - expectedILDrag;
}

/**
 * Calculate protocol risk score (0-100, 100 = safest)
 */
export function calculateProtocolRiskScore(
  hasAudit: boolean,
  protocolAge: number, // days
  tvl: number, // USD
  exploitHistory: boolean,
  smartContractRisk: number // 0-1
): number {
  let score = 50; // Base score

  // Audit status (+20 points)
  if (hasAudit) score += 20;

  // Protocol maturity (+20 points max)
  if (protocolAge > 365) score += 20;
  else if (protocolAge > 180) score += 15;
  else if (protocolAge > 90) score += 10;
  else if (protocolAge > 30) score += 5;

  // TVL size (+10 points max)
  if (tvl > 100_000_000) score += 10;
  else if (tvl > 10_000_000) score += 7;
  else if (tvl > 1_000_000) score += 4;

  // Exploit history (-30 points)
  if (exploitHistory) score -= 30;

  // Smart contract risk (-20 points max)
  score -= smartContractRisk * 20;

  return Math.max(0, Math.min(100, score));
}

/**
 * Get recommendation based on risk-adjusted return and constraints
 */
export function getRecommendation(
  opportunity: YieldOpportunity,
  userRiskProfile: RankingFilters['riskProfile']
): { recommendation: YieldOpportunity['recommendation']; reasonCode: string } {
  const { riskScore, riskAdjustedReturn, effectiveAPR, exploitHistory, hasAudit } = opportunity;

  // Avoid conditions
  if (exploitHistory) {
    return { recommendation: 'avoid', reasonCode: 'exploit-history' };
  }

  if (userRiskProfile === 'conservative' && !hasAudit) {
    return { recommendation: 'avoid', reasonCode: 'no-audit-conservative-profile' };
  }

  if (effectiveAPR < 5) {
    return { recommendation: 'avoid', reasonCode: 'low-effective-apr' };
  }

  // Enter conditions
  if (riskAdjustedReturn > 15 && riskScore > 80) {
    return { recommendation: 'enter', reasonCode: 'excellent-risk-adjusted-return' };
  }

  if (riskScore > 85 && effectiveAPR > 8) {
    return { recommendation: 'enter', reasonCode: 'high-safety-good-yield' };
  }

  // Monitor (default)
  return { recommendation: 'monitor', reasonCode: 'moderate-opportunity' };
}

/**
 * Compare two opportunities
 */
export function compareOpportunities(
  a: YieldOpportunity,
  b: YieldOpportunity
): number {
  // Primary: risk-adjusted return
  if (Math.abs(a.riskAdjustedReturn - b.riskAdjustedReturn) > 2) {
    return b.riskAdjustedReturn - a.riskAdjustedReturn;
  }

  // Secondary: risk score (prefer safer)
  if (Math.abs(a.riskScore - b.riskScore) > 10) {
    return b.riskScore - a.riskScore;
  }

  // Tertiary: TVL (prefer established)
  return b.tvl - a.tvl;
}

/**
 * Format opportunity as human-readable summary
 */
export function formatOpportunitySummary(opp: YieldOpportunity): string {
  return `${opp.protocol} ${opp.pool} (${opp.type}): ${opp.effectiveAPR.toFixed(1)}% APR, Risk Score ${opp.riskScore}/100, Risk-Adjusted Return ${opp.riskAdjustedReturn.toFixed(1)}x`;
}
