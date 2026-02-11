"use client";

import { useEffect, useRef, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Commitment } from "@solana/web3.js";
import {
  findAeonConfigPDA,
  findTreasuryVaultPDA,
  findDonationVaultPDA,
  findCCSConfigPDA,
  findProofConfigPDA,
  findApolloConfigPDA,
  findHermesConfigPDA,
} from "@/lib/pda";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PDASubscription {
  /** Human-readable label for logging. */
  label: string;
  /** PDA public key to subscribe to. */
  pdaFn: () => [import("@solana/web3.js").PublicKey, number];
  /** Query keys to invalidate when this account changes. */
  queryKeys: string[][];
}

// ---------------------------------------------------------------------------
// Subscription definitions
// ---------------------------------------------------------------------------

const SUBSCRIPTIONS: PDASubscription[] = [
  {
    label: "AeonConfig",
    pdaFn: findAeonConfigPDA,
    queryKeys: [["protocolStats"], ["activityFeed"]],
  },
  {
    label: "TreasuryVault",
    pdaFn: findTreasuryVaultPDA,
    queryKeys: [["protocolStats"]],
  },
  {
    label: "DonationVault",
    pdaFn: findDonationVaultPDA,
    queryKeys: [["protocolStats"]],
  },
  {
    label: "CCSConfig",
    pdaFn: findCCSConfigPDA,
    queryKeys: [["protocolStats"]],
  },
  {
    label: "ProofConfig",
    pdaFn: findProofConfigPDA,
    queryKeys: [["protocolStats"], ["proofVolume"]],
  },
  {
    label: "ApolloConfig",
    pdaFn: findApolloConfigPDA,
    queryKeys: [["protocolStats"]],
  },
  {
    label: "HermesConfig",
    pdaFn: findHermesConfigPDA,
    queryKeys: [["protocolStats"]],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether WebSocket subscriptions are available on the connection.
 * When wsEndpoint is empty or points to a local validator that isn't running,
 * we skip WebSocket subscriptions entirely to avoid console errors.
 */
function isWebSocketAvailable(connection: { rpcEndpoint: string }): boolean {
  try {
    const rpcUrl = connection.rpcEndpoint;
    const parsed = new URL(rpcUrl);
    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "0.0.0.0";

    // For local endpoints, assume no validator is running — skip WS subscriptions.
    // The WalletProvider already sets wsEndpoint to "" for local endpoints,
    // but this guard provides defense-in-depth.
    if (isLocal) return false;

    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

/**
 * Subscribes to on-chain account changes via WebSocket and automatically
 * invalidates the corresponding TanStack Query caches when data changes.
 *
 * This provider does not render any UI; it only manages subscriptions.
 * It is safe to include even when programs are not yet deployed -- failed
 * subscriptions are silently ignored. When running on localhost without a
 * Solana validator, WebSocket subscriptions are skipped entirely.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { connection } = useConnection();
  const queryClient = useQueryClient();
  const subscriptionIds = useRef<number[]>([]);

  const invalidateKeys = useCallback(
    (keys: string[][]) => {
      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
    [queryClient],
  );

  useEffect(() => {
    // Skip WebSocket subscriptions when no validator is available
    if (!isWebSocketAvailable(connection)) {
      return;
    }

    const ids: number[] = [];
    const commitment: Commitment = "confirmed";

    for (const sub of SUBSCRIPTIONS) {
      try {
        const [pda] = sub.pdaFn();

        const id = connection.onAccountChange(
          pda,
          () => {
            invalidateKeys(sub.queryKeys);
          },
          commitment,
        );

        ids.push(id);
      } catch {
        // PDA derivation or subscription failed -- skip silently.
        // This can happen if programs are not yet deployed.
      }
    }

    subscriptionIds.current = ids;

    // Cleanup: unsubscribe when the component unmounts or connection changes
    return () => {
      for (const id of ids) {
        try {
          connection.removeAccountChangeListener(id);
        } catch {
          // Ignore cleanup errors
        }
      }
      subscriptionIds.current = [];
    };
  }, [connection, invalidateKeys]);

  return <>{children}</>;
}
