import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_IDS } from "./constants";
import {
  findTreasuryVaultPDA,
  findDonationVaultPDA,
  findCCSConfigPDA,
  findTreasuryConfigPDA,
  findServiceEntryPDA,
  findDonationReceiptPDA,
} from "./pda";

// ---------------------------------------------------------------------------
// Instruction discriminator computation
// ---------------------------------------------------------------------------

/**
 * Compute the 8-byte Anchor instruction discriminator.
 * discriminator = sha256("global:<instruction_name>")[0..8]
 */
async function instructionDiscriminator(
  instructionName: string,
): Promise<Buffer> {
  const msgBuffer = new TextEncoder().encode(`global:${instructionName}`);
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    msgBuffer as unknown as ArrayBuffer,
  );
  return Buffer.from(new Uint8Array(hashBuffer).slice(0, 8));
}

// ---------------------------------------------------------------------------
// Wallet interface (compatible with wallet-adapter)
// ---------------------------------------------------------------------------

export interface WalletSigner {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}

// ---------------------------------------------------------------------------
// Transaction builders
// ---------------------------------------------------------------------------

/**
 * Build and send a service payment transaction.
 *
 * Accounts (expected by the on-chain instruction):
 *   0. [signer]  payer
 *   1. [mut]     service_entry PDA
 *   2. [mut]     treasury_vault PDA
 *   3. [mut]     ccs_config PDA
 *   4. []        treasury_config PDA
 *   5. []        system_program
 *
 * Args: service_id (u16), amount (u64 lamports)
 */
export async function processServicePayment(
  connection: Connection,
  wallet: WalletSigner,
  serviceId: number,
  amountSol: number,
): Promise<string> {
  const disc = await instructionDiscriminator("process_service_payment");

  // Serialize args: service_id (u16 LE) + amount (u64 LE)
  const data = Buffer.alloc(8 + 2 + 8);
  disc.copy(data, 0);
  data.writeUInt16LE(serviceId, 8);
  const amountLamports = new BN(Math.round(amountSol * LAMPORTS_PER_SOL));
  amountLamports.toArrayLike(Buffer, "le", 8).copy(data, 10);

  const [serviceEntryPDA] = findServiceEntryPDA(serviceId);
  const [treasuryVaultPDA] = findTreasuryVaultPDA();
  const [ccsConfigPDA] = findCCSConfigPDA();
  const [treasuryConfigPDA] = findTreasuryConfigPDA();

  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.treasury,
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: serviceEntryPDA, isSigner: false, isWritable: true },
      { pubkey: treasuryVaultPDA, isSigner: false, isWritable: true },
      { pubkey: ccsConfigPDA, isSigner: false, isWritable: true },
      { pubkey: treasuryConfigPDA, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  return await buildAndSend(connection, wallet, [ix]);
}

/**
 * Build and send a creator CCS withdrawal transaction.
 *
 * Accounts (expected by the on-chain instruction):
 *   0. [signer]  creator (authority)
 *   1. [mut]     treasury_vault PDA
 *   2. [mut]     ccs_config PDA
 *   3. []        treasury_config PDA
 *   4. []        system_program
 *
 * Args: amount (u64 lamports)
 */
export async function withdrawCreatorSplit(
  connection: Connection,
  wallet: WalletSigner,
  amountSol: number,
): Promise<string> {
  const disc = await instructionDiscriminator("withdraw_creator_split");

  // Serialize args: amount (u64 LE)
  const data = Buffer.alloc(8 + 8);
  disc.copy(data, 0);
  const amountLamports = new BN(Math.round(amountSol * LAMPORTS_PER_SOL));
  amountLamports.toArrayLike(Buffer, "le", 8).copy(data, 8);

  const [treasuryVaultPDA] = findTreasuryVaultPDA();
  const [ccsConfigPDA] = findCCSConfigPDA();
  const [treasuryConfigPDA] = findTreasuryConfigPDA();

  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.treasury,
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: treasuryVaultPDA, isSigner: false, isWritable: true },
      { pubkey: ccsConfigPDA, isSigner: false, isWritable: true },
      { pubkey: treasuryConfigPDA, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  return await buildAndSend(connection, wallet, [ix]);
}

/**
 * Build and send a donation transaction.
 *
 * Accounts (expected by the on-chain instruction):
 *   0. [signer]  donor
 *   1. [mut]     donation_vault PDA
 *   2. [mut]     donation_receipt PDA (derived from current nonce)
 *   3. []        system_program
 *
 * Args: amount (u64 lamports), nonce (u32 - current donation count)
 */
export async function recordDonation(
  connection: Connection,
  wallet: WalletSigner,
  amountSol: number,
  nonce: number,
): Promise<string> {
  const disc = await instructionDiscriminator("record_donation");

  // Serialize args: amount (u64 LE) + nonce (u32 LE)
  const data = Buffer.alloc(8 + 8 + 4);
  disc.copy(data, 0);
  const amountLamports = new BN(Math.round(amountSol * LAMPORTS_PER_SOL));
  amountLamports.toArrayLike(Buffer, "le", 8).copy(data, 8);
  data.writeUInt32LE(nonce, 16);

  const [donationVaultPDA] = findDonationVaultPDA();
  const [donationReceiptPDA] = findDonationReceiptPDA(nonce);

  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.treasury,
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: donationVaultPDA, isSigner: false, isWritable: true },
      { pubkey: donationReceiptPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  return await buildAndSend(connection, wallet, [ix]);
}

// ---------------------------------------------------------------------------
// Internal: build, sign, and send transaction
// ---------------------------------------------------------------------------

async function buildAndSend(
  connection: Connection,
  wallet: WalletSigner,
  instructions: TransactionInstruction[],
): Promise<string> {
  const tx = new Transaction();
  for (const ix of instructions) {
    tx.add(ix);
  }

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = wallet.publicKey;

  const signed = await wallet.signTransaction(tx);
  const rawTx = signed.serialize();

  const signature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );

  return signature;
}
