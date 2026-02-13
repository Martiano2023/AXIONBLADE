// ---------------------------------------------------------------------------
// AXIONBLADE Stress Test — Market Crash Simulation
// ---------------------------------------------------------------------------
// Simulates portfolio performance under extreme market conditions:
// - Minor correction: -20% market drop
// - Major correction: -40% market drop
// - Bear market: -60% market drop
// - Black swan: -80% market drop
// - Calculates liquidation risk, exit liquidity, worst-case scenarios
// ---------------------------------------------------------------------------

export interface StressTestResult {
  scenarios: StressScenario[];
  exitLiquidity: ExitLiquidityAnalysis;
  liquidationRisk: LiquidationRiskAnalysis;
  worstCaseImpact: number; // USD loss in worst scenario
  recommendations: string[];
}

export interface StressScenario {
  name: string;
  marketDrop: number; // -20, -40, -60, -80
  portfolioImpact: {
    initialValue: number;
    finalValue: number;
    loss: number;
    lossPercentage: number;
  };
  positionsAtRisk: Array<{
    protocol: string;
    type: string;
    currentValue: number;
    stressedValue: number;
    healthFactor: number | null;
    liquidationRisk: boolean;
  }>;
  survivability: 'Safe' | 'Moderate' | 'High Risk' | 'Critical';
}

export interface ExitLiquidityAnalysis {
  canExitFully: boolean;
  maxExitableValue: number;
  maxExitablePercentage: number;
  bottlenecks: Array<{
    asset: string;
    reason: string;
    estimatedSlippage: number;
  }>;
}

export interface LiquidationRiskAnalysis {
  hasLeveragedPositions: boolean;
  positionsAtRisk: number;
  totalValueAtRisk: number;
  minHealthFactor: number | null;
  recommendations: string[];
}

/**
 * Run comprehensive stress test
 */
