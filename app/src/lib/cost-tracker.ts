// ---------------------------------------------------------------------------
// AXIONBLADE Cost Tracker — Real-time service cost measurement
// ---------------------------------------------------------------------------
// Tracks actual costs per service call (RPC, APIs, compute) to ensure
// pricing maintains A0-8 compliance (cost + 20% minimum margin).
// Emits alerts when margins fall below 30% threshold.
// ---------------------------------------------------------------------------

import { getServiceCost, getServiceBasePrice, calculateServiceMargin } from './pricing-engine';

export interface CostMeasurement {
  serviceId: string;
  timestamp: number;
  costLamports: number;
  costSOL: number;
  components: {
    rpcCalls: number;
    externalAPIs: number;
    compute: number;
    storage: number;
  };
}

export interface ServiceCostStats {
  serviceId: string;
  avgCost7d: number;
  avgCost30d: number;
  avgCost24h: number;
  lastMeasured: number;
  sampleCount: number;
  currentMargin: number;
  recommendedPrice: number;
}

export interface MarginAlert {
  serviceId: string;
  currentMargin: number;
  minimumMargin: number;
  currentPrice: number;
  recommendedPrice: number;
  severity: 'warning' | 'critical';
  timestamp: number;
}

// In-memory cost history (last 30 days)
const costHistory: Map<string, CostMeasurement[]> = new Map();

// Alert thresholds
const WARNING_MARGIN = 0.30; // 30%
const CRITICAL_MARGIN = 0.20; // 20% (A0-8 minimum)

/**
 * Record a cost measurement for a service call
 */
export function recordCost(measurement: CostMeasurement): void {
  const history = costHistory.get(measurement.serviceId) || [];
  history.push(measurement);

  // Keep only last 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const filtered = history.filter(m => m.timestamp > thirtyDaysAgo);
  costHistory.set(measurement.serviceId, filtered);

  // Check for margin alerts
  checkMarginAlert(measurement.serviceId);
}

/**
 * Get cost statistics for a service
 */
export function getServiceStats(serviceId: string): ServiceCostStats | null {
  const history = costHistory.get(serviceId);
  if (!history || history.length === 0) {
    // Return estimated stats if no measurements yet
    const estimatedCost = getServiceCost(serviceId as any);
    const basePrice = getServiceBasePrice(serviceId as any);
    return {
      serviceId,
      avgCost7d: estimatedCost,
      avgCost30d: estimatedCost,
      avgCost24h: estimatedCost,
      lastMeasured: Date.now(),
      sampleCount: 0,
      currentMargin: (basePrice - estimatedCost) / estimatedCost,
      recommendedPrice: estimatedCost * 1.4, // cost + 40% margin
    };
  }

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const samples24h = history.filter(m => m.timestamp > oneDayAgo);
  const samples7d = history.filter(m => m.timestamp > sevenDaysAgo);
  const samples30d = history.filter(m => m.timestamp > thirtyDaysAgo);

  const avgCost24h = average(samples24h.map(m => m.costSOL)) || 0;
  const avgCost7d = average(samples7d.map(m => m.costSOL)) || 0;
  const avgCost30d = average(samples30d.map(m => m.costSOL)) || 0;

  const basePrice = getServiceBasePrice(serviceId as any);
  const currentMargin = (basePrice - avgCost7d) / avgCost7d;
  const recommendedPrice = avgCost7d * 1.4; // cost + 40% target margin

  return {
    serviceId,
    avgCost7d,
    avgCost30d,
    avgCost24h,
    lastMeasured: history[history.length - 1].timestamp,
    sampleCount: history.length,
    currentMargin,
    recommendedPrice,
  };
}

/**
 * Check if a service's margin is below threshold
 */
function checkMarginAlert(serviceId: string): void {
  const stats = getServiceStats(serviceId);
  if (!stats) return;

  const { currentMargin, recommendedPrice } = stats;
  const basePrice = getServiceBasePrice(serviceId as any);

  let alert: MarginAlert | null = null;

  if (currentMargin < CRITICAL_MARGIN) {
    alert = {
      serviceId,
      currentMargin,
      minimumMargin: CRITICAL_MARGIN,
      currentPrice: basePrice,
      recommendedPrice,
      severity: 'critical',
      timestamp: Date.now(),
    };
  } else if (currentMargin < WARNING_MARGIN) {
    alert = {
      serviceId,
      currentMargin,
      minimumMargin: WARNING_MARGIN,
      currentPrice: basePrice,
      recommendedPrice,
      severity: 'warning',
      timestamp: Date.now(),
    };
  }

  if (alert) {
    emitMarginAlert(alert);
  }
}

/**
 * Get all active margin alerts
 */
