"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { useState, useCallback } from "react";

// Treasury PDA address (this is the noumen_treasury program's PDA)
const TREASURY_ADDRESS = new PublicKey(
  "11111111111111111111111111111111",
); // placeholder

export interface PaymentResult {
  success: boolean;
  signature?: string;
  error?: string;
  proofHash?: string;
}

export function usePayment() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [processing, setProcessing] = useState(false);

  const pay = useCallback(
    async (amountSOL: number, memo?: string): Promise<PaymentResult> => {
      if (!publicKey || !connected) {
        return { success: false, error: "Wallet not connected" };
      }

      setProcessing(true);
      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: TREASURY_ADDRESS,
            lamports: Math.round(amountSOL * LAMPORTS_PER_SOL),
          }),
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "confirmed");

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
    [publicKey, connected, connection, sendTransaction],
  );

  return {
    pay,
    processing,
    connected,
    walletAddress: publicKey?.toBase58() || null,
  };
}
