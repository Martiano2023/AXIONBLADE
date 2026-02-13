import { NextRequest, NextResponse } from "next/server";
import {
  getCorsHeaders,
  checkRateLimit,
  validateApiKey,
  isValidSolanaAddress,
  getTierFromKey,
} from "../_shared/middleware";

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  const pool = request.nextUrl.searchParams.get("pool");

  if (!pool) {
    return NextResponse.json(
      { error: "Missing pool parameter" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!isValidSolanaAddress(pool)) {
    return NextResponse.json(
      { error: "Invalid pool address. Expected a Solana base-58 address (32-44 characters)." },
      { status: 400, headers: corsHeaders }
    );
  }

  const apiKey = request.headers.get("x-api-key");
  if (!validateApiKey(apiKey)) {
    return NextResponse.json(
      { error: "Invalid or missing API key. Get one at axionblade.app/settings" },
      { status: 401, headers: corsHeaders }
    );
  }

  const tier = getTierFromKey(apiKey!);

  // Rate limit by API key (tier-aware)
  const rateCheck = checkRateLimit(apiKey!, tier);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: { ...corsHeaders, "X-RateLimit-Remaining": "0" },
      }
    );
  }

  // Mock but realistic data
  // In production this would call the risk engine
  const fullResponse = {
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
    riskDrivers: [
      "Concentrated liquidity in top 3 positions (62%)",
      "Incentive emission declining 8% weekly",
      "Volume-to-TVL ratio below 0.15 threshold",
    ],
    aiNarrative: "Pool shows moderate risk primarily driven by liquidity concentration and declining incentives. Fee revenue stable but dependent on volume recovery.",
    proofHash:
      "0x" +
      Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(""),
    timestamp: Date.now(),
    source: "axionblade-v3.2.3",
  };

  const responseHeaders = {
    ...corsHeaders,
    "X-RateLimit-Remaining": String(rateCheck.remaining),
  };

  // Tier-based response filtering
  // FREE: no evidence families, risk drivers, confidence, AI narrative, or proof hash
  if (tier === "free") {
    return NextResponse.json(
      {
        pool: fullResponse.pool,
        score: fullResponse.score,
        level: fullResponse.level,
        timestamp: fullResponse.timestamp,
        source: fullResponse.source,
        tier: "free",
      },
      { headers: responseHeaders }
    );
  }

  // PRO: everything except comparative analysis fields
  if (tier === "pro") {
    return NextResponse.json(
      {
        pool: fullResponse.pool,
        score: fullResponse.score,
        level: fullResponse.level,
        confidence: fullResponse.confidence,
        evidenceFamilies: fullResponse.evidenceFamilies,
        riskDrivers: fullResponse.riskDrivers,
        aiNarrative: fullResponse.aiNarrative,
        proofHash: fullResponse.proofHash,
        timestamp: fullResponse.timestamp,
        source: fullResponse.source,
        tier: "pro",
      },
      { headers: responseHeaders }
    );
  }

  // Protocol/Institutional: full response
  return NextResponse.json(
    {
      ...fullResponse,
      tier: "protocol",
    },
    { headers: responseHeaders }
  );
}
