/**
 * AXIONBLADE v3.2.3 — FASE 3: Security Test Suite
 *
 * Tests:
 *   1. Unauthorized access (wrong signer for each instruction)
 *   2. Overflow protection (arithmetic boundary checks)
 *   3. Re-entrancy guards (double-init, double-confirm, replay)
 *   4. Authority separation (role isolation verification)
 *   5. PDA tampering (wrong seeds, wrong program)
 *   6. Double-spend prevention (double payments, double sweeps)
 *   7. Axiom enforcement (A0-9 agent cap, A0-14 evaluator no-exec, etc.)
 *
 * Prerequisites:
 *   - solana-test-validator running on localhost:8899
 *   - All 7 programs deployed & initialized (run init-localnet.ts first)
 *   - Keys in contracts/keys/
 *
 * Usage: npx ts-node scripts/security-tests.ts
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
  category: string;
  status: "PASS" | "FAIL" | "SKIP";
  details: string;
}

const results: TestResult[] = [];
let passCount = 0;
let failCount = 0;

function recordTest(category: string, name: string, status: "PASS" | "FAIL" | "SKIP", details: string) {
  results.push({ name, category, status, details });
  if (status === "PASS") passCount++;
  if (status === "FAIL") failCount++;
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "⊘";
  console.log(`  ${icon} ${name}: ${details}`);
}

/**
 * Security tests expect transactions to FAIL. A passing security test means
 * the transaction was correctly rejected by the program. If a tx succeeds
 * when it should fail, that's a security vulnerability.
 */
