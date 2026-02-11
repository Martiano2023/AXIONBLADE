// ---------------------------------------------------------------------------
// NOUMEN Pyth Network Price Service Client
// ---------------------------------------------------------------------------
// Fetches real-time price data from the Pyth Network via the Hermes API.
// Provides SOL-ecosystem token prices for APOLLO risk assessments.
// ---------------------------------------------------------------------------

import { PriceServiceConnection } from "@pythnetwork/price-service-client";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Pyth Hermes beta endpoint (publicly accessible, no auth required) */
const PYTH_ENDPOINT = "https://hermes-beta.pyth.network";

/**
 * Real Pyth price feed IDs for tokens relevant to NOUMEN's monitored pools.
 * These are the actual hex-encoded feed IDs from the Pyth Network.
 */
export const PRICE_FEED_IDS: Record<string, string> = {
  "SOL/USD":
    "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  "RAY/USD":
    "0x91568baa8beb53db23eb3fb7f22c6e8bd303d103919e19733f2bb642d3e7987a",
  "ORCA/USD":
    "0x37505261e557e251290b1540c2c703092b2280bcf1de1e1e0aa3acda8510a028",
  "BONK/USD":
    "0x72b021217ca3fe68922a19aaf990109cb9d84e9ad004b4d2025ad6f529314419",
  "JTO/USD":
    "0xb43660a5f790c69354b0729a5ef9d50d68f1df92107540210b9cccba1f947cc2",
  "JUP/USD":
    "0x0a0408d619e9380abad35060f9192039ed5042fa6f82301d0e48bb52be830996",
  "MNDE/USD":
    "0x5765a4ee22be7d7dba8afab6532f1f6b3f53ae9c3e7e78b021b1a6fbb0178cb7",
  "mSOL/USD":
    "0xc2289a6a43d2ce91c6f55caec370f4acc38a2ed477f58813334c6d03749ff2a4",
};

/** Reverse mapping: feed ID -> symbol for quick lookups */
const FEED_ID_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.entries(PRICE_FEED_IDS).map(([symbol, id]) => [id, symbol])
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenPrice {
  symbol: string;
  price: number;
  confidence: number;
  timestamp: number;
  source: "pyth";
}

// ---------------------------------------------------------------------------
// Connection singleton
// ---------------------------------------------------------------------------

let connection: PriceServiceConnection | null = null;

function getConnection(): PriceServiceConnection {
  if (!connection) {
    connection = new PriceServiceConnection(PYTH_ENDPOINT, {
      priceFeedRequestConfig: { binary: false },
    });
  }
  return connection;
}

// ---------------------------------------------------------------------------
// Last known prices cache (used as fallback when Pyth is unreachable)
// ---------------------------------------------------------------------------

let lastKnownPrices: Record<string, TokenPrice> = {};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch current prices for the given symbols (or all tracked symbols).
 *
 * The function contacts the Pyth Hermes endpoint, parses each price feed
 * using the `expo` field (price = parseFloat(price_str) * 10^expo), and
 * returns a symbol-keyed map of `TokenPrice` objects.
 *
 * On failure, returns the last known prices. If no prices have ever been
 * fetched, returns fallback objects with zeroed values.
 */
export async function fetchPrices(
  symbols?: string[]
): Promise<Record<string, TokenPrice>> {
  const targetSymbols = symbols ?? Object.keys(PRICE_FEED_IDS);
  const feedIds = targetSymbols
    .map((s) => PRICE_FEED_IDS[s])
    .filter(Boolean);

  if (feedIds.length === 0) {
    return {};
  }

  try {
    const conn = getConnection();
    const feeds = await conn.getLatestPriceFeeds(feedIds);

    if (!feeds || feeds.length === 0) {
      console.warn("[pyth-client] No price feeds returned from Pyth");
      return fallbackPrices(targetSymbols);
    }

    const result: Record<string, TokenPrice> = {};

    for (const feed of feeds) {
      const symbol = FEED_ID_TO_SYMBOL[feed.id] ?? FEED_ID_TO_SYMBOL[`0x${feed.id}`];
      if (!symbol) continue;

      const priceData = feed.getPriceUnchecked();
      const price = parseFloat(priceData.price) * Math.pow(10, priceData.expo);
      const confidence =
        parseFloat(priceData.conf) * Math.pow(10, priceData.expo);

      result[symbol] = {
        symbol,
        price: Math.abs(price),
        confidence: Math.abs(confidence),
        timestamp: priceData.publishTime,
        source: "pyth",
      };
    }

    // Cache successfully fetched prices
    lastKnownPrices = { ...lastKnownPrices, ...result };

    return result;
  } catch (err) {
    console.error("[pyth-client] Failed to fetch prices from Pyth:", err);
    return fallbackPrices(targetSymbols);
  }
}

/**
 * Convenience function: fetch only the SOL/USD price.
 * Returns 0 if the fetch fails.
 */
export async function fetchSolPrice(): Promise<number> {
  const prices = await fetchPrices(["SOL/USD"]);
  return prices["SOL/USD"]?.price ?? 0;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns last known prices for the requested symbols, or zeroed fallback
 * objects for symbols that have never been fetched.
 */
function fallbackPrices(symbols: string[]): Record<string, TokenPrice> {
  const result: Record<string, TokenPrice> = {};

  for (const symbol of symbols) {
    if (lastKnownPrices[symbol]) {
      result[symbol] = lastKnownPrices[symbol];
    } else {
      result[symbol] = {
        symbol,
        price: 0,
        confidence: 0,
        timestamp: 0,
        source: "pyth",
      };
    }
  }

  return result;
}
