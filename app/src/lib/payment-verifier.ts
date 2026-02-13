// ---------------------------------------------------------------------------
// AXIONBLADE Payment Verifier — ON-CHAIN Payment Verification
// ---------------------------------------------------------------------------
// SECURITY-CRITICAL: This module verifies that payments are REAL on-chain
// transactions before granting access to premium services.
//
// Features:
// - On-chain transaction verification via Solana RPC
// - Anti-replay: Same transaction cannot be used twice
// - Amount verification: Checks actual SOL transferred
// - Recipient verification: Ensures payment went to treasury
// - Rate limiting: Max 10 requests per minute per wallet
// - Timeout protection: Transactions older than 5 minutes are rejected
// ---------------------------------------------------------------------------

import { Connection, PublicKey, Transaction, ParsedTransactionWithMeta } from '@solana/web3.js';
import { createHash } from 'crypto';
import { retryWithBackoff } from './retry-with-backoff';

// MAINNET CONFIGURATION
const TREASURY_WALLET = new PublicKey('HgThD22yumQsiv7ymLNNWnfzEsfrhKd5sG1X3ffYxNbk');
const LAMPORTS_PER_SOL = 1_000_000_000;
const TRANSACTION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_MINUTE = 10;

// In-memory stores (in production, use Redis or database)
const usedTransactions = new Set<string>();
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// ---------------------------------------------------------------------------
// Anti-Replay Protection
// ---------------------------------------------------------------------------

function isTransactionUsed(signature: string): boolean {
  return usedTransactions.has(signature);
}

function markTransactionAsUsed(signature: string): void {
  usedTransactions.add(signature);

  // Clean up old transactions (keep last 10,000 for memory efficiency)
  if (usedTransactions.size > 10000) {
    const iterator = usedTransactions.values();
    for (let i = 0; i < 1000; i++) {
      const { value } = iterator.next();
      if (value) usedTransactions.delete(value);
    }
  }
}

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

function checkRateLimit(walletAddress: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(walletAddress);

  if (!entry || now > entry.resetAt) {
    // Create new rate limit window
    rateLimitMap.set(walletAddress, {
      count: 1,
      resetAt: now + 60000, // 1 minute from now
    });
    return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - 1 };
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - entry.count };
}

// ---------------------------------------------------------------------------
// On-Chain Payment Verification
// ---------------------------------------------------------------------------

export interface PaymentVerificationResult {
  valid: boolean;
  error?: string;
  payer?: string;
  amount?: number;
  timestamp?: number;
}

export async function verifyPayment(
  signature: string,
  requiredAmountSOL: number,
  connection: Connection
): Promise<PaymentVerificationResult> {
  try {
    // 1. Anti-Replay Check
    if (isTransactionUsed(signature)) {
      return {
        valid: false,
        error: 'Transaction already used (replay attack detected)',
      };
    }

    // 2. Fetch transaction from blockchain (with retry)
    const tx = await retryWithBackoff(
      () => connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      }),
      { maxRetries: 3, initialDelay: 1000 }
    );

    if (!tx || !tx.meta) {
      return {
        valid: false,
        error: 'Transaction not found on-chain',
      };
    }

    // 3. Check transaction success
    if (tx.meta.err) {
      return {
        valid: false,
        error: 'Transaction failed on-chain',
      };
    }

    // 4. Check transaction age (timeout protection)
    const blockTime = tx.blockTime;
    if (!blockTime) {
      return {
        valid: false,
        error: 'Transaction has no block time',
      };
    }

    const transactionAge = Date.now() / 1000 - blockTime;
    if (transactionAge * 1000 > TRANSACTION_TIMEOUT_MS) {
      return {
        valid: false,
        error: 'Transaction too old (>5 minutes)',
      };
    }

    // 5. Extract payer (fee payer = wallet making payment)
    const payer = tx.transaction.message.accountKeys[0].pubkey.toBase58();

    // 6. Check rate limit
    const rateLimit = checkRateLimit(payer);
    if (!rateLimit.allowed) {
      return {
        valid: false,
        error: 'Rate limit exceeded (max 10 requests per minute)',
      };
    }

    // 7. Verify amount transferred to treasury
    const requiredLamports = Math.floor(requiredAmountSOL * LAMPORTS_PER_SOL);
    let transferredToTreasury = 0;

    // Check postBalances vs preBalances for treasury
    const treasuryIndex = tx.transaction.message.accountKeys.findIndex(
      (key) => key.pubkey.equals(TREASURY_WALLET)
    );

    if (treasuryIndex === -1) {
      return {
        valid: false,
        error: 'Payment not sent to treasury wallet',
      };
    }

    const preBalance = tx.meta.preBalances[treasuryIndex];
    const postBalance = tx.meta.postBalances[treasuryIndex];
    transferredToTreasury = postBalance - preBalance;

    // 8. Verify sufficient amount
    if (transferredToTreasury < requiredLamports) {
      return {
        valid: false,
        error: `Insufficient payment: sent ${transferredToTreasury / LAMPORTS_PER_SOL} SOL, required ${requiredAmountSOL} SOL`,
      };
    }

    // 9. Mark transaction as used (anti-replay)
    markTransactionAsUsed(signature);

    // 10. Success!
    return {
      valid: true,
      payer,
      amount: transferredToTreasury / LAMPORTS_PER_SOL,
      timestamp: blockTime,
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

// ---------------------------------------------------------------------------
// Utility: Get RPC Connection
// ---------------------------------------------------------------------------

export function getConnection(): Connection {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  return new Connection(rpcUrl, 'confirmed');
}

// ---------------------------------------------------------------------------
// Utility: Clear Rate Limit (for testing)
// ---------------------------------------------------------------------------

export function clearRateLimit(walletAddress: string): void {
  rateLimitMap.delete(walletAddress);
}

// ---------------------------------------------------------------------------
// Utility: Reset Used Transactions (for testing)
// ---------------------------------------------------------------------------

export function resetUsedTransactions(): void {
  usedTransactions.clear();
}
