// ---------------------------------------------------------------------------
// AXIONBLADE Smart Recommendations — Actionable Portfolio Optimization
// ---------------------------------------------------------------------------
// Generates prioritized recommendations for:
// - Rebalancing strategies
// - Hedge suggestions
// - Position closure alerts
// - Risk reduction actions
// ---------------------------------------------------------------------------

export interface SmartRecommendationsResult {
  rebalancing: RebalancingPlan[];
  hedges: HedgeSuggestion[];
  prioritizedActions: PrioritizedAction[];
  quickWins: string[];
}

export interface RebalancingPlan {
  reason: string;
  actions: Array<{
    action: 'reduce' | 'increase' | 'exit';
    asset: string;
    currentAllocation: number;
    targetAllocation: number;
    rationale: string;
  }>;
  expectedImprovement: string;
}

export interface HedgeSuggestion {
  risk: string;
  hedgeStrategy: string;
  instruments: string[];
  estimatedCost: string;
  effectiveness: 'High' | 'Medium' | 'Low';
}

export interface PrioritizedAction {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  action: string;
  rationale: string;
  estimatedImpact: string;
  complexity: 'Easy' | 'Moderate' | 'Complex';
}

/**
 * Generate smart recommendations
 */
export function generateSmartRecommendations(data: {
  riskScore: any;
  portfolioXRay: any;
  threats: any[];
  stressTest: any;
  defiPositions: any[];
}): SmartRecommendationsResult {
  const rebalancing = generateRebalancingPlans(data.portfolioXRay, data.riskScore);
  const hedges = generateHedgeSuggestions(data.stressTest, data.defiPositions);
  const prioritizedActions = generatePrioritizedActions(data);
  const quickWins = identifyQuickWins(data.threats);

  return {
    rebalancing,
    hedges,
    prioritizedActions,
    quickWins,
  };
}

// ---------------------------------------------------------------------------
// Rebalancing Plans
// ---------------------------------------------------------------------------

function generateRebalancingPlans(
  portfolioXRay: any,
  riskScore: any
): RebalancingPlan[] {
  const plans: RebalancingPlan[] = [];

  // Plan 1: Reduce concentration if HHI is high
  if (portfolioXRay.concentrationRisk.level === 'High' || portfolioXRay.concentrationRisk.level === 'Extreme') {
    plans.push({
      reason: 'High portfolio concentration detected',
      actions: [
        {
          action: 'reduce',
          asset: portfolioXRay.concentrationRisk.largestHolding.name,
          currentAllocation: portfolioXRay.concentrationRisk.largestHolding.percentage,
          targetAllocation: 25,
          rationale: 'Reduce over-concentration to mitigate single-asset risk',
        },
      ],
      expectedImprovement: 'Diversification score +15 points, concentration risk → Moderate',
    });
  }

  // Plan 2: Increase diversification if low asset count
  if (portfolioXRay.diversificationScore < 50) {
    plans.push({
      reason: 'Low diversification - portfolio needs broader exposure',
      actions: [
        {
          action: 'increase',
          asset: 'Blue-chip DeFi tokens (e.g., JUP, JTO, ORCA)',
          currentAllocation: 0,
          targetAllocation: 15,
          rationale: 'Add established DeFi tokens for better diversification',
        },
      ],
      expectedImprovement: 'Diversification score +20 points',
    });
  }

  return plans;
}

// ---------------------------------------------------------------------------
// Hedge Suggestions
// ---------------------------------------------------------------------------

