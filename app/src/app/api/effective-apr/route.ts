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
  // In production this would call APOLLO's Effective APR module
  const headlineAPR = 24.5;
  const effectiveAPR = 18.2;
  const delta = headlineAPR - effectiveAPR;
  const deltaPercentage = (delta / headlineAPR) * 100;

  return NextResponse.json(
    {
      pool,
      headlineAPR,
      effectiveAPR,
      delta: parseFloat(delta.toFixed(2)),
      deltaPercentage: parseFloat(deltaPercentage.toFixed(2)),
      confidence: 91.3,
      timestamp: Date.now(),
    },
    { headers: corsHeaders }
  );
}
