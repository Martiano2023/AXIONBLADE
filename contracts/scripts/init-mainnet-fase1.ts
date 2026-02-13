/**
 * AXIONBLADE Mainnet Initialization Script — FASE 1
 *
 * Inicializa PDAs para os 3 programas core da Fase 1:
 *   - noumen_core (AEON)
 *   - noumen_proof
 *   - noumen_apollo
 *
 * Usage:
 *   RPC_URL="https://api.mainnet-beta.solana.com" npx ts-node scripts/init-mainnet-fase1.ts
 *
 * Prerequisites:
 *   - Programs deployed via deploy-mainnet-fase1.sh
 *   - Wallet at ~/.config/solana/id.json funded with mainnet SOL
 *   - Program IDs atualizados abaixo
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

// ──────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────

const RPC_URL = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";

/**
 * ⚠️ IMPORTANTE: Atualize estes IDs com os Program IDs deployados na mainnet!
 * Você pode encontrá-los após rodar deploy-mainnet-fase1.sh
 */
const PROGRAM_IDS = {
  core: new PublicKey("SEU_PROGRAM_ID_AQUI"), // noumen_core
  proof: new PublicKey("SEU_PROGRAM_ID_AQUI"), // noumen_proof
  apollo: new PublicKey("SEU_PROGRAM_ID_AQUI"), // noumen_apollo
};

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

/** Compute Anchor instruction discriminator: sha256("global:<name>")[0..8] */
function ixDiscriminator(name: string): Buffer {
  const hash = createHash("sha256").update(`global:${name}`).digest();
  return hash.subarray(0, 8);
}

