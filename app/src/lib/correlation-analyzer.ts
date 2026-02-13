// ---------------------------------------------------------------------------
// AXIONBLADE Correlation Analyzer — Price Correlation Analysis
// ---------------------------------------------------------------------------
// Analyzes price correlation between tokens and major assets (SOL, BTC, ETH).
// Uses Pearson correlation coefficient (-1 to 1):
// - 1.0: Perfect positive correlation (move together)
// - 0.0: No correlation (independent)
// - -1.0: Perfect negative correlation (move opposite)
//
// Applications:
// - Portfolio diversification (want low correlation)
// - Hedging strategies (want negative correlation)
// - IL prediction (high correlation = low IL)
// - Beta calculation (volatility relative to market)
// ---------------------------------------------------------------------------

export interface PriceData {
  timestamp: number; // Unix timestamp
  price: number; // USD price
}

export interface CorrelationResult {
  tokenA: string;
  tokenB: string;
  correlation: number; // -1 to 1
  pValue: number; // Statistical significance (< 0.05 = significant)
  sampleSize: number;
  timeframe: string; // e.g., '30d', '90d'
  strength: 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak';
  direction: 'positive' | 'negative' | 'none';
  beta: number; // Volatility ratio (tokenA vs tokenB)
}

export interface MultiAssetCorrelation {
  token: string;
  correlations: {
    sol: CorrelationResult;
    btc: CorrelationResult;
    eth: CorrelationResult;
  };
  diversificationScore: number; // 0-100 (100 = highly diversified)
  bestHedge: 'sol' | 'btc' | 'eth' | 'none';
  recommendation: string;
}

/**
 * Calculate correlation between two price series
 */
export function calculateCorrelation(
  pricesA: PriceData[],
  pricesB: PriceData[],
  tokenA: string,
  tokenB: string,
  timeframe: string
): CorrelationResult {
  // Align time series (match timestamps)
  const aligned = alignTimeSeries(pricesA, pricesB);

  if (aligned.length < 10) {
    throw new Error('Insufficient data points for correlation (need at least 10)');
  }

  // Calculate returns (log returns for better statistical properties)
  const returnsA = calculateReturns(aligned.map(d => d.priceA));
  const returnsB = calculateReturns(aligned.map(d => d.priceB));

  // Calculate Pearson correlation coefficient
  const correlation = pearsonCorrelation(returnsA, returnsB);

  // Calculate p-value (statistical significance)
  const pValue = calculatePValue(correlation, aligned.length);

  // Determine strength and direction
  const strength = getCorrelationStrength(Math.abs(correlation));
  const direction = correlation > 0.1 ? 'positive' : correlation < -0.1 ? 'negative' : 'none';

  // Calculate beta (volatility ratio)
  const beta = calculateBeta(returnsA, returnsB);

  return {
    tokenA,
    tokenB,
    correlation,
    pValue,
    sampleSize: aligned.length,
    timeframe,
    strength,
    direction,
    beta,
  };
}

/**
 * Analyze correlation with major assets (SOL, BTC, ETH)
 */
export function analyzeMultiAssetCorrelation(
  token: string,
  tokenPrices: PriceData[],
  solPrices: PriceData[],
  btcPrices: PriceData[],
  ethPrices: PriceData[]
): MultiAssetCorrelation {
  // Calculate correlations
  const solCorr = calculateCorrelation(tokenPrices, solPrices, token, 'SOL', '30d');
  const btcCorr = calculateCorrelation(tokenPrices, btcPrices, token, 'BTC', '30d');
  const ethCorr = calculateCorrelation(tokenPrices, ethPrices, token, 'ETH', '30d');

  // Calculate diversification score (average absolute correlation)
  // Lower correlation = better diversification
  const avgAbsCorrelation = (
    Math.abs(solCorr.correlation) +
    Math.abs(btcCorr.correlation) +
    Math.abs(ethCorr.correlation)
  ) / 3;

  const diversificationScore = Math.round((1 - avgAbsCorrelation) * 100);

  // Find best hedge (most negative correlation)
  let bestHedge: MultiAssetCorrelation['bestHedge'] = 'none';
  let mostNegative = 0;

  if (solCorr.correlation < mostNegative) {
    bestHedge = 'sol';
    mostNegative = solCorr.correlation;
  }
  if (btcCorr.correlation < mostNegative) {
    bestHedge = 'btc';
    mostNegative = btcCorr.correlation;
  }
  if (ethCorr.correlation < mostNegative) {
    bestHedge = 'eth';
    mostNegative = ethCorr.correlation;
  }

  // Generate recommendation
  const recommendation = generateCorrelationRecommendation(
    { sol: solCorr, btc: btcCorr, eth: ethCorr },
    diversificationScore
  );

  return {
    token,
    correlations: { sol: solCorr, btc: btcCorr, eth: ethCorr },
    diversificationScore,
    bestHedge,
    recommendation,
  };
}

/**
 * Align two time series by timestamp
 */
function alignTimeSeries(
  seriesA: PriceData[],
  seriesB: PriceData[]
): Array<{ timestamp: number; priceA: number; priceB: number }> {
  const aligned: Array<{ timestamp: number; priceA: number; priceB: number }> = [];

  // Create maps for fast lookup
  const mapA = new Map(seriesA.map(d => [d.timestamp, d.price]));
  const mapB = new Map(seriesB.map(d => [d.timestamp, d.price]));

  // Find common timestamps
  for (const [timestamp, priceA] of mapA) {
    const priceB = mapB.get(timestamp);
    if (priceB !== undefined) {
      aligned.push({ timestamp, priceA, priceB });
    }
  }

  // Sort by timestamp
  aligned.sort((a, b) => a.timestamp - b.timestamp);

  return aligned;
}

