// ---------------------------------------------------------------------------
// AXIONBLADE Retry with Exponential Backoff
// ---------------------------------------------------------------------------
// Implements robust retry logic for RPC calls and external API requests.
// Features:
// - Exponential backoff (1s, 2s, 4s)
// - Maximum 3 retries
// - Configurable timeout
// - Error aggregation
// ---------------------------------------------------------------------------

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  timeout?: number; // milliseconds per attempt
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 8000, // 8 seconds max
  timeout: 10000, // 10 seconds per attempt
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: Error[] = [];

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Wrap in timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), opts.timeout)
        ),
      ]);

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);

      // If this was the last attempt, throw aggregated error
      if (attempt === opts.maxRetries) {
        const aggregatedError = new Error(
          `Failed after ${opts.maxRetries + 1} attempts. Errors: ${errors.map(e => e.message).join(', ')}`
        );
        (aggregatedError as any).attempts = errors;
        throw aggregatedError;
      }

      // Calculate backoff delay (exponential: 1s, 2s, 4s, 8s)
      const delay = Math.min(
        opts.initialDelay * Math.pow(2, attempt),
        opts.maxDelay
      );

      console.warn(
        `Attempt ${attempt + 1}/${opts.maxRetries + 1} failed: ${err.message}. Retrying in ${delay}ms...`
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // TypeScript exhaustiveness check
  throw new Error('Retry logic error: Should never reach here');
}

// ---------------------------------------------------------------------------
// RPC Connection with Auto-Retry
// ---------------------------------------------------------------------------

import { Connection } from '@solana/web3.js';

export async function fetchWithRetry<T>(
  connection: Connection,
  method: (conn: Connection) => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryWithBackoff(() => method(connection), options);
}

// ---------------------------------------------------------------------------
// Example Usage
// ---------------------------------------------------------------------------

/*
// Fetch transaction with retry
const tx = await retryWithBackoff(
  () => connection.getParsedTransaction(signature),
  { maxRetries: 3, initialDelay: 1000 }
);

// Fetch balance with custom timeout
const balance = await fetchWithRetry(
  connection,
  (conn) => conn.getBalance(publicKey),
  { timeout: 5000 }
);
*/