export function getMarginAlerts(): MarginAlert[] {
  const alerts: MarginAlert[] = [];

  for (const serviceId of costHistory.keys()) {
    const stats = getServiceStats(serviceId);
    if (!stats) continue;

    const basePrice = getServiceBasePrice(serviceId as any);
    const { currentMargin, recommendedPrice } = stats;

    if (currentMargin < WARNING_MARGIN) {
      alerts.push({
        serviceId,
        currentMargin,
        minimumMargin: currentMargin < CRITICAL_MARGIN ? CRITICAL_MARGIN : WARNING_MARGIN,
        currentPrice: basePrice,
        recommendedPrice,
        severity: currentMargin < CRITICAL_MARGIN ? 'critical' : 'warning',
        timestamp: Date.now(),
      });
    }
  }

  return alerts.sort((a, b) => a.currentMargin - b.currentMargin);
}

/**
 * Get all service cost stats
 */
export function getAllServiceStats(): ServiceCostStats[] {
  const allServiceIds = [
    'walletScan',
    'basic',
    'pro',
    'institutional',
    'poolAnalyzer',
    'protocolAuditor',
    'yieldOptimizer',
    'tokenDeepDive',
    'aeonMonthly',
    'hermesPerTx',
  ];

  return allServiceIds.map(serviceId => getServiceStats(serviceId)!).filter(Boolean);
}

/**
 * Clear cost history (for testing)
 */
export function clearCostHistory(): void {
  costHistory.clear();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function emitMarginAlert(alert: MarginAlert): void {
  // In production, this would send to monitoring system (Datadog, Sentry, etc.)
  // For now, just log to console
  console.warn('[AXIONBLADE Cost Tracker] Margin Alert:', {
    service: alert.serviceId,
    severity: alert.severity,
    currentMargin: `${(alert.currentMargin * 100).toFixed(1)}%`,
    recommendation: `Increase price from ${alert.currentPrice.toFixed(4)} to ${alert.recommendedPrice.toFixed(4)} SOL`,
  });
}

// ---------------------------------------------------------------------------
// Cost Component Helpers
// ---------------------------------------------------------------------------

/**
 * Estimate RPC call cost
 * Based on Helius/QuickNode pricing
 */
export function estimateRPCCost(callCount: number): number {
  // Helius: ~$0.10 per 1000 calls, SOL @ $180 = 0.000000556 SOL per call
  const costPerCall = 0.000000556;
  return callCount * costPerCall;
}

/**
 * Estimate external API cost
 * Based on Pyth/Birdeye/Helius pricing
 */
export function estimateAPICost(apiCalls: { pyth?: number; birdeye?: number; helius?: number }): number {
  const costs = {
    pyth: 0, // Free tier sufficient for current usage
    birdeye: 0.000001, // ~$0.0001 per call (SOL @ $180)
    helius: 0.000000556, // Same as RPC
  };

  return (
    (apiCalls.pyth || 0) * costs.pyth +
    (apiCalls.birdeye || 0) * costs.birdeye +
    (apiCalls.helius || 0) * costs.helius
  );
}

/**
 * Estimate compute cost (serverless functions)
 * Based on Vercel/AWS Lambda pricing
 */
export function estimateComputeCost(durationMs: number, memoryMB: number): number {
  // Vercel Pro: $40/month for 1000 GB-hours
  // 1 GB-hour = $0.04
  // Convert to GB-ms: 1 GB-hour = 3,600,000 GB-ms
  // Cost per GB-ms = $0.04 / 3,600,000 = $0.000000011 per GB-ms
  // SOL @ $180: 0.000000000061 SOL per GB-ms
  const costPerGBms = 0.000000000061;
  const gbMs = (memoryMB / 1024) * durationMs;
  return gbMs * costPerGBms;
}

/**
 * Create a cost measurement
 */
export function createCostMeasurement(params: {
  serviceId: string;
  rpcCalls: number;
  apiCalls: { pyth?: number; birdeye?: number; helius?: number };
  durationMs: number;
  memoryMB: number;
}): CostMeasurement {
  const rpcCost = estimateRPCCost(params.rpcCalls);
  const apiCost = estimateAPICost(params.apiCalls);
  const computeCost = estimateComputeCost(params.durationMs, params.memoryMB);

  const costSOL = rpcCost + apiCost + computeCost;
  const LAMPORTS_PER_SOL = 1_000_000_000;

  return {
    serviceId: params.serviceId,
    timestamp: Date.now(),
    costLamports: Math.round(costSOL * LAMPORTS_PER_SOL),
    costSOL,
    components: {
      rpcCalls: rpcCost,
      externalAPIs: apiCost,
      compute: computeCost,
      storage: 0, // Negligible for current usage
    },
  };
}
