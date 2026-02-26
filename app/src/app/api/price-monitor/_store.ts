// ---------------------------------------------------------------------------
// Price Monitor — In-Memory State Store
// ---------------------------------------------------------------------------
// Shared module that holds the mutable price state across all price-monitor
// API route handlers within the same Node.js process. Because Next.js API
// routes run in the same process (per deployment instance), module-level
// singletons persist between requests.
//
// In production this would be replaced by a persistent store (Redis, Postgres,
// or an on-chain PDA) so that multiple serverless instances stay in sync.
// For the demo / prototype phase this in-memory approach is sufficient.
// ---------------------------------------------------------------------------

import {
  getAllServiceIds,
  getServiceBasePrice,
  getServiceCost,
  getPriceFloor,
} from "@/lib/pricing-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServiceId = ReturnType<typeof getAllServiceIds>[number];

export interface ServicePriceState {
  /** Canonical service identifier from pricing-engine */
  serviceId: ServiceId;
  /** Human-readable display label */
  displayName: string;
  /** Measured operational cost per call (SOL) */
  baseCost: number;
  /** Absolute floor — never go below this (cost × 2.0, 100% margin) */
  floorPrice: number;
  /** Target ceiling — ideal price at full demand (cost × 3.0, 200% margin) */
  targetPrice: number;
  /** Current live price, adjusted every 4h by the demand engine */
  currentPrice: number;
  /** ISO-8601 timestamp of the last autonomous adjustment */
  lastAdjusted: string;
  /** ISO-8601 timestamp of when the next adjustment is scheduled */
  nextAdjustment: string;
  /** Most recent demand score (0-1) used to set currentPrice */
  lastDemandScore: number;
}

export interface AdjustmentRecord {
  /** Sequential adjustment index within the current process lifetime */
  id: number;
  /** ISO-8601 timestamp when the adjustment ran */
  adjustedAt: string;
  /** Which prices changed (service, oldPrice, newPrice, demand) */
  changes: Array<{
    serviceId: ServiceId;
    displayName: string;
    oldPrice: number;
    newPrice: number;
    demand: number;
  }>;
  /** Total number of services whose price actually moved */
  servicesAdjusted: number;
}

// ---------------------------------------------------------------------------
// Display name mapping
// ---------------------------------------------------------------------------

const DISPLAY_NAMES: Record<ServiceId, string> = {
  walletScan:      "Wallet Scanner",
  basic:           "Basic Analysis",
  pro:             "Pro Analysis",
  institutional:   "Institutional",
  poolAnalyzer:    "Pool Analyzer",
  protocolAuditor: "Protocol Auditor",
  yieldOptimizer:  "Yield Optimizer",
  tokenDeepDive:   "Token Deep Dive",
  aeonMonthly:     "AEON Monthly",
  hermesPerTx:     "HERMES / TX",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Round to 8 significant decimal places (SOL precision). */
function roundSol(v: number): number {
  return Math.round(v * 1_000_000_00) / 1_000_000_00;
}

/** Compute the ISO-8601 timestamp for 4 hours from now. */
function fourHoursFromNow(from: Date = new Date()): string {
  return new Date(from.getTime() + 4 * 60 * 60 * 1_000).toISOString();
}

// ---------------------------------------------------------------------------
// Initial state — starts every service at its target price (200% margin)
// ---------------------------------------------------------------------------

function buildInitialState(): Map<ServiceId, ServicePriceState> {
  const map = new Map<ServiceId, ServicePriceState>();
  const ids = getAllServiceIds();
  const now = new Date();

  for (const id of ids) {
    const cost        = getServiceCost(id);
    const floor       = getPriceFloor(id);
    const target      = getServiceBasePrice(id); // BASE_PRICES = cost × 3.0

    map.set(id, {
      serviceId:       id,
      displayName:     DISPLAY_NAMES[id] ?? id,
      baseCost:        cost,
      floorPrice:      floor,
      targetPrice:     target,
      currentPrice:    target,              // starts at target (200% margin)
      lastAdjusted:    now.toISOString(),
      nextAdjustment:  fourHoursFromNow(now),
      lastDemandScore: 1.0,                 // assumes full demand at start
    });
  }

  return map;
}

// ---------------------------------------------------------------------------
// Singleton stores (module-level — survive across requests in same process)
// ---------------------------------------------------------------------------

/** Live prices per service, mutated on every /adjust call. */
export const currentPrices: Map<ServiceId, ServicePriceState> =
  buildInitialState();

/** Rolling log of the last 50 adjustment runs. */
export const adjustmentHistory: AdjustmentRecord[] = [];

/** Monotonically increasing adjustment counter. */
let adjustmentCounter = 0;

// ---------------------------------------------------------------------------
// State mutation helpers
// ---------------------------------------------------------------------------

/**
 * Apply a batch of price changes atomically (from /adjust handler).
 * Updates currentPrices in-place and prepends a record to adjustmentHistory.
 */
export function applyAdjustments(
  changes: AdjustmentRecord["changes"],
  now: Date = new Date()
): AdjustmentRecord {
  const nextTime = fourHoursFromNow(now);

  for (const change of changes) {
    const state = currentPrices.get(change.serviceId);
    if (!state) continue;

    state.currentPrice    = change.newPrice;
    state.lastAdjusted    = now.toISOString();
    state.nextAdjustment  = nextTime;
    state.lastDemandScore = change.demand;
  }

  const record: AdjustmentRecord = {
    id:                ++adjustmentCounter,
    adjustedAt:        now.toISOString(),
    changes,
    servicesAdjusted:  changes.filter((c) => c.oldPrice !== c.newPrice).length,
  };

  // Prepend and cap history at 50 entries
  adjustmentHistory.unshift(record);
  if (adjustmentHistory.length > 50) adjustmentHistory.pop();

  return record;
}

/**
 * Apply a ±5% random walk to a single service price (used by GET /price-monitor
 * to simulate "live" demand without running the full 4h adjustment cycle).
 * Returns the new price, already clamped to [floor, target].
 */
export function applyRandomWalk(id: ServiceId): number {
  const state = currentPrices.get(id);
  if (!state) return 0;

  // ±5% random delta
  const delta = (Math.random() * 0.10) - 0.05; // range: -0.05 to +0.05
  const raw   = state.currentPrice * (1 + delta);
  const clamped = roundSol(Math.min(state.targetPrice, Math.max(state.floorPrice, raw)));

  state.currentPrice = clamped;
  return clamped;
}
