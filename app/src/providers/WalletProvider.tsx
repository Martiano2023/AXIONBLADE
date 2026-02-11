"use client";

import { useMemo, useEffect, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

/**
 * Detect whether the RPC endpoint points to a local validator.
 * When running on localhost without a validator, the Solana Connection
 * auto-derives a ws:// endpoint and attempts to connect, producing
 * "ws error: undefined" console errors. We suppress those in that case.
 */
function isLocalEndpoint(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "0.0.0.0"
    );
  } catch {
    return false;
  }
}

/**
 * Suppress the Solana web3.js "ws error:" console.error messages that occur
 * when WebSocket cannot connect to a local validator. This is a targeted
 * patch -- only suppresses messages starting with "ws error:" and only
 * when the RPC endpoint is local. All other console.error calls pass through.
 */
function useSuppressSolanaWsErrors(endpoint: string) {
  useEffect(() => {
    if (!isLocalEndpoint(endpoint)) return;

    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      // The Solana Connection._wsOnError handler calls:
      //   console.error('ws error:', err.message)
      // Suppress only that specific pattern.
      if (
        args.length >= 1 &&
        typeof args[0] === "string" &&
        args[0].startsWith("ws error:")
      ) {
        return; // Silently ignore WebSocket errors for local endpoints
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, [endpoint]);
}

export function WalletProvider({ children }: Props) {
  const endpoint =
    process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";

  // Suppress Solana WebSocket errors when running against a local endpoint
  // that has no validator. This prevents "ws error: undefined" in the console.
  useSuppressSolanaWsErrors(endpoint);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  // When the endpoint is a local validator, provide a fake wsEndpoint to
  // prevent the Connection from auto-deriving ws://localhost:8900.
  // Note: The Connection constructor uses `wsEndpoint || makeWebsocketUrl(endpoint)`,
  // so we must provide a truthy value. Using wss://localhost prevents any real
  // connection attempt (port 443 won't have a Solana WS server). Combined with
  // the RealtimeProvider guard that skips subscriptions for local endpoints,
  // the WebSocket is never actually used.
  const connectionConfig = useMemo(() => {
    if (isLocalEndpoint(endpoint)) {
      return {
        wsEndpoint: "wss://localhost", // Truthy no-op endpoint — prevents auto-derive
        commitment: "confirmed" as const,
      };
    }
    return { commitment: "confirmed" as const };
  }, [endpoint]);

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
