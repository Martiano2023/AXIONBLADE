// ---------------------------------------------------------------------------
// AXIONBLADE DeFi Exposure Map — Protocol Position Tracking
// ---------------------------------------------------------------------------
// Comprehensive view of all DeFi protocol exposures with health factors
// ---------------------------------------------------------------------------

export interface DeFiExposureResult {
  positions: DeFiPosition[];
  totalExposure: number;
  protocolDistribution: Record<string, number>;
  healthFactors: HealthFactorSummary;
}

export interface DeFiPosition {
  protocol: string;
  type: 'LP' | 'Lending' | 'Borrowing' | 'Staking' | 'Farming';
  value: number;
  healthFactor?: number;
  collateral?: number;
  debt?: number;
  apr?: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  details: string;
}

export interface HealthFactorSummary {
  lowestHealthFactor: number | null;
  positionsAtRisk: number;
  avgHealthFactor: number | null;
}

export function mapDeFiExposure(positions: any[]): DeFiExposureResult {
  const totalExposure = positions.reduce((sum, p) => sum + p.value, 0);

  const protocolDistribution: Record<string, number> = {};
  for (const pos of positions) {
    protocolDistribution[pos.protocol] = (protocolDistribution[pos.protocol] || 0) + pos.value;
  }

  const healthFactors = calculateHealthFactorSummary(positions);

  return {
    positions,
    totalExposure,
    protocolDistribution,
    healthFactors,
  };
}

function calculateHealthFactorSummary(positions: any[]): HealthFactorSummary {
  const withHealthFactor = positions.filter(p => p.healthFactor !== undefined);

  if (withHealthFactor.length === 0) {
    return {
      lowestHealthFactor: null,
      positionsAtRisk: 0,
      avgHealthFactor: null,
    };
  }

  const healthFactors = withHealthFactor.map(p => p.healthFactor);
  const lowestHealthFactor = Math.min(...healthFactors);
  const avgHealthFactor = healthFactors.reduce((sum, hf) => sum + hf, 0) / healthFactors.length;
  const positionsAtRisk = healthFactors.filter(hf => hf < 1.5).length;

  return {
    lowestHealthFactor,
    positionsAtRisk,
    avgHealthFactor,
  };
}
