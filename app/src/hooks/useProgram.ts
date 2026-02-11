import { useMemo } from "react";
import {
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import type { Connection, PublicKey } from "@solana/web3.js";
import type { WalletSigner } from "@/lib/transactions";

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

interface UseProgramResult {
  /** The current Solana RPC connection. */
  connection: Connection;
  /** The connected wallet public key, or null when disconnected. */
  publicKey: PublicKey | null;
  /** Whether a wallet is currently connected. */
  connected: boolean;
  /**
   * A `WalletSigner` compatible object for use with transaction builders.
   * Returns `null` when no wallet is connected or the wallet cannot sign.
   */
  walletSigner: WalletSigner | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Provides connection and wallet access for on-chain interactions.
 *
 * Uses `useConnection` and `useWallet` from `@solana/wallet-adapter-react`
 * and packages them into a convenient shape for use with the transaction
 * builders in `@/lib/transactions`.
 */
export function useProgram(): UseProgramResult {
  const { connection } = useConnection();
  const { publicKey, connected, signTransaction } = useWallet();

  const walletSigner = useMemo<WalletSigner | null>(() => {
    if (!publicKey || !signTransaction) return null;
    return { publicKey, signTransaction };
  }, [publicKey, signTransaction]);

  return { connection, publicKey, connected, walletSigner };
}
