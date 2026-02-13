import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

export function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = ["https://axionblade.app", "https://www.axionblade.app"];
  // Allow localhost in dev
  if (process.env.NODE_ENV === "development") {
    allowed.push("http://localhost:3000", "http://localhost:3001");
  }
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  };
}

// ---------------------------------------------------------------------------
// Rate Limiting (simple in-memory store -- suitable for dev / prototype)
// ---------------------------------------------------------------------------

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Tier-aware rate limits:
 *   free:     2 requests / day     (86_400_000 ms window)
 *   pro:      100 requests / hour  (3_600_000 ms window)
 *   protocol: 10,000 requests / month (approx 30 days = 2_592_000_000 ms)
 */
const TIER_RATE_LIMITS: Record<Tier, { limit: number; windowMs: number }> = {
  free:     { limit: 2,      windowMs: 86_400_000 },
  pro:      { limit: 100,    windowMs: 3_600_000 },
  protocol: { limit: 10_000, windowMs: 2_592_000_000 },
};

export function checkRateLimit(key: string, tier: Tier = "free"): {
  allowed: boolean;
  remaining: number;
} {
  const { limit, windowMs } = TIER_RATE_LIMITS[tier];
  const now = Date.now();
  const record = rateLimitStore.get(key);
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  record.count++;
  const remaining = Math.max(0, limit - record.count);
  return { allowed: record.count <= limit, remaining };
}

// ---------------------------------------------------------------------------
// API Key Validation
// ---------------------------------------------------------------------------

export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;
  // API keys must be 32+ chars, alphanumeric with hyphens/underscores
  if (apiKey.length < 32) return false;
  if (!/^[a-zA-Z0-9\-_]+$/.test(apiKey)) return false;
  // In production, this would check against a database of issued keys
  // For devnet beta, accept well-formed keys
  return true;
}

// ---------------------------------------------------------------------------
// Tier Detection
// ---------------------------------------------------------------------------

export type Tier = "free" | "pro" | "protocol";

/**
 * Determine tier from key prefix convention:
 *   nk_protocol_xxx = protocol tier
 *   nk_pro_xxx      = pro tier
 *   everything else  = free tier
 */
export function getTierFromKey(apiKey: string): Tier {
  if (apiKey.startsWith("nk_protocol_")) return "protocol";
  if (apiKey.startsWith("nk_pro_")) return "pro";
  return "free";
}

// ---------------------------------------------------------------------------
// Input Validation
// ---------------------------------------------------------------------------

/** Validate a Solana base-58 address (32-44 chars, base-58 alphabet). */
export function isValidSolanaAddress(addr: string): boolean {
  if (addr.length < 32 || addr.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(addr);
}

/** Validate a hex proof hash (0x prefix + 40 hex chars). */
export function isValidProofHash(hash: string): boolean {
  return /^0x[0-9a-fA-F]{40,64}$/.test(hash);
}
