// ---------------------------------------------------------------------------
// POST /api/price-monitor/adjust
// ---------------------------------------------------------------------------
// The 4-hour autonomous price adjustment cron job.
//
// Called by Vercel Cron (schedule: "0 */4 * * *") with:
//   Body:    { "trigger": "cron" }
//   Header:  x-cron-secret: <CRON_SECRET env var>
//
// Algorithm per service:
//   1. Generate mock demand metrics: requestCount24h (Poisson-ish) + trend7d
//   2. Compute demand score ∈ [0, 1]:
//        score = 0.6 × normalise(requestCount24h) + 0.4 × normaliseTrend(trend7d)
//   3. Map score to price:
//        demand > 0.70  →  targetPrice  (200% margin — high demand, hold ceiling)
//        demand 0.40–0.70 →  linear interpolation between floor and target
//        demand < 0.40  →  floorPrice   (100% margin — low demand, compete on price)
//   4. Always enforce: price = max(calculated, floorPrice)  ← axiom A0-8 equivalent
//   5. Persist changes to the shared in-memory store
//
// Security:
//   • Requires header x-cron-secret matching process.env.CRON_SECRET
//   • In development (CRON_SECRET not set) the check is bypassed with a warning
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import {
  currentPrices,
  applyAdjustments,
  type ServiceId,
  type AdjustmentRecord,
} from "../_store";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEMAND_HIGH_THRESHOLD = 0.70;
const DEMAND_LOW_THRESHOLD  = 0.40;

// Mock baseline request counts per service (requests per 24h at "normal" load).
// These would come from real analytics / on-chain usage PDAs in production.
const BASELINE_REQUESTS_24H: Record<ServiceId, number> = {
  walletScan:      120,
  basic:           300,
  pro:             80,
  institutional:   15,
  poolAnalyzer:    200,
  protocolAuditor: 60,
  yieldOptimizer:  90,
  tokenDeepDive:   50,
  aeonMonthly:     25,
  hermesPerTx:     400,
};

// ---------------------------------------------------------------------------
// Demand signal simulation
// ---------------------------------------------------------------------------

/**
 * Simulate 24h request count by adding Gaussian-ish noise to the baseline.
 * Uses Box-Muller so the distribution is realistic without external deps.
 */
function simulateRequestCount24h(serviceId: ServiceId): number {
  const baseline = BASELINE_REQUESTS_24H[serviceId] ?? 100;
  // Box-Muller transform for normally distributed noise
  const u1 = Math.random();
  const u2 = Math.random();
  const stdNormal = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
  // ±30% std deviation around baseline
  const count = Math.round(baseline + stdNormal * baseline * 0.30);
  return Math.max(0, count);
}

/**
 * Simulate a 7-day trend as a percentage: -0.30 to +0.30 (−30% to +30%).
 * Positive trend means demand is growing; negative means shrinking.
 */
function simulateTrend7d(): number {
  // Slight positive bias (growth-stage product)
  return (Math.random() * 0.60) - 0.20; // range: -0.20 to +0.40
}

/**
 * Normalise a request count to 0-1 using the service's baseline.
 * A count at 2× baseline → 1.0; at 0 → 0.0.
 */
function normaliseCount(count: number, baseline: number): number {
  if (baseline <= 0) return 0.5;
  return Math.min(1.0, count / (baseline * 2));
}

/**
 * Normalise a trend value (-1 to +1) to 0-1 score.
 * A trend of +1.0 maps to 1.0; -1.0 maps to 0.0.
 */
function normaliseTrend(trend: number): number {
  return Math.min(1.0, Math.max(0.0, (trend + 1.0) / 2.0));
}

/**
 * Compute composite demand score ∈ [0, 1]:
 *   60% weight on 24h volume, 40% weight on 7d trend.
 */
function computeDemandScore(serviceId: ServiceId): {
  score: number;
  requestCount24h: number;
  trend7d: number;
} {
  const requestCount24h = simulateRequestCount24h(serviceId);
  const trend7d         = simulateTrend7d();
  const baseline        = BASELINE_REQUESTS_24H[serviceId] ?? 100;

  const countScore  = normaliseCount(requestCount24h, baseline);
  const trendScore  = normaliseTrend(trend7d);
  const score       = 0.6 * countScore + 0.4 * trendScore;

  return { score, requestCount24h, trend7d };
}