function generateHedgeSuggestions(
  stressTest: any,
  defiPositions: any[]
): HedgeSuggestion[] {
  const hedges: HedgeSuggestion[] = [];

  // Hedge 1: Tail risk protection if vulnerable to crashes
  const blackSwanScenario = stressTest.scenarios.find((s: any) => s.marketDrop === -80);
  if (blackSwanScenario && blackSwanScenario.survivability === 'Critical') {
    hedges.push({
      risk: 'Black swan market crash (-80%)',
      hedgeStrategy: 'Tail risk protection via put options or inverse correlation assets',
      instruments: ['SOL put options', 'Stablecoin allocation', 'Inverse ETF'],
      estimatedCost: '2-5% of portfolio value annually',
      effectiveness: 'High',
    });
  }

  // Hedge 2: Leverage risk protection
  if (stressTest.liquidationRisk.hasLeveragedPositions) {
    hedges.push({
      risk: 'Liquidation risk on leveraged positions',
      hedgeStrategy: 'Reduce leverage or add protective collateral buffer',
      instruments: ['Increase collateral', 'Close high-risk positions', 'Set stop-loss orders'],
      estimatedCost: 'Minimal (just gas fees)',
      effectiveness: 'High',
    });
  }

  // Hedge 3: IL protection for LP positions
  const lpPositions = defiPositions.filter(p => p.type === 'LP');
  if (lpPositions.length > 0) {
    hedges.push({
      risk: 'Impermanent loss on LP positions',
      hedgeStrategy: 'Hedge directional exposure or use IL-protected vaults',
      instruments: ['Delta-neutral strategies', 'IL-protected vaults (Kamino)', 'Correlation-aware LPing'],
      estimatedCost: '0.5-2% of LP value',
      effectiveness: 'Medium',
    });
  }

  return hedges;
}

// ---------------------------------------------------------------------------
// Prioritized Actions
// ---------------------------------------------------------------------------

function generatePrioritizedActions(data: any): PrioritizedAction[] {
  const actions: PrioritizedAction[] = [];

  // Critical actions from threats
  const criticalThreats = data.threats.filter((t: any) => t.severity === 'critical');
  for (const threat of criticalThreats) {
    actions.push({
      priority: 'Critical',
      action: threat.recommendation,
      rationale: threat.description,
      estimatedImpact: 'Prevents potential total loss',
      complexity: threat.autoFixAvailable ? 'Easy' : 'Moderate',
    });
  }

  // High priority: Liquidation risk
  if (data.stressTest.liquidationRisk.positionsAtRisk > 0) {
    actions.push({
      priority: 'High',
      action: 'Add collateral to leveraged positions or reduce debt',
      rationale: `${data.stressTest.liquidationRisk.positionsAtRisk} position(s) at risk of liquidation`,
      estimatedImpact: `Protects $${data.stressTest.liquidationRisk.totalValueAtRisk.toLocaleString()} from liquidation`,
      complexity: 'Easy',
    });
  }

  // Medium priority: Rebalancing
  if (data.portfolioXRay.concentrationRisk.level === 'High') {
    actions.push({
      priority: 'Medium',
      action: 'Rebalance portfolio to reduce concentration',
      rationale: `${data.portfolioXRay.concentrationRisk.largestHolding.percentage.toFixed(0)}% in single asset`,
      estimatedImpact: 'Reduces portfolio volatility by 15-25%',
      complexity: 'Moderate',
    });
  }

  // Low priority: Optimization
  actions.push({
    priority: 'Low',
    action: 'Review and optimize yield strategies',
    rationale: 'Periodic optimization maintains competitive returns',
    estimatedImpact: 'Potential +2-5% APR improvement',
    complexity: 'Moderate',
  });

  return actions;
}

// ---------------------------------------------------------------------------
// Quick Wins
// ---------------------------------------------------------------------------

function identifyQuickWins(threats: any[]): string[] {
  const quickWins: string[] = [];

  // Auto-fixable threats
  const autoFixable = threats.filter(t => t.autoFixAvailable);
  if (autoFixable.length > 0) {
    quickWins.push(`🎯 Revoke ${autoFixable.length} dangerous approval(s) with one click (AEON can automate)`);
  }

  // Always include general tips
  quickWins.push('💡 Enable AEON Guardian for 24/7 automated threat monitoring');
  quickWins.push('📊 Set up custom alerts for price movements and health factor changes');
  quickWins.push('🔄 Schedule quarterly portfolio rebalancing reviews');

  return quickWins;
}
