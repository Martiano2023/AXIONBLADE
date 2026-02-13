// ---------------------------------------------------------------------------
// AXIONBLADE Wallet Scanner V2 — Type Definitions
// ---------------------------------------------------------------------------
// All interfaces for the 8-section comprehensive wallet risk analysis.
// Every section generator imports from this file.
// ---------------------------------------------------------------------------

// ── Top-Level Result ──

export interface WalletScanV2Result {
  wallet: string;
  riskScore: RiskScoreSection;
  portfolioXray: PortfolioXraySection;
  defiExposure: DefiExposureSection;
  threatDetection: ThreatDetectionSection;
  stressTest: StressTestSection;
  recommendations: RecommendationsSection;
  riskTimeline: RiskTimelineSection;
  poolScanner: PoolScannerSection;
  farmingMap: FarmingMapSection;
  lendingDashboard: LendingDashboardSection;
  proofHash: string;
  timestamp: number;
  source: string;
  scanDuration: number;
}

// ── Section 1: Risk Score ──

export type LetterGrade = "S" | "A" | "B" | "C" | "D" | "F";
export type RiskFactorCategory = "txBehavior" | "portfolio" | "defiRisk" | "security" | "maturity";

export interface RiskFactor {
  name: string;
  score: number; // 0-100
  weight: number;
  category: RiskFactorCategory;
  finding: string;
}

export interface CategoryScore {
  name: string;
  category: RiskFactorCategory;
  score: number; // 0-100
  weight: number; // percentage (20 each)
}

export interface RiskScoreSection {
  overallScore: number; // 0-100
  letterGrade: LetterGrade;
  percentile: number; // 1-99
  factors: RiskFactor[]; // 15 items
  categoryScores: CategoryScore[]; // 5 items
}

// ── Section 2: Portfolio X-Ray ──

export interface TokenPosition {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  allocationPercent: number;
  pnlPercent: number;
  riskFlag: string | null;
}

export interface CorrelationPair {
  tokenA: string;
  tokenB: string;
  correlation: number; // -1 to 1
}

export interface PortfolioXraySection {
  tokens: TokenPosition[];
  totalValue: number;
  herfindahlIndex: number; // 0-1 (1 = perfectly concentrated)
  topConcentrationPercent: number;
  correlationPairs: CorrelationPair[];
}

// ── Section 3: DeFi Exposure ──

export type DefiRiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface DefiPositionV2 {
  protocol: string;
  protocolId: string;
  type: string; // "LP Position" | "Liquid Staking" | "Lending" | "Perp" | "Vault"
  value: number;
  healthFactor: number | null; // 1.0-5.0, null if N/A
  impermanentLossPercent: number;
  realYieldPercent: number;
  liquidationPrice: number | null;
  riskLevel: DefiRiskLevel;
  pair: string;
}

export interface DefiExposureSection {
  positions: DefiPositionV2[];
  totalExposure: number;
  avgHealthFactor: number;
  protocolCount: number;
  concentrationRisk: DefiRiskLevel;
}

// ── Section 4: Threat Detection ──

export type ThreatSeverity = "low" | "medium" | "high" | "critical";

export interface Threat {
  type: string;
  severity: ThreatSeverity;
  description: string;
  detectedAt: string; // relative time string
}

export interface TokenApproval {
  protocol: string;
  riskLevel: DefiRiskLevel;
  unlimited: boolean;
  lastUsedDaysAgo: number;
}

export interface ThreatDetectionSection {
  hygieneScore: number; // 0-100
  threats: Threat[];
  dangerousApprovals: TokenApproval[];
  overallSeverity: ThreatSeverity;
}

// ── Section 5: Stress Test ──

export interface CrashScenario {
  drawdownPercent: number; // -20, -40, -60, -80
  portfolioImpactPercent: number;
  liquidationCount: number;
  survivability: "High" | "Medium" | "Low" | "Critical";
}

export interface StressTestSection {
  scenarios: CrashScenario[]; // 4 scenarios
  exitLiquidityPercent: number;
  portfolioAtRiskPercent: number;
}

// ── Section 6: Recommendations ──

export interface Recommendation {
  title: string;
  description: string;
  priority: number; // 1-5 (1 = highest)
  category: string;
}

export interface RecommendationsSection {
  doNow: Recommendation[];
  thisWeek: Recommendation[];
  monitor: Recommendation[];
}

// ── Section 7: Risk Timeline ──

export interface TimelinePoint {
  day: number;
  score: number; // 0-100
}

export interface TimelineEvent {
  day: number;
  label: string;
  impact: "positive" | "negative" | "neutral";
}

export interface RiskTimelineSection {
  dataPoints: TimelinePoint[]; // 90 days
  events: TimelineEvent[];
  trend: "improving" | "stable" | "declining";
}

// ── Section 8: Pool Scanner (NEW) ──

export interface WalletPoolPosition {
  poolAddress: string;
  protocol: string;
  pair: string;
  tvl: number;
  volume24h: number;
  feeAprReal: number;
  ilHistoricPercent: number;
  tokenRatio: { tokenA: number; tokenB: number };
  liquidityDepth: number; // USD within 2% range
  userShare: number; // user's % of pool
  userValueUsd: number;
  riskLevel: DefiRiskLevel;
}

export interface PoolScannerSection {
  pools: WalletPoolPosition[];
  totalPoolValue: number;
  avgFeeApr: number;
  avgIL: number;
  highestRiskPool: string | null;
}

