// ---------------------------------------------------------------------------
// AXIONBLADE Protocol Aggregator — Enhanced Protocol Intelligence
// ---------------------------------------------------------------------------
// Extends protocol-db.ts with comprehensive metrics:
// - Multi-source TVL aggregation (DeFiLlama, protocol APIs)
// - Historical TVL trends and growth rates
// - Audit status and exploit history
// - Governance analysis (token distribution, voting participation)
// - Fee generation and revenue breakdown
// - User metrics (active users, retention)
// - Risk scoring (composite of multiple factors)
// ---------------------------------------------------------------------------

export interface ProtocolMetrics {
  protocol: string;
  chain: 'solana' | 'multi-chain';

  // TVL metrics
  tvl: {
    current: number; // USD
    change24h: number; // Percentage
    change7d: number;
    change30d: number;
    historical: Array<{ timestamp: number; value: number }>;
    rank: number; // Rank by TVL among all protocols
  };

  // Volume metrics
  volume: {
    volume24h: number; // USD
    volume7d: number;
    volume30d: number;
    volumeToTVL: number; // Efficiency ratio
  };

  // User metrics
  users: {
    activeUsers24h: number;
    activeUsers7d: number;
    activeUsers30d: number;
    retention7d: number; // Percentage returning after 7 days
    growthRate: number; // New users growth rate
  };

  // Revenue & fees
  revenue: {
    fees24h: number; // USD
    fees7d: number;
    fees30d: number;
    feesAnnualized: number;
    revenueShare: number; // Percentage going to protocol vs LPs
  };

  // Security & audits
  security: {
    hasAudit: boolean;
    auditFirms: string[];
    auditDate: number | null; // Unix timestamp
    exploitHistory: Array<{
      date: number;
      type: string;
      lossUSD: number;
      resolved: boolean;
    }>;
    bugBountyProgram: boolean;
    insuranceAvailable: boolean;
  };

  // Governance
  governance: {
    hasToken: boolean;
    tokenSymbol: string | null;
    tokenMarketCap: number | null;
    holderCount: number | null;
    proposalCount: number;
    voterParticipation: number; // Percentage of token holders who voted
  };

  // Protocol characteristics
  characteristics: {
    type: 'dex' | 'lending' | 'staking' | 'bridge' | 'derivatives' | 'other';
    launchDate: number; // Unix timestamp
    ageInDays: number;
    isUpgradeable: boolean;
    hasEmergencyPause: boolean;
    hasTimelock: boolean;
  };

  // Composite risk score
  riskScore: {
    overall: number; // 0-100 (100 = safest)
    securityScore: number;
    decentralizationScore: number;
    maturityScore: number;
    liquidityScore: number;
  };

  // Summary
  summary: {
    rank: number; // Overall rank
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    recommendation: 'strong_buy' | 'buy' | 'hold' | 'avoid';
    reasonCode: string;
  };
}

/**
 * Aggregate comprehensive protocol metrics
 */
