"use client";

// ---------------------------------------------------------------------------
// AXIONBLADE usePrices Hook — Real-time Pyth price data
// ---------------------------------------------------------------------------
// Fetches token prices from the Pyth Network on mount, auto-refreshes
// every 10 seconds, and exposes a manual refresh function.
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchPrices, type TokenPrice } from "@/lib/pyth-client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Auto-refresh interval in milliseconds */
const REFRESH_INTERVAL_MS = 10_000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePrices(symbols?: string[]): {
  prices: Record<string, TokenPrice>;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => void;
} {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Stabilize symbols reference to avoid re-triggering effects on every render
  const symbolsRef = useRef(symbols);
  symbolsRef.current = symbols;

  const doFetch = useCallback(async () => {
    try {
      const result = await fetchPrices(symbolsRef.current);
      setPrices(result);
      setLastUpdated(Date.now());
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch prices";
      setError(message);
      console.error("[usePrices] Fetch error:", message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    doFetch();
  }, [doFetch]);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(doFetch, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [doFetch]);

  // Manual refresh
  const refresh = useCallback(() => {
    setLoading(true);
    doFetch();
  }, [doFetch]);

  return { prices, loading, error, lastUpdated, refresh };
}
