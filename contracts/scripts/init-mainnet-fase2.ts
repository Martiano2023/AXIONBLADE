/**
 * AXIONBLADE Mainnet Initialization Script — FASE 2
 *
 * Inicializa PDAs para os 4 programas de economia da Fase 2:
 *   - noumen_treasury
 *   - noumen_service
 *   - noumen_auditor
 *   - noumen_hermes
 *
 * Usage:
 *   RPC_URL="https://api.mainnet-beta.solana.com" npx ts-node scripts/init-mainnet-fase2.ts
 *
 * Prerequisites:
 *   - Fase 1 inicializada (core, proof, apollo)
 *   - Programs da Fase 2 deployed via deploy-mainnet-fase2.sh
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

// Creator wallet — receives 15% of revenue via CCS (Creator Compensation Structure)
const CREATOR_WALLET = new PublicKey("HgThD22yumQsiv7ymLNNWnfzEsfrhKd5sG1X3ffYxNbk");

/**
 * ⚠️ IMPORTANTE: Atualize estes IDs com os Program IDs da Fase 1 e Fase 2!
 */
const PROGRAM_IDS = {
  // Fase 1 (já deployados)
  core: new PublicKey("SEU_CORE_ID_AQUI"),

  // Fase 2 (deployados via deploy-mainnet-fase2.sh)
  treasury: new PublicKey("SEU_PROGRAM_ID_AQUI"),
  service: new PublicKey("SEU_PROGRAM_ID_AQUI"),
  auditor: new PublicKey("SEU_PROGRAM_ID_AQUI"),
  hermes: new PublicKey("SEU_PROGRAM_ID_AQUI"),
};

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

/** Compute Anchor instruction discriminator */
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

/** Borsh-serialize a Pubkey */
function serializePubkey(key: PublicKey): Buffer {
  return key.toBuffer();
}

/** Borsh-serialize u64 */
function serializeU64(val: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(val);
  return buf;
}

/** Borsh-serialize u32 */
function serializeU32(val: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(val);
  return buf;
}

/** Borsh-serialize u16 */
function serializeU16(val: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(val);
  return buf;
}

/** Borsh-serialize u8 */
function serializeU8(val: number): Buffer {
  const buf = Buffer.alloc(1);
  buf.writeUInt8(val);
  return buf;
}

// ──────────────────────────────────────────
// Main
// ──────────────────────────────────────────