// ── Section 9: Farming/Staking Map (NEW) ──

export interface FarmingPosition {
  protocol: string;
  farm: string;
  stakedToken: string;
  stakedValue: number;
  aprAdvertised: number;
  aprReal: number;
  timeStakedDays: number;
  pendingRewards: number;
  pendingRewardsUsd: number;
  rewardToken: string;
  unlockSchedule: string; // "Instant" | "7d lockup" | "30d lockup" etc
  riskLevel: DefiRiskLevel;
}

export interface FarmingMapSection {
  positions: FarmingPosition[];
  totalStakedValue: number;
  totalPendingRewards: number;
  avgRealApr: number;
  aprGapWarning: boolean; // true if advertised > real by >50%
}

// ── Section 10: Lending Dashboard (NEW) ──

export interface LendingPosition {
  protocol: string;
  asset: string;
  type: "supply" | "borrow";
  amount: number;
  valueUsd: number;
  apr: number;
  healthFactor: number | null;
  utilizationRate: number;
  liquidationDistancePercent: number | null;
  riskLevel: DefiRiskLevel;
}

export interface LendingDashboardSection {
  positions: LendingPosition[];
  totalSupplied: number;
  totalBorrowed: number;
  netApr: number; // supply APR - borrow APR weighted
  lowestHealthFactor: number | null;
  liquidationRisk: DefiRiskLevel;
}

// ── Standalone Service Types ──

// Pool Analyzer
export interface PoolAnalysisResult {
  poolAddress: string;
  protocol: string;
  pair: string;
  tvlReal: number;
  volumeTvlRatio: number;
  feeApr: number;
  ilSimulation: { days30: number; days60: number; days90: number };
  lpHolderConcentration: number; // Herfindahl of LP holders
  smartMoneyFlow: "inflow" | "outflow" | "neutral";
  smartMoneyAmount: number;
  rugRiskScore: number; // 0-100 (100 = max risk)
  similarPools: SimilarPool[];
  bestRange: { lower: number; upper: number } | null; // for CLMM
  verdict: "Enter" | "Wait" | "Avoid";
  verdictExplanation: string;
  proofHash: string;
  timestamp: number;
}

export interface SimilarPool {
  poolAddress: string;
  protocol: string;
  tvl: number;
  feeApr: number;
  score: number;
}

// Protocol Auditor
export interface ProtocolAuditResult {
  protocolId: string;
  protocolName: string;
  tvlTrend: { value: number; change7d: number; change30d: number };
  auditStatus: { audited: boolean; auditors: string[]; lastAuditDaysAgo: number };
  teamDoxxedScore: number; // 0-100
  exploitHistory: ExploitEvent[];
  insuranceCoverage: number; // USD
  smartContractAge: number; // days
  governanceHealth: number; // 0-100
  adminKeyConcentration: number; // number of signers required
  adminKeyType: "multisig" | "single" | "locked";
  dependencyChain: string[];
  competitors: CompetitorComparison[];
  safetyRating: "A" | "B" | "C" | "D" | "F";
  safetyRatingExplanation: string;
  proofHash: string;
  timestamp: number;
}

export interface ExploitEvent {
  date: string;
  description: string;
  amountLost: number;
  resolved: boolean;
}

export interface CompetitorComparison {
  protocol: string;
  tvl: number;
  safetyRating: string;
  feeApr: number;
}

// Yield Optimizer
export type RiskProfile = "conservative" | "moderate" | "aggressive";

export interface YieldOpportunity {
  rank: number;
  protocol: string;
  pool: string;
  type: string;
  aprReal: number;
  riskAdjustedReturn: number;
  riskLevel: DefiRiskLevel;
  simulation: { days30: number; days90: number; days180: number };
  allocationPercent: number;
  minDeposit: number;
}

export interface YieldOptimizerResult {
  inputAmountSol: number;
  inputAmountUsd: number;
  riskProfile: RiskProfile;
  opportunities: YieldOpportunity[]; // top 10
  totalProjectedApr: number;
  projectedGain: { days30: number; days90: number; days180: number };
  diversificationScore: number; // 0-100
  concentrationAlerts: string[];
  yieldPlan: string; // formatted allocation plan text
  proofHash: string;
  timestamp: number;
}

// Token Deep Dive
export interface HolderDistribution {
  whalesPercent: number; // top 10 holders
  retailPercent: number;
  smartMoneyPercent: number;
  topHolders: { address: string; percent: number; label: string }[];
}

export interface TokenDeepDiveResult {
  mint: string;
  symbol: string;
  name: string;
  holders: HolderDistribution;
  liquidityByDex: { dex: string; liquidityUsd: number; percent: number }[];
  buySellPressure: {
    h24: { buyPercent: number; sellPercent: number };
    d7: { buyPercent: number; sellPercent: number };
  };
  correlations: { asset: string; correlation: number }[];
  tokenVelocity: number; // transactions per day
  mintAuthority: "renounced" | "active" | "unknown";
  freezeAuthority: "renounced" | "active" | "unknown";
  topHolderMovements: { address: string; action: "buy" | "sell"; amount: number; daysAgo: number }[];
  vestingSchedule: { date: string; amount: number; percent: number }[] | null;
  socialSentiment: number; // -100 to 100
  verdict: "Bullish" | "Neutral" | "Bearish";
  verdictTimeframe: string;
  verdictExplanation: string;
  proofHash: string;
  timestamp: number;
}
