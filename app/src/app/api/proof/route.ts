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
  const hash = request.nextUrl.searchParams.get("hash");

  if (!hash) {
    return NextResponse.json(
      { error: "Missing hash parameter" },
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
  // In production this would look up the proof PDA on-chain
  const mockTxSig = Array.from({ length: 88 }, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
      Math.floor(Math.random() * 62)
    )
  ).join("");

  return NextResponse.json(
    {
      hash,
      poolAddress: "So11111111111111111111111111111111111111112",
      score: 78,
      level: "Medium",
      tier: "Premium",
      mintedAt: Date.now() - 3600000,
      blockNumber: 284_521_337,
      explorer: `https://explorer.solana.com/tx/${mockTxSig}`,
    },
    { headers: corsHeaders }
  );
}
