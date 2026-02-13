// ---------------------------------------------------------------------------
// AXIONBLADE Portfolio X-Ray — Treemap & Concentration Analysis
// ---------------------------------------------------------------------------
// Visualizes portfolio composition and identifies concentration risks:
// - Treemap data for hierarchical visualization
// - Herfindahl-Hirschman Index (HHI) for concentration
// - Correlation matrix for diversification analysis
// - Low liquidity alerts
// ---------------------------------------------------------------------------

export interface TreemapNode {
  name: string;
  value: number;
  percentage: number;
  color: string;
  children?: TreemapNode[];
}

export interface PortfolioXRayResult {
  treemapData: TreemapNode[];
  concentrationRisk: {
    hhi: number;
    level: 'Low' | 'Moderate' | 'High' | 'Extreme';
    largestHolding: { name: string; percentage: number };
    top5Percentage: number;
  };
  correlationMatrix: CorrelationMatrix;
  lowLiquidityAlerts: Array<{
    asset: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  diversificationScore: number;
}

export interface CorrelationMatrix {
  assets: string[];
  matrix: number[][]; // Correlation coefficients [-1, 1]
  avgCorrelation: number;
}

/**
 * Generate portfolio x-ray analysis
 */
export function generatePortfolioXRay(data: {
  tokenHoldings: Array<{ symbol: string; usdValue: number; mint: string }>;
  defiPositions: Array<{ protocol: string; value: number; type: string }>;
}): PortfolioXRayResult {
  const totalValue = calculateTotalValue(data.tokenHoldings, data.defiPositions);

  // Generate treemap data
  const treemapData = generateTreemapData(data.tokenHoldings, data.defiPositions, totalValue);

  // Calculate concentration risk
  const concentrationRisk = calculateConcentrationRisk(data.tokenHoldings, totalValue);

  // Generate correlation matrix
  const correlationMatrix = generateCorrelationMatrix(data.tokenHoldings);

  // Identify low liquidity assets
  const lowLiquidityAlerts = identifyLowLiquidityAssets(data.tokenHoldings);

  // Calculate diversification score
  const diversificationScore = calculateDiversificationScore(
    concentrationRisk.hhi,
    correlationMatrix.avgCorrelation,
    data.tokenHoldings.length
  );

  return {
    treemapData,
    concentrationRisk,
    correlationMatrix,
    lowLiquidityAlerts,
    diversificationScore,
  };
}

// ---------------------------------------------------------------------------
// Treemap Generation
// ---------------------------------------------------------------------------

function calculateTotalValue(tokens: any[], positions: any[]): number {
  const tokenValue = tokens.reduce((sum, t) => sum + t.usdValue, 0);
  const positionValue = positions.reduce((sum, p) => sum + p.value, 0);
  return tokenValue + positionValue;
}

function generateTreemapData(
  tokens: any[],
  positions: any[],
  totalValue: number
): TreemapNode[] {
  const nodes: TreemapNode[] = [];

  // Group 1: Token Holdings
  if (tokens.length > 0) {
    const tokenValue = tokens.reduce((sum, t) => sum + t.usdValue, 0);
    const tokenChildren: TreemapNode[] = tokens.map(t => ({
      name: t.symbol,
      value: t.usdValue,
      percentage: (t.usdValue / totalValue) * 100,
      color: getColorForAsset(t.symbol),
    }));

    nodes.push({
      name: 'Tokens',
      value: tokenValue,
      percentage: (tokenValue / totalValue) * 100,
      color: '#3b82f6',
      children: tokenChildren,
    });
  }

  // Group 2: DeFi Positions
  if (positions.length > 0) {
    const defiValue = positions.reduce((sum, p) => sum + p.value, 0);
    const defiChildren: TreemapNode[] = positions.map(p => ({
      name: `${p.protocol} ${p.type}`,
      value: p.value,
      percentage: (p.value / totalValue) * 100,
      color: getColorForProtocol(p.protocol),
    }));

    nodes.push({
      name: 'DeFi',
      value: defiValue,
      percentage: (defiValue / totalValue) * 100,
      color: '#8b5cf6',
      children: defiChildren,
    });
  }

  return nodes;
}

function getColorForAsset(symbol: string): string {
  const colors: Record<string, string> = {
    SOL: '#14f195',
    USDC: '#2775ca',
    USDT: '#26a17b',
    BTC: '#f7931a',
    ETH: '#627eea',
  };
  return colors[symbol] || '#6366f1';
}

function getColorForProtocol(protocol: string): string {
  const colors: Record<string, string> = {
    Raydium: '#8c5cf6',
    Orca: '#22d3ee',
    Marinade: '#f59e0b',
    Jito: '#ef4444',
    Kamino: '#10b981',
    Drift: '#ec4899',
  };
  return colors[protocol] || '#6366f1';
}

// ---------------------------------------------------------------------------
// Concentration Risk (HHI)
// ---------------------------------------------------------------------------

function calculateConcentrationRisk(
  tokens: any[],
  totalValue: number
): PortfolioXRayResult['concentrationRisk'] {
  if (tokens.length === 0) {
    return {
      hhi: 0,
      level: 'Low',
      largestHolding: { name: 'None', percentage: 0 },
      top5Percentage: 0,
    };
  }

  // Calculate market shares (percentages)
  const shares = tokens.map(t => (t.usdValue / totalValue) * 100);

  // Herfindahl-Hirschman Index: sum of squared market shares
  const hhi = shares.reduce((sum, share) => sum + share * share, 0);

  // Determine concentration level
  let level: 'Low' | 'Moderate' | 'High' | 'Extreme';
  if (hhi < 1500) level = 'Low';
  else if (hhi < 2500) level = 'Moderate';
  else if (hhi < 5000) level = 'High';
  else level = 'Extreme';

  // Find largest holding
  const sorted = [...tokens].sort((a, b) => b.usdValue - a.usdValue);
  const largestHolding = {
    name: sorted[0].symbol,
    percentage: (sorted[0].usdValue / totalValue) * 100,
  };

  // Top 5 percentage
  const top5 = sorted.slice(0, 5);
  const top5Value = top5.reduce((sum, t) => sum + t.usdValue, 0);
  const top5Percentage = (top5Value / totalValue) * 100;

  return {
    hhi,
    level,
    largestHolding,
    top5Percentage,
  };
}

// ---------------------------------------------------------------------------
// Correlation Matrix
// ---------------------------------------------------------------------------

function generateCorrelationMatrix(tokens: any[]): CorrelationMatrix {
  // In production, fetch historical price data and calculate correlations
  // For now, generate mock correlation matrix

  const assets = tokens.map(t => t.symbol).slice(0, 5); // Top 5 assets
  const n = assets.length;

  // Mock correlation matrix (symmetric)
  const matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1.0; // Perfect correlation with self
      } else if (i < j) {
        // Generate mock correlation [-0.5, 0.9]
        matrix[i][j] = Math.random() * 1.4 - 0.5;
      } else {
        // Symmetric
        matrix[i][j] = matrix[j][i];
      }
    }
  }

  // Calculate average correlation (excluding diagonal)
  let sum = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        sum += Math.abs(matrix[i][j]);
        count++;
      }
    }
  }
  const avgCorrelation = count > 0 ? sum / count : 0;

  return {
    assets,
    matrix,
    avgCorrelation,
  };
}