/**
 * Calculate log returns from price series
 */
function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const prevPrice = prices[i - 1];
    const currPrice = prices[i];

    if (prevPrice > 0 && currPrice > 0) {
      returns.push(Math.log(currPrice / prevPrice));
    }
  }

  return returns;
}

/**
 * Calculate Pearson correlation coefficient
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  // Calculate means
  const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

  // Calculate covariance and standard deviations
  let covariance = 0;
  let varX = 0;
  let varY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    covariance += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }

  if (varX === 0 || varY === 0) return 0;

  return covariance / Math.sqrt(varX * varY);
}

/**
 * Calculate p-value for correlation (approximate)
 */
function calculatePValue(correlation: number, sampleSize: number): number {
  if (sampleSize < 3) return 1;

  // t-statistic
  const t = correlation * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));

  // Approximate p-value using simplified t-distribution
  // (for exact calculation, would use proper t-distribution CDF)
  const df = sampleSize - 2;
  const pValue = 2 * (1 - approximateTCDF(Math.abs(t), df));

  return Math.max(0, Math.min(1, pValue));
}

/**
 * Approximate t-distribution CDF (simplified for p-value estimation)
 */
function approximateTCDF(t: number, df: number): number {
  // Simplified approximation (good enough for p-value thresholds)
  const x = df / (df + t * t);
  return 1 - 0.5 * Math.pow(x, df / 2);
}

/**
 * Calculate beta (volatility ratio)
 * Beta = Cov(A, B) / Var(B)
 */
function calculateBeta(returnsA: number[], returnsB: number[]): number {
  const n = Math.min(returnsA.length, returnsB.length);
  if (n < 2) return 1;

  const meanA = returnsA.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
  const meanB = returnsB.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

  let covariance = 0;
  let varianceB = 0;

  for (let i = 0; i < n; i++) {
    const dA = returnsA[i] - meanA;
    const dB = returnsB[i] - meanB;
    covariance += dA * dB;
    varianceB += dB * dB;
  }

  if (varianceB === 0) return 1;

  return covariance / varianceB;
}

/**
 * Get correlation strength label
 */
function getCorrelationStrength(absCorrelation: number): CorrelationResult['strength'] {
  if (absCorrelation > 0.8) return 'very_strong';
  if (absCorrelation > 0.6) return 'strong';
  if (absCorrelation > 0.4) return 'moderate';
  if (absCorrelation > 0.2) return 'weak';
  return 'very_weak';
}

/**
 * Generate recommendation based on correlation analysis
 */
function generateCorrelationRecommendation(
  correlations: { sol: CorrelationResult; btc: CorrelationResult; eth: CorrelationResult },
  diversificationScore: number
): string {
  const { sol, btc, eth } = correlations;

  // All high positive correlations = follows market
  if (sol.correlation > 0.7 && btc.correlation > 0.7 && eth.correlation > 0.7) {
    return `📊 Highly correlated with major assets (SOL: ${sol.correlation.toFixed(2)}, BTC: ${btc.correlation.toFixed(2)}, ETH: ${eth.correlation.toFixed(2)}). Moves with broader crypto market. Low diversification benefit (score: ${diversificationScore}/100).`;
  }

  // Negative correlation with major assets = hedge candidate
  if (sol.correlation < -0.3 || btc.correlation < -0.3 || eth.correlation < -0.3) {
    const bestHedge = sol.correlation < btc.correlation && sol.correlation < eth.correlation ? 'SOL'
      : btc.correlation < eth.correlation ? 'BTC' : 'ETH';
    return `✅ Negative correlation detected. Best hedge against ${bestHedge} (${correlations[bestHedge.toLowerCase() as 'sol' | 'btc' | 'eth'].correlation.toFixed(2)}). Good diversification candidate (score: ${diversificationScore}/100).`;
  }

  // Low correlation = independent movement
  if (diversificationScore > 60) {
    return `🎯 Low correlation with major assets. Independent price action (diversification score: ${diversificationScore}/100). Good for portfolio diversification, but higher idiosyncratic risk.`;
  }

  // Moderate correlation
  return `⚖️ Moderate correlation with crypto market (diversification score: ${diversificationScore}/100). Partially follows major assets. Some diversification benefit, monitor beta (SOL: ${sol.beta.toFixed(2)}x).`;
}

/**
 * Predict IL based on correlation
 * High correlation = low IL, low correlation = high IL
 */
export function predictILFromCorrelation(
  correlation: number,
  volatilityA: number,
  volatilityB: number,
  days: number
): number {
  // Simplified IL prediction based on correlation
  // IL increases with: lower correlation, higher volatility, longer time

  const avgVolatility = (volatilityA + volatilityB) / 2;
  const correlationFactor = 1 - Math.abs(correlation); // 0 = perfect correlation, 1 = no correlation
  const timeFactor = Math.sqrt(days / 30); // Square root of time scaling

  // Expected IL (rough approximation)
  const expectedIL = avgVolatility * correlationFactor * timeFactor * 0.5;

  return expectedIL;
}

/**
 * Format correlation for display
 */
export function formatCorrelation(correlation: number): string {
  return `${correlation > 0 ? '+' : ''}${(correlation * 100).toFixed(1)}%`;
}

/**
 * Get correlation color for UI
 */
export function getCorrelationColor(correlation: number): string {
  if (correlation > 0.6) return 'green'; // Strong positive (good for similar pairs)
  if (correlation > 0.3) return 'yellow'; // Moderate positive
  if (correlation > -0.3) return 'gray'; // Low/no correlation (good for diversification)
  if (correlation > -0.6) return 'yellow'; // Moderate negative
  return 'purple'; // Strong negative (good for hedging)
}
