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

  // Free tier cannot access effective-apr
  if (tier === "free") {
    return NextResponse.json(
      { error: "Effective APR is not available on the free tier. Upgrade at noumen.app/settings" },
      {
        status: 403,
        headers: { ...corsHeaders, "X-RateLimit-Remaining": String(rateCheck.remaining) },
      }
    );
  }

  // Mock but realistic data
  // In production this would call APOLLO's Effective APR module
  const headlineAPR = 24.5;
  const effectiveAPR = 18.2;
  const delta = headlineAPR - effectiveAPR;
  const deltaPercentage = (delta / headlineAPR) * 100;

  const responseHeaders = {
    ...corsHeaders,
    "X-RateLimit-Remaining": String(rateCheck.remaining),
  };

  // PRO tier: base effective APR data
  if (tier === "pro") {
    return NextResponse.json(
      {
        pool,
        headlineAPR,
        effectiveAPR,
        delta: parseFloat(delta.toFixed(2)),
        deltaPercentage: parseFloat(deltaPercentage.toFixed(2)),
        confidence: 91.3,
        timestamp: Date.now(),
        tier: "pro",
      },
      { headers: responseHeaders }
    );
  }

  // Protocol tier: full response with additional breakdown
  return NextResponse.json(
    {
      pool,
      headlineAPR,
      effectiveAPR,
      delta: parseFloat(delta.toFixed(2)),
      deltaPercentage: parseFloat(deltaPercentage.toFixed(2)),
      confidence: 91.3,
      components: {
        feeAPR: 12.8,
        incentiveAPR: 11.7,
        ilDrag: -5.3,
        compoundingEffect: 0.8,
      },
      timestamp: Date.now(),
      tier: "protocol",
    },
    { headers: responseHeaders }
  );
}
