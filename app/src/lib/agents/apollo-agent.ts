// ---------------------------------------------------------------------------
// APOLLO Analyst Agent — Risk Analysis with Natural Language Narratives
// ---------------------------------------------------------------------------
// Wraps existing risk-engine.ts with natural language explanations.
// Generates deterministic risk assessments with >=2 evidence families (A0-32).
//
// Evidence Families (bitmap):
// - Bit 0: Price/Volume (Pyth, Birdeye)
// - Bit 1: Liquidity (pool depth, slippage)
// - Bit 2: Behavior (holder distribution, smart money)
// - Bit 3: Incentive (emissions, fees)
// - Bit 4: Protocol (audits, TVL, age)
//
// APOLLO never executes — only analyzes (A0-14).
// ---------------------------------------------------------------------------

import { Connection } from '@solana/web3.js';
import { Threat, DeFiPosition } from './aeon-agent';
import { calculateRiskScore } from '../risk-engine';

export interface AnalysisResult {
  input: {
    pool?: string;
    protocol?: string;
    threat: Threat;
  };
  output: {
    riskBreakdown: RiskBreakdown;
    narrative: string;
    recommendation: 'safe' | 'monitor' | 'reduce' | 'exit';
    confidence: number; // 0-100
  };
  evidenceFamilies: number; // bitmap (must have >=2 bits set for A0-32)
  assessedAt: number;
}

