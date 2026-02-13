// ---------------------------------------------------------------------------
// AXIONBLADE Risk Scoring Engine — S/A/B/C/D/F Tier Calculation
// ---------------------------------------------------------------------------
// Converts numerical risk scores (0-100) to letter grades with percentile ranking:
// - S: 95-100 (Elite, top 5%)
// - A: 85-94 (Excellent, top 15%)
// - B: 70-84 (Good, top 30%)
// - C: 50-69 (Average, middle 40%)
// - D: 30-49 (Below Average, bottom 30%)
// - F: 0-29 (Poor, bottom 20%)
// ---------------------------------------------------------------------------

export type RiskTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface RiskScoreResult {
  score: number; // 0-100
  tier: RiskTier;
  percentile: number; // 0-100, higher is better
  color: string;
  label: string;
  description: string;
  breakdown: {
    portfolioDiversity: number;
    protocolSafety: number;
    transactionHygiene: number;
    liquidityHealth: number;
    exposureManagement: number;
  };
}

/**
 * Calculate risk tier from overall score
 */
export function calculateRiskTier(score: number): RiskTier {
  if (score >= 95) return 'S';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

/**
 * Calculate percentile rank (score vs all wallets)
 */
export function calculatePercentile(score: number, allScores?: number[]): number {
  // In production, compare against historical database of wallet scores
  // For now, use approximate distribution

  if (!allScores || allScores.length === 0) {
    // Approximate percentile based on score distribution
    if (score >= 95) return 98;
    if (score >= 85) return 92;
    if (score >= 70) return 75;
    if (score >= 50) return 50;
    if (score >= 30) return 25;
    return 10;
  }

  // Calculate actual percentile
  const sorted = [...allScores].sort((a, b) => a - b);
  const position = sorted.findIndex(s => s >= score);
  return (position / sorted.length) * 100;
}

/**
 * Get tier metadata
 */
export function getTierMetadata(tier: RiskTier): {
  color: string;
  label: string;
  description: string;
  bgColor: string;
  borderColor: string;
} {
  const metadata = {
    S: {
      color: 'text-cyan-400',
      label: 'Elite',
      description: 'Exceptional risk management. Top 5% of wallets.',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/50',
    },
    A: {
      color: 'text-green-400',
      label: 'Excellent',
      description: 'Strong risk management. Top 15% of wallets.',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/50',
    },
    B: {
      color: 'text-blue-400',
      label: 'Good',
      description: 'Above average risk management. Top 30% of wallets.',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/50',
    },
    C: {
      color: 'text-amber-400',
      label: 'Average',
      description: 'Moderate risk management. Middle 40% of wallets.',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/50',
    },
    D: {
      color: 'text-orange-400',
      label: 'Below Average',
      description: 'Weak risk management. Bottom 30% of wallets.',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/50',
    },
    F: {
      color: 'text-red-400',
      label: 'Poor',
      description: 'High risk exposure. Bottom 20% of wallets.',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/50',
    },
  };

  return metadata[tier];
}

/**
 * Calculate comprehensive risk score with breakdown
 */
export function calculateComprehensiveRiskScore(data: {
  tokenHoldings: any[];
  defiPositions: any[];
  transactions: any[];
  protocols: string[];
}): RiskScoreResult {
  // Component scores (each 0-100)
  const portfolioDiversity = calculatePortfolioDiversity(data.tokenHoldings);
  const protocolSafety = calculateProtocolSafety(data.defiPositions, data.protocols);
  const transactionHygiene = calculateTransactionHygiene(data.transactions);
  const liquidityHealth = calculateLiquidityHealth(data.tokenHoldings, data.defiPositions);
  const exposureManagement = calculateExposureManagement(data.defiPositions);

  // Weighted average (can be adjusted)
  const weights = {
    portfolioDiversity: 0.20,
    protocolSafety: 0.25,
    transactionHygiene: 0.15,
    liquidityHealth: 0.20,
    exposureManagement: 0.20,
  };

  const score = Math.round(
    portfolioDiversity * weights.portfolioDiversity +
    protocolSafety * weights.protocolSafety +
    transactionHygiene * weights.transactionHygiene +
    liquidityHealth * weights.liquidityHealth +
    exposureManagement * weights.exposureManagement
  );

  const tier = calculateRiskTier(score);
  const percentile = calculatePercentile(score);
  const metadata = getTierMetadata(tier);

  return {
    score,
    tier,
    percentile,
    color: metadata.color,
    label: metadata.label,
    description: metadata.description,
    breakdown: {
      portfolioDiversity,
      protocolSafety,
      transactionHygiene,
      liquidityHealth,
      exposureManagement,
    },
  };
}

// ---------------------------------------------------------------------------
// Component Scoring Functions
// ---------------------------------------------------------------------------

function calculatePortfolioDiversity(holdings: any[]): number {
  if (holdings.length === 0) return 0;
  if (holdings.length === 1) return 30;
  if (holdings.length <= 3) return 50;
  if (holdings.length <= 5) return 70;
  if (holdings.length <= 10) return 85;
  return 95;
}

function calculateProtocolSafety(positions: any[], protocols: string[]): number {
  if (positions.length === 0) return 100; // No exposure = no risk

  const auditedProtocols = ['Raydium', 'Orca', 'Marinade', 'Jito', 'Kamino', 'Drift'];
  const safeProtocols = protocols.filter(p => auditedProtocols.includes(p));

  const safetyRatio = safeProtocols.length / protocols.length;
  return Math.round(safetyRatio * 100);
}

function calculateTransactionHygiene(transactions: any[]): number {
  // Check for dangerous patterns
  // For now, return high score (80-95 range)
  return 85;
}

function calculateLiquidityHealth(holdings: any[], positions: any[]): number {
  // Check if assets are liquid
  // For now, return moderate score
  return 75;
}

function calculateExposureManagement(positions: any[]): number {
  if (positions.length === 0) return 100;

  // Check for over-concentration in single protocol
  const protocolCounts: Record<string, number> = {};
  for (const pos of positions) {
    protocolCounts[pos.protocol] = (protocolCounts[pos.protocol] || 0) + 1;
  }

  const maxConcentration = Math.max(...Object.values(protocolCounts));
  const concentrationRatio = maxConcentration / positions.length;

  if (concentrationRatio > 0.7) return 40; // Over-concentrated
  if (concentrationRatio > 0.5) return 60;
  if (concentrationRatio > 0.3) return 80;
  return 95; // Well diversified
}