/** Load keypair from file */
function loadKeypair(filePath: string): Keypair {
  const resolved = filePath.startsWith("~")
    ? path.join(process.env.HOME!, filePath.slice(1))
    : filePath;
  const raw = JSON.parse(fs.readFileSync(resolved, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

/** Find PDA */
function findPDA(seeds: Buffer[], programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

/** Borsh-serialize a Pubkey (32 bytes) */
function serializePubkey(key: PublicKey): Buffer {
  return key.toBuffer();
}

/** Borsh-serialize u64 as little-endian */
function serializeU64(val: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(val);
  return buf;
}

/** Borsh-serialize u32 as little-endian */
function serializeU32(val: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(val);
  return buf;
}

/** Borsh-serialize u8 */
function serializeU8(val: number): Buffer {
  const buf = Buffer.alloc(1);
  buf.writeUInt8(val);
  return buf;
}

/** Borsh-serialize boolean */
function serializeBool(val: boolean): Buffer {
  return serializeU8(val ? 1 : 0);
}

// ──────────────────────────────────────────
// Main
// ──────────────────────────────────────────

async function main() {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║  AXIONBLADE v3.2.3 — Mainnet Init Fase 1  ║");
  console.log("║  Proof Before Action                   ║");
  console.log("╚═══════════════════════════════════════╝\n");

  // Check if user updated program IDs
  if (PROGRAM_IDS.core.toBase58() === "SEU_PROGRAM_ID_AQUI") {
    console.error("❌ ERROR: Você precisa atualizar os PROGRAM_IDS no arquivo init-mainnet-fase1.ts!");
    console.error("   Use os Program IDs retornados pelo deploy-mainnet-fase1.sh\n");
    process.exit(1);
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const payer = loadKeypair("~/.config/solana/id.json");

  console.log(`RPC:    ${RPC_URL}`);
  console.log(`Payer:  ${payer.publicKey.toBase58()}`);

  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL\n`);

  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    console.warn("⚠️  WARNING: Balance abaixo de 0.1 SOL. Inicialização pode falhar.\n");
  }

  console.log("Program IDs:");
  console.log(`  core:   ${PROGRAM_IDS.core.toBase58()}`);
  console.log(`  proof:  ${PROGRAM_IDS.proof.toBase58()}`);
  console.log(`  apollo: ${PROGRAM_IDS.apollo.toBase58()}\n`);

  // ──────────────────────────────────────────
  // 1. Initialize noumen_core (AEON)
  // ──────────────────────────────────────────

  console.log("═══════════════════════════════════════");
  console.log("  1. Inicializando noumen_core (AEON)");
  console.log("═══════════════════════════════════════\n");

  const [corePDA] = findPDA([Buffer.from("core")], PROGRAM_IDS.core);
  console.log(`Core PDA: ${corePDA.toBase58()}`);

  try {
    const coreAccount = await connection.getAccountInfo(corePDA);
    if (coreAccount) {
      console.log("✓ Core já inicializado.\n");
    } else {
      const initCoreIx = new TransactionInstruction({
        programId: PROGRAM_IDS.core,
        keys: [
          { pubkey: corePDA, isSigner: false, isWritable: true },
          { pubkey: payer.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([
          ixDiscriminator("initialize"),
          serializePubkey(payer.publicKey), // authority
        ]),
      });

      const tx = new Transaction().add(initCoreIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
      console.log(`✓ Core inicializado. Signature: ${sig}\n`);
    }
  } catch (err) {
    console.error(`❌ Erro ao inicializar core:`, err);
    throw err;
  }

  // ──────────────────────────────────────────
  // 2. Initialize noumen_proof
  // ──────────────────────────────────────────

  console.log("═══════════════════════════════════════");
  console.log("  2. Inicializando noumen_proof");
  console.log("═══════════════════════════════════════\n");

  const [proofConfigPDA] = findPDA([Buffer.from("proof_config")], PROGRAM_IDS.proof);
  console.log(`Proof Config PDA: ${proofConfigPDA.toBase58()}`);

  try {
    const proofAccount = await connection.getAccountInfo(proofConfigPDA);
    if (proofAccount) {
      console.log("✓ Proof config já inicializado.\n");
    } else {
      const initProofIx = new TransactionInstruction({
        programId: PROGRAM_IDS.proof,
        keys: [
          { pubkey: proofConfigPDA, isSigner: false, isWritable: true },
          { pubkey: payer.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([
          ixDiscriminator("initialize_proof_config"),
          serializePubkey(payer.publicKey), // authority
          serializeU32(10000), // max_proof_age_slots (exemplo: 10k slots)
        ]),
      });

      const tx = new Transaction().add(initProofIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
      console.log(`✓ Proof config inicializado. Signature: ${sig}\n`);
    }
  } catch (err) {
    console.error(`❌ Erro ao inicializar proof:`, err);
    throw err;
  }

  // ──────────────────────────────────────────
  // 3. Initialize noumen_apollo
  // ──────────────────────────────────────────

  console.log("═══════════════════════════════════════");
  console.log("  3. Inicializando noumen_apollo");
  console.log("═══════════════════════════════════════\n");

  const [apolloConfigPDA] = findPDA([Buffer.from("apollo_config")], PROGRAM_IDS.apollo);
  console.log(`Apollo Config PDA: ${apolloConfigPDA.toBase58()}`);

  try {
    const apolloAccount = await connection.getAccountInfo(apolloConfigPDA);
    if (apolloAccount) {
      console.log("✓ Apollo config já inicializado.\n");
    } else {
      const initApolloIx = new TransactionInstruction({
        programId: PROGRAM_IDS.apollo,
        keys: [
          { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
          { pubkey: payer.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([
          ixDiscriminator("initialize_apollo"),
          serializePubkey(payer.publicKey), // authority
          serializeU32(40), // risk_weight_cap_bps (40% = 4000 bps)
        ]),
      });

      const tx = new Transaction().add(initApolloIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
      console.log(`✓ Apollo config inicializado. Signature: ${sig}\n`);
    }
  } catch (err) {
    console.error(`❌ Erro ao inicializar apollo:`, err);
    throw err;
  }

  // ──────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────

  console.log("═══════════════════════════════════════");
  console.log("  🎉 FASE 1 INICIALIZADA COM SUCESSO!");
  console.log("═══════════════════════════════════════\n");
  console.log("PDAs criados:");
  console.log(`  Core:         ${corePDA.toBase58()}`);
  console.log(`  Proof Config: ${proofConfigPDA.toBase58()}`);
  console.log(`  Apollo Config: ${apolloConfigPDA.toBase58()}\n`);
  console.log("Próximos passos:");
  console.log("  1. Configure o frontend com os Program IDs");
  console.log("  2. Teste as funcionalidades básicas (read-only)");
  console.log("  3. Quando tiver mais SOL, execute a Fase 2:");
  console.log("     ./scripts/deploy-mainnet-fase2.sh\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
