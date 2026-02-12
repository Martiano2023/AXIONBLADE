import { NextRequest, NextResponse } from "next/server";
import {
  getCorsHeaders,
  checkRateLimit,
  validateApiKey,
  isValidProofHash,
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
  const hash = request.nextUrl.searchParams.get("hash");

  if (!hash) {
    return NextResponse.json(
      { error: "Missing hash parameter" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!isValidProofHash(hash)) {
    return NextResponse.json(
      { error: "Invalid proof hash. Expected format: 0x followed by 40-64 hex characters." },
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

  // Proofs are public -- available to all tiers

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
    {
      headers: {
        ...corsHeaders,
        "X-RateLimit-Remaining": String(rateCheck.remaining),
      },
    }
  );
}
