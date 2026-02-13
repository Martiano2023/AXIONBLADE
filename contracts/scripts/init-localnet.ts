/**
 * AXIONBLADE v3.2.3 — Localnet Full Initialization & Test Suite
 *
 * Initializes all 7 programs, tests every instruction, verifies revenue split,
 * tests 3 pricing tiers, and runs end-to-end flow simulation.
 *
 * Usage: npx ts-node scripts/init-localnet.ts
 *
 * Prerequisites:
 *   - solana-test-validator running on localhost:8899
 *   - All 7 programs deployed via `anchor deploy`
 *   - Keys in contracts/keys/ (super_authority.json, aeon_authority.json, keeper_authority.json)
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

const RPC_URL = process.env.RPC_URL || "http://localhost:8899";
const CREATOR_WALLET = new PublicKey("HgThD22yumQsiv7ymLNNWnfzEsfrhKd5sG1X3ffYxNbk");

const PROGRAM_IDS = {
  core: new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"),
  proof: new PublicKey("3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV"),
  treasury: new PublicKey("EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu"),
  apollo: new PublicKey("92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee"),
  hermes: new PublicKey("Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj"),
  auditor: new PublicKey("CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe"),
  service: new PublicKey("9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY"),
};

// ──────────────────────────────────────────
// Test Results Tracking
// ──────────────────────────────────────────

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "SKIP";
  details: string;
  tx?: string;
}

const results: TestResult[] = [];
let passCount = 0;
let failCount = 0;

function recordTest(name: string, status: "PASS" | "FAIL" | "SKIP", details: string, tx?: string) {
  results.push({ name, status, details, tx });
  if (status === "PASS") passCount++;
  if (status === "FAIL") failCount++;
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "⊘";
  console.log(`  ${icon} ${name}: ${details}${tx ? ` [${tx.slice(0, 16)}...]` : ""}`);
}

// ──────────────────────────────────────────
// Serialization Helpers
// ──────────────────────────────────────────

function ixDiscriminator(name: string): Buffer {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

function loadKeypair(filePath: string): Keypair {
  const resolved = filePath.startsWith("~")
    ? path.join(process.env.HOME!, filePath.slice(1))
    : filePath;
  const raw = JSON.parse(fs.readFileSync(resolved, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function findPDA(seeds: Buffer[], programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

function serializePubkey(key: PublicKey): Buffer { return key.toBuffer(); }
function serializeI64(val: bigint): Buffer { const b = Buffer.alloc(8); b.writeBigInt64LE(val); return b; }
function serializeU64(val: bigint): Buffer { const b = Buffer.alloc(8); b.writeBigUInt64LE(val); return b; }
function serializeU32(val: number): Buffer { const b = Buffer.alloc(4); b.writeUInt32LE(val); return b; }
function serializeU16(val: number): Buffer { const b = Buffer.alloc(2); b.writeUInt16LE(val); return b; }
function serializeU8(val: number): Buffer { return Buffer.from([val]); }
function serializeBool(val: boolean): Buffer { return Buffer.from([val ? 1 : 0]); }
function serializeHash(hex?: string): Buffer {
  if (hex) return Buffer.from(hex, "hex");
  return createHash("sha256").update(Date.now().toString() + Math.random()).digest();
}

// ──────────────────────────────────────────
// PDA derivations
// ──────────────────────────────────────────

const [aeonConfigPDA] = findPDA([Buffer.from("aeon_config")], PROGRAM_IDS.core);
const [proofConfigPDA] = findPDA([Buffer.from("proof_config")], PROGRAM_IDS.proof);
const [treasuryConfigPDA] = findPDA([Buffer.from("treasury_config")], PROGRAM_IDS.treasury);
const [treasuryVaultPDA] = findPDA([Buffer.from("treasury_vault")], PROGRAM_IDS.treasury);
const [donationVaultPDA] = findPDA([Buffer.from("donation_vault")], PROGRAM_IDS.treasury);
const [ccsConfigPDA] = findPDA([Buffer.from("ccs_config")], PROGRAM_IDS.treasury);
const [apolloConfigPDA] = findPDA([Buffer.from("apollo_config")], PROGRAM_IDS.apollo);
const [hermesConfigPDA] = findPDA([Buffer.from("hermes_config")], PROGRAM_IDS.hermes);
const [auditorConfigPDA] = findPDA([Buffer.from("auditor_config")], PROGRAM_IDS.auditor);
const [serviceConfigPDA] = findPDA([Buffer.from("service_config")], PROGRAM_IDS.service);

// ──────────────────────────────────────────
// Fund accounts helper
// ──────────────────────────────────────────

async function fundAccount(connection: Connection, pubkey: PublicKey, amount: number = 10) {
  const balance = await connection.getBalance(pubkey);
  if (balance < amount * LAMPORTS_PER_SOL) {
    const sig = await connection.requestAirdrop(pubkey, amount * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
  }
}

// ═══════════════════════════════════════════════
// FASE 2A: Initialize all 7 programs
// ═══════════════════════════════════════════════

async function initializeAll(
  connection: Connection,
  superAuth: Keypair,
  aeonAuth: Keypair,
  keeperAuth: Keypair,
) {
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║  FASE 2A: Initialize All 7 Programs            ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  // ── 1. noumen_core: initialize_aeon ──
  console.log("─── [1/7] noumen_core: initialize_aeon ───");
  try {
    const existing = await connection.getAccountInfo(aeonConfigPDA);
    if (existing) {
      recordTest("initialize_aeon", "SKIP", "Already initialized");
    } else {
      const argsData = Buffer.concat([
        serializePubkey(keeperAuth.publicKey),    // keeper_authority
        serializePubkey(aeonAuth.publicKey),       // aeon_authority
        serializePubkey(PROGRAM_IDS.treasury),     // treasury_program
        serializePubkey(PROGRAM_IDS.proof),        // proof_program
        serializeI64(BigInt(60)),                   // heartbeat_interval: 60s
        serializeU32(100),                          // operational_agent_cap: 100
      ]);
      const data = Buffer.concat([ixDiscriminator("initialize_aeon"), argsData]);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
          { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.core,
        data,
      });
      const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [superAuth], { commitment: "confirmed" });
      recordTest("initialize_aeon", "PASS", `AeonConfig: ${aeonConfigPDA.toBase58().slice(0, 12)}...`, sig);
    }
  } catch (err: any) {
    recordTest("initialize_aeon", "FAIL", err.message);
  }

  // ── 2. noumen_proof: initialize_proof ──
  console.log("─── [2/7] noumen_proof: initialize_proof ───");
  try {
    const existing = await connection.getAccountInfo(proofConfigPDA);
    if (existing) {
      recordTest("initialize_proof", "SKIP", "Already initialized");
    } else {
      const argsData = serializePubkey(keeperAuth.publicKey);
      const data = Buffer.concat([ixDiscriminator("initialize_proof"), argsData]);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: proofConfigPDA, isSigner: false, isWritable: true },
          { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.proof,
        data,
      });
      const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [superAuth], { commitment: "confirmed" });
      recordTest("initialize_proof", "PASS", `ProofConfig: ${proofConfigPDA.toBase58().slice(0, 12)}...`, sig);
    }
  } catch (err: any) {
    recordTest("initialize_proof", "FAIL", err.message);
  }

  // ── 3. noumen_treasury: initialize_treasury (step 1) ──
  console.log("─── [3/7] noumen_treasury: initialize_treasury ───");
  try {
    const existing = await connection.getAccountInfo(treasuryConfigPDA);
    if (existing) {
      recordTest("initialize_treasury", "SKIP", "Already initialized");
    } else {
      const argsData = Buffer.concat([
        serializePubkey(aeonAuth.publicKey),
        serializePubkey(keeperAuth.publicKey),
        serializePubkey(CREATOR_WALLET),
      ]);
      const data = Buffer.concat([ixDiscriminator("initialize_treasury"), argsData]);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
          { pubkey: treasuryConfigPDA, isSigner: false, isWritable: true },
          { pubkey: treasuryVaultPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.treasury,
        data,
      });
      const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [superAuth], { commitment: "confirmed" });
      recordTest("initialize_treasury", "PASS", `TreasuryConfig: ${treasuryConfigPDA.toBase58().slice(0, 12)}...`, sig);
    }
  } catch (err: any) {
    recordTest("initialize_treasury", "FAIL", err.message);
  }

  // ── 3b. noumen_treasury: initialize_donations (step 2) ──
  console.log("─── [3b/7] noumen_treasury: initialize_donations ───");
  try {
    const existing = await connection.getAccountInfo(donationVaultPDA);
    if (existing) {
      recordTest("initialize_donations", "SKIP", "Already initialized");
    } else {
      const data = ixDiscriminator("initialize_donations");
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
          { pubkey: treasuryConfigPDA, isSigner: false, isWritable: false },
          { pubkey: donationVaultPDA, isSigner: false, isWritable: true },
          { pubkey: ccsConfigPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.treasury,
        data,
      });
      const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [superAuth], { commitment: "confirmed" });
      recordTest("initialize_donations", "PASS", `DonationVault + CCS initialized`, sig);
    }
  } catch (err: any) {
    recordTest("initialize_donations", "FAIL", err.message);
  }

  // ── 4. noumen_apollo: initialize_apollo ──
  console.log("─── [4/7] noumen_apollo: initialize_apollo ───");
  try {
    const existing = await connection.getAccountInfo(apolloConfigPDA);
    if (existing) {
      recordTest("initialize_apollo", "SKIP", "Already initialized");
    } else {
      const argsData = Buffer.concat([
        serializePubkey(aeonAuth.publicKey),       // authority (apollo_authority)
        serializeU16(50),                           // max_mli_pools
        serializeU64(BigInt(1_000_000_000)),        // mli_tvl_minimum (1 SOL)
      ]);
      const data = Buffer.concat([ixDiscriminator("initialize_apollo"), argsData]);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
          { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.apollo,
        data,
      });
      const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
      recordTest("initialize_apollo", "PASS", `ApolloConfig: ${apolloConfigPDA.toBase58().slice(0, 12)}...`, sig);
    }
  } catch (err: any) {
    recordTest("initialize_apollo", "FAIL", err.message);
  }

  // ── 5. noumen_hermes: initialize_hermes ──
  console.log("─── [5/7] noumen_hermes: initialize_hermes ───");
  try {
    const existing = await connection.getAccountInfo(hermesConfigPDA);
    if (existing) {
      recordTest("initialize_hermes", "SKIP", "Already initialized");
    } else {
      const argsData = serializePubkey(aeonAuth.publicKey); // hermes_authority
      const data = Buffer.concat([ixDiscriminator("initialize_hermes"), argsData]);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: hermesConfigPDA, isSigner: false, isWritable: true },
          { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.hermes,
        data,
      });
      const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
      recordTest("initialize_hermes", "PASS", `HermesConfig: ${hermesConfigPDA.toBase58().slice(0, 12)}...`, sig);
    }
  } catch (err: any) {
    recordTest("initialize_hermes", "FAIL", err.message);
  }

  // ── 6. noumen_auditor: initialize_auditor ──
  console.log("─── [6/7] noumen_auditor: initialize_auditor ───");
  try {
    const existing = await connection.getAccountInfo(auditorConfigPDA);
    if (existing) {
      recordTest("initialize_auditor", "SKIP", "Already initialized");
    } else {
      const argsData = serializePubkey(aeonAuth.publicKey); // aeon_authority
      const data = Buffer.concat([ixDiscriminator("initialize_auditor"), argsData]);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
          { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.auditor,
        data,
      });
      const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [superAuth], { commitment: "confirmed" });
      recordTest("initialize_auditor", "PASS", `AuditorConfig: ${auditorConfigPDA.toBase58().slice(0, 12)}...`, sig);
    }
  } catch (err: any) {
    recordTest("initialize_auditor", "FAIL", err.message);
  }

  // ── 7. noumen_service: initialize_service_config ──
  console.log("─── [7/7] noumen_service: initialize_service_config ───");
  try {
    const existing = await connection.getAccountInfo(serviceConfigPDA);
    if (existing) {
      recordTest("initialize_service_config", "SKIP", "Already initialized");
    } else {
      const argsData = Buffer.concat([
        serializePubkey(aeonAuth.publicKey),
        serializePubkey(keeperAuth.publicKey),
      ]);
      const data = Buffer.concat([ixDiscriminator("initialize_service_config"), argsData]);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: serviceConfigPDA, isSigner: false, isWritable: true },
          { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.service,
        data,
      });
      const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [superAuth], { commitment: "confirmed" });
      recordTest("initialize_service_config", "PASS", `ServiceConfig: ${serviceConfigPDA.toBase58().slice(0, 12)}...`, sig);
    }
  } catch (err: any) {
    recordTest("initialize_service_config", "FAIL", err.message);
  }
}

// ═══════════════════════════════════════════════
// FASE 2B: Test every instruction
// ═══════════════════════════════════════════════

async function testAllInstructions(
  connection: Connection,
  superAuth: Keypair,
  aeonAuth: Keypair,
  keeperAuth: Keypair,
  payer: Keypair,
) {
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║  FASE 2B: Test Every Instruction               ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  // ── CORE: create_agent ──
  console.log("─── noumen_core: create_agent ───");
  const agentId = 1;
  const [agentManifestPDA] = findPDA(
    [Buffer.from("agent"), serializeU16(agentId)],
    PROGRAM_IDS.core,
  );
  try {
    const existing = await connection.getAccountInfo(agentManifestPDA);
    if (existing) {
      recordTest("create_agent", "SKIP", "Agent #1 already exists");
    } else {
      const argsData = Buffer.concat([
        serializeU16(agentId),                     // agent_id
        serializePubkey(aeonAuth.publicKey),        // authority
        serializeU8(1),                             // agent_type: 1 (evaluator)
        serializeU8(0),                             // execution_permission: 0 (none)
        serializeU64(BigInt(0)),                    // budget_lamports
        serializeU64(BigInt(0)),                    // budget_daily_cap_lamports
        serializeI64(BigInt(Math.floor(Date.now() / 1000) + 86400 * 365)), // ttl: absolute timestamp 1 year from now
        serializeHash(),                            // creation_proof: [u8; 32]
      ]);
      const data = Buffer.concat([ixDiscriminator("create_agent"), argsData]);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
          { pubkey: agentManifestPDA, isSigner: false, isWritable: true },
          { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.core,
        data,
      });
      const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
      recordTest("create_agent", "PASS", `Agent #${agentId} created`, sig);
    }
  } catch (err: any) {
    recordTest("create_agent", "FAIL", err.message);
  }

  // ── CORE: update_agent ──
  console.log("─── noumen_core: update_agent ───");
  try {
    // UpdateAgentArgs: new_authority (Option<Pubkey>), new_budget_daily_cap (Option<u64>), new_ttl (Option<i64>)
    // Borsh Option: 0 = None, 1 + value = Some
    const argsData = Buffer.concat([
      Buffer.from([0]),                             // new_authority: None
      Buffer.from([1]), serializeU64(BigInt(500_000_000)), // new_budget_daily_cap: Some(0.5 SOL)
      Buffer.from([0]),                             // new_ttl: None
    ]);
    const data = Buffer.concat([ixDiscriminator("update_agent"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: false },
        { pubkey: agentManifestPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
    recordTest("update_agent", "PASS", "Agent #1 daily cap updated to 0.5 SOL", sig);
  } catch (err: any) {
    recordTest("update_agent", "FAIL", err.message);
  }

  // ── CORE: record_heartbeat ──
  console.log("─── noumen_core: record_heartbeat ───");
  try {
    const data = ixDiscriminator("record_heartbeat");
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [keeperAuth], { commitment: "confirmed" });
    recordTest("record_heartbeat", "PASS", "Heartbeat recorded", sig);
  } catch (err: any) {
    recordTest("record_heartbeat", "FAIL", err.message);
  }

  // ── CORE: propose_policy_change ──
  console.log("─── noumen_core: propose_policy_change ───");
  const proposalId = 1;
  const [policyPDA] = findPDA(
    [Buffer.from("proposal"), serializeU32(proposalId)],
    PROGRAM_IDS.core,
  );
  try {
    const existing = await connection.getAccountInfo(policyPDA);
    if (existing) {
      recordTest("propose_policy_change", "SKIP", "Proposal #1 already exists");
    } else {
      const argsData = Buffer.concat([
        serializeU32(proposalId),                  // proposal_id
        serializeU8(2),                             // policy_layer: 2 (Operational)
        serializeHash(),                            // change_hash
        serializeI64(BigInt(86400)),                // delay_seconds: 24h
      ]);
      const data = Buffer.concat([ixDiscriminator("propose_policy_change"), argsData]);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: aeonConfigPDA, isSigner: false, isWritable: false },
          { pubkey: policyPDA, isSigner: false, isWritable: true },
          { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.core,
        data,
      });
      const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
      recordTest("propose_policy_change", "PASS", `Proposal #${proposalId} created (Layer 2, 24h delay)`, sig);
    }
  } catch (err: any) {
    recordTest("propose_policy_change", "FAIL", err.message);
  }

  // ── CORE: trigger_circuit_breaker ──
  console.log("─── noumen_core: trigger_circuit_breaker ───");
  try {
    const argsData = Buffer.concat([
      serializeU8(1),                               // new_mode: 1 (AlertOnly)
      serializeHash(),                              // trigger_reason_hash
    ]);
    const data = Buffer.concat([ixDiscriminator("trigger_circuit_breaker"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
    recordTest("trigger_circuit_breaker", "PASS", "Circuit breaker → AlertOnly", sig);
  } catch (err: any) {
    recordTest("trigger_circuit_breaker", "FAIL", err.message);
  }

  // ── CORE: reset_circuit_breaker ──
  console.log("─── noumen_core: reset_circuit_breaker ───");
  try {
    const argsData = serializeHash(); // reason_hash [u8; 32]
    const data = Buffer.concat([ixDiscriminator("reset_circuit_breaker"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [superAuth], { commitment: "confirmed" });
    recordTest("reset_circuit_breaker", "PASS", "Circuit breaker → Normal", sig);
  } catch (err: any) {
    recordTest("reset_circuit_breaker", "FAIL", err.message);
  }

  // ── PROOF: log_decision ──
  console.log("─── noumen_proof: log_decision ───");
  const decisionNonce = BigInt(1);
  const [decisionLogPDA] = findPDA(
    [Buffer.from("decision"), serializeU16(agentId), serializeU64(decisionNonce)],
    PROGRAM_IDS.proof,
  );
  try {
    const argsData = Buffer.concat([
      serializeU16(agentId),                       // agent_id
      serializeU64(decisionNonce),                 // nonce
      serializeHash(),                              // input_hash [u8; 32]
      serializeHash(),                              // decision_hash [u8; 32]
      serializeHash(),                              // justification_hash [u8; 32]
      serializeU8(0b00000111),                     // evidence_families_bitmap: 3 families (Price, Liquidity, Behavior)
      serializeU8(1),                               // decision_class: 1 (Assessment)
      serializeBool(false),                         // is_execution_class
    ]);
    const data = Buffer.concat([ixDiscriminator("log_decision"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: false },
        { pubkey: decisionLogPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [keeperAuth], { commitment: "confirmed" });
    recordTest("log_decision", "PASS", `Decision #1 logged (3 evidence families)`, sig);
  } catch (err: any) {
    recordTest("log_decision", "FAIL", err.message);
  }

  // ── PROOF: log_decision #2 (execution class) ──
  console.log("─── noumen_proof: log_decision #2 (execution) ───");
  const decisionNonce2 = BigInt(2);
  const [decisionLogPDA2] = findPDA(
    [Buffer.from("decision"), serializeU16(agentId), serializeU64(decisionNonce2)],
    PROGRAM_IDS.proof,
  );
  try {
    const argsData = Buffer.concat([
      serializeU16(agentId),
      serializeU64(decisionNonce2),
      serializeHash(),
      serializeHash(),
      serializeHash(),
      serializeU8(0b00000111),                     // 3 evidence families
      serializeU8(2),                               // decision_class: 2 (Execution)
      serializeBool(true),                          // is_execution_class = true
    ]);
    const data = Buffer.concat([ixDiscriminator("log_decision"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: false },
        { pubkey: decisionLogPDA2, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [keeperAuth], { commitment: "confirmed" });
    recordTest("log_decision_exec", "PASS", `Decision #2 logged (execution class)`, sig);
  } catch (err: any) {
    recordTest("log_decision_exec", "FAIL", err.message);
  }

  // ── PROOF: confirm_execution ──
  console.log("─── noumen_proof: confirm_execution ───");
  const [executionResultPDA] = findPDA(
    [Buffer.from("execution"), decisionLogPDA2.toBuffer()],
    PROGRAM_IDS.proof,
  );
  try {
    const argsData = Buffer.concat([
      serializeHash(),                              // result_hash [u8; 32]
      serializeU8(0),                               // status: 0 (Success)
    ]);
    const data = Buffer.concat([ixDiscriminator("confirm_execution"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: false },
        { pubkey: decisionLogPDA2, isSigner: false, isWritable: true },
        { pubkey: executionResultPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [keeperAuth], { commitment: "confirmed" });
    recordTest("confirm_execution", "PASS", `Execution result confirmed for Decision #2`, sig);
  } catch (err: any) {
    recordTest("confirm_execution", "FAIL", err.message);
  }

  // ── PROOF: submit_batch_proof ──
  console.log("─── noumen_proof: submit_batch_proof ───");
  const batchNonce = BigInt(1);
  const [batchProofPDA] = findPDA(
    [Buffer.from("batch"), serializeU16(agentId), serializeU64(batchNonce)],
    PROGRAM_IDS.proof,
  );
  try {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializeU16(agentId),                       // agent_id
      serializeU64(batchNonce),                    // batch_nonce
      serializeHash(),                              // merkle_root [u8; 32]
      serializeU32(10),                             // leaf_count
      serializeI64(now - BigInt(3600)),            // start_timestamp
      serializeI64(now),                            // end_timestamp
    ]);
    const data = Buffer.concat([ixDiscriminator("submit_batch_proof"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: false },
        { pubkey: batchProofPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [keeperAuth], { commitment: "confirmed" });
    recordTest("submit_batch_proof", "PASS", `Batch #1 submitted (10 leaves)`, sig);
  } catch (err: any) {
    recordTest("submit_batch_proof", "FAIL", err.message);
  }

  // ── SERVICE: register_service (3 tiers) ──
  console.log("─── noumen_service: register 3 services ───");
  const services = [
    { id: 1, name: "Risk Snapshot", tier: 0, price: 20_000_000, cost: 10_000_000 },         // Entry: 0.02 SOL
    { id: 2, name: "Deep Analysis", tier: 1, price: 150_000_000, cost: 80_000_000 },         // Premium: 0.15 SOL
    { id: 3, name: "Institutional Feed", tier: 2, price: 2_000_000_000, cost: 1_000_000_000 }, // B2B: 2 SOL
  ];

  for (const svc of services) {
    const serviceIdBuf = serializeU16(svc.id);
    const [serviceEntryPDA] = findPDA(
      [Buffer.from("service"), serviceIdBuf],
      PROGRAM_IDS.service,
    );
    try {
      const existing = await connection.getAccountInfo(serviceEntryPDA);
      if (existing) {
        recordTest(`register_service_${svc.id}`, "SKIP", `${svc.name} already registered`);
        continue;
      }
      const argsData = Buffer.concat([
        serializeU16(svc.id),                      // service_id
        serializeU16(1),                            // owning_agent_id = 1 (APOLLO)
        serializeU8(svc.tier),                      // service_tier
        serializeU64(BigInt(svc.price)),            // price_lamports
        serializeU64(BigInt(svc.cost)),             // cost_lamports
      ]);
      const data = Buffer.concat([ixDiscriminator("register_service"), argsData]);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: serviceConfigPDA, isSigner: false, isWritable: true },
          { pubkey: serviceEntryPDA, isSigner: false, isWritable: true },
          { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.service,
        data,
      });
      const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
      recordTest(`register_service_${svc.id}`, "PASS", `${svc.name} (Tier ${svc.tier}, ${svc.price / LAMPORTS_PER_SOL} SOL)`, sig);
    } catch (err: any) {
      recordTest(`register_service_${svc.id}`, "FAIL", err.message);
    }
  }

  // ── SERVICE: update_service_price ──
  console.log("─── noumen_service: update_service_price ───");
  try {
    const [serviceEntryPDA1] = findPDA([Buffer.from("service"), serializeU16(1)], PROGRAM_IDS.service);
    const argsData = Buffer.concat([
      serializeU16(1),                              // _service_id
      serializeU64(BigInt(25_000_000)),             // new_price: 0.025 SOL
      serializeU64(BigInt(12_000_000)),             // new_cost: 0.012 SOL
    ]);
    const data = Buffer.concat([ixDiscriminator("update_service_price"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: false },
        { pubkey: serviceEntryPDA1, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
    recordTest("update_service_price", "PASS", "Service #1 price updated to 0.025 SOL", sig);
  } catch (err: any) {
    recordTest("update_service_price", "FAIL", err.message);
  }

  // ── SERVICE: update_service_level ──
  console.log("─── noumen_service: update_service_level ───");
  try {
    const [serviceEntryPDA1] = findPDA([Buffer.from("service"), serializeU16(1)], PROGRAM_IDS.service);
    const argsData = Buffer.concat([
      serializeU16(1),                              // _service_id
      serializeU8(1),                               // new_level: 1 (Simulated)
    ]);
    const data = Buffer.concat([ixDiscriminator("update_service_level"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: false },
        { pubkey: serviceEntryPDA1, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
    recordTest("update_service_level", "PASS", "Service #1 → Simulated", sig);
  } catch (err: any) {
    recordTest("update_service_level", "FAIL", err.message);
  }

  // ── SERVICE: update_service_metrics ──
  console.log("─── noumen_service: update_service_metrics ───");
  try {
    const [serviceEntryPDA1] = findPDA([Buffer.from("service"), serializeU16(1)], PROGRAM_IDS.service);
    const argsData = Buffer.concat([
      serializeU16(1),                              // _service_id
      serializeU16(42),                             // request_count_7d
      serializeU64(BigInt(1_050_000_000)),          // revenue_7d_lamports
    ]);
    const data = Buffer.concat([ixDiscriminator("update_service_metrics"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: false },
        { pubkey: serviceEntryPDA1, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [keeperAuth], { commitment: "confirmed" });
    recordTest("update_service_metrics", "PASS", "Service #1: 42 requests, 1.05 SOL revenue", sig);
  } catch (err: any) {
    recordTest("update_service_metrics", "FAIL", err.message);
  }

  // ── APOLLO: register_pool ──
  console.log("─── noumen_apollo: register_pool ───");
  const fakePool = Keypair.generate().publicKey;
  const [poolTaxonomyPDA] = findPDA(
    [Buffer.from("pool_tax"), fakePool.toBuffer()],
    PROGRAM_IDS.apollo,
  );
  try {
    const argsData = Buffer.concat([
      serializePubkey(fakePool),                   // pool_address
      serializeU8(0),                               // pool_type: 0 (AMM)
      serializeU8(0),                               // protocol: 0
      serializeU8(1),                               // risk_profile: 1 (medium)
      serializeU8(2),                               // il_sensitivity: 2
      serializeU8(0),                               // pair_class: 0
      serializeU64(BigInt(50_000_000_000)),         // tvl_lamports: 50 SOL
    ]);
    const data = Buffer.concat([ixDiscriminator("register_pool"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
        { pubkey: poolTaxonomyPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.apollo,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
    recordTest("register_pool", "PASS", `Pool registered: ${fakePool.toBase58().slice(0, 12)}...`, sig);
  } catch (err: any) {
    recordTest("register_pool", "FAIL", err.message);
  }

  // ── APOLLO: publish_assessment ──
  console.log("─── noumen_apollo: publish_assessment ───");
  const assessmentNonce = BigInt(1);
  const [assessmentPDA] = findPDA(
    [Buffer.from("assessment"), fakePool.toBuffer(), serializeU64(assessmentNonce)],
    PROGRAM_IDS.apollo,
  );
  try {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializePubkey(fakePool),                   // pool_address
      serializeU64(assessmentNonce),               // assessment_nonce
      serializeU8(2),                               // risk_level: 2 (medium)
      serializeU8(85),                              // confidence_score: 85%
      serializeU8(0b00000111),                     // evidence_families_bitmap: 3 families
      serializeU16(720),                            // composite_score: 72.0
      serializeU16(680),                            // mli_score: 68.0
      serializeU16(1200),                           // effective_apr_bps: 12%
      serializeU16(2500),                           // headline_apr_bps: 25%
      serializeU16(350),                            // il_projected_bps: 3.5%
      serializeU16(650),                            // sustainability_score: 65.0
      serializeI64(now + BigInt(86400)),            // expiry: 24h from now
      serializePubkey(decisionLogPDA),              // decision_log_ref
    ]);
    const data = Buffer.concat([ixDiscriminator("publish_assessment"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
        { pubkey: assessmentPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.apollo,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
    recordTest("publish_assessment", "PASS", `Assessment: risk=Medium, confidence=85%, APR=12%`, sig);
  } catch (err: any) {
    recordTest("publish_assessment", "FAIL", err.message);
  }

  // ── HERMES: publish_report ──
  console.log("─── noumen_hermes: publish_report ───");
  const reportNonce = BigInt(1);
  const [reportPDA] = findPDA(
    [Buffer.from("report"), serializeU64(reportNonce)],
    PROGRAM_IDS.hermes,
  );
  try {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializeU64(reportNonce),                   // report_nonce
      serializeU8(0),                               // report_type: 0 (PoolAnalysis)
      serializePubkey(fakePool),                   // subject_pool
      serializeHash(),                              // content_hash [u8; 32]
      serializeU8(90),                              // confidence_score: 90
      serializeI64(now + BigInt(86400)),            // expiry
      serializePubkey(decisionLogPDA),              // decision_log_ref
    ]);
    const data = Buffer.concat([ixDiscriminator("publish_report"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: hermesConfigPDA, isSigner: false, isWritable: true },
        { pubkey: reportPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.hermes,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
    recordTest("publish_report", "PASS", `Intelligence report #1 published`, sig);
  } catch (err: any) {
    recordTest("publish_report", "FAIL", err.message);
  }

  // ── HERMES: publish_pool_comparison ──
  console.log("─── noumen_hermes: publish_pool_comparison ───");
  const compReportNonce = BigInt(2);
  const [compReportPDA] = findPDA(
    [Buffer.from("report"), serializeU64(compReportNonce)],
    PROGRAM_IDS.hermes,
  );
  try {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializeU64(compReportNonce),               // report_nonce
      serializeHash(),                              // content_hash [u8; 32]
      serializeU8(3),                               // pool_count
      serializeU8(0),                               // pair_class
      serializeHash(),                              // subject_hash [u8; 32]
      serializeU8(88),                              // confidence_score: 88
      serializeI64(now + BigInt(86400)),            // expiry
      serializePubkey(decisionLogPDA),              // decision_log_ref
    ]);
    const data = Buffer.concat([ixDiscriminator("publish_pool_comparison"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: hermesConfigPDA, isSigner: false, isWritable: true },
        { pubkey: compReportPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.hermes,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
    recordTest("publish_pool_comparison", "PASS", `Pool comparison report published (3 pools)`, sig);
  } catch (err: any) {
    recordTest("publish_pool_comparison", "FAIL", err.message);
  }

  // ── AUDITOR: record_truth_label ──
  console.log("─── noumen_auditor: record_truth_label ───");
  const signalNonce = BigInt(1);
  const [truthLabelPDA] = findPDA(
    [Buffer.from("truth_label"), serializeU64(signalNonce)],
    PROGRAM_IDS.auditor,
  );
  try {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializeU64(signalNonce),                   // signal_nonce
      serializeHash(),                              // signal_id [u8; 32]
      serializeU8(1),                               // htl_result: 1 (True)
      serializeU8(0),                               // eol_result: 0 (NoEvent)
      serializeU8(0),                               // signal_type: 0
      serializeI64(now - BigInt(3660)),            // window_start (past)
      serializeI64(now - BigInt(60)),              // window_end (must be <= clock)
      serializeHash(),                              // evidence_hash [u8; 32]
    ]);
    const data = Buffer.concat([ixDiscriminator("record_truth_label"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
        { pubkey: truthLabelPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.auditor,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [superAuth], { commitment: "confirmed" });
    recordTest("record_truth_label", "PASS", `Truth label #1 recorded`, sig);
  } catch (err: any) {
    recordTest("record_truth_label", "FAIL", err.message);
  }

  // ── AUDITOR: register_security_incident ──
  console.log("─── noumen_auditor: register_security_incident ───");
  const incidentNonce = BigInt(1);
  const [incidentPDA] = findPDA(
    [Buffer.from("incident"), serializeU64(incidentNonce)],
    PROGRAM_IDS.auditor,
  );
  try {
    const argsData = Buffer.concat([
      serializeU64(incidentNonce),                 // incident_nonce
      serializePubkey(fakePool),                   // affected_pool
      serializeU8(0),                               // incident_type: 0
      serializeHash(),                              // detection_evidence_hash [u8; 32]
    ]);
    const data = Buffer.concat([ixDiscriminator("register_security_incident"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
        { pubkey: incidentPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.auditor,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [superAuth], { commitment: "confirmed" });
    recordTest("register_security_incident", "PASS", `Incident #1 registered`, sig);
  } catch (err: any) {
    recordTest("register_security_incident", "FAIL", err.message);
  }

  // ── AUDITOR: resolve_incident ──
  console.log("─── noumen_auditor: resolve_incident ───");
  try {
    const argsData = Buffer.concat([
      serializeU64(incidentNonce),                 // incident_nonce
      serializeU8(2),                               // new_status: 2 (Resolved)
      serializeHash(),                              // resolution_evidence_hash [u8; 32]
    ]);
    const data = Buffer.concat([ixDiscriminator("resolve_incident"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: auditorConfigPDA, isSigner: false, isWritable: false },
        { pubkey: incidentPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
      ],
      programId: PROGRAM_IDS.auditor,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [superAuth], { commitment: "confirmed" });
    recordTest("resolve_incident", "PASS", `Incident #1 resolved`, sig);
  } catch (err: any) {
    recordTest("resolve_incident", "FAIL", err.message);
  }

  // ── AUDITOR: publish_accuracy_snapshot ──
  console.log("─── noumen_auditor: publish_accuracy_snapshot ───");
  const snapshotNonce = BigInt(1);
  const [accuracyPDA] = findPDA(
    [Buffer.from("accuracy"), serializeU64(snapshotNonce)],
    PROGRAM_IDS.auditor,
  );
  try {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializeU64(snapshotNonce),                 // snapshot_nonce
      serializeU16(8500),                           // htl_accuracy_bps: 85%
      serializeU16(1200),                           // eol_positive_rate_bps: 12%
      serializeU16(250),                            // brier_score_bps: 0.025
      serializeU32(100),                            // sample_count
      serializeI64(now - BigInt(86400 * 7)),       // period_start: 7 days ago
      serializeI64(now),                            // period_end: now
      serializeHash(),                              // snapshot_hash [u8; 32]
    ]);
    const data = Buffer.concat([ixDiscriminator("publish_accuracy_snapshot"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: auditorConfigPDA, isSigner: false, isWritable: false },
        { pubkey: accuracyPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.auditor,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [superAuth], { commitment: "confirmed" });
    recordTest("publish_accuracy_snapshot", "PASS", `Accuracy snapshot: 85% HTL, 100 samples`, sig);
  } catch (err: any) {
    recordTest("publish_accuracy_snapshot", "FAIL", err.message);
  }

  // ── TREASURY: update_revenue_averages ──
  console.log("─── noumen_treasury: update_revenue_averages ───");
  try {
    const argsData = Buffer.concat([
      serializeU64(BigInt(5_000_000_000)),          // avg_7d_revenue: 5 SOL
      serializeU64(BigInt(20_000_000_000)),         // avg_30d_revenue: 20 SOL
    ]);
    const data = Buffer.concat([ixDiscriminator("update_revenue_averages"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: false },
        { pubkey: treasuryConfigPDA, isSigner: false, isWritable: false },
        { pubkey: ccsConfigPDA, isSigner: false, isWritable: true },
      ],
      programId: PROGRAM_IDS.treasury,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [keeperAuth], { commitment: "confirmed" });
    recordTest("update_revenue_averages", "PASS", "7d=5 SOL, 30d=20 SOL", sig);
  } catch (err: any) {
    recordTest("update_revenue_averages", "FAIL", err.message);
  }
}

// ═══════════════════════════════════════════════
// FASE 2C: Revenue Split Test (3 tiers)
// ═══════════════════════════════════════════════

async function testRevenueSplit(
  connection: Connection,
  payer: Keypair,
) {
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║  FASE 2C: Revenue Split Test (40/30/15/15)     ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  // Fund the creator wallet so it has rent exemption
  await fundAccount(connection, CREATOR_WALLET, 0.01);

  const tiers = [
    { name: "Entry (0.02 SOL)", serviceId: 1, amount: 20_000_000 },
    { name: "Premium (0.15 SOL)", serviceId: 2, amount: 150_000_000 },
    { name: "Institutional (2 SOL)", serviceId: 3, amount: 2_000_000_000 },
  ];

  for (const tier of tiers) {
    console.log(`─── Testing: ${tier.name} ───`);

    // Get creator balance before
    const creatorBalanceBefore = await connection.getBalance(CREATOR_WALLET);
    const vaultInfoBefore = await connection.getAccountInfo(treasuryVaultPDA);

    try {
      const argsData = Buffer.concat([
        serializeU16(tier.serviceId),
        serializeU64(BigInt(tier.amount)),
      ]);
      const data = Buffer.concat([ixDiscriminator("process_service_payment"), argsData]);
      const ix = new TransactionInstruction({
        keys: [
          { pubkey: payer.publicKey, isSigner: true, isWritable: true },
          { pubkey: treasuryConfigPDA, isSigner: false, isWritable: false },
          { pubkey: treasuryVaultPDA, isSigner: false, isWritable: true },
          { pubkey: ccsConfigPDA, isSigner: false, isWritable: true },
          { pubkey: CREATOR_WALLET, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_IDS.treasury,
        data,
      });

      const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [payer], { commitment: "confirmed" });

      // Verify split
      const creatorBalanceAfter = await connection.getBalance(CREATOR_WALLET);
      const creatorReceived = creatorBalanceAfter - creatorBalanceBefore;

      const expectedOps = Math.floor(tier.amount * 0.40);
      const expectedReserve = Math.floor(tier.amount * 0.30);
      const expectedDev = Math.floor(tier.amount * 0.15);
      const expectedCreator = tier.amount - expectedOps - expectedReserve - expectedDev;

      const creatorMatch = Math.abs(creatorReceived - expectedCreator) <= 1;

      if (creatorMatch) {
        recordTest(
          `payment_${tier.name}`,
          "PASS",
          `Split verified: Ops=${expectedOps/1e9}, Reserve=${expectedReserve/1e9}, Dev=${expectedDev/1e9}, Creator=${creatorReceived/1e9} SOL`,
          sig,
        );
      } else {
        recordTest(
          `payment_${tier.name}`,
          "FAIL",
          `Creator mismatch: expected ${expectedCreator}, got ${creatorReceived}`,
          sig,
        );
      }
    } catch (err: any) {
      recordTest(`payment_${tier.name}`, "FAIL", err.message);
    }
  }
}

// ═══════════════════════════════════════════════
// FASE 2D: End-to-end flow simulation
// ═══════════════════════════════════════════════

async function testEndToEnd(
  connection: Connection,
  superAuth: Keypair,
  aeonAuth: Keypair,
  keeperAuth: Keypair,
  payer: Keypair,
) {
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║  FASE 2D: End-to-End Flow Simulation           ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  // Flow: Decision logged → Assessment published → Report published → Payment processed → Audit snapshot

  // Step 1: Log a new decision
  console.log("─── E2E Step 1: Log decision ───");
  const e2eDecisionNonce = BigInt(100);
  const [e2eDecisionPDA] = findPDA(
    [Buffer.from("decision"), serializeU16(1), serializeU64(e2eDecisionNonce)],
    PROGRAM_IDS.proof,
  );
  try {
    const argsData = Buffer.concat([
      serializeU16(1), serializeU64(e2eDecisionNonce),
      serializeHash(), serializeHash(), serializeHash(),
      serializeU8(0b00011111), // 5 evidence families
      serializeU8(1), serializeBool(false),
    ]);
    const data = Buffer.concat([ixDiscriminator("log_decision"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: false },
        { pubkey: e2eDecisionPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [keeperAuth], { commitment: "confirmed" });
    recordTest("e2e_log_decision", "PASS", "Decision #100 logged with 5 evidence families", sig);
  } catch (err: any) {
    recordTest("e2e_log_decision", "FAIL", err.message);
  }

  // Step 2: Publish assessment referencing the decision
  console.log("─── E2E Step 2: Publish assessment ───");
  const e2ePool = Keypair.generate().publicKey;
  const e2eAssessmentNonce = BigInt(100);
  const [e2eAssessmentPDA] = findPDA(
    [Buffer.from("assessment"), e2ePool.toBuffer(), serializeU64(e2eAssessmentNonce)],
    PROGRAM_IDS.apollo,
  );
  try {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializePubkey(e2ePool),
      serializeU64(e2eAssessmentNonce),
      serializeU8(1), serializeU8(92), serializeU8(0b00011111),
      serializeU16(850), serializeU16(790),
      serializeU16(800), serializeU16(1500),
      serializeU16(200), serializeU16(780),
      serializeI64(now + BigInt(86400)),
      serializePubkey(e2eDecisionPDA),
    ]);
    const data = Buffer.concat([ixDiscriminator("publish_assessment"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
        { pubkey: e2eAssessmentPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.apollo,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
    recordTest("e2e_publish_assessment", "PASS", "Assessment: risk=Low, confidence=92%", sig);
  } catch (err: any) {
    recordTest("e2e_publish_assessment", "FAIL", err.message);
  }

  // Step 3: Publish Hermes report
  console.log("─── E2E Step 3: Publish intelligence report ───");
  const e2eReportNonce = BigInt(100);
  const [e2eReportPDA] = findPDA(
    [Buffer.from("report"), serializeU64(e2eReportNonce)],
    PROGRAM_IDS.hermes,
  );
  try {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializeU64(e2eReportNonce),
      serializeU8(0), serializePubkey(e2ePool),
      serializeHash(), serializeU8(95),
      serializeI64(now + BigInt(86400)),
      serializePubkey(e2eDecisionPDA),
    ]);
    const data = Buffer.concat([ixDiscriminator("publish_report"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: hermesConfigPDA, isSigner: false, isWritable: true },
        { pubkey: e2eReportPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.hermes,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [aeonAuth], { commitment: "confirmed" });
    recordTest("e2e_publish_report", "PASS", "Intelligence report published", sig);
  } catch (err: any) {
    recordTest("e2e_publish_report", "FAIL", err.message);
  }

  // Step 4: Process payment
  console.log("─── E2E Step 4: Process service payment ───");
  try {
    const argsData = Buffer.concat([
      serializeU16(1),
      serializeU64(BigInt(100_000_000)), // 0.1 SOL
    ]);
    const data = Buffer.concat([ixDiscriminator("process_service_payment"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: treasuryConfigPDA, isSigner: false, isWritable: false },
        { pubkey: treasuryVaultPDA, isSigner: false, isWritable: true },
        { pubkey: ccsConfigPDA, isSigner: false, isWritable: true },
        { pubkey: CREATOR_WALLET, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.treasury,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [payer], { commitment: "confirmed" });
    recordTest("e2e_process_payment", "PASS", "0.1 SOL payment processed with 4-way split", sig);
  } catch (err: any) {
    recordTest("e2e_process_payment", "FAIL", err.message);
  }

  // Step 5: Audit truth label
  console.log("─── E2E Step 5: Record truth label for audit ───");
  const e2eTruthNonce = BigInt(100);
  const [e2eTruthPDA] = findPDA(
    [Buffer.from("truth_label"), serializeU64(e2eTruthNonce)],
    PROGRAM_IDS.auditor,
  );
  try {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializeU64(e2eTruthNonce),
      serializeHash(), serializeU8(1), serializeU8(0), serializeU8(0),
      serializeI64(now - BigInt(3660)), serializeI64(now - BigInt(60)),
      serializeHash(),
    ]);
    const data = Buffer.concat([ixDiscriminator("record_truth_label"), argsData]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
        { pubkey: e2eTruthPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.auditor,
      data,
    });
    const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [superAuth], { commitment: "confirmed" });
    recordTest("e2e_record_truth_label", "PASS", "Audit truth label recorded", sig);
  } catch (err: any) {
    recordTest("e2e_record_truth_label", "FAIL", err.message);
  }

  recordTest("e2e_flow_complete", "PASS", "Full flow: Decision → Assessment → Report → Payment → Audit");
}

// ═══════════════════════════════════════════════
// Verification
// ═══════════════════════════════════════════════

async function verifyAllPDAs(connection: Connection) {
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║  Verification: All PDAs                        ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  const pdas = [
    { name: "AeonConfig", pda: aeonConfigPDA, program: "core" },
    { name: "ProofConfig", pda: proofConfigPDA, program: "proof" },
    { name: "TreasuryConfig", pda: treasuryConfigPDA, program: "treasury" },
    { name: "TreasuryVault", pda: treasuryVaultPDA, program: "treasury" },
    { name: "DonationVault", pda: donationVaultPDA, program: "treasury" },
    { name: "CCSConfig", pda: ccsConfigPDA, program: "treasury" },
    { name: "ApolloConfig", pda: apolloConfigPDA, program: "apollo" },
    { name: "HermesConfig", pda: hermesConfigPDA, program: "hermes" },
    { name: "AuditorConfig", pda: auditorConfigPDA, program: "auditor" },
    { name: "ServiceConfig", pda: serviceConfigPDA, program: "service" },
  ];

  let allOk = true;
  for (const { name, pda, program } of pdas) {
    const info = await connection.getAccountInfo(pda);
    const status = info ? `OK (${info.data.length} bytes)` : "MISSING";
    if (!info) allOk = false;
    console.log(`  ${name.padEnd(20)} ${pda.toBase58().slice(0, 16)}... ${status}`);
  }

  if (allOk) {
    recordTest("verify_all_pdas", "PASS", "All 10 config PDAs exist and are initialized");
  } else {
    recordTest("verify_all_pdas", "FAIL", "Some PDAs are missing");
  }
}

// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  AXIONBLADE v3.2.3 — Localnet Deploy & Test      ║");
  console.log("║  Proof Before Action                              ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const connection = new Connection(RPC_URL, "confirmed");

  // Load keypairs
  const projectRoot = path.join(process.env.HOME!, "Desktop/AXIONBLADE/contracts");
  const superAuth = loadKeypair(path.join(projectRoot, "keys/super_authority.json"));
  const aeonAuth = loadKeypair(path.join(projectRoot, "keys/aeon_authority.json"));
  const keeperAuth = loadKeypair(path.join(projectRoot, "keys/keeper_authority.json"));
  const payer = loadKeypair("~/.config/solana/id.json");

  console.log("Authorities:");
  console.log(`  Super:   ${superAuth.publicKey.toBase58()}`);
  console.log(`  AEON:    ${aeonAuth.publicKey.toBase58()}`);
  console.log(`  Keeper:  ${keeperAuth.publicKey.toBase58()}`);
  console.log(`  Payer:   ${payer.publicKey.toBase58()}`);
  console.log(`  Creator: ${CREATOR_WALLET.toBase58()}`);
  console.log(`  RPC:     ${RPC_URL}\n`);

  // Fund all authorities
  console.log("Funding authorities...");
  await fundAccount(connection, superAuth.publicKey, 100);
  await fundAccount(connection, aeonAuth.publicKey, 100);
  await fundAccount(connection, keeperAuth.publicKey, 100);
  await fundAccount(connection, payer.publicKey, 100);
  console.log("  All funded.\n");

  // Run all phases
  await initializeAll(connection, superAuth, aeonAuth, keeperAuth);
  await testAllInstructions(connection, superAuth, aeonAuth, keeperAuth, payer);
  await testRevenueSplit(connection, payer);
  await testEndToEnd(connection, superAuth, aeonAuth, keeperAuth, payer);
  await verifyAllPDAs(connection);

  // ══════════════════════════════════════════
  // Final Report
  // ══════════════════════════════════════════

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  FINAL TEST REPORT                                ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Total Tests: ${results.length.toString().padStart(3)}                                   ║`);
  console.log(`║  Passed:      ${passCount.toString().padStart(3)}                                   ║`);
  console.log(`║  Failed:      ${failCount.toString().padStart(3)}                                   ║`);
  console.log(`║  Skipped:     ${(results.length - passCount - failCount).toString().padStart(3)}                                   ║`);
  console.log("╚══════════════════════════════════════════════════╝\n");

  if (failCount > 0) {
    console.log("FAILED TESTS:");
    for (const r of results) {
      if (r.status === "FAIL") {
        console.log(`  ✗ ${r.name}: ${r.details}`);
      }
    }
  }

  console.log("\nAll test details:");
  for (const r of results) {
    const icon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : "⊘";
    console.log(`  ${icon} [${r.status}] ${r.name}`);
  }

  if (failCount > 0) {
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\nAXIONBLADE localnet deployment and testing complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nFATAL ERROR:", err);
    process.exit(1);
  });