// ---------------------------------------------------------------------------
// Price calculation
// ---------------------------------------------------------------------------

/**
 * Map a demand score to a concrete price between floor and target.
 *
 *   demand >= HIGH_THRESHOLD → targetPrice   (hold the ceiling)
 *   demand <  LOW_THRESHOLD  → floorPrice    (drop to floor)
 *   otherwise                → linear interpolation
 *
 * Always enforces: result >= floorPrice  (equivalent to axiom A0-8's cost floor)
 */
function demandToPrice(
  demand: number,
  floorPrice: number,
  targetPrice: number
): number {
  let price: number;

  if (demand >= DEMAND_HIGH_THRESHOLD) {
    price = targetPrice;
  } else if (demand < DEMAND_LOW_THRESHOLD) {
    price = floorPrice;
  } else {
    // Linear interpolation in the 0.40–0.70 band
    const t = (demand - DEMAND_LOW_THRESHOLD) / (DEMAND_HIGH_THRESHOLD - DEMAND_LOW_THRESHOLD);
    price = floorPrice + t * (targetPrice - floorPrice);
  }

  // Hard floor enforcement — never go below cost × 2.0
  return Math.max(price, floorPrice);
}

/** Round SOL price to 8 decimal places. */
function roundSol(v: number): number {
  return Math.round(v * 1_000_000_00) / 1_000_000_00;
}

// ---------------------------------------------------------------------------
// Request body type
// ---------------------------------------------------------------------------

interface AdjustRequestBody {
  trigger: "cron";
}

// ---------------------------------------------------------------------------
// Security helper
// ---------------------------------------------------------------------------

/**
 * Validate the x-cron-secret header using a constant-time comparison.
 * Returns true if the request is authorised to trigger an adjustment.
 */
function isAuthorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[price-monitor/adjust] CRON_SECRET not set — skipping auth in dev");
      return true;
    }
    console.error("[price-monitor/adjust] CRON_SECRET not configured in production!");
    return false;
  }

  const provided = request.headers.get("x-cron-secret") ?? "";

  // Constant-time comparison to prevent timing attacks
  if (provided.length !== secret.length) return false;
  let mismatch = 0;
  for (let i = 0; i < secret.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return mismatch === 0;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. Authentication ────────────────────────────────────────────────────
  if (!isAuthorised(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorised — valid x-cron-secret required" },
      { status: 401 }
    );
  }

  // ── 2. Parse and validate body ───────────────────────────────────────────
  let body: AdjustRequestBody;
  try {
    body = (await request.json()) as AdjustRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (body.trigger !== "cron") {
    return NextResponse.json(
      { ok: false, error: 'Invalid trigger — expected { "trigger": "cron" }' },
      { status: 400 }
    );
  }

  // ── 3. Run adjustment loop ───────────────────────────────────────────────
  const now = new Date();
  const changes: AdjustmentRecord["changes"] = [];

  for (const [serviceId, state] of currentPrices.entries()) {
    const { score, requestCount24h, trend7d } = computeDemandScore(serviceId);
    const oldPrice = state.currentPrice;
    const newPrice = roundSol(demandToPrice(score, state.floorPrice, state.targetPrice));

    // Only track if price actually moved (avoids noise in the change log)
    changes.push({
      serviceId,
      displayName:     state.displayName,
      oldPrice,
      newPrice,
      demand:          Math.round(score * 1000) / 1000, // 3 decimal places
    });

    // Log for operator visibility (captured by Vercel function logs)
    console.info(
      `[price-monitor/adjust] ${serviceId}: ${oldPrice.toFixed(8)} → ${newPrice.toFixed(8)} | ` +
      `demand=${score.toFixed(3)} requests24h=${requestCount24h} trend7d=${(trend7d * 100).toFixed(1)}%`
    );
  }

  // ── 4. Persist to store ───────────────────────────────────────────────────
  const record = applyAdjustments(changes, now);

  // ── 5. Return response ───────────────────────────────────────────────────
  return NextResponse.json(
    {
      ok:               true,
      adjusted:         record.servicesAdjusted > 0,
      adjustedAt:       record.adjustedAt,
      servicesAdjusted: record.servicesAdjusted,
      nextAdjustment:   new Date(now.getTime() + 4 * 60 * 60 * 1_000).toISOString(),
      changes:          record.changes,
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
