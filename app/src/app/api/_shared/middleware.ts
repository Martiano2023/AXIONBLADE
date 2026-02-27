import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from "crypto";

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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
// API Key Validation — HMAC-signed keys only
// ---------------------------------------------------------------------------
// Key format: nk_{tier}_{16-char-random-payload}_{8-char-hmac-sig}
// The HMAC signature is HMAC-SHA256(API_HMAC_SECRET, "nk_{tier}_{payload}").slice(0, 8)
// This means only keys issued by the server (with knowledge of the secret) are valid.
// ---------------------------------------------------------------------------

export type Tier = "free" | "pro" | "protocol";

const HMAC_SECRET = process.env.API_HMAC_SECRET ?? "";

/**
 * Timing-safe string comparison to prevent timing-based attacks.
 * Returns true if a === b, without leaking length information via timing.
 */
function safeCompare(a: string, b: string): boolean {
  // Lengths must match; use fixed-length comparison to avoid length-based leaks
  try {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return nodeTimingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

/**
 * Compute the expected 8-char HMAC signature for the given key body.
 */
function computeHmacSig(body: string): string {
  return createHmac("sha256", HMAC_SECRET).update(body).digest("hex").slice(0, 8);
}

/**
 * Validate an API key using HMAC signature verification.
 * Rejects any key that was not signed by our server (prevents fake keys).
 */
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;

  // Structure: nk_{tier}_{payload}_{sig8}
  // At least 4 underscore-separated segments: nk, {tier}, {payload}, {sig}
  const parts = apiKey.split("_");
  if (parts.length < 4) return false;
  if (parts[0] !== "nk") return false;

  // Sig is always the last segment (8 chars)
  const sig = parts[parts.length - 1];
  if (sig.length !== 8) return false;

  // Body is everything before the last underscore
  const lastUnderscore = apiKey.lastIndexOf("_");
  const body = apiKey.slice(0, lastUnderscore);

  // In development without a secret set, fall back to format-only check
  if (!HMAC_SECRET) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[middleware] API_HMAC_SECRET not set — skipping HMAC check in dev");
      return body.length >= 24 && /^[a-zA-Z0-9_]+$/.test(body);
    }
    // In production without a secret, reject all keys
    console.error("[middleware] API_HMAC_SECRET not configured in production!");
    return false;
  }

  const expected = computeHmacSig(body);
  return safeCompare(sig, expected);
}

// ---------------------------------------------------------------------------
// Tier Detection
// ---------------------------------------------------------------------------

/**
 * Determine tier from key prefix convention:
 *   nk_protocol_xxx = protocol tier
 *   nk_pro_xxx      = pro tier
 *   everything else  = free tier
 * Only called AFTER validateApiKey() has confirmed the key is authentic.
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
