// ---------------------------------------------------------------------------
// AXIONBLADE Holder Analyzer — Token Distribution & Whale Concentration
// ---------------------------------------------------------------------------
// Analyzes token holder distribution to detect concentration risk:
// - Gini coefficient (0-1, 0 = perfect equality, 1 = total inequality)
// - Whale concentration (% held by top N holders)
// - Herfindahl-Hirschman Index (HHI) for market concentration
// - Smart money tracking (known funds, market makers)
//
// High concentration = dump risk, low liquidity, manipulation potential
// ---------------------------------------------------------------------------

export interface HolderDistribution {
  totalHolders: number;
  totalSupply: number;
  topHolders: TopHolder[];
  giniCoefficient: number; // 0-1 (0 = equal, 1 = concentrated)
  hhi: number; // Herfindahl-Hirschman Index (0-10000)
  concentrationMetrics: {
    top10Percentage: number;
    top50Percentage: number;
    top100Percentage: number;
  };
  smartMoneyHoldings: number; // % held by known smart money wallets
  exchangeHoldings: number; // % held by CEX wallets
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  recommendation: string;
}

export interface TopHolder {
  address: string;
  balance: number;
  percentage: number;
  label?: string; // 'DEX Pool', 'CEX', 'Team', 'Smart Money', etc.
  category: 'pool' | 'exchange' | 'team' | 'smart_money' | 'unknown';
}

/**
 * Analyze token holder distribution
 */
export function analyzeHolderDistribution(
  tokenMint: string,
  holders: Array<{ address: string; balance: number; label?: string }>
): HolderDistribution {
  // Sort holders by balance (descending)
  const sortedHolders = [...holders].sort((a, b) => b.balance - a.balance);

  // Calculate total supply
  const totalSupply = sortedHolders.reduce((sum, h) => sum + h.balance, 0);

  // Categorize top holders
  const topHolders: TopHolder[] = sortedHolders.slice(0, 100).map(h => ({
    address: h.address,
    balance: h.balance,
    percentage: (h.balance / totalSupply) * 100,
    label: h.label,
    category: categorizeHolder(h.address, h.label),
  }));

  // Calculate Gini coefficient
  const giniCoefficient = calculateGiniCoefficient(sortedHolders.map(h => h.balance));

  // Calculate HHI (Herfindahl-Hirschman Index)
  const hhi = calculateHHI(sortedHolders.map(h => h.balance), totalSupply);

  // Calculate concentration metrics
  const top10Percentage = calculateTopNPercentage(sortedHolders, 10, totalSupply);
  const top50Percentage = calculateTopNPercentage(sortedHolders, 50, totalSupply);
  const top100Percentage = calculateTopNPercentage(sortedHolders, 100, totalSupply);

  // Calculate smart money and exchange holdings
  const smartMoneyHoldings = calculateCategoryPercentage(topHolders, 'smart_money');
  const exchangeHoldings = calculateCategoryPercentage(topHolders, 'exchange');

  // Determine risk level
  const riskLevel = determineConcentrationRisk(
    giniCoefficient,
    top10Percentage,
    hhi,
    exchangeHoldings
  );

  // Generate recommendation
  const recommendation = generateRecommendation(
    riskLevel,
    giniCoefficient,
    top10Percentage,
    smartMoneyHoldings
  );

  return {
    totalHolders: sortedHolders.length,
    totalSupply,
    topHolders: topHolders.slice(0, 20), // Return top 20 for display
    giniCoefficient,
    hhi,
    concentrationMetrics: {
      top10Percentage,
      top50Percentage,
      top100Percentage,
    },
    smartMoneyHoldings,
    exchangeHoldings,
    riskLevel,
    recommendation,
  };
}

/**
 * Calculate Gini coefficient (measure of inequality)
 * 0 = perfect equality, 1 = total inequality
 */