// ---------------------------------------------------------------------------
// Low Liquidity Detection
// ---------------------------------------------------------------------------

function identifyLowLiquidityAssets(
  tokens: any[]
): PortfolioXRayResult['lowLiquidityAlerts'] {
  const alerts: PortfolioXRayResult['lowLiquidityAlerts'] = [];

  // Check for low liquidity tokens
  // In production, check DEX liquidity, holder count, etc.

  for (const token of tokens) {
    // Mock logic: flag if value < $100
    if (token.usdValue < 100) {
      alerts.push({
        asset: token.symbol,
        reason: `Low value ($${token.usdValue.toFixed(2)}) - may have limited liquidity`,
        severity: 'low',
      });
    }
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Diversification Score
// ---------------------------------------------------------------------------

function calculateDiversificationScore(
  hhi: number,
  avgCorrelation: number,
  assetCount: number
): number {
  // Lower HHI = better diversification
  const hhiScore = Math.max(0, 100 - hhi / 100);

  // Lower correlation = better diversification
  const correlationScore = Math.max(0, (1 - avgCorrelation) * 100);

  // More assets = better diversification
  const countScore = Math.min(100, assetCount * 10);

  // Weighted average
  return Math.round(hhiScore * 0.4 + correlationScore * 0.3 + countScore * 0.3);
}
