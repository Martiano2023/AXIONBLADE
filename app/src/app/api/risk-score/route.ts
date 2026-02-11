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
  // In production this would call the risk engine
  return NextResponse.json(
    {
      pool,
      score: 78,
      level: "Medium",
      confidence: 87.5,
      evidenceFamilies: {
        liquidity: 82,
        volatility: 71,
        incentive: 68,
        smartContract: 85,
        protocol: 90,
      },
      timestamp: Date.now(),
      proofHash:
        "0x" +
        Array.from({ length: 40 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join(""),
      source: "noumen-v3.2.3",
    },
    { headers: corsHeaders }
  );
}
