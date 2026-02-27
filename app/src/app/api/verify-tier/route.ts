// ---------------------------------------------------------------------------
// AXIONBLADE Tier Verification API — Server-Side On-Chain Verification
// ---------------------------------------------------------------------------
// POST /api/verify-tier
// Body: { service: "apollo" | "hermes", txSignature: string }
//
// Returns: { verified: boolean, tier: string, expiry: number, error?: string }
//
// Security:
// - Fetches the transaction from Solana mainnet RPC
// - Verifies tx is confirmed (not failed)
// - Verifies tx is not older than MAX_TX_AGE_DAYS
// - Verifies SOL was transferred to the treasury wallet
// - Verifies amount matches the service price
// - Anti-replay: rejects signatures already used (in-memory, use Redis in prod)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { getCorsHeaders, checkRateLimit } from "../_shared/middleware";
import { TREASURY_WALLET } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const LAMPORTS_PER_SOL = 1_000_000_000;
const MAX_TX_AGE_DAYS = 90; // reject tx older than 90 days
const TIER_DURATION_DAYS = 30; // paid tier lasts 30 days

// Minimum payment per service (SOL)
const SERVICE_PRICES: Record<string, Record<string, number>> = {
  apollo: {
    basic:       0.005,
    pro:         0.025,
    institutional: 0.10,
  },
  hermes: {
    pro:      0.01,
    protocol: 0.05,
  },
};

// In-memory anti-replay store (replace with Redis in production)
const usedSignatures = new Set<string>();

function getConnection(): Connection {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
    process.env.NEXT_PUBLIC_RPC_URL ??
    "https://api.mainnet-beta.solana.com";
  return new Connection(rpcUrl, "confirmed");
}

// ---------------------------------------------------------------------------
// Route Handlers
// ---------------------------------------------------------------------------

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Rate limit: 5 verify attempts per IP per minute to prevent brute-force
  const { allowed } = checkRateLimit(`verify-tier:${clientIp}`, "pro");
  if (!allowed) {
    return NextResponse.json(
      { verified: false, error: "Rate limit exceeded — too many verification attempts" },
      { status: 429, headers: getCorsHeaders(request) }
    );
  }

  // Parse body
  let body: { service?: string; txSignature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { verified: false, error: "Invalid JSON body" },
      { status: 400, headers: getCorsHeaders(request) }
    );
  }

  const { service, txSignature } = body;

  // Validate inputs
  if (!service || !["apollo", "hermes"].includes(service)) {
    return NextResponse.json(
      { verified: false, error: "Invalid service — must be 'apollo' or 'hermes'" },
      { status: 400, headers: getCorsHeaders(request) }
    );
  }

  if (!txSignature || typeof txSignature !== "string" || txSignature.length < 64) {
    return NextResponse.json(
      { verified: false, error: "Invalid transaction signature" },
      { status: 400, headers: getCorsHeaders(request) }
    );
  }

  // Anti-replay check
  if (usedSignatures.has(txSignature)) {
    return NextResponse.json(
      { verified: false, error: "Transaction already used (replay attack rejected)" },
      { status: 409, headers: getCorsHeaders(request) }
    );
  }

  // ---------------------------------------------------------------------------
  // On-Chain Verification
  // ---------------------------------------------------------------------------
  try {
    const connection = getConnection();

    const tx = await connection.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    // Transaction must exist
    if (!tx || !tx.meta) {
      return NextResponse.json(
        { verified: false, error: "Transaction not found on-chain" },
        { status: 404, headers: getCorsHeaders(request) }
      );
    }

    // Transaction must have succeeded
    if (tx.meta.err) {
      return NextResponse.json(
        { verified: false, error: "Transaction failed on-chain" },
        { status: 422, headers: getCorsHeaders(request) }
      );
    }

    // Transaction must not be too old
    const blockTime = tx.blockTime;
    if (!blockTime) {
      return NextResponse.json(
        { verified: false, error: "Transaction has no block time" },
        { status: 422, headers: getCorsHeaders(request) }
      );
    }

    const ageDays = (Date.now() / 1000 - blockTime) / 86400;
    if (ageDays > MAX_TX_AGE_DAYS) {
      return NextResponse.json(
        { verified: false, error: `Transaction too old (>${MAX_TX_AGE_DAYS} days)` },
        { status: 422, headers: getCorsHeaders(request) }
      );
    }

    // Find treasury in account keys
    const treasuryIndex = tx.transaction.message.accountKeys.findIndex(
      (key) => key.pubkey.equals(TREASURY_WALLET)
    );

    if (treasuryIndex === -1) {
      return NextResponse.json(
        { verified: false, error: "Payment not directed to treasury wallet" },
        { status: 422, headers: getCorsHeaders(request) }
      );
    }

    // Calculate lamports transferred to treasury
    const preBalance = tx.meta.preBalances[treasuryIndex];
    const postBalance = tx.meta.postBalances[treasuryIndex];
    const transferredLamports = postBalance - preBalance;
    const transferredSOL = transferredLamports / LAMPORTS_PER_SOL;

    // Determine which tier was paid for
    const prices = SERVICE_PRICES[service];
    let grantedTier: string | null = null;

    // Check tiers from highest to lowest — grant highest tier whose price is met
    const tierOrder =
      service === "apollo"
        ? ["institutional", "pro", "basic"]
        : ["protocol", "pro"];

    for (const tier of tierOrder) {
      if (prices[tier] && transferredSOL >= prices[tier]) {
        grantedTier = tier;
        break;
      }
    }

    if (!grantedTier) {
      return NextResponse.json(
        {
          verified: false,
          error: `Insufficient payment: ${transferredSOL.toFixed(4)} SOL does not meet minimum for any tier`,
        },
        { status: 402, headers: getCorsHeaders(request) }
      );
    }

    // Mark signature as used (anti-replay)
    usedSignatures.add(txSignature);
    // Prune old entries if set grows too large
    if (usedSignatures.size > 20000) {
      const iter = usedSignatures.values();
      for (let i = 0; i < 2000; i++) {
        const { value } = iter.next();
        if (value) usedSignatures.delete(value);
      }
    }

    // Compute expiry timestamp
    const expiryTimestamp = Math.floor(Date.now() / 1000) + TIER_DURATION_DAYS * 86400;

    return NextResponse.json(
      {
        verified: true,
        tier: grantedTier,
        service,
        expiry: expiryTimestamp,
        amountSOL: transferredSOL,
        blockTime,
      },
      { status: 200, headers: getCorsHeaders(request) }
    );
  } catch (error) {
    console.error("[verify-tier] On-chain verification error:", error);
    return NextResponse.json(
      { verified: false, error: "On-chain verification failed — RPC error" },
      { status: 503, headers: getCorsHeaders(request) }
    );
  }
}