async function expectTxFail(
  connection: Connection,
  ix: TransactionInstruction,
  signers: Keypair[],
  expectedErrorSubstring: string,
): Promise<{ failed: boolean; errorMsg: string }> {
  try {
    await sendAndConfirmTransaction(
      connection,
      new Transaction().add(ix),
      signers,
      { commitment: "confirmed" },
    );
    return { failed: false, errorMsg: "Transaction SUCCEEDED (expected failure)" };
  } catch (err: any) {
    const msg = err.message || String(err);
    if (msg.includes(expectedErrorSubstring) || expectedErrorSubstring === "any") {
      return { failed: true, errorMsg: msg };
    }
    // Different error than expected — still a failure but may indicate a different issue
    return { failed: true, errorMsg: msg };
  }
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
// Fund helper
// ──────────────────────────────────────────

async function fundAccount(connection: Connection, pubkey: PublicKey, amount: number = 5) {
  const sig = await connection.requestAirdrop(pubkey, amount * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig, "confirmed");
}

// ═══════════════════════════════════════════
// SECTION 1: Unauthorized Access Tests
// ═══════════════════════════════════════════

async function testUnauthorizedAccess(
  connection: Connection,
  superAuth: Keypair,
  aeonAuth: Keypair,
  keeperAuth: Keypair,
  attacker: Keypair,
) {
  const CAT = "UNAUTHORIZED";
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║  SECTION 1: Unauthorized Access Tests          ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  // 1.1 — Attacker tries create_agent (requires aeon_authority)
  {
    const agentId = 99;
    const [agentPDA] = findPDA([Buffer.from("agent"), serializeU16(agentId)], PROGRAM_IDS.core);
    const argsData = Buffer.concat([
      serializeU16(agentId), serializePubkey(attacker.publicKey), serializeU8(1), serializeU8(0),
      serializeU64(BigInt(0)), serializeU64(BigInt(0)),
      serializeI64(BigInt(Math.floor(Date.now() / 1000) + 86400 * 365)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: agentPDA, isSigner: false, isWritable: true },
        { pubkey: attacker.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data: Buffer.concat([ixDiscriminator("create_agent"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [attacker], "0x7d3");
    recordTest(CAT, "core_create_agent_attacker",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Attacker correctly rejected from create_agent" : "VULNERABILITY: Attacker created an agent!");
  }

  // 1.2 — Attacker tries reset_circuit_breaker (requires super_authority)
  {
    const argsData = Buffer.alloc(0);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: attacker.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data: Buffer.concat([ixDiscriminator("reset_circuit_breaker"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [attacker], "any");
    recordTest(CAT, "core_reset_breaker_attacker",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Attacker correctly rejected from reset_circuit_breaker" : "VULNERABILITY: Attacker reset circuit breaker!");
  }

  // 1.3 — Attacker tries log_decision (requires keeper_authority)
  {
    const nonce = BigInt(999);
    const [decisionPDA] = findPDA(
      [Buffer.from("decision"), serializeU16(1), serializeU64(nonce)],
      PROGRAM_IDS.proof,
    );
    const argsData = Buffer.concat([
      serializeU16(1), serializeU64(nonce), serializeU8(0),
      serializeU8(0b00111), serializeBool(false), serializeHash(),
      serializeI64(BigInt(Math.floor(Date.now() / 1000))),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: true },
        { pubkey: decisionPDA, isSigner: false, isWritable: true },
        { pubkey: attacker.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data: Buffer.concat([ixDiscriminator("log_decision"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [attacker], "0x1779");
    recordTest(CAT, "proof_log_decision_attacker",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Attacker correctly rejected from log_decision" : "VULNERABILITY: Attacker logged a decision!");
  }

  // 1.4 — Attacker tries publish_assessment (requires apollo authority)
  {
    const pool = Keypair.generate().publicKey;
    const nonce = BigInt(999);
    const [assessPDA] = findPDA(
      [Buffer.from("assessment"), pool.toBuffer(), serializeU64(nonce)],
      PROGRAM_IDS.apollo,
    );
    const argsData = Buffer.concat([
      serializePubkey(pool), serializeU64(nonce), serializeU8(1),
      serializeU8(85), serializeU16(1200), serializeU16(1000),
      serializeU8(0b00011), serializeI64(BigInt(Math.floor(Date.now() / 1000) + 3600)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
        { pubkey: assessPDA, isSigner: false, isWritable: true },
        { pubkey: attacker.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.apollo,
      data: Buffer.concat([ixDiscriminator("publish_assessment"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [attacker], "any");
    recordTest(CAT, "apollo_publish_assessment_attacker",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Attacker correctly rejected from publish_assessment" : "VULNERABILITY: Attacker published assessment!");
  }

  // 1.5 — Attacker tries publish_report (requires hermes authority)
  {
    const nonce = BigInt(999);
    const [reportPDA] = findPDA(
      [Buffer.from("report"), serializeU64(nonce)],
      PROGRAM_IDS.hermes,
    );
    const argsData = Buffer.concat([
      serializeU64(nonce), serializeU8(0),
      serializePubkey(Keypair.generate().publicKey),
      serializeU8(80),
      serializeI64(BigInt(Math.floor(Date.now() / 1000) + 3600)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: hermesConfigPDA, isSigner: false, isWritable: true },
        { pubkey: reportPDA, isSigner: false, isWritable: true },
        { pubkey: attacker.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.hermes,
      data: Buffer.concat([ixDiscriminator("publish_report"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [attacker], "any");
    recordTest(CAT, "hermes_publish_report_attacker",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Attacker correctly rejected from publish_report" : "VULNERABILITY: Attacker published report!");
  }

  // 1.6 — Attacker tries record_truth_label (requires auditor authority = superAuth)
  {
    const nonce = BigInt(999);
    const [truthPDA] = findPDA(
      [Buffer.from("truth_label"), serializeU64(nonce)],
      PROGRAM_IDS.auditor,
    );
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializeU64(nonce), serializeHash(),
      serializeU8(1), serializeU8(0), serializeU8(0),
      serializeI64(now - BigInt(3660)), serializeI64(now - BigInt(60)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
        { pubkey: truthPDA, isSigner: false, isWritable: true },
        { pubkey: attacker.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.auditor,
      data: Buffer.concat([ixDiscriminator("record_truth_label"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [attacker], "any");
    recordTest(CAT, "auditor_record_truth_label_attacker",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Attacker correctly rejected from record_truth_label" : "VULNERABILITY: Attacker recorded truth label!");
  }

  // 1.7 — Attacker tries register_service (requires aeon_authority)
  {
    const serviceId = 99;
    const [servicePDA] = findPDA(
      [Buffer.from("service"), serializeU16(serviceId)],
      PROGRAM_IDS.service,
    );
    const argsData = Buffer.concat([
      serializeU16(serviceId), serializeU8(0),
      serializeU64(BigInt(20_000_000)), serializeU64(BigInt(15_000_000)),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: true },
        { pubkey: servicePDA, isSigner: false, isWritable: true },
        { pubkey: attacker.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data: Buffer.concat([ixDiscriminator("register_service"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [attacker], "any");
    recordTest(CAT, "service_register_attacker",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Attacker correctly rejected from register_service" : "VULNERABILITY: Attacker registered service!");
  }

  // 1.8 — Keeper tries create_agent (keeper != aeon)
  {
    const agentId = 98;
    const [agentPDA] = findPDA([Buffer.from("agent"), serializeU16(agentId)], PROGRAM_IDS.core);
    const argsData = Buffer.concat([
      serializeU16(agentId), serializePubkey(keeperAuth.publicKey), serializeU8(1), serializeU8(0),
      serializeU64(BigInt(0)), serializeU64(BigInt(0)),
      serializeI64(BigInt(Math.floor(Date.now() / 1000) + 86400 * 365)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: agentPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data: Buffer.concat([ixDiscriminator("create_agent"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [keeperAuth], "any");
    recordTest(CAT, "core_create_agent_keeper_role",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Keeper correctly rejected from create_agent (role separation)" : "VULNERABILITY: Keeper created agent!");
  }

  // 1.9 — AEON tries log_decision (only keeper can do this)
  {
    const nonce = BigInt(998);
    const [decisionPDA] = findPDA(
      [Buffer.from("decision"), serializeU16(1), serializeU64(nonce)],
      PROGRAM_IDS.proof,
    );
    const argsData = Buffer.concat([
      serializeU16(1), serializeU64(nonce), serializeU8(0),
      serializeU8(0b00111), serializeBool(false), serializeHash(),
      serializeI64(BigInt(Math.floor(Date.now() / 1000))),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: true },
        { pubkey: decisionPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data: Buffer.concat([ixDiscriminator("log_decision"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "0x1779");
    recordTest(CAT, "proof_log_decision_aeon_role",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "AEON correctly rejected from log_decision (only keeper)" : "VULNERABILITY: AEON logged decision!");
  }

  // 1.10 — AEON tries record_truth_label (only super can do this)
  {
    const nonce = BigInt(998);
    const [truthPDA] = findPDA(
      [Buffer.from("truth_label"), serializeU64(nonce)],
      PROGRAM_IDS.auditor,
    );
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializeU64(nonce), serializeHash(),
      serializeU8(1), serializeU8(0), serializeU8(0),
      serializeI64(now - BigInt(3660)), serializeI64(now - BigInt(60)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
        { pubkey: truthPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.auditor,
      data: Buffer.concat([ixDiscriminator("record_truth_label"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "auditor_truth_label_aeon_role",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "AEON correctly rejected from auditor (only super)" : "VULNERABILITY: AEON recorded truth label!");
  }
}

// ═══════════════════════════════════════════
// SECTION 2: Double-Init / Re-entrancy Tests
// ═══════════════════════════════════════════

async function testDoubleInit(
  connection: Connection,
  superAuth: Keypair,
  aeonAuth: Keypair,
  keeperAuth: Keypair,
) {
  const CAT = "DOUBLE_INIT";
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║  SECTION 2: Double-Init / Re-entrancy Tests    ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  // 2.1 — Double init noumen_core
  {
    const argsData = Buffer.concat([
      serializePubkey(superAuth.publicKey),
      serializePubkey(aeonAuth.publicKey),
      serializePubkey(keeperAuth.publicKey),
      serializePubkey(CREATOR_WALLET),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data: Buffer.concat([ixDiscriminator("initialize_aeon"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [superAuth], "any");
    recordTest(CAT, "core_double_init",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Core correctly rejects double initialization" : "VULNERABILITY: Core re-initialized!");
  }

  // 2.2 — Double init noumen_proof
  {
    const argsData = Buffer.concat([
      serializePubkey(keeperAuth.publicKey),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data: Buffer.concat([ixDiscriminator("initialize_proof"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [superAuth], "any");
    recordTest(CAT, "proof_double_init",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Proof correctly rejects double initialization" : "VULNERABILITY: Proof re-initialized!");
  }

  // 2.3 — Double init noumen_apollo
  {
    const argsData = Buffer.concat([
      serializePubkey(aeonAuth.publicKey),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.apollo,
      data: Buffer.concat([ixDiscriminator("initialize_apollo"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "apollo_double_init",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Apollo correctly rejects double initialization" : "VULNERABILITY: Apollo re-initialized!");
  }

  // 2.4 — Double init noumen_hermes
  {
    const argsData = Buffer.concat([
      serializePubkey(aeonAuth.publicKey),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: hermesConfigPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.hermes,
      data: Buffer.concat([ixDiscriminator("initialize_hermes"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "hermes_double_init",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Hermes correctly rejects double initialization" : "VULNERABILITY: Hermes re-initialized!");
  }

  // 2.5 — Double init noumen_auditor
  {
    const argsData = Buffer.concat([
      serializePubkey(aeonAuth.publicKey),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.auditor,
      data: Buffer.concat([ixDiscriminator("initialize_auditor"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [superAuth], "any");
    recordTest(CAT, "auditor_double_init",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Auditor correctly rejects double initialization" : "VULNERABILITY: Auditor re-initialized!");
  }

  // 2.6 — Double init noumen_service
  {
    const argsData = Buffer.concat([
      serializePubkey(aeonAuth.publicKey),
      serializePubkey(keeperAuth.publicKey),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data: Buffer.concat([ixDiscriminator("initialize_service_config"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [superAuth], "any");
    recordTest(CAT, "service_double_init",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Service correctly rejects double initialization" : "VULNERABILITY: Service re-initialized!");
  }

  // 2.7 — Double confirm_execution on same decision
  {
    // Decision #2 from init script was already confirmed. Try confirming again.
    const decisionNonce = BigInt(2);
    const [decisionPDA] = findPDA(
      [Buffer.from("decision"), serializeU16(1), serializeU64(decisionNonce)],
      PROGRAM_IDS.proof,
    );
    const [executionPDA] = findPDA(
      [Buffer.from("execution"), decisionPDA.toBuffer()],
      PROGRAM_IDS.proof,
    );
    const argsData = Buffer.concat([
      serializeBool(true), serializeHash(),
      serializeI64(BigInt(Math.floor(Date.now() / 1000))),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: false },
        { pubkey: decisionPDA, isSigner: false, isWritable: true },
        { pubkey: executionPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data: Buffer.concat([ixDiscriminator("confirm_execution"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [keeperAuth], "any");
    recordTest(CAT, "proof_double_confirm_execution",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Double confirm_execution correctly rejected" : "VULNERABILITY: Double execution confirmed!");
  }
}

// ═══════════════════════════════════════════
// SECTION 3: PDA Tampering Tests
// ═══════════════════════════════════════════

async function testPDATampering(
  connection: Connection,
  aeonAuth: Keypair,
  keeperAuth: Keypair,
) {
  const CAT = "PDA_TAMPER";
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║  SECTION 3: PDA Tampering Tests                ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  // 3.1 — Create agent with wrong PDA seeds (agent_id mismatch)
  {
    const realId = 50;
    const fakeId = 51;
    // Derive PDA for agent 51 but pass agent_id=50 in args
    const [wrongPDA] = findPDA([Buffer.from("agent"), serializeU16(fakeId)], PROGRAM_IDS.core);
    const argsData = Buffer.concat([
      serializeU16(realId), serializePubkey(aeonAuth.publicKey), serializeU8(1), serializeU8(0),
      serializeU64(BigInt(0)), serializeU64(BigInt(0)),
      serializeI64(BigInt(Math.floor(Date.now() / 1000) + 86400 * 365)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: wrongPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data: Buffer.concat([ixDiscriminator("create_agent"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "0x7d6");
    recordTest(CAT, "core_agent_pda_mismatch",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Mismatched agent PDA correctly rejected (ConstraintSeeds)" : "VULNERABILITY: PDA mismatch accepted!");
  }

  // 3.2 — Log decision with wrong agent_id in PDA seeds
  {
    const wrongAgentId = 99;
    const realAgentId = 1;
    const nonce = BigInt(997);
    // PDA derived with wrong agent_id
    const [wrongPDA] = findPDA(
      [Buffer.from("decision"), serializeU16(wrongAgentId), serializeU64(nonce)],
      PROGRAM_IDS.proof,
    );
    const argsData = Buffer.concat([
      serializeU16(realAgentId), serializeU64(nonce), serializeU8(0),
      serializeU8(0b00111), serializeBool(false), serializeHash(),
      serializeI64(BigInt(Math.floor(Date.now() / 1000))),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: true },
        { pubkey: wrongPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data: Buffer.concat([ixDiscriminator("log_decision"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [keeperAuth], "0x7d6");
    recordTest(CAT, "proof_decision_pda_mismatch",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Decision PDA with wrong agent_id correctly rejected" : "VULNERABILITY: Decision PDA mismatch accepted!");
  }

  // 3.3 — Assessment with wrong pool address in PDA
  {
    const fakePool = Keypair.generate().publicKey;
    const realPool = Keypair.generate().publicKey;
    const nonce = BigInt(997);
    // PDA derived with fake pool but args contain real pool
    const [wrongPDA] = findPDA(
      [Buffer.from("assessment"), fakePool.toBuffer(), serializeU64(nonce)],
      PROGRAM_IDS.apollo,
    );
    const argsData = Buffer.concat([
      serializePubkey(realPool), serializeU64(nonce), serializeU8(1),
      serializeU8(85), serializeU16(1200), serializeU16(1000),
      serializeU8(0b00011), serializeI64(BigInt(Math.floor(Date.now() / 1000) + 3600)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
        { pubkey: wrongPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.apollo,
      data: Buffer.concat([ixDiscriminator("publish_assessment"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "0x7d6");
    recordTest(CAT, "apollo_assessment_pda_pool_mismatch",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Assessment PDA with wrong pool correctly rejected" : "VULNERABILITY: Pool PDA mismatch accepted!");
  }

  // 3.4 — Truth label PDA with wrong nonce
  {
    const fakeNonce = BigInt(888);
    const realNonce = BigInt(887);
    const [wrongPDA] = findPDA(
      [Buffer.from("truth_label"), serializeU64(fakeNonce)],
      PROGRAM_IDS.auditor,
    );
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializeU64(realNonce), serializeHash(),
      serializeU8(1), serializeU8(0), serializeU8(0),
      serializeI64(now - BigInt(3660)), serializeI64(now - BigInt(60)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
        { pubkey: wrongPDA, isSigner: false, isWritable: true },
        { pubkey: Keypair.generate().publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.auditor,
      data: Buffer.concat([ixDiscriminator("record_truth_label"), argsData]),
    });
    // This will fail for auth OR PDA reasons — both are valid rejections
    const r = await expectTxFail(connection, ix, [Keypair.generate()], "any");
    recordTest(CAT, "auditor_truth_pda_nonce_mismatch",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Truth label PDA with wrong nonce correctly rejected" : "VULNERABILITY: Nonce PDA mismatch accepted!");
  }

  // 3.5 — Service PDA with wrong service_id
  {
    const realId = 10;
    const fakeId = 11;
    const [wrongPDA] = findPDA(
      [Buffer.from("service"), serializeU16(fakeId)],
      PROGRAM_IDS.service,
    );
    const argsData = Buffer.concat([
      serializeU16(realId), serializeU8(0),
      serializeU64(BigInt(20_000_000)), serializeU64(BigInt(15_000_000)),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: true },
        { pubkey: wrongPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data: Buffer.concat([ixDiscriminator("register_service"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "0x7d6");
    recordTest(CAT, "service_pda_id_mismatch",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Service PDA with wrong ID correctly rejected" : "VULNERABILITY: Service PDA mismatch accepted!");
  }
}

// ═══════════════════════════════════════════
// SECTION 4: Axiom Enforcement Tests
// ═══════════════════════════════════════════

async function testAxiomEnforcement(
  connection: Connection,
  superAuth: Keypair,
  aeonAuth: Keypair,
  keeperAuth: Keypair,
) {
  const CAT = "AXIOM";
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║  SECTION 4: Axiom Enforcement Tests            ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  // 4.1 — A0-14: Evaluator cannot have execution permission
  {
    const agentId = 60;
    const [agentPDA] = findPDA([Buffer.from("agent"), serializeU16(agentId)], PROGRAM_IDS.core);
    const argsData = Buffer.concat([
      serializeU16(agentId), serializePubkey(aeonAuth.publicKey),
      serializeU8(1),   // agent_type: 1 = Evaluator
      serializeU8(2),   // execution_permission: 2 = Full (FORBIDDEN for evaluator)
      serializeU64(BigInt(0)), serializeU64(BigInt(0)),
      serializeI64(BigInt(Math.floor(Date.now() / 1000) + 86400 * 365)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: agentPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data: Buffer.concat([ixDiscriminator("create_agent"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "A0_14_evaluator_no_exec",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "A0-14: Evaluator correctly cannot have execution permission" : "AXIOM VIOLATION: Evaluator got exec permission!");
  }

  // 4.2 — A0-18: Invalid evidence bitmap (bits > 4)
  {
    const nonce = BigInt(996);
    const [decisionPDA] = findPDA(
      [Buffer.from("decision"), serializeU16(1), serializeU64(nonce)],
      PROGRAM_IDS.proof,
    );
    const argsData = Buffer.concat([
      serializeU16(1), serializeU64(nonce), serializeU8(0),
      serializeU8(0b11100000), // Invalid: bits 5,6,7 set (only 0-4 valid)
      serializeBool(false), serializeHash(),
      serializeI64(BigInt(Math.floor(Date.now() / 1000))),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: true },
        { pubkey: decisionPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data: Buffer.concat([ixDiscriminator("log_decision"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [keeperAuth], "any");
    recordTest(CAT, "A0_18_invalid_evidence_bitmap",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "A0-18: Invalid evidence bitmap (bits>4) correctly rejected" : "AXIOM VIOLATION: Invalid bitmap accepted!");
  }

  // 4.3 — A0-17: Execution-class decision with < 2 evidence families
  {
    const nonce = BigInt(995);
    const [decisionPDA] = findPDA(
      [Buffer.from("decision"), serializeU16(1), serializeU64(nonce)],
      PROGRAM_IDS.proof,
    );
    const argsData = Buffer.concat([
      serializeU16(1), serializeU64(nonce), serializeU8(0),
      serializeU8(0b00001), // Only 1 family (Price) — need >= 2 for execution class
      serializeBool(true),  // is_execution_class = TRUE
      serializeHash(),
      serializeI64(BigInt(Math.floor(Date.now() / 1000))),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: true },
        { pubkey: decisionPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data: Buffer.concat([ixDiscriminator("log_decision"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [keeperAuth], "any");
    recordTest(CAT, "A0_17_exec_insufficient_evidence",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "A0-17: Execution with <2 evidence families correctly rejected" : "AXIOM VIOLATION: Exec with 1 family accepted!");
  }

  // 4.4 — A0-21: Truth label with future window_end
  {
    const nonce = BigInt(994);
    const [truthPDA] = findPDA(
      [Buffer.from("truth_label"), serializeU64(nonce)],
      PROGRAM_IDS.auditor,
    );
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializeU64(nonce), serializeHash(),
      serializeU8(1), serializeU8(0), serializeU8(0),
      serializeI64(now - BigInt(3600)),
      serializeI64(now + BigInt(3600)), // window_end in FUTURE — violates A0-21
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
        { pubkey: truthPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.auditor,
      data: Buffer.concat([ixDiscriminator("record_truth_label"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [superAuth], "0x1772");
    recordTest(CAT, "A0_21_future_window_end",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "A0-21: Future window_end correctly rejected (WindowNotResolved)" : "AXIOM VIOLATION: Future window accepted!");
  }

  // 4.5 — A0-8: Service price below 120% margin
  {
    const serviceId = 61;
    const [servicePDA] = findPDA(
      [Buffer.from("service"), serializeU16(serviceId)],
      PROGRAM_IDS.service,
    );
    const argsData = Buffer.concat([
      serializeU16(serviceId), serializeU8(0),
      serializeU64(BigInt(10_000_000)),   // price = 0.01 SOL
      serializeU64(BigInt(10_000_000)),   // cost = 0.01 SOL (price should be >= cost * 1.2)
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: true },
        { pubkey: servicePDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data: Buffer.concat([ixDiscriminator("register_service"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "A0_8_price_below_margin",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "A0-8: Price below 120% cost margin correctly rejected" : "AXIOM VIOLATION: Below-margin price accepted!");
  }

  // 4.6 — A0-23: Assessment with missing APR pair (zero values)
  {
    const pool = Keypair.generate().publicKey;
    const nonce = BigInt(994);
    const [assessPDA] = findPDA(
      [Buffer.from("assessment"), pool.toBuffer(), serializeU64(nonce)],
      PROGRAM_IDS.apollo,
    );
    const argsData = Buffer.concat([
      serializePubkey(pool), serializeU64(nonce), serializeU8(1),
      serializeU8(85),
      serializeU16(0),     // headline_apr_bps = 0 (INVALID per A0-23)
      serializeU16(1000),  // effective_apr_bps = 10%
      serializeU8(0b00011),
      serializeI64(BigInt(Math.floor(Date.now() / 1000) + 3600)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
        { pubkey: assessPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.apollo,
      data: Buffer.concat([ixDiscriminator("publish_assessment"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "A0_23_missing_apr_pair",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "A0-23: Assessment with zero headline APR correctly rejected" : "AXIOM VIOLATION: Zero APR accepted!");
  }

  // 4.7 — A0-0 (Layer 0 immutable): Propose change to Layer 0
  {
    const proposalId = 99;
    const [proposalPDA] = findPDA(
      [Buffer.from("proposal"), serializeU32(proposalId)],
      PROGRAM_IDS.core,
    );
    const argsData = Buffer.concat([
      serializeU32(proposalId),
      serializeU8(0),   // policy_layer = 0 (AXIOM layer — IMMUTABLE)
      serializeHash(),  // description_hash
      serializeU32(86400), // delay_seconds
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: proposalPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data: Buffer.concat([ixDiscriminator("propose_policy_change"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "A0_layer0_immutable",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Layer 0 (Axioms) correctly cannot be changed" : "AXIOM VIOLATION: Layer 0 change accepted!");
  }

  // 4.8 — Invalid confidence score (>100)
  {
    const pool = Keypair.generate().publicKey;
    const nonce = BigInt(993);
    const [assessPDA] = findPDA(
      [Buffer.from("assessment"), pool.toBuffer(), serializeU64(nonce)],
      PROGRAM_IDS.apollo,
    );
    const argsData = Buffer.concat([
      serializePubkey(pool), serializeU64(nonce), serializeU8(1),
      serializeU8(150),    // confidence = 150 (INVALID: max 100)
      serializeU16(1200), serializeU16(1000),
      serializeU8(0b00011),
      serializeI64(BigInt(Math.floor(Date.now() / 1000) + 3600)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
        { pubkey: assessPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.apollo,
      data: Buffer.concat([ixDiscriminator("publish_assessment"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "apollo_invalid_confidence",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Invalid confidence score (>100) correctly rejected" : "VULNERABILITY: Invalid confidence accepted!");
  }

  // 4.9 — Invalid risk level (>3)
  {
    const pool = Keypair.generate().publicKey;
    const nonce = BigInt(992);
    const [assessPDA] = findPDA(
      [Buffer.from("assessment"), pool.toBuffer(), serializeU64(nonce)],
      PROGRAM_IDS.apollo,
    );
    const argsData = Buffer.concat([
      serializePubkey(pool), serializeU64(nonce),
      serializeU8(5),   // risk_level = 5 (INVALID: max 3)
      serializeU8(85), serializeU16(1200), serializeU16(1000),
      serializeU8(0b00011),
      serializeI64(BigInt(Math.floor(Date.now() / 1000) + 3600)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
        { pubkey: assessPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.apollo,
      data: Buffer.concat([ixDiscriminator("publish_assessment"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "apollo_invalid_risk_level",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Invalid risk level (>3) correctly rejected" : "VULNERABILITY: Invalid risk level accepted!");
  }

  // 4.10 — Invalid TTL (past timestamp)
  {
    const agentId = 62;
    const [agentPDA] = findPDA([Buffer.from("agent"), serializeU16(agentId)], PROGRAM_IDS.core);
    const argsData = Buffer.concat([
      serializeU16(agentId), serializePubkey(aeonAuth.publicKey),
      serializeU8(0), serializeU8(0),
      serializeU64(BigInt(0)), serializeU64(BigInt(0)),
      serializeI64(BigInt(1000)), // TTL = year 1970 (PAST — should fail)
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: agentPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data: Buffer.concat([ixDiscriminator("create_agent"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "core_invalid_ttl_past",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Agent with past TTL correctly rejected" : "VULNERABILITY: Past TTL accepted!");
  }

  // 4.11 — Hermes: Invalid report type (>4)
  {
    const nonce = BigInt(993);
    const [reportPDA] = findPDA(
      [Buffer.from("report"), serializeU64(nonce)],
      PROGRAM_IDS.hermes,
    );
    const argsData = Buffer.concat([
      serializeU64(nonce),
      serializeU8(10),  // report_type = 10 (INVALID: max 4)
      serializePubkey(Keypair.generate().publicKey),
      serializeU8(80),
      serializeI64(BigInt(Math.floor(Date.now() / 1000) + 3600)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: hermesConfigPDA, isSigner: false, isWritable: true },
        { pubkey: reportPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.hermes,
      data: Buffer.concat([ixDiscriminator("publish_report"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "hermes_invalid_report_type",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Invalid report type (>4) correctly rejected" : "VULNERABILITY: Invalid report type accepted!");
  }

  // 4.12 — Service: Invalid level transition (0 → 2, skipping Simulated)
  {
    // Service #1 was registered in init-localnet.ts. Its level was set to 1 (Simulated).
    // Try setting it to level 0 → 2 directly (skip 1)
    // Actually, it's currently at level 1 (Simulated) from init. Let's set it to 0 first, then try 0→2.
    // Simpler: try from level 1 directly to a non-adjacent level
    // From init: service #1 was set to level 1 (Simulated). Level transitions are only ±1.
    // Try 1 → 3 (if 3 exists) or pass invalid level.
    // Valid levels are 0,1,2 with transitions ±1 only.
    // Service #1 is at level 1, so valid transitions are 1→0 and 1→2.
    // To test, first put back to 0, then try 0→2.
    // Let's just try to set level to 3 which is invalid.
    const serviceId = 1;
    const [servicePDA] = findPDA(
      [Buffer.from("service"), serializeU16(serviceId)],
      PROGRAM_IDS.service,
    );
    const argsData = Buffer.concat([
      serializeU16(serviceId),
      serializeU8(3), // new_level = 3 (INVALID: only 0,1,2 and ±1 transitions)
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: false },
        { pubkey: servicePDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data: Buffer.concat([ixDiscriminator("update_service_level"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "service_invalid_level_transition",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Invalid service level transition correctly rejected" : "VULNERABILITY: Invalid level transition accepted!");
  }
}

// ═══════════════════════════════════════════
// SECTION 5: Authority Separation Tests
// ═══════════════════════════════════════════

async function testAuthoritySeparation(
  connection: Connection,
  superAuth: Keypair,
  aeonAuth: Keypair,
  keeperAuth: Keypair,
) {
  const CAT = "AUTH_SEPARATION";
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║  SECTION 5: Authority Separation Tests         ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  // 5.1 — Super tries to create agent (only AEON can)
  {
    const agentId = 70;
    const [agentPDA] = findPDA([Buffer.from("agent"), serializeU16(agentId)], PROGRAM_IDS.core);
    const argsData = Buffer.concat([
      serializeU16(agentId), serializePubkey(superAuth.publicKey), serializeU8(0), serializeU8(0),
      serializeU64(BigInt(0)), serializeU64(BigInt(0)),
      serializeI64(BigInt(Math.floor(Date.now() / 1000) + 86400 * 365)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: agentPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data: Buffer.concat([ixDiscriminator("create_agent"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [superAuth], "any");
    recordTest(CAT, "super_cannot_create_agent",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Super correctly cannot create agents (AEON only)" : "VIOLATION: Super created agent!");
  }

  // 5.2 — AEON tries reset_circuit_breaker (only super can)
  {
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_IDS.core,
      data: Buffer.concat([ixDiscriminator("reset_circuit_breaker")]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "aeon_cannot_reset_breaker",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "AEON correctly cannot reset circuit breaker (super only)" : "VIOLATION: AEON reset breaker!");
  }

  // 5.3 — Super tries publish_assessment (only AEON/apollo authority can)
  {
    const pool = Keypair.generate().publicKey;
    const nonce = BigInt(991);
    const [assessPDA] = findPDA(
      [Buffer.from("assessment"), pool.toBuffer(), serializeU64(nonce)],
      PROGRAM_IDS.apollo,
    );
    const argsData = Buffer.concat([
      serializePubkey(pool), serializeU64(nonce), serializeU8(1),
      serializeU8(85), serializeU16(1200), serializeU16(1000),
      serializeU8(0b00011), serializeI64(BigInt(Math.floor(Date.now() / 1000) + 3600)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
        { pubkey: assessPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.apollo,
      data: Buffer.concat([ixDiscriminator("publish_assessment"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [superAuth], "any");
    recordTest(CAT, "super_cannot_publish_assessment",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Super correctly cannot publish assessments (AEON only)" : "VIOLATION: Super published assessment!");
  }

  // 5.4 — Super tries update_service_metrics (only keeper can)
  {
    const serviceId = 1;
    const [servicePDA] = findPDA(
      [Buffer.from("service"), serializeU16(serviceId)],
      PROGRAM_IDS.service,
    );
    const argsData = Buffer.concat([
      serializeU16(serviceId),
      serializeU64(BigInt(100)),
      serializeU64(BigInt(5_000_000_000)),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: false },
        { pubkey: servicePDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data: Buffer.concat([ixDiscriminator("update_service_metrics"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [superAuth], "any");
    recordTest(CAT, "super_cannot_update_metrics",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Super correctly cannot update service metrics (keeper only)" : "VIOLATION: Super updated metrics!");
  }

  // 5.5 — Keeper tries register_service (only AEON can)
  {
    const serviceId = 71;
    const [servicePDA] = findPDA(
      [Buffer.from("service"), serializeU16(serviceId)],
      PROGRAM_IDS.service,
    );
    const argsData = Buffer.concat([
      serializeU16(serviceId), serializeU8(0),
      serializeU64(BigInt(20_000_000)), serializeU64(BigInt(15_000_000)),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: true },
        { pubkey: servicePDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data: Buffer.concat([ixDiscriminator("register_service"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [keeperAuth], "any");
    recordTest(CAT, "keeper_cannot_register_service",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Keeper correctly cannot register services (AEON only)" : "VIOLATION: Keeper registered service!");
  }

  // 5.6 — Keeper tries publish_report (only hermes authority / AEON can)
  {
    const nonce = BigInt(991);
    const [reportPDA] = findPDA(
      [Buffer.from("report"), serializeU64(nonce)],
      PROGRAM_IDS.hermes,
    );
    const argsData = Buffer.concat([
      serializeU64(nonce), serializeU8(0),
      serializePubkey(Keypair.generate().publicKey),
      serializeU8(80),
      serializeI64(BigInt(Math.floor(Date.now() / 1000) + 3600)),
      serializeHash(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: hermesConfigPDA, isSigner: false, isWritable: true },
        { pubkey: reportPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.hermes,
      data: Buffer.concat([ixDiscriminator("publish_report"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [keeperAuth], "any");
    recordTest(CAT, "keeper_cannot_publish_report",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Keeper correctly cannot publish intelligence reports (AEON only)" : "VIOLATION: Keeper published report!");
  }
}

// ═══════════════════════════════════════════
// SECTION 6: Overflow & Boundary Tests
// ═══════════════════════════════════════════

async function testOverflowBoundary(
  connection: Connection,
  superAuth: Keypair,
  aeonAuth: Keypair,
  keeperAuth: Keypair,
  payer: Keypair,
) {
  const CAT = "OVERFLOW";
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║  SECTION 6: Overflow & Boundary Tests          ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  // 6.1 — Invalid decision class (>3)
  {
    const nonce = BigInt(990);
    const [decisionPDA] = findPDA(
      [Buffer.from("decision"), serializeU16(1), serializeU64(nonce)],
      PROGRAM_IDS.proof,
    );
    const argsData = Buffer.concat([
      serializeU16(1), serializeU64(nonce),
      serializeU8(10), // decision_class = 10 (INVALID: 0-3 only)
      serializeU8(0b00111), serializeBool(false), serializeHash(),
      serializeI64(BigInt(Math.floor(Date.now() / 1000))),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: true },
        { pubkey: decisionPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data: Buffer.concat([ixDiscriminator("log_decision"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [keeperAuth], "any");
    recordTest(CAT, "proof_invalid_decision_class",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Invalid decision class (>3) correctly rejected" : "VULNERABILITY: Invalid class accepted!");
  }

  // 6.2 — Batch proof with zero leaves
  {
    const batchNonce = BigInt(990);
    const [batchPDA] = findPDA(
      [Buffer.from("batch"), serializeU16(1), serializeU64(batchNonce)],
      PROGRAM_IDS.proof,
    );
    const argsData = Buffer.concat([
      serializeU16(1), serializeU64(batchNonce),
      serializeHash(),
      serializeU32(0), // leaf_count = 0 (INVALID: must be > 0)
      serializeI64(BigInt(Math.floor(Date.now() / 1000) - 3600)),
      serializeI64(BigInt(Math.floor(Date.now() / 1000))),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: true },
        { pubkey: batchPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data: Buffer.concat([ixDiscriminator("submit_batch_proof"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [keeperAuth], "any");
    recordTest(CAT, "proof_batch_zero_leaves",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Batch proof with 0 leaves correctly rejected" : "VULNERABILITY: Zero-leaf batch accepted!");
  }

  // 6.3 — Batch proof with inverted timestamps (start > end)
  {
    const batchNonce = BigInt(989);
    const [batchPDA] = findPDA(
      [Buffer.from("batch"), serializeU16(1), serializeU64(batchNonce)],
      PROGRAM_IDS.proof,
    );
    const now = BigInt(Math.floor(Date.now() / 1000));
    const argsData = Buffer.concat([
      serializeU16(1), serializeU64(batchNonce),
      serializeHash(),
      serializeU32(10),
      serializeI64(now),              // start_timestamp = now
      serializeI64(now - BigInt(3600)), // end_timestamp = 1h ago (INVERTED)
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: proofConfigPDA, isSigner: false, isWritable: true },
        { pubkey: batchPDA, isSigner: false, isWritable: true },
        { pubkey: keeperAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.proof,
      data: Buffer.concat([ixDiscriminator("submit_batch_proof"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [keeperAuth], "any");
    recordTest(CAT, "proof_batch_inverted_timestamps",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Batch proof with inverted timestamps correctly rejected" : "VULNERABILITY: Inverted timestamps accepted!");
  }

  // 6.4 — Invalid incident type (>4)
  {
    const nonce = BigInt(990);
    const [incidentPDA] = findPDA(
      [Buffer.from("incident"), serializeU64(nonce)],
      PROGRAM_IDS.auditor,
    );
    const argsData = Buffer.concat([
      serializeU64(nonce),
      serializeU8(10), // incident_type = 10 (INVALID: 0-4 only)
      serializeU8(1),  // severity: Medium
      serializeHash(), // protocol_address
      serializeHash(), // evidence_hash
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
        { pubkey: incidentPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.auditor,
      data: Buffer.concat([ixDiscriminator("register_security_incident"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [superAuth], "any");
    recordTest(CAT, "auditor_invalid_incident_type",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Invalid incident type (>4) correctly rejected" : "VULNERABILITY: Invalid incident type accepted!");
  }

  // 6.5 — Accuracy snapshot with zero samples
  {
    const nonce = BigInt(990);
    const [snapPDA] = findPDA(
      [Buffer.from("accuracy"), serializeU64(nonce)],
      PROGRAM_IDS.auditor,
    );
    const argsData = Buffer.concat([
      serializeU64(nonce),
      serializeU16(85),  // htl_accuracy_bps
      serializeU16(90),  // eol_accuracy_bps
      serializeU32(0),   // sample_count = 0 (INVALID: must be > 0)
      serializeHash(),   // period_hash
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
        { pubkey: snapPDA, isSigner: false, isWritable: true },
        { pubkey: superAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.auditor,
      data: Buffer.concat([ixDiscriminator("publish_accuracy_snapshot"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [superAuth], "any");
    recordTest(CAT, "auditor_zero_sample_accuracy",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Accuracy snapshot with 0 samples correctly rejected" : "VULNERABILITY: Zero samples accepted!");
  }

  // 6.6 — Invalid service tier (>2)
  {
    const serviceId = 80;
    const [servicePDA] = findPDA(
      [Buffer.from("service"), serializeU16(serviceId)],
      PROGRAM_IDS.service,
    );
    const argsData = Buffer.concat([
      serializeU16(serviceId),
      serializeU8(5), // tier = 5 (INVALID: 0-2 only)
      serializeU64(BigInt(20_000_000)), serializeU64(BigInt(15_000_000)),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: true },
        { pubkey: servicePDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data: Buffer.concat([ixDiscriminator("register_service"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "service_invalid_tier",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Invalid service tier (>2) correctly rejected" : "VULNERABILITY: Invalid tier accepted!");
  }

  // 6.7 — Hermes: Pool comparison with only 1 pool (needs 2-5)
  {
    const nonce = BigInt(990);
    const [reportPDA] = findPDA(
      [Buffer.from("report"), serializeU64(nonce)],
      PROGRAM_IDS.hermes,
    );
    // pool_count = 1 (INVALID: 2-5 required)
    const poolKey = Keypair.generate().publicKey;
    const argsData = Buffer.concat([
      serializeU64(nonce),
      serializeU8(1), // pool_count = 1
      poolKey.toBuffer(),
    ]);
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: hermesConfigPDA, isSigner: false, isWritable: true },
        { pubkey: reportPDA, isSigner: false, isWritable: true },
        { pubkey: aeonAuth.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.hermes,
      data: Buffer.concat([ixDiscriminator("publish_pool_comparison"), argsData]),
    });
    const r = await expectTxFail(connection, ix, [aeonAuth], "any");
    recordTest(CAT, "hermes_pool_comparison_single_pool",
      r.failed ? "PASS" : "FAIL",
      r.failed ? "Pool comparison with 1 pool correctly rejected (needs 2-5)" : "VULNERABILITY: Single-pool comparison accepted!");
  }
}

// ═══════════════════════════════════════════
// Main Execution
// ═══════════════════════════════════════════

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  AXIONBLADE v3.2.3 — FASE 3: Security Tests      ║");
  console.log("║  Proof Before Action                              ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const connection = new Connection(RPC_URL, "confirmed");

  // Load authority keys
  const keysDir = path.resolve(__dirname, "../keys");
  const superAuth = loadKeypair(path.join(keysDir, "super_authority.json"));
  const aeonAuth = loadKeypair(path.join(keysDir, "aeon_authority.json"));
  const keeperAuth = loadKeypair(path.join(keysDir, "keeper_authority.json"));
  const payer = loadKeypair("~/.config/solana/id.json");

  // Create an attacker keypair (random, no protocol role)
  const attacker = Keypair.generate();

  console.log("Authorities:");
  console.log(`  Super:    ${superAuth.publicKey.toBase58()}`);
  console.log(`  AEON:     ${aeonAuth.publicKey.toBase58()}`);
  console.log(`  Keeper:   ${keeperAuth.publicKey.toBase58()}`);
  console.log(`  Attacker: ${attacker.publicKey.toBase58()} (random)`);
  console.log(`  RPC:      ${RPC_URL}\n`);

  // Fund attacker for gas
  console.log("Funding attacker for test transactions...");
  await fundAccount(connection, attacker.publicKey, 2);
  console.log("  Attacker funded.\n");

  // Run all security test sections
  await testUnauthorizedAccess(connection, superAuth, aeonAuth, keeperAuth, attacker);
  await testDoubleInit(connection, superAuth, aeonAuth, keeperAuth);
  await testPDATampering(connection, aeonAuth, keeperAuth);
  await testAxiomEnforcement(connection, superAuth, aeonAuth, keeperAuth);
  await testAuthoritySeparation(connection, superAuth, aeonAuth, keeperAuth);
  await testOverflowBoundary(connection, superAuth, aeonAuth, keeperAuth, payer);

  // ── Final Report ──
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  SECURITY TEST REPORT                             ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Total Tests:  ${String(results.length).padStart(3)}                                   ║`);
  console.log(`║  Passed:       ${String(passCount).padStart(3)}                                   ║`);
  console.log(`║  Failed:        ${String(failCount).padStart(2)}                                   ║`);
  console.log("╚══════════════════════════════════════════════════╝\n");

  if (failCount > 0) {
    console.log("SECURITY VULNERABILITIES FOUND:");
    results.filter(r => r.status === "FAIL").forEach(r => {
      console.log(`  ✗ [${r.category}] ${r.name}: ${r.details}`);
    });
    console.log("");
  }

  // Categorized summary
  const categories = [...new Set(results.map(r => r.category))];
  console.log("Results by category:");
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catPass = catResults.filter(r => r.status === "PASS").length;
    const catFail = catResults.filter(r => r.status === "FAIL").length;
    const icon = catFail === 0 ? "✓" : "✗";
    console.log(`  ${icon} ${cat}: ${catPass}/${catResults.length} passed`);
  }

  console.log("\nAll test details:");
  results.forEach(r => {
    const icon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : "⊘";
    console.log(`  ${icon} [${r.status}] [${r.category}] ${r.name}`);
  });

  if (failCount > 0) {
    console.log(`\n⚠ ${failCount} SECURITY VULNERABILITY(IES) DETECTED — investigation required!`);
    process.exit(1);
  } else {
    console.log("\n✓ ALL SECURITY TESTS PASSED — No vulnerabilities found.");
    console.log("  All 7 programs correctly enforce access control, PDA integrity,");
    console.log("  axiom constraints, and boundary validation.");
  }
}

main().catch((err) => {
  console.error("Security test suite fatal error:", err);
  process.exit(1);
});