export function runStressTest(data: {
  tokenHoldings: Array<{ symbol: string; usdValue: number; liquidity?: number }>;
  defiPositions: Array<{
    protocol: string;
    type: string;
    value: number;
    healthFactor?: number;
    collateral?: number;
    debt?: number;
  }>;
}): StressTestResult {
  const totalValue = calculateTotalPortfolioValue(data.tokenHoldings, data.defiPositions);

  // Run 4 stress scenarios
  const scenarios: StressScenario[] = [
    runScenario('Minor Correction (-20%)', -20, data, totalValue),
    runScenario('Major Correction (-40%)', -40, data, totalValue),
    runScenario('Bear Market (-60%)', -60, data, totalValue),
    runScenario('Black Swan (-80%)', -80, data, totalValue),
  ];

  // Analyze exit liquidity
  const exitLiquidity = analyzeExitLiquidity(data.tokenHoldings);

  // Analyze liquidation risk
  const liquidationRisk = analyzeLiquidationRisk(data.defiPositions);

  // Find worst-case impact
  const worstCaseImpact = Math.max(...scenarios.map(s => s.portfolioImpact.loss));

  // Generate recommendations
  const recommendations = generateStressTestRecommendations(
    scenarios,
    exitLiquidity,
    liquidationRisk
  );

  return {
    scenarios,
    exitLiquidity,
    liquidationRisk,
    worstCaseImpact,
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// Scenario Simulation
// ---------------------------------------------------------------------------

function calculateTotalPortfolioValue(holdings: any[], positions: any[]): number {
  const holdingsValue = holdings.reduce((sum, h) => sum + h.usdValue, 0);
  const positionsValue = positions.reduce((sum, p) => sum + p.value, 0);
  return holdingsValue + positionsValue;
}

function runScenario(
  name: string,
  marketDrop: number,
  data: any,
  initialValue: number
): StressScenario {
  const dropMultiplier = 1 + marketDrop / 100; // e.g., -20% → 0.8

  // Calculate new portfolio value
  let finalValue = 0;
  const positionsAtRisk: StressScenario['positionsAtRisk'] = [];

  // Impact on token holdings (direct market price impact)
  for (const holding of data.tokenHoldings) {
    const stressedValue = holding.usdValue * dropMultiplier;
    finalValue += stressedValue;
  }

  // Impact on DeFi positions (price impact + liquidation risk)
  for (const position of data.defiPositions) {
    const stressedValue = position.value * dropMultiplier;

    // Check if leveraged position
    if (position.healthFactor !== undefined) {
      // Recalculate health factor under stress
      const stressedCollateral = (position.collateral || position.value) * dropMultiplier;
      const debt = position.debt || 0;
      const stressedHealthFactor = debt > 0 ? stressedCollateral / debt : Infinity;

      const liquidationRisk = stressedHealthFactor < 1.1;

      positionsAtRisk.push({
        protocol: position.protocol,
        type: position.type,
        currentValue: position.value,
        stressedValue: liquidationRisk ? 0 : stressedValue,
        healthFactor: stressedHealthFactor,
        liquidationRisk,
      });

      // If liquidated, position value → 0 (or minimal)
      finalValue += liquidationRisk ? 0 : stressedValue;
    } else {
      // Non-leveraged position
      finalValue += stressedValue;

      positionsAtRisk.push({
        protocol: position.protocol,
        type: position.type,
        currentValue: position.value,
        stressedValue,
        healthFactor: null,
        liquidationRisk: false,
      });
    }
  }

  const loss = initialValue - finalValue;
  const lossPercentage = (loss / initialValue) * 100;

  // Determine survivability
  let survivability: StressScenario['survivability'];
  const liquidations = positionsAtRisk.filter(p => p.liquidationRisk).length;

  if (liquidations === 0 && lossPercentage < 25) survivability = 'Safe';
  else if (liquidations === 0 && lossPercentage < 50) survivability = 'Moderate';
  else if (liquidations > 0 || lossPercentage < 75) survivability = 'High Risk';
  else survivability = 'Critical';

  return {
    name,
    marketDrop,
    portfolioImpact: {
      initialValue,
      finalValue,
      loss,
      lossPercentage,
    },
    positionsAtRisk,
    survivability,
  };
}

// ---------------------------------------------------------------------------
// Exit Liquidity Analysis
// ---------------------------------------------------------------------------

function analyzeExitLiquidity(holdings: any[]): ExitLiquidityAnalysis {
  const bottlenecks: ExitLiquidityAnalysis['bottlenecks'] = [];
  let totalValue = 0;
  let exitableValue = 0;

  for (const holding of holdings) {
    totalValue += holding.usdValue;

    // Check liquidity (mock logic)
    const liquidity = holding.liquidity || holding.usdValue * 10; // Mock: 10x value in liquidity
    const estimatedSlippage = (holding.usdValue / liquidity) * 100;

    if (estimatedSlippage > 10) {
      bottlenecks.push({
        asset: holding.symbol,
        reason: `Low liquidity: ${estimatedSlippage.toFixed(1)}% estimated slippage on full exit`,
        estimatedSlippage,
      });

      // Reduce exitable value by slippage
      exitableValue += holding.usdValue * (1 - estimatedSlippage / 100);
    } else {
      // Fully exitable
      exitableValue += holding.usdValue;
    }
  }

  return {
    canExitFully: bottlenecks.length === 0,
    maxExitableValue: exitableValue,
    maxExitablePercentage: totalValue > 0 ? (exitableValue / totalValue) * 100 : 100,
    bottlenecks,
  };
}

// ---------------------------------------------------------------------------
// Liquidation Risk Analysis
// ---------------------------------------------------------------------------

function analyzeLiquidationRisk(positions: any[]): LiquidationRiskAnalysis {
  const leveragedPositions = positions.filter(p => p.healthFactor !== undefined);
  const hasLeveragedPositions = leveragedPositions.length > 0;

  if (!hasLeveragedPositions) {
    return {
      hasLeveragedPositions: false,
      positionsAtRisk: 0,
      totalValueAtRisk: 0,
      minHealthFactor: null,
      recommendations: [],
    };
  }

  // Find positions with low health factors
  const atRisk = leveragedPositions.filter(p => p.healthFactor && p.healthFactor < 1.5);
  const totalValueAtRisk = atRisk.reduce((sum, p) => sum + p.value, 0);

  const healthFactors = leveragedPositions
    .map(p => p.healthFactor)
    .filter((hf): hf is number => hf !== undefined);
  const minHealthFactor = Math.min(...healthFactors);

  const recommendations: string[] = [];

  if (minHealthFactor < 1.2) {
    recommendations.push('🚨 URGENT: Health factor below 1.2 - immediate liquidation risk');
    recommendations.push('Add collateral or repay debt to improve health factor');
  } else if (minHealthFactor < 1.5) {
    recommendations.push('⚠️ WARNING: Health factor below 1.5 - monitor closely');
    recommendations.push('Consider adding collateral as a precaution');
  }

  return {
    hasLeveragedPositions,
    positionsAtRisk: atRisk.length,
    totalValueAtRisk,
    minHealthFactor,
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// Recommendation Generation
// ---------------------------------------------------------------------------

function generateStressTestRecommendations(
  scenarios: StressScenario[],
  exitLiquidity: ExitLiquidityAnalysis,
  liquidationRisk: LiquidationRiskAnalysis
): string[] {
  const recommendations: string[] = [];

  // Check survivability in moderate stress
  const moderateStress = scenarios[1]; // -40%
  if (moderateStress.survivability === 'Critical' || moderateStress.survivability === 'High Risk') {
    recommendations.push('⚠️ Portfolio vulnerable to moderate market stress - consider reducing risk exposure');
  }

  // Check exit liquidity
  if (!exitLiquidity.canExitFully) {
    recommendations.push(
      `💧 ${exitLiquidity.bottlenecks.length} asset(s) have limited liquidity - diversify to more liquid positions`
    );
  }

  // Check liquidation risk
  if (liquidationRisk.positionsAtRisk > 0) {
    recommendations.push(
      `🔴 ${liquidationRisk.positionsAtRisk} leveraged position(s) at risk of liquidation`
    );
    recommendations.push(...liquidationRisk.recommendations);
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('✅ Portfolio shows good resilience to market stress');
    recommendations.push('Continue monitoring positions and maintaining healthy collateral ratios');
  }

  return recommendations;
}
