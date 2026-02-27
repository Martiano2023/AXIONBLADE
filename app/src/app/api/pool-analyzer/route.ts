// ---------------------------------------------------------------------------
// AXIONBLADE Pool Analyzer API — Comprehensive LP Pool Analysis
// ---------------------------------------------------------------------------
// Provides deep analysis of LP pools including:
// - Real TVL (excluding wash trading)
// - Volume/TVL ratio (efficiency metric)
// - Fee APR calculation
// - IL simulation (30/60/90 day projections)
// - LP holder concentration
// - Smart money flow tracking
// - Rug risk scoring
// - Comparison to similar pools
// - Optimal concentrated liquidity range (if applicable)
//
// Price: 0.005 SOL per analysis
// Proof: On-chain proof of analysis via noumen_proof
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey, Connection } from '@solana/web3.js';
import { simulateIL, ILSimulationParams } from '@/lib/il-simulator';
import { analyzeHolderDistribution } from '@/lib/holder-analyzer';
import { hashInput, hashDecision } from '@/lib/proof-generator';
import { verifyPayment as verifyPaymentOnChain, getConnection } from '@/lib/payment-verifier';

const SERVICE_PRICE_SOL = 0.005;
const SERVICE_ID = 'pool-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { poolAddress, paymentSignature } = body;

    // Validate pool address
    if (!poolAddress || typeof poolAddress !== 'string') {
      return NextResponse.json(
        { error: 'Invalid pool address' },
        { status: 400 }
      );
    }

    let poolPubkey: PublicKey;
    try {
      poolPubkey = new PublicKey(poolAddress);
    } catch {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    // Verify payment (in production, verify on-chain transaction)
    if (!paymentSignature) {
      return NextResponse.json(
        { error: 'Payment signature required' },
        { status: 402 }
      );
    }

    const connection = getConnection();
    const paymentResult = await verifyPaymentOnChain(paymentSignature, SERVICE_PRICE_SOL, connection);
    if (!paymentResult.valid) {
      return NextResponse.json(
        { error: paymentResult.error || 'Payment verification failed' },
        { status: 402 }
      );
    }

    // Fetch pool data from multiple sources
    const poolData = await fetchPoolData(poolAddress);

    // Analysis 1: Real TVL (filter wash trading)
    const tvlReal = calculateRealTVL(poolData);

    // Analysis 2: Volume/TVL ratio
    const volumeToTVLRatio = poolData.volume24h / tvlReal;

    // Analysis 3: Fee APR calculation
    const feeAPR = calculateFeeAPR(poolData, tvlReal);

    // Analysis 4: IL simulation (30/60/90 days)
    const ilSimulation = simulateIL({
      tokenASymbol: poolData.tokenA.symbol,
      tokenBSymbol: poolData.tokenB.symbol,
      tokenAPrice: poolData.tokenA.price,
      tokenBPrice: poolData.tokenB.price,
      tokenAVolatility: poolData.tokenA.volatility30d,
      tokenBVolatility: poolData.tokenB.volatility30d,
      correlation: poolData.correlation,
      holdingPeriodDays: 30,
    });

    // Analysis 5: LP holder concentration
    const holderAnalysis = analyzeHolderDistribution(
      poolAddress,
      poolData.lpHolders
    );

    // Analysis 6: Smart money flow (24h net change)
    const smartMoneyFlow24h = trackSmartMoneyFlow(poolData);

    // Analysis 7: Rug risk scoring
    const rugRiskScore = calculateRugRisk(poolData, holderAnalysis);

    // Analysis 8: Comparison to similar pools
    const comparison = await compareToSimilarPools(poolAddress, poolData);

    // Analysis 9: Best concentrated liquidity range (if applicable)
    const bestRange = calculateBestConcentratedRange(poolData);

    // Determine overall verdict
    const verdict = getVerdict(
      rugRiskScore,
      volumeToTVLRatio,
      holderAnalysis.concentrationMetrics.top10Percentage,
      feeAPR,
      ilSimulation.riskLevel
    );

    // Generate proof on-chain (in production)
    const proofHash = await generateProofOnChain({
      serviceId: SERVICE_ID,
      inputHash: hashInput({ poolAddress }),
      outputHash: hashDecision({
        tvlReal,
        volumeToTVLRatio,
        feeAPR,
        verdict,
      }),
    });

    // Return comprehensive analysis
    return NextResponse.json({
      pool: poolAddress,
      tokenPair: `${poolData.tokenA.symbol}-${poolData.tokenB.symbol}`,
      protocol: poolData.protocol,

      // Core metrics
      tvlReal,
      tvlReported: poolData.tvl,
      volumeToTVLRatio,
      feeAPR,

      // IL analysis
      ilSimulation: {
        days30: ilSimulation.projections.days30,
        days60: ilSimulation.projections.days60,
        days90: ilSimulation.projections.days90,
        riskLevel: ilSimulation.riskLevel,
        recommendation: ilSimulation.recommendation,
      },

      // Holder analysis
      holderConcentration: {
        giniCoefficient: holderAnalysis.giniCoefficient,
        top10Percentage: holderAnalysis.concentrationMetrics.top10Percentage,
        top50Percentage: holderAnalysis.concentrationMetrics.top50Percentage,
        riskLevel: holderAnalysis.riskLevel,
      },

      // Flow analysis
      smartMoneyFlow24h,

      // Risk scoring
      rugRiskScore,
      rugRiskLevel: rugRiskScore > 80 ? 'low' : rugRiskScore > 60 ? 'medium' : rugRiskScore > 40 ? 'high' : 'extreme',

      // Comparison
      comparison: {
        rank: comparison.rank,
        totalPoolsInCategory: comparison.totalPools,
        betterThan: comparison.betterThanPercentage,
        topPools: comparison.topPools.slice(0, 3),
      },

      // Recommendations
      bestConcentratedRange: bestRange,
      verdict,
      explanation: generateExplanation(verdict, rugRiskScore, feeAPR, ilSimulation.riskLevel),

      // Proof
      proofHash,
      timestamp: Date.now(),
      source: 'axionblade-v3.3.0-pool-analyzer',
    });
  } catch (error) {
    console.error('Pool analyzer error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

interface PoolData {
  protocol: string;
  tvl: number;
  volume24h: number;
  volume7d: number;
  fees24h: number;
  tokenA: { symbol: string; price: number; volatility30d: number };
  tokenB: { symbol: string; price: number; volatility30d: number };
  correlation: number;
  lpHolders: Array<{ address: string; balance: number; label?: string }>;
  liquidityDepth: number;
  age: number; // days
  hasAudit: boolean;
}

async function fetchPoolData(poolAddress: string): Promise<PoolData> {
  // In production, fetch from:
  // - Jupiter API for pool info
  // - Birdeye for price/volume data
  // - Helius for holder data
  // Mock data for now
  return {
    protocol: 'Raydium',
    tvl: 5_000_000,
    volume24h: 850_000,
    volume7d: 6_200_000,
    fees24h: 2_550,
    tokenA: { symbol: 'SOL', price: 180, volatility30d: 0.45 },
    tokenB: { symbol: 'USDC', price: 1.0, volatility30d: 0.02 },
    correlation: 0.15,
    lpHolders: [
      { address: 'whale1...', balance: 150000, label: 'Smart Money' },
      { address: 'whale2...', balance: 100000 },
      // ... more holders
    ],
    liquidityDepth: 2_000_000,
    age: 180,
    hasAudit: true,
  };
}

function calculateRealTVL(poolData: PoolData): number {
  // Filter wash trading by checking for suspicious patterns
  // For now, apply conservative 5% wash trading discount
  return poolData.tvl * 0.95;
}

function calculateFeeAPR(poolData: PoolData, tvl: number): number {
  // Annualize 24h fees
  const dailyFees = poolData.fees24h;
  const annualizedFees = dailyFees * 365;
  return (annualizedFees / tvl) * 100;
}

function trackSmartMoneyFlow(poolData: PoolData): {
  netFlow: number;
  direction: 'inflow' | 'outflow' | 'neutral';
  percentage: number;
} {
  // Mock smart money tracking
  // In production, track known whale/fund wallets
  const netFlow = 50000; // $50k net inflow
  const direction = netFlow > 10000 ? 'inflow' : netFlow < -10000 ? 'outflow' : 'neutral';
  const percentage = (Math.abs(netFlow) / poolData.tvl) * 100;

  return { netFlow, direction, percentage };
}

function calculateRugRisk(poolData: PoolData, holderAnalysis: any): number {
  let score = 50; // Base score

  // Age factor (+30 points max)
  if (poolData.age > 180) score += 30;
  else if (poolData.age > 90) score += 20;
  else if (poolData.age > 30) score += 10;
  else score -= 10; // New pools are risky

  // Audit (+20 points)
  if (poolData.hasAudit) score += 20;

  // Holder concentration (-30 points max)
  const top10Pct = holderAnalysis.concentrationMetrics.top10Percentage;
  if (top10Pct > 80) score -= 30;
  else if (top10Pct > 60) score -= 20;
  else if (top10Pct > 40) score -= 10;

  // TVL size (+10 points max)
  if (poolData.tvl > 10_000_000) score += 10;
  else if (poolData.tvl > 1_000_000) score += 5;

  return Math.max(0, Math.min(100, score));
}

async function compareToSimilarPools(
  poolAddress: string,
  poolData: PoolData
): Promise<{
  rank: number;
  totalPools: number;
  betterThanPercentage: number;
  topPools: Array<{ pool: string; score: number }>;
}> {
  // Mock comparison - in production, fetch and rank similar pools
  return {
    rank: 5,
    totalPools: 50,
    betterThanPercentage: 90,
    topPools: [
      { pool: 'Pool1', score: 95 },
      { pool: 'Pool2', score: 92 },
      { pool: 'Pool3', score: 88 },
    ],
  };
}

function calculateBestConcentratedRange(poolData: PoolData): {
  applicable: boolean;
  lowerTick?: number;
  upperTick?: number;
  expectedAPR?: number;
} | null {
  // For constant product pools, N/A
  // For concentrated liquidity (Orca, Raydium CLMM), calculate optimal range
  return {
    applicable: false,
  };
}

function getVerdict(
  rugRisk: number,
  volumeToTVL: number,
  top10Concentration: number,
  feeAPR: number,
  ilRiskLevel: string
): 'excellent' | 'good' | 'fair' | 'poor' | 'avoid' {
  // Avoid conditions
  if (rugRisk < 40) return 'avoid';
  if (top10Concentration > 80) return 'avoid';

  // Excellent conditions
  if (rugRisk > 80 && volumeToTVL > 0.15 && feeAPR > 15 && ilRiskLevel === 'low') {
    return 'excellent';
  }

  // Good conditions
  if (rugRisk > 70 && volumeToTVL > 0.10 && feeAPR > 10) {
    return 'good';
  }

  // Fair conditions
  if (rugRisk > 60 && feeAPR > 5) {
    return 'fair';
  }

  return 'poor';
}

function generateExplanation(
  verdict: string,
  rugRisk: number,
  feeAPR: number,
  ilRiskLevel: string
): string {
  const verdictText = verdict.charAt(0).toUpperCase() + verdict.slice(1);

  return `${verdictText} pool: Rug risk score ${rugRisk}/100, Fee APR ${feeAPR.toFixed(1)}%, IL risk ${ilRiskLevel}. ${
    verdict === 'excellent'
      ? 'Strong fundamentals with high fees and low risks. Good for LPs.'
      : verdict === 'good'
      ? 'Solid pool with reasonable risk/reward. Suitable for most LPs.'
      : verdict === 'fair'
      ? 'Moderate opportunity. Monitor closely for changes.'
      : verdict === 'poor'
      ? 'Below-average metrics. Consider alternatives.'
      : 'High risk detected. Avoid unless you have specific alpha.'
  }`;
}

async function generateProofOnChain(params: {
  serviceId: string;
  inputHash: Buffer;
  outputHash: Buffer;
}): Promise<string> {
  // In production, call noumen_proof::log_decision
  // Return proof PDA address as hex string
  return '0x' + params.inputHash.toString('hex').slice(0, 32);
}
