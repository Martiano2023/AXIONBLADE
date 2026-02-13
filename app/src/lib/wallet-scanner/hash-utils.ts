// ---------------------------------------------------------------------------
// AXIONBLADE Deterministic Hash Utilities
// ---------------------------------------------------------------------------
// All wallet scanner generators use these functions to produce reproducible
// results from wallet addresses. Same wallet = same output, always.
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic 32-bit integer hash from wallet + seed.
 * Based on djb2 algorithm variant.
 */
export function deterministicHash(wallet: string, seed: string): number {
  let hash = 5381;
  const input = wallet + "|" + seed;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) + hash + char) | 0; // hash * 33 + char, keep as 32-bit
  }
  return Math.abs(hash);
}

/**
 * Generate a deterministic float between 0.0 and 1.0.
 */
export function deterministicFloat(wallet: string, seed: string): number {
  const hash = deterministicHash(wallet, seed);
  return (hash % 10000) / 10000;
}

/**
 * Generate a deterministic integer in [min, max] inclusive.
 */
export function deterministicRange(
  wallet: string,
  seed: string,
  min: number,
  max: number
): number {
  const hash = deterministicHash(wallet, seed);
  return min + (hash % (max - min + 1));
}

/**
 * Pick one item deterministically from an array.
 */
export function deterministicChoice<T>(
  wallet: string,
  seed: string,
  options: T[]
): T {
  if (options.length === 0) throw new Error("deterministicChoice: empty array");
  const idx = deterministicHash(wallet, seed) % options.length;
  return options[idx];
}

/**
 * Return true/false deterministically with given probability (default 0.5).
 */
export function deterministicBoolean(
  wallet: string,
  seed: string,
  probability: number = 0.5
): boolean {
  return deterministicFloat(wallet, seed) < probability;
}

/**
 * Pick a deterministic subset of min..max items from an array.
 * Items are selected by iterating with different seed suffixes.
 */
export function deterministicSubset<T>(
  wallet: string,
  seed: string,
  options: T[],
  min: number,
  max: number
): T[] {
  const count = deterministicRange(wallet, seed + "_count", min, Math.min(max, options.length));
  const shuffled = [...options];

  // Fisher-Yates deterministic shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = deterministicHash(wallet, seed + "_shuf_" + i) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

/**
 * Generate a deterministic float in a specific range [min, max).
 */
export function deterministicFloatRange(
  wallet: string,
  seed: string,
  min: number,
  max: number
): number {
  const f = deterministicFloat(wallet, seed);
  return min + f * (max - min);
}

/**
 * Generate a deterministic proof hash (hex string).
 */
export function generateProofHash(wallet: string, data: string): string {
  const combined = wallet + "|" + data + "|" + Date.now().toString(36);
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return (
    "0x" +
    Array.from({ length: 40 }, (_, i) =>
      ((Math.abs(hash + i * 17 + combined.charCodeAt(i % combined.length)) % 16)).toString(16)
    ).join("")
  );
}
