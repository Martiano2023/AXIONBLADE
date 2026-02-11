import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  "X-RateLimit-Remaining": "99",
};

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const pool = request.nextUrl.searchParams.get("pool");

  if (!pool) {
    return NextResponse.json(
      { error: "Missing pool parameter" },
      { status: 400, headers: corsHeaders }
    );
  }

  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key required. Get one at noumen.app/settings" },
      { status: 401, headers: corsHeaders }
    );
  }

  // Mock but realistic data
  // In production this would call APOLLO's MLI module
  return NextResponse.json(
    {
      pool,
      status: "suspicious" as "healthy" | "suspicious" | "trap",
      confidence: 76.4,
      reasons: [
        "Headline APR diverges >30% from effective APR",
        "Incentive emissions declining at 12% weekly rate",
        "TVL concentration: top 3 wallets hold 68% of pool liquidity",
      ],
      headlineAPR: 142.5,
      effectiveAPR: 23.8,
      timestamp: Date.now(),
    },
    { headers: corsHeaders }
  );
}