async function main() {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║  AXIONBLADE v3.2.3 — Mainnet Init Fase 2  ║");
  console.log("║  Economia & Serviços Completos        ║");
  console.log("╚═══════════════════════════════════════╝\n");

  // Check if user updated program IDs
  if (PROGRAM_IDS.treasury.toBase58() === "SEU_PROGRAM_ID_AQUI") {
    console.error("❌ ERROR: Você precisa atualizar os PROGRAM_IDS no arquivo init-mainnet-fase2.ts!");
    console.error("   Use os Program IDs retornados pelo deploy-mainnet-fase2.sh\n");
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

  console.log("Program IDs (Fase 2):");
  console.log(`  treasury: ${PROGRAM_IDS.treasury.toBase58()}`);
  console.log(`  service:  ${PROGRAM_IDS.service.toBase58()}`);
  console.log(`  auditor:  ${PROGRAM_IDS.auditor.toBase58()}`);
  console.log(`  hermes:   ${PROGRAM_IDS.hermes.toBase58()}\n`);

  // ──────────────────────────────────────────
  // 1. Initialize noumen_treasury
  // ──────────────────────────────────────────

  console.log("═══════════════════════════════════════");
  console.log("  1. Inicializando noumen_treasury");
  console.log("═══════════════════════════════════════\n");

  const [treasuryConfigPDA] = findPDA([Buffer.from("treasury_config")], PROGRAM_IDS.treasury);
  const [treasuryVaultPDA] = findPDA([Buffer.from("treasury_vault")], PROGRAM_IDS.treasury);
  const [donationVaultPDA] = findPDA([Buffer.from("donation_vault")], PROGRAM_IDS.treasury);
  const [ccsConfigPDA] = findPDA([Buffer.from("ccs_config")], PROGRAM_IDS.treasury);
  console.log(`Treasury Config PDA: ${treasuryConfigPDA.toBase58()}`);
  console.log(`Creator Wallet:      ${CREATOR_WALLET.toBase58()}`);

  try {
    const treasuryAccount = await connection.getAccountInfo(treasuryConfigPDA);
    if (treasuryAccount) {
      console.log("✓ Treasury já inicializado.\n");
    } else {
      // initialize_treasury(aeon_authority, keeper_authority, creator_wallet)
      const initTreasuryIx = new TransactionInstruction({
        programId: PROGRAM_IDS.treasury,
        keys: [
          { pubkey: payer.publicKey, isSigner: true, isWritable: true },
          { pubkey: treasuryConfigPDA, isSigner: false, isWritable: true },
          { pubkey: treasuryVaultPDA, isSigner: false, isWritable: true },
          { pubkey: donationVaultPDA, isSigner: false, isWritable: true },
          { pubkey: ccsConfigPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([
          ixDiscriminator("initialize_treasury"),
          serializePubkey(payer.publicKey),    // aeon_authority (deployer acts as authority on mainnet init)
          serializePubkey(payer.publicKey),    // keeper_authority
          serializePubkey(CREATOR_WALLET),     // creator_wallet (15% CCS revenue)
        ]),
      });

      const tx = new Transaction().add(initTreasuryIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
      console.log(`✓ Treasury inicializado. Signature: ${sig}\n`);
    }
  } catch (err) {
    console.error(`❌ Erro ao inicializar treasury:`, err);
    throw err;
  }

  // ──────────────────────────────────────────
  // 2. Initialize noumen_service
  // ──────────────────────────────────────────

  console.log("═══════════════════════════════════════");
  console.log("  2. Inicializando noumen_service");
  console.log("═══════════════════════════════════════\n");

  const [serviceConfigPDA] = findPDA([Buffer.from("service_config")], PROGRAM_IDS.service);
  console.log(`Service Config PDA: ${serviceConfigPDA.toBase58()}`);

  try {
    const serviceAccount = await connection.getAccountInfo(serviceConfigPDA);
    if (serviceAccount) {
      console.log("✓ Service config já inicializado.\n");
    } else {
      const initServiceIx = new TransactionInstruction({
        programId: PROGRAM_IDS.service,
        keys: [
          { pubkey: serviceConfigPDA, isSigner: false, isWritable: true },
          { pubkey: treasuryConfigPDA, isSigner: false, isWritable: false },
          { pubkey: payer.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([
          ixDiscriminator("initialize_service"),
          serializePubkey(payer.publicKey), // authority
          serializeU16(1500), // ccs_total_cap_bps (15% = 1500 bps)
          serializeU16(400),  // ccs_floor_bps (4% = 400 bps)
        ]),
      });

      const tx = new Transaction().add(initServiceIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
      console.log(`✓ Service config inicializado. Signature: ${sig}\n`);
    }
  } catch (err) {
    console.error(`❌ Erro ao inicializar service:`, err);
    throw err;
  }

  // ──────────────────────────────────────────
  // 3. Initialize noumen_auditor
  // ──────────────────────────────────────────

  console.log("═══════════════════════════════════════");
  console.log("  3. Inicializando noumen_auditor");
  console.log("═══════════════════════════════════════\n");

  const [auditorConfigPDA] = findPDA([Buffer.from("auditor_config")], PROGRAM_IDS.auditor);
  console.log(`Auditor Config PDA: ${auditorConfigPDA.toBase58()}`);

  try {
    const auditorAccount = await connection.getAccountInfo(auditorConfigPDA);
    if (auditorAccount) {
      console.log("✓ Auditor config já inicializado.\n");
    } else {
      const initAuditorIx = new TransactionInstruction({
        programId: PROGRAM_IDS.auditor,
        keys: [
          { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
          { pubkey: payer.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([
          ixDiscriminator("initialize_auditor"),
          serializePubkey(payer.publicKey), // authority
          serializeU8(29), // total_axioms (29 axiomas ativos)
        ]),
      });

      const tx = new Transaction().add(initAuditorIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
      console.log(`✓ Auditor config inicializado. Signature: ${sig}\n`);
    }
  } catch (err) {
    console.error(`❌ Erro ao inicializar auditor:`, err);
    throw err;
  }

  // ──────────────────────────────────────────
  // 4. Initialize noumen_hermes
  // ──────────────────────────────────────────

  console.log("═══════════════════════════════════════");
  console.log("  4. Inicializando noumen_hermes");
  console.log("═══════════════════════════════════════\n");

  const [hermesConfigPDA] = findPDA([Buffer.from("hermes_config")], PROGRAM_IDS.hermes);
  console.log(`Hermes Config PDA: ${hermesConfigPDA.toBase58()}`);

  try {
    const hermesAccount = await connection.getAccountInfo(hermesConfigPDA);
    if (hermesAccount) {
      console.log("✓ Hermes config já inicializado.\n");
    } else {
      const initHermesIx = new TransactionInstruction({
        programId: PROGRAM_IDS.hermes,
        keys: [
          { pubkey: hermesConfigPDA, isSigner: false, isWritable: true },
          { pubkey: payer.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([
          ixDiscriminator("initialize_hermes"),
          serializePubkey(payer.publicKey), // authority
          serializeU8(5), // total_services (5 serviços HERMES)
        ]),
      });

      const tx = new Transaction().add(initHermesIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
      console.log(`✓ Hermes config inicializado. Signature: ${sig}\n`);
    }
  } catch (err) {
    console.error(`❌ Erro ao inicializar hermes:`, err);
    throw err;
  }

  // ──────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────

  console.log("═══════════════════════════════════════");
  console.log("  🎉 FASE 2 INICIALIZADA COM SUCESSO!");
  console.log("═══════════════════════════════════════\n");
  console.log("PDAs criados:");
  console.log(`  Treasury Config: ${treasuryConfigPDA.toBase58()}`);
  console.log(`  Service Config:  ${serviceConfigPDA.toBase58()}`);
  console.log(`  Auditor Config:  ${auditorConfigPDA.toBase58()}`);
  console.log(`  Hermes Config:   ${hermesConfigPDA.toBase58()}`);
  console.log(`\nCreator Wallet (CCS 15%): ${CREATOR_WALLET.toBase58()}\n`);
  console.log("🚀 AXIONBLADE v3.2.3 TOTALMENTE FUNCIONAL NA MAINNET!");
  console.log("\nPróximos passos:");
  console.log("  1. Atualize .env.production com todos os Program IDs");
  console.log("  2. Rebuild do frontend: cd ../app && npm run build");
  console.log("  3. Deploy do frontend");
  console.log("  4. Teste todas as funcionalidades\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
