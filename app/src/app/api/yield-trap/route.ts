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
      { error: "Invalid or missing API key. Get one at noumen.app/settings" },
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

  // Free tier cannot access yield-trap
  if (tier === "free") {
    return NextResponse.json(
      { error: "Yield Trap detection is not available on the free tier. Upgrade at noumen.app/settings" },
      {
        status: 403,
        headers: { ...corsHeaders, "X-RateLimit-Remaining": String(rateCheck.remaining) },
      }
    );
  }

  const responseHeaders = {
    ...corsHeaders,
    "X-RateLimit-Remaining": String(rateCheck.remaining),
  };

  // Mock but realistic data
  // In production this would call APOLLO's MLI module
  // PRO tier: base yield trap assessment
  if (tier === "pro") {
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
        tier: "pro",
      },
      { headers: responseHeaders }
    );
  }

  // Protocol tier: full response with additional detail
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
      evidenceFamilies: {
        price: "neutral",
        liquidity: "warning",
        behavior: "alert",
        incentive: "alert",
        protocol: "neutral",
      },
      riskDrivers: [
        "Emission schedule unsustainable beyond 14 days",
        "Whale concentration risk above 60% threshold",
      ],
      timestamp: Date.now(),
      tier: "protocol",
    },
    { headers: responseHeaders }
  );
}
