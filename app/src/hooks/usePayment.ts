"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState, useCallback } from "react";
import { findTreasuryVaultPDA } from "@/lib/pda";
import { processServicePayment } from "@/lib/transactions";

// Treasury vault PDA (derived from program seeds)
const [TREASURY_VAULT] = findTreasuryVaultPDA();

export interface PaymentResult {
  success: boolean;
  signature?: string;
  error?: string;
  proofHash?: string;
}

export function usePayment() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const [processing, setProcessing] = useState(false);

  const pay = useCallback(
    async (amountSOL: number, serviceId: number = 0, memo?: string): Promise<PaymentResult> => {
      if (!publicKey || !connected) {
        return { success: false, error: "Wallet not connected" };
      }

      if (amountSOL <= 0 || amountSOL > 1000) {
        return { success: false, error: "Invalid payment amount" };
      }

      if (!signTransaction) {
        return { success: false, error: "Wallet does not support signing" };
      }

      setProcessing(true);
      try {
        // Build proper treasury program instruction via processServicePayment
        const signature = await processServicePayment(
          connection,
          { publicKey, signTransaction },
          serviceId,
          amountSOL,
        );

        // Confirm with "finalized" commitment for payment safety
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "finalized",
        );

        // Generate proof hash from signature
        const proofHash = "0x" + signature.slice(0, 40);

        setProcessing(false);
        return { success: true, signature, proofHash };
      } catch (error: unknown) {
        setProcessing(false);

        const message =
          error instanceof Error ? error.message : "Transaction failed";

        if (message.includes("rejected")) {
          return { success: false, error: "Transaction rejected by user" };
        }
        if (message.includes("insufficient")) {
          return { success: false, error: "Insufficient SOL balance" };
        }
        return { success: false, error: message };
      }
    },
    [publicKey, connected, connection, signTransaction],
  );

  return {
    pay,
    processing,
    connected,
    walletAddress: publicKey?.toBase58() || null,
    treasuryVault: TREASURY_VAULT,
  };
}
