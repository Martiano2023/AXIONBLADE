// ---------------------------------------------------------------------------
// AXIONBLADE Risk Timeline — Historical Risk Trend Analysis
// ---------------------------------------------------------------------------
// Tracks risk score evolution over time with event markers
// ---------------------------------------------------------------------------

export interface RiskTimelineResult {
  currentScore: number;
  trend30d: number; // Change in score over 30 days
  trendDirection: 'improving' | 'stable' | 'declining';
  events: RiskEvent[];
  historicalScores: Array<{ date: number; score: number }>;
}

export interface RiskEvent {
  date: number;
  type: 'new_position' | 'closed_position' | 'market_event' | 'threat_detected' | 'rebalance';
  description: string;
  scoreImpact: number;
}

export function generateRiskTimeline(data: {
  currentScore: number;
  positions: any[];
}): RiskTimelineResult {
  // Generate mock historical data
  const historicalScores = generateMockHistoricalScores(data.currentScore, 90);

  const score30DaysAgo = historicalScores.find(
    h => h.date <= Date.now() - 30 * 24 * 60 * 60 * 1000
  )?.score || data.currentScore;

  const trend30d = data.currentScore - score30DaysAgo;

  let trendDirection: 'improving' | 'stable' | 'declining';
  if (trend30d > 5) trendDirection = 'improving';
  else if (trend30d < -5) trendDirection = 'declining';
  else trendDirection = 'stable';

  const events = generateMockEvents();

  return {
    currentScore: data.currentScore,
    trend30d,
    trendDirection,
    events,
    historicalScores,
  };
}

function generateMockHistoricalScores(currentScore: number, days: number) {
  const scores: Array<{ date: number; score: number }> = [];
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    const date = now - i * 24 * 60 * 60 * 1000;
    const variance = (Math.random() - 0.5) * 10;
    const score = Math.max(0, Math.min(100, currentScore + variance - (days - i) * 0.1));
    scores.push({ date, score });
  }

  return scores;
}

function generateMockEvents(): RiskEvent[] {
  const now = Date.now();
  return [
    {
      date: now - 5 * 24 * 60 * 60 * 1000,
      type: 'new_position',
      description: 'Opened LP position on Raydium SOL-USDC',
      scoreImpact: -3,
    },
    {
      date: now - 15 * 24 * 60 * 60 * 1000,
      type: 'threat_detected',
      description: 'Detected unlimited approval to unknown contract',
      scoreImpact: -8,
    },
    {
      date: now - 20 * 24 * 60 * 60 * 1000,
      type: 'rebalance',
      description: 'Rebalanced portfolio - reduced concentration',
      scoreImpact: +5,
    },
  ];
}