export async function aggregateProtocolMetrics(
  protocolId: string
): Promise<ProtocolMetrics> {
  // In production, fetch from multiple sources:
  // - DeFiLlama API for TVL and historical data
  // - Protocol-specific APIs for volume, fees
  // - Helius/Solscan for user metrics
  // - DefiSafety for audit scores
  // - Governance platforms for voting data

  // Mock comprehensive metrics
  const mockData: ProtocolMetrics = {
    protocol: protocolId,
    chain: 'solana',

    tvl: {
      current: 150_000_000,
      change24h: 2.5,
      change7d: 8.2,
      change30d: 15.7,
      historical: generateMockHistoricalTVL(150_000_000, 30),
      rank: 5,
    },

    volume: {
      volume24h: 25_000_000,
      volume7d: 180_000_000,
      volume30d: 750_000_000,
      volumeToTVL: 0.17, // 17% daily volume/TVL ratio
    },

    users: {
      activeUsers24h: 3500,
      activeUsers7d: 12000,
      activeUsers30d: 35000,
      retention7d: 45.0, // 45% return after 7 days
      growthRate: 12.5, // 12.5% monthly growth
    },

    revenue: {
      fees24h: 50_000,
      fees7d: 360_000,
      fees30d: 1_500_000,
      feesAnnualized: 18_250_000,
      revenueShare: 0.30, // 30% to protocol treasury
    },

    security: {
      hasAudit: true,
      auditFirms: ['OtterSec', 'Neodyme', 'Certik'],
      auditDate: Date.now() - 180 * 24 * 60 * 60 * 1000, // 180 days ago
      exploitHistory: [],
      bugBountyProgram: true,
      insuranceAvailable: false,
    },

    governance: {
      hasToken: true,
      tokenSymbol: 'PROTO',
      tokenMarketCap: 50_000_000,
      holderCount: 15000,
      proposalCount: 25,
      voterParticipation: 12.5, // 12.5% of holders vote
    },

    characteristics: {
      type: 'dex',
      launchDate: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
      ageInDays: 365,
      isUpgradeable: true,
      hasEmergencyPause: true,
      hasTimelock: true,
    },

    riskScore: {
      overall: 85,
      securityScore: 90,
      decentralizationScore: 75,
      maturityScore: 85,
      liquidityScore: 90,
    },

    summary: {
      rank: 5,
      riskLevel: 'low',
      recommendation: 'buy',
      reasonCode: 'strong-fundamentals-growing-tvl',
    },
  };

  return mockData;
}

/**
 * Calculate composite risk score
 */
export function calculateProtocolRiskScore(metrics: {
  hasAudit: boolean;
  auditFirms: string[];
  exploitHistory: any[];
  ageInDays: number;
  tvl: number;
  volumeToTVL: number;
  voterParticipation: number;
  hasEmergencyPause: boolean;
  hasTimelock: boolean;
}): ProtocolMetrics['riskScore'] {
  // Security score (0-100)
  let securityScore = 50;
  if (metrics.hasAudit) securityScore += 20;
  securityScore += Math.min(metrics.auditFirms.length * 10, 20); // +10 per firm, max 20
  securityScore -= metrics.exploitHistory.length * 15; // -15 per exploit
  if (metrics.hasEmergencyPause) securityScore += 5;
  if (metrics.hasTimelock) securityScore += 5;
  securityScore = Math.max(0, Math.min(100, securityScore));

  // Maturity score (0-100)
  let maturityScore = 0;
  if (metrics.ageInDays > 365) maturityScore = 100;
  else if (metrics.ageInDays > 180) maturityScore = 85;
  else if (metrics.ageInDays > 90) maturityScore = 70;
  else if (metrics.ageInDays > 30) maturityScore = 50;
  else maturityScore = 30;

  // Decentralization score (0-100)
  let decentralizationScore = 50;
  if (metrics.voterParticipation > 20) decentralizationScore += 30;
  else if (metrics.voterParticipation > 10) decentralizationScore += 20;
  else if (metrics.voterParticipation > 5) decentralizationScore += 10;
  if (!metrics.hasEmergencyPause) decentralizationScore -= 10; // Centralized control risk
  decentralizationScore = Math.max(0, Math.min(100, decentralizationScore));

  // Liquidity score (0-100)
  let liquidityScore = 50;
  if (metrics.tvl > 100_000_000) liquidityScore += 30;
  else if (metrics.tvl > 10_000_000) liquidityScore += 20;
  else if (metrics.tvl > 1_000_000) liquidityScore += 10;

  if (metrics.volumeToTVL > 0.2) liquidityScore += 15; // High trading activity
  else if (metrics.volumeToTVL > 0.1) liquidityScore += 10;
  else if (metrics.volumeToTVL < 0.05) liquidityScore -= 10; // Low activity
  liquidityScore = Math.max(0, Math.min(100, liquidityScore));

  // Overall score (weighted average)
  const overall = Math.round(
    securityScore * 0.35 +
    maturityScore * 0.25 +
    decentralizationScore * 0.20 +
    liquidityScore * 0.20
  );

  return {
    overall,
    securityScore,
    decentralizationScore,
    maturityScore,
    liquidityScore,
  };
}

/**
 * Compare protocols side-by-side
 */
