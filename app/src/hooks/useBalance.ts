"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState, useEffect, useRef } from "react";

/**
 * Check if the RPC endpoint is a local validator that may not be running.
 */
function isLocalRpc(endpoint: string): boolean {
  try {
    const parsed = new URL(endpoint);
    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "0.0.0.0"
    );
  } catch {
    return false;
  }
}

export function useBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Track whether the RPC is unreachable to avoid repeated failing calls
  const rpcUnreachable = useRef(false);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    // Reset reachability when connection or wallet changes
    rpcUnreachable.current = false;

    let cancelled = false;

    async function fetchBalance() {
      // Skip if we already know the RPC is unreachable (local validator not running)
      if (rpcUnreachable.current) return;

      setLoading(true);
      try {
        const bal = await connection.getBalance(publicKey!);
        if (!cancelled) setBalance(bal / LAMPORTS_PER_SOL);
      } catch {
        if (!cancelled) {
          setBalance(null);
          // If this is a local endpoint, stop retrying to avoid console noise
          if (isLocalRpc(connection.rpcEndpoint)) {
            rpcUnreachable.current = true;
          }
        }
      }
      if (!cancelled) setLoading(false);
    }

    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [publicKey, connection]);

  return { balance, loading };
}