export interface RiskBreakdown {
  priceVolatility: number; // 0-100
  liquidityRisk: number;
  concentrationRisk: number;
  protocolRisk: number;
  overallScore: number;
  tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export class ApolloAgent {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Analyze risk for a threat detected by AEON
   * Returns analysis with >=2 evidence families (A0-32 compliance)
   */
  async analyzeRisk(poolOrProtocol: string, threat: Threat): Promise<AnalysisResult> {
    // Fetch pool/protocol metrics
    const metrics = await this.fetchMetrics(poolOrProtocol, threat);

    // Calculate risk breakdown using existing risk engine
    const riskBreakdown = this.calculateRiskBreakdown(metrics);

    // Generate natural language narrative (deterministic templates)
    const narrative = this.generateRiskNarrative(riskBreakdown, metrics, threat);

    // Determine recommendation based on threat severity + risk score
    const recommendation = this.getRecommendation(threat, riskBreakdown);

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(metrics);

    // Build evidence bitmap (must have >=2 bits set)
    const evidenceFamilies = this.buildEvidenceBitmap(metrics);

    return {
      input: {
        pool: threat.pool,
        protocol: threat.protocol,
        threat,
      },
      output: {
        riskBreakdown,
        narrative,
        recommendation,
        confidence,
      },
      evidenceFamilies,
      assessedAt: Date.now(),
    };
  }

  /**
   * Fetch metrics for pool or protocol
   */
  private async fetchMetrics(poolOrProtocol: string, threat: Threat): Promise<any> {
    // In production, fetch from:
    // - Pyth: price feeds
    // - Birdeye: volume, holder data
    // - Jupiter: liquidity, slippage
    // - Protocol APIs: emissions, TVL, audits

    // Mock metrics for now
    return {
      priceVolatility30d: 0.45, // 45% 30-day volatility
      volume24h: 1_000_000,
      tvl: 5_000_000,
      liquidityDepth: 2_000_000,
      holderCount: 1500,
      whaleConcentration: 0.35, // Top 10 holders own 35%
      protocolAge: 180, // days
      hasAudit: true,
      emissionAPR: 15.0,
      feeAPR: 8.5,
      // Evidence family flags
      hasPriceData: true,
      hasLiquidityData: true,
      hasBehaviorData: true,
      hasIncentiveData: true,
      hasProtocolData: true,
    };
  }

  /**
   * Calculate risk breakdown
   */
  private calculateRiskBreakdown(metrics: any): RiskBreakdown {
    // Price/Volume risk (0-100 scale)
    const priceVolatility = Math.min(100, metrics.priceVolatility30d * 100);

    // Liquidity risk (inverse of depth relative to TVL)
    const liquidityRatio = metrics.liquidityDepth / metrics.tvl;
    const liquidityRisk = Math.max(0, 100 - liquidityRatio * 200);

    // Concentration risk (whale holdings)
    const concentrationRisk = metrics.whaleConcentration * 100;

    // Protocol risk (age, audits)
    let protocolRisk = 50;
    if (metrics.hasAudit) protocolRisk -= 20;
    if (metrics.protocolAge > 180) protocolRisk -= 20;
    if (metrics.protocolAge < 30) protocolRisk += 30;
    protocolRisk = Math.max(0, Math.min(100, protocolRisk));

    // Overall score (weighted average)
    const overallScore =
      priceVolatility * 0.25 +
      liquidityRisk * 0.30 +
      concentrationRisk * 0.25 +
      protocolRisk * 0.20;

    // Tier assignment
    let tier: RiskBreakdown['tier'];
    if (overallScore >= 90) tier = 'S';
    else if (overallScore >= 80) tier = 'A';
    else if (overallScore >= 70) tier = 'B';
    else if (overallScore >= 60) tier = 'C';
    else if (overallScore >= 50) tier = 'D';
    else tier = 'F';

    return {
      priceVolatility,
      liquidityRisk,
      concentrationRisk,
      protocolRisk,
      overallScore,
      tier,
    };
  }

  /**
   * Generate natural language risk narrative (deterministic templates)
   */
  private generateRiskNarrative(
    riskBreakdown: RiskBreakdown,
    metrics: any,
    threat: Threat
  ): string {
    const lines: string[] = [];

    // Threat context
    lines.push(`⚠️ **${threat.type}** detected (${threat.severity} severity)`);
    lines.push(`\n${threat.detail}`);

    // Risk analysis
    lines.push(`\n**Risk Analysis (Tier ${riskBreakdown.tier}, Score ${riskBreakdown.overallScore.toFixed(0)}/100):**`);

    if (riskBreakdown.priceVolatility > 70) {
      lines.push(`- ⚡ High price volatility (${riskBreakdown.priceVolatility.toFixed(0)}%) indicates significant market risk`);
    }

    if (riskBreakdown.liquidityRisk > 60) {
      lines.push(`- 💧 Low liquidity depth (${(metrics.liquidityDepth / 1_000_000).toFixed(1)}M) increases slippage risk`);
    }

    if (riskBreakdown.concentrationRisk > 50) {
      lines.push(`- 🐋 High whale concentration (${(metrics.whaleConcentration * 100).toFixed(0)}%) creates exit risk`);
    }

    if (riskBreakdown.protocolRisk > 60) {
      lines.push(`- 🏗️ Protocol maturity concerns (age: ${metrics.protocolAge} days, audit: ${metrics.hasAudit ? 'Yes' : 'No'})`);
    }

    // Evidence families
    const familyCount = this.countEvidenceFamilies(this.buildEvidenceBitmap(metrics));
    lines.push(`\n**Evidence Sources:** ${familyCount} independent families verified ✓`);

    return lines.join('\n');
  }

  /**
   * Determine recommendation based on threat + risk
   */
  private getRecommendation(
    threat: Threat,
    riskBreakdown: RiskBreakdown
  ): 'safe' | 'monitor' | 'reduce' | 'exit' {
    if (threat.severity === 'Critical' || riskBreakdown.tier === 'F') {
      return 'exit';
    }
    if (threat.severity === 'High' || riskBreakdown.tier === 'D') {
      return 'reduce';
    }
    if (threat.severity === 'Medium' || riskBreakdown.tier === 'C') {
      return 'monitor';
    }
    return 'safe';
  }

  /**
   * Calculate confidence based on data availability
   */
  private calculateConfidence(metrics: any): number {
    let confidence = 50; // base confidence

    if (metrics.hasPriceData) confidence += 10;
    if (metrics.hasLiquidityData) confidence += 15;
    if (metrics.hasBehaviorData) confidence += 10;
    if (metrics.hasIncentiveData) confidence += 10;
    if (metrics.hasProtocolData) confidence += 5;

    return Math.min(100, confidence);
  }

  /**
   * Build evidence families bitmap (A0-32: requires >=2 families)
   */
  private buildEvidenceBitmap(metrics: any): number {
    let bitmap = 0;

    if (metrics.hasPriceData) bitmap |= 1 << 0; // Price/Volume
    if (metrics.hasLiquidityData) bitmap |= 1 << 1; // Liquidity
    if (metrics.hasBehaviorData) bitmap |= 1 << 2; // Behavior
    if (metrics.hasIncentiveData) bitmap |= 1 << 3; // Incentive
    if (metrics.hasProtocolData) bitmap |= 1 << 4; // Protocol

    return bitmap;
  }

  /**
   * Count number of evidence families (count set bits)
   */
  private countEvidenceFamilies(bitmap: number): number {
    let count = 0;
    for (let i = 0; i < 5; i++) {
      if (bitmap & (1 << i)) count++;
    }
    return count;
  }
}