function calculateGiniCoefficient(balances: number[]): number {
  const n = balances.length;
  if (n === 0) return 0;

  // Sort balances ascending
  const sorted = [...balances].sort((a, b) => a - b);

  // Calculate cumulative sum
  let cumulativeSum = 0;
  let giniSum = 0;

  for (let i = 0; i < n; i++) {
    cumulativeSum += sorted[i];
    giniSum += (i + 1) * sorted[i];
  }

  if (cumulativeSum === 0) return 0;

  // Gini = (2 * Σ(i * x_i)) / (n * Σx_i) - (n + 1) / n
  const gini = (2 * giniSum) / (n * cumulativeSum) - (n + 1) / n;
  return Math.max(0, Math.min(1, gini));
}

/**
 * Calculate Herfindahl-Hirschman Index (market concentration)
 * HHI = Σ(market_share_i)^2 * 10000
 * < 1500: Low concentration
 * 1500-2500: Moderate concentration
 * > 2500: High concentration
 */
function calculateHHI(balances: number[], totalSupply: number): number {
  if (totalSupply === 0) return 0;

  const hhi = balances.reduce((sum, balance) => {
    const marketShare = balance / totalSupply;
    return sum + marketShare * marketShare;
  }, 0);

  return Math.round(hhi * 10000);
}

/**
 * Calculate percentage held by top N holders
 */
function calculateTopNPercentage(
  holders: Array<{ balance: number }>,
  n: number,
  totalSupply: number
): number {
  if (totalSupply === 0) return 0;

  const topN = holders.slice(0, n);
  const topNSum = topN.reduce((sum, h) => sum + h.balance, 0);
  return (topNSum / totalSupply) * 100;
}

/**
 * Categorize holder by address and label
 */
function categorizeHolder(
  address: string,
  label?: string
): TopHolder['category'] {
  if (!label) return 'unknown';

  const lowerLabel = label.toLowerCase();

  // DEX pools
  if (lowerLabel.includes('pool') || lowerLabel.includes('lp')) {
    return 'pool';
  }

  // Exchanges
  if (lowerLabel.includes('exchange') || lowerLabel.includes('binance') || lowerLabel.includes('coinbase')) {
    return 'exchange';
  }

  // Team/vesting
  if (lowerLabel.includes('team') || lowerLabel.includes('vesting') || lowerLabel.includes('treasury')) {
    return 'team';
  }

  // Smart money
  if (lowerLabel.includes('fund') || lowerLabel.includes('vc') || lowerLabel.includes('whale')) {
    return 'smart_money';
  }

  return 'unknown';
}

/**
 * Calculate percentage held by a specific category
 */
function calculateCategoryPercentage(
  topHolders: TopHolder[],
  category: TopHolder['category']
): number {
  const categoryTotal = topHolders
    .filter(h => h.category === category)
    .reduce((sum, h) => sum + h.percentage, 0);
  return categoryTotal;
}

/**
 * Determine concentration risk level
 */
function determineConcentrationRisk(
  giniCoefficient: number,
  top10Percentage: number,
  hhi: number,
  exchangeHoldings: number
): HolderDistribution['riskLevel'] {
  // Extreme risk conditions
  if (top10Percentage > 80 || giniCoefficient > 0.9) {
    return 'extreme';
  }

  // High risk conditions
  if (top10Percentage > 60 || giniCoefficient > 0.8 || hhi > 2500) {
    return 'high';
  }

  // Medium risk conditions
  if (top10Percentage > 40 || giniCoefficient > 0.7 || hhi > 1500) {
    return 'medium';
  }

  // Low risk (well distributed)
  return 'low';
}

/**
 * Generate recommendation based on distribution metrics
 */
