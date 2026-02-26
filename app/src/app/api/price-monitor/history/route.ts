// ---------------------------------------------------------------------------
// GET /api/price-monitor/history
// ---------------------------------------------------------------------------
// Returns the last 24h of price adjustments from the in-memory log.
//
// Query params:
//   ?limit=N  — override default of 50, capped at 50
//
// Response shape:
//   {
//     ok:       boolean
//     fetchedAt: string (ISO-8601)
//     count:    number
//     history: AdjustmentRecord[]   — newest first
//   }
//
// The in-memory store holds at most 50 records (roughly 8.3 days at 4h cadence).
// Records older than 24h are filtered out so the UI only shows today's activity.
//
// No authentication required — adjustment history is public metadata.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { adjustmentHistory } from "../_store";

/** 24h in milliseconds */
const WINDOW_24H_MS = 24 * 60 * 60 * 1_000;

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = searchParams.get("limit");

    // Parse and clamp the limit parameter
    let limit = 50;
    if (rawLimit !== null) {
      const parsed = parseInt(rawLimit, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 50);
      }
    }

    const now    = Date.now();
    const cutoff = now - WINDOW_24H_MS;

    // Filter to last 24h and apply the requested limit
    // adjustmentHistory is already sorted newest-first (prepend in _store)
    const filtered = adjustmentHistory
      .filter((record) => new Date(record.adjustedAt).getTime() >= cutoff)
      .slice(0, limit);

    // Summary stats for the period — useful for the "Total adjustments today" metric
    const totalServicesChanged = filtered.reduce(
      (sum, r) => sum + r.servicesAdjusted,
      0
    );

    return NextResponse.json(
      {
        ok:                   true,
        fetchedAt:            new Date().toISOString(),
        count:                filtered.length,
        totalServicesChanged,
        history:              filtered,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[price-monitor/history] GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch adjustment history" },
      { status: 500 }
    );
  }
}