export function compareProtocols(
  protocols: ProtocolMetrics[]
): {
  winner: string;
  comparison: Array<{
    metric: string;
    values: Record<string, number | string>;
    winner: string;
  }>;
} {
  if (protocols.length < 2) {
    throw new Error('Need at least 2 protocols to compare');
  }

  const comparison = [
    {
      metric: 'Overall Risk Score',
      values: Object.fromEntries(protocols.map(p => [p.protocol, p.riskScore.overall])),
      winner: protocols.reduce((best, p) => p.riskScore.overall > best.riskScore.overall ? p : best).protocol,
    },
    {
      metric: 'TVL (USD)',
      values: Object.fromEntries(protocols.map(p => [p.protocol, `$${(p.tvl.current / 1_000_000).toFixed(1)}M`])),
      winner: protocols.reduce((best, p) => p.tvl.current > best.tvl.current ? p : best).protocol,
    },
    {
      metric: 'Volume/TVL Ratio',
      values: Object.fromEntries(protocols.map(p => [p.protocol, `${(p.volume.volumeToTVL * 100).toFixed(1)}%`])),
      winner: protocols.reduce((best, p) => p.volume.volumeToTVL > best.volume.volumeToTVL ? p : best).protocol,
    },
    {
      metric: 'Fees (24h)',
      values: Object.fromEntries(protocols.map(p => [p.protocol, `$${(p.revenue.fees24h / 1_000).toFixed(1)}k`])),
      winner: protocols.reduce((best, p) => p.revenue.fees24h > best.revenue.fees24h ? p : best).protocol,
    },
  ];

  // Determine overall winner (highest risk score + TVL)
  const winner = protocols.reduce((best, p) => {
    const bestScore = best.riskScore.overall + Math.log10(best.tvl.current);
    const pScore = p.riskScore.overall + Math.log10(p.tvl.current);
    return pScore > bestScore ? p : best;
  }).protocol;

  return { winner, comparison };
}

/**
 * Generate mock historical TVL data
 */
function generateMockHistoricalTVL(
  currentTVL: number,
  days: number
): Array<{ timestamp: number; value: number }> {
  const data: Array<{ timestamp: number; value: number }> = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * dayMs;
    // Simulate growth with some volatility
    const growthFactor = Math.pow(currentTVL / (currentTVL * 0.8), (days - i) / days);
    const noise = 1 + (Math.random() - 0.5) * 0.05; // ±2.5% daily noise
    const value = currentTVL * 0.8 * growthFactor * noise;
    data.push({ timestamp, value });
  }

  return data;
}

/**
 * Get recommendation based on metrics
 */
export function getProtocolRecommendation(
  metrics: ProtocolMetrics
): { recommendation: ProtocolMetrics['summary']['recommendation']; reasonCode: string } {
  const { riskScore, tvl, volume, security } = metrics;

  // Avoid conditions
  if (security.exploitHistory.length > 0 && !security.exploitHistory[0].resolved) {
    return { recommendation: 'avoid', reasonCode: 'unresolved-exploit' };
  }

  if (riskScore.overall < 50) {
    return { recommendation: 'avoid', reasonCode: 'high-risk-score' };
  }

  // Strong buy conditions
  if (riskScore.overall > 85 && tvl.change30d > 20 && volume.volumeToTVL > 0.15) {
    return { recommendation: 'strong_buy', reasonCode: 'excellent-fundamentals-growing-fast' };
  }

  // Buy conditions
  if (riskScore.overall > 75 && tvl.change7d > 5) {
    return { recommendation: 'buy', reasonCode: 'good-fundamentals-positive-trend' };
  }

  // Hold (default)
  return { recommendation: 'hold', reasonCode: 'stable-metrics-monitor' };
}

/**
 * Format protocol summary for display
 */
export function formatProtocolSummary(metrics: ProtocolMetrics): string {
  return `${metrics.protocol}: TVL $${(metrics.tvl.current / 1_000_000).toFixed(1)}M (${metrics.tvl.change7d > 0 ? '+' : ''}${metrics.tvl.change7d.toFixed(1)}% 7d), Risk Score ${metrics.riskScore.overall}/100, ${metrics.security.auditFirms.length} audits`;
}