function generateRecommendation(
  riskLevel: HolderDistribution['riskLevel'],
  giniCoefficient: number,
  top10Percentage: number,
  smartMoneyHoldings: number
): string {
  if (riskLevel === 'extreme') {
    return `🚨 Extreme concentration risk: Top 10 holders own ${top10Percentage.toFixed(1)}%, Gini ${giniCoefficient.toFixed(2)}. High dump risk. Avoid unless you have specific alpha.`;
  }

  if (riskLevel === 'high') {
    return `⚠️ High concentration risk: Top 10 holders own ${top10Percentage.toFixed(1)}%. Vulnerable to large sells. Monitor closely and use stop-losses.`;
  }

  if (riskLevel === 'medium') {
    return `⚡ Moderate concentration: Top 10 holders own ${top10Percentage.toFixed(1)}%. ${smartMoneyHoldings > 10 ? `Positive: ${smartMoneyHoldings.toFixed(1)}% held by smart money.` : 'Typical distribution for mid-cap tokens.'} Proceed with caution.`;
  }

  return `✅ Well-distributed holdings: Top 10 own ${top10Percentage.toFixed(1)}%, Gini ${giniCoefficient.toFixed(2)}. ${smartMoneyHoldings > 5 ? `Smart money holding ${smartMoneyHoldings.toFixed(1)}%.` : ''} Lower manipulation risk.`;
}

/**
 * Detect potential wash trading or self-dealing
 */
export function detectSuspiciousPatterns(holders: TopHolder[]): {
  hasSuspiciousPatterns: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];

  // Check for multiple addresses with similar balances (potential Sybil)
  const balanceBuckets = new Map<number, number>();
  for (const holder of holders) {
    const bucket = Math.floor(holder.percentage);
    balanceBuckets.set(bucket, (balanceBuckets.get(bucket) || 0) + 1);
  }

  for (const [bucket, count] of balanceBuckets) {
    if (count > 5 && bucket > 1) {
      patterns.push(`${count} wallets each holding ~${bucket}% (possible Sybil attack)`);
    }
  }

  // Check for excessive unknown holders in top 10
  const unknownInTop10 = holders.slice(0, 10).filter(h => h.category === 'unknown').length;
  if (unknownInTop10 > 7) {
    patterns.push(`${unknownInTop10}/10 top holders are unidentified (opacity risk)`);
  }

  // Check for team/insiders holding too much
  const teamPercentage = calculateCategoryPercentage(holders, 'team');
  if (teamPercentage > 30) {
    patterns.push(`Team/insiders hold ${teamPercentage.toFixed(1)}% (high insider risk)`);
  }

  return {
    hasSuspiciousPatterns: patterns.length > 0,
    patterns,
  };
}

/**
 * Compare holder distribution over time
 */
export interface DistributionChange {
  metricName: string;
  previous: number;
  current: number;
  change: number;
  changePercentage: number;
  trend: 'improving' | 'worsening' | 'stable';
}

export function compareDistributions(
  previous: HolderDistribution,
  current: HolderDistribution
): DistributionChange[] {
  const changes: DistributionChange[] = [];

  // Gini coefficient (lower is better)
  changes.push(createChange(
    'Gini Coefficient',
    previous.giniCoefficient,
    current.giniCoefficient,
    'lower'
  ));

  // Top 10 percentage (lower is better)
  changes.push(createChange(
    'Top 10% Holdings',
    previous.concentrationMetrics.top10Percentage,
    current.concentrationMetrics.top10Percentage,
    'lower'
  ));

  // Total holders (higher is better)
  changes.push(createChange(
    'Total Holders',
    previous.totalHolders,
    current.totalHolders,
    'higher'
  ));

  return changes;
}

function createChange(
  metricName: string,
  previous: number,
  current: number,
  preferredDirection: 'higher' | 'lower'
): DistributionChange {
  const change = current - previous;
  const changePercentage = previous !== 0 ? (change / previous) * 100 : 0;

  let trend: DistributionChange['trend'];
  if (Math.abs(changePercentage) < 2) {
    trend = 'stable';
  } else if (preferredDirection === 'higher') {
    trend = change > 0 ? 'improving' : 'worsening';
  } else {
    trend = change < 0 ? 'improving' : 'worsening';
  }

  return { metricName, previous, current, change, changePercentage, trend };
}
