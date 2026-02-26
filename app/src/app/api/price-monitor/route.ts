// ---------------------------------------------------------------------------
// GET /api/price-monitor
// ---------------------------------------------------------------------------
// Returns the current live prices for all services.
//
// Each service entry includes:
//   serviceId       — canonical key from pricing-engine
//   displayName     — human-readable label
//   currentPrice    — live SOL price (starts at targetPrice, random walk ±5%)
//   baseCost        — measured operational cost per call
//   floorPrice      — hard minimum (cost × 2.0, 100% margin)
//   targetPrice     — demand ceiling (cost × 3.0, 200% margin)
//   margin          — actual margin % at currentPrice  ((price-cost)/cost × 100)
//   lastAdjusted    — ISO-8601 timestamp of last autonomous adjustment
//   nextAdjustment  — ISO-8601 timestamp of next scheduled adjustment (4h after last)
//   lastDemandScore — 0-1 demand signal used by the last adjustment cycle
//   priceStatus     — "target" | "interpolated" | "floor" for UI colour-coding
//
// No authentication required — prices are public information.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { currentPrices, applyRandomWalk, type ServicePriceState } from "./_store";

// ---------------------------------------------------------------------------
// Price status helper
// ---------------------------------------------------------------------------

/**
 * Classify a service's live price relative to its floor and target so that
 * the UI can apply colour-coding without re-implementing the same logic.
 *
 *   "target"       — at or above 99% of targetPrice (green)
 *   "floor"        — at or below 101% of floorPrice (red)
 *   "interpolated" — somewhere between floor and target (amber)
 */
function getPriceStatus(state: ServicePriceState): "target" | "interpolated" | "floor" {
  const atTarget = state.currentPrice >= state.targetPrice * 0.99;
  const atFloor  = state.currentPrice <= state.floorPrice * 1.01;

  if (atTarget) return "target";
  if (atFloor)  return "floor";
  return "interpolated";
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    // Apply a ±5% random walk to each service to simulate live demand signal.
    // This runs on every GET so the UI always shows fresh-ish data between cron
    // cycles. The random walk is bounded by [floorPrice, targetPrice].
    const services = Array.from(currentPrices.values()).map((state) => {
      // Mutate the in-memory state with a small random walk
      const livePrice = applyRandomWalk(state.serviceId);

      // Recalculate derived fields after the walk
      const margin = ((livePrice - state.baseCost) / state.baseCost) * 100;

      return {
        serviceId:       state.serviceId,
        displayName:     state.displayName,
        currentPrice:    livePrice,
        baseCost:        state.baseCost,
        floorPrice:      state.floorPrice,
        targetPrice:     state.targetPrice,
        margin:          Math.round(margin * 10) / 10, // 1 decimal place
        lastAdjusted:    state.lastAdjusted,
        nextAdjustment:  state.nextAdjustment,
        lastDemandScore: state.lastDemandScore,
        priceStatus:     getPriceStatus({ ...state, currentPrice: livePrice }),
      };
    });

    return NextResponse.json(
      {
        ok:        true,
        fetchedAt: new Date().toISOString(),
        count:     services.length,
        services,
      },
      {
        headers: {
          // Prevent upstream CDN caching — prices change every 4h but we want
          // the client to always see the latest random-walk value.
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[price-monitor] GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch price data" },
      { status: 500 }
    );
  }
}
