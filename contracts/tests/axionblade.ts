import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { expect } from "chai";
import BN from "bn.js";
import { createHash } from "node:crypto";

// ──────────────────────────────────────────────
// Program IDs (from Anchor.toml)
// ──────────────────────────────────────────────
const CORE_PROGRAM_ID = new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE");
const PROOF_PROGRAM_ID = new PublicKey("3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV");
const TREASURY_PROGRAM_ID = new PublicKey("EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu");
const APOLLO_PROGRAM_ID = new PublicKey("92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee");
const HERMES_PROGRAM_ID = new PublicKey("Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj");
const AUDITOR_PROGRAM_ID = new PublicKey("CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe");
const SERVICE_PROGRAM_ID = new PublicKey("9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY");

// ──────────────────────────────────────────────
// Discriminator Helpers
// ──────────────────────────────────────────────

/**
 * Computes the Anchor instruction discriminator for a given instruction name.
 * SHA-256("global:{name}") -> first 8 bytes as Buffer.
 */
function ixDiscriminator(name: string): Buffer {
  const hash = createHash("sha256").update(`global:${name}`).digest();
  return hash.subarray(0, 8);
}

/**
 * Computes the Anchor account discriminator for a given account struct name.
 * SHA-256("account:{Name}") -> first 8 bytes as Buffer.
 */
function accountDiscriminator(name: string): Buffer {
  const hash = createHash("sha256").update(`account:${name}`).digest();
  return hash.subarray(0, 8);
}

// ──────────────────────────────────────────────
// Borsh Serialization Helpers
// ──────────────────────────────────────────────

function encodeU8(value: number): Buffer {
  const buf = Buffer.alloc(1);
  buf.writeUInt8(value, 0);
  return buf;
}

function encodeU16LE(value: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(value, 0);
  return buf;
}

function encodeU32LE(value: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value, 0);
  return buf;
}

function encodeI64LE(value: BN): Buffer {
  return value.toArrayLike(Buffer, "le", 8);
}

function encodeU64LE(value: BN): Buffer {
  return value.toArrayLike(Buffer, "le", 8);
}

function encodePubkey(pubkey: PublicKey): Buffer {
  return pubkey.toBuffer();
}

function encodeBytes32(bytes: Buffer): Buffer {
  if (bytes.length !== 32) throw new Error("Expected 32 bytes");
  return bytes;
}

function encodeBool(value: boolean): Buffer {
  return encodeU8(value ? 1 : 0);
}

// ──────────────────────────────────────────────
// PDA & Utility Helpers
// ──────────────────────────────────────────────

function findPda(seeds: (Buffer | Uint8Array)[], programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

function randomHash(): Buffer {
  return Buffer.from(
    createHash("sha256")
      .update(Keypair.generate().publicKey.toBuffer())
      .digest()
  );
}

// ──────────────────────────────────────────────
// Transaction Helpers
// ──────────────────────────────────────────────

async function sendTx(
  provider: anchor.AnchorProvider,
  ix: TransactionInstruction,
  signers: Keypair[]
): Promise<string> {
  const tx = new Transaction().add(ix);
  tx.feePayer = provider.wallet.publicKey;
  tx.recentBlockhash = (
    await provider.connection.getRecentBlockhash()
  ).blockhash;
  return await provider.sendAndConfirm(tx, signers);
}

async function getAccountData(
  provider: anchor.AnchorProvider,
  address: PublicKey
): Promise<Buffer | null> {
  const info = await provider.connection.getAccountInfo(address);
  if (!info) return null;
  return info.data as Buffer;
}

// ──────────────────────────────────────────────
// Test Suite
// ──────────────────────────────────────────────

describe("NOUMEN Protocol Integration Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // ── Shared keypairs ──
  const superAuthority = (provider.wallet as anchor.Wallet).payer;
  const aeonAuthority = Keypair.generate();
  const keeperAuthority = Keypair.generate();
  const creatorWallet = Keypair.generate();
  const apolloAuthority = Keypair.generate();
  const hermesAuthority = Keypair.generate();
  const auditorAuthority = Keypair.generate();

  // ── PDAs (derived in before()) ──
  let aeonConfigPda: PublicKey;
  let proofConfigPda: PublicKey;
  let treasuryConfigPda: PublicKey;
  let treasuryVaultPda: PublicKey;
  let donationVaultPda: PublicKey;
  let ccsConfigPda: PublicKey;
  let apolloConfigPda: PublicKey;
  let hermesConfigPda: PublicKey;
  let auditorConfigPda: PublicKey;
  let serviceConfigPda: PublicKey;

  before(async () => {
    // Derive config PDAs
    [aeonConfigPda] = findPda([Buffer.from("aeon_config")], CORE_PROGRAM_ID);
    [proofConfigPda] = findPda([Buffer.from("proof_config")], PROOF_PROGRAM_ID);
    [treasuryConfigPda] = findPda([Buffer.from("treasury_config")], TREASURY_PROGRAM_ID);
    [treasuryVaultPda] = findPda([Buffer.from("treasury_vault")], TREASURY_PROGRAM_ID);
    [donationVaultPda] = findPda([Buffer.from("donation_vault")], TREASURY_PROGRAM_ID);
    [ccsConfigPda] = findPda([Buffer.from("ccs_config")], TREASURY_PROGRAM_ID);
    [apolloConfigPda] = findPda([Buffer.from("apollo_config")], APOLLO_PROGRAM_ID);
    [hermesConfigPda] = findPda([Buffer.from("hermes_config")], HERMES_PROGRAM_ID);
    [auditorConfigPda] = findPda([Buffer.from("auditor_config")], AUDITOR_PROGRAM_ID);
    [serviceConfigPda] = findPda([Buffer.from("service_config")], SERVICE_PROGRAM_ID);

    // Fund all authority keypairs
    const targets = [
      aeonAuthority.publicKey,
      keeperAuthority.publicKey,
      creatorWallet.publicKey,
      apolloAuthority.publicKey,
      hermesAuthority.publicKey,
      auditorAuthority.publicKey,
    ];
    for (const t of targets) {
      const sig = await provider.connection.requestAirdrop(t, 10 * LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sig, "confirmed");
    }
  });

  // ================================================================
  //  1. NOUMEN CORE
  // ================================================================
  describe("noumen_core", () => {
    it("initialize_aeon: creates AeonConfig PDA with correct state", async () => {
      // InitializeAeonArgs: keeper_authority, aeon_authority, treasury_program,
      //   proof_program, heartbeat_interval, operational_agent_cap
      const data = Buffer.concat([
        ixDiscriminator("initialize_aeon"),
        encodePubkey(keeperAuthority.publicKey),   // keeper_authority
        encodePubkey(aeonAuthority.publicKey),     // aeon_authority
        encodePubkey(TREASURY_PROGRAM_ID),         // treasury_program
        encodePubkey(PROOF_PROGRAM_ID),            // proof_program
        encodeI64LE(new BN(300)),                  // heartbeat_interval
        encodeU32LE(50),                           // operational_agent_cap
      ]);

      const ix = new TransactionInstruction({
        programId: CORE_PROGRAM_ID,
        keys: [
          { pubkey: aeonConfigPda, isSigner: false, isWritable: true },
          { pubkey: superAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, []);

      const acct = await getAccountData(provider, aeonConfigPda);
      expect(acct).to.not.be.null;
      expect(acct!.length).to.be.greaterThan(8);

      // Discriminator
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("AeonConfig"))).to.be.true;

      // super_authority at offset 8
      expect(new PublicKey(acct!.subarray(8, 40)).equals(superAuthority.publicKey)).to.be.true;

      // aeon_authority at offset 72 (after pending_super_authority at 40-71)
      expect(new PublicKey(acct!.subarray(72, 104)).equals(aeonAuthority.publicKey)).to.be.true;

      // keeper_authority at offset 104
      expect(new PublicKey(acct!.subarray(104, 136)).equals(keeperAuthority.publicKey)).to.be.true;
    });

    it("initialize_aeon: double-init is rejected", async () => {
      const data = Buffer.concat([
        ixDiscriminator("initialize_aeon"),
        encodePubkey(keeperAuthority.publicKey),
        encodePubkey(aeonAuthority.publicKey),
        encodePubkey(TREASURY_PROGRAM_ID),
        encodePubkey(PROOF_PROGRAM_ID),
        encodeI64LE(new BN(300)),
        encodeU32LE(50),
      ]);

      const ix = new TransactionInstruction({
        programId: CORE_PROGRAM_ID,
        keys: [
          { pubkey: aeonConfigPda, isSigner: false, isWritable: true },
          { pubkey: superAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      try {
        await sendTx(provider, ix, []);
        expect.fail("Should have rejected double initialization");
      } catch (err: any) {
        // init PDA already exists or AlreadyInitialized
        expect(err.toString()).to.match(/custom program error|already in use/i);
      }
    });

    it("create_agent (register_agent): Collector with agent_id=1", async () => {
      const agentId = 1;
      const agentIdBuf = encodeU16LE(agentId);
      const creationProof = randomHash();
      const ttl = new BN(Math.floor(Date.now() / 1000) + 86400 * 365);

      const [agentManifestPda] = findPda(
        [Buffer.from("agent"), agentIdBuf],
        CORE_PROGRAM_ID
      );

      // CreateAgentArgs: agent_id, authority, agent_type, execution_permission,
      //   budget_lamports, budget_daily_cap_lamports, ttl, creation_proof
      const data = Buffer.concat([
        ixDiscriminator("create_agent"),
        agentIdBuf,                                // agent_id: u16
        encodePubkey(aeonAuthority.publicKey),     // authority: Pubkey
        encodeU8(0),                               // agent_type: Collector
        encodeU8(1),                               // execution_permission: Limited
        encodeU64LE(new BN(1_000_000_000)),        // budget_lamports
        encodeU64LE(new BN(100_000_000)),          // budget_daily_cap_lamports
        encodeI64LE(ttl),                          // ttl
        encodeBytes32(creationProof),              // creation_proof
      ]);

      const ix = new TransactionInstruction({
        programId: CORE_PROGRAM_ID,
        keys: [
          { pubkey: aeonConfigPda, isSigner: false, isWritable: true },
          { pubkey: agentManifestPda, isSigner: false, isWritable: true },
          { pubkey: aeonAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [aeonAuthority]);

      const acct = await getAccountData(provider, agentManifestPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("AgentManifest"))).to.be.true;

      // agent_id at offset 8
      expect(acct!.readUInt16LE(8)).to.equal(agentId);

      // status = Active (1) at offset 8 + 2(agent_id) + 32(authority) + 1(agent_type) = 43
      expect(acct!.readUInt8(43)).to.equal(1);
    });

    it("create_agent: evaluator with execution != Never is rejected (A0-14)", async () => {
      const agentId = 99;
      const agentIdBuf = encodeU16LE(agentId);
      const ttl = new BN(Math.floor(Date.now() / 1000) + 86400 * 365);

      const [agentManifestPda] = findPda(
        [Buffer.from("agent"), agentIdBuf],
        CORE_PROGRAM_ID
      );

      const data = Buffer.concat([
        ixDiscriminator("create_agent"),
        agentIdBuf,
        encodePubkey(aeonAuthority.publicKey),
        encodeU8(1),      // Evaluator
        encodeU8(2),      // Full execution (INVALID for evaluator)
        encodeU64LE(new BN(1_000_000_000)),
        encodeU64LE(new BN(100_000_000)),
        encodeI64LE(ttl),
        encodeBytes32(randomHash()),
      ]);

      const ix = new TransactionInstruction({
        programId: CORE_PROGRAM_ID,
        keys: [
          { pubkey: aeonConfigPda, isSigner: false, isWritable: true },
          { pubkey: agentManifestPda, isSigner: false, isWritable: true },
          { pubkey: aeonAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      try {
        await sendTx(provider, ix, [aeonAuthority]);
        expect.fail("Should have thrown EvaluatorCannotExecute");
      } catch (err: any) {
        expect(err.toString()).to.contain("custom program error");
      }
    });

    it("create_agent: evaluator with execution=Never succeeds (A0-14 compliance)", async () => {
      const agentId = 2;
      const agentIdBuf = encodeU16LE(agentId);
      const ttl = new BN(Math.floor(Date.now() / 1000) + 86400 * 365);

      const [agentManifestPda] = findPda(
        [Buffer.from("agent"), agentIdBuf],
        CORE_PROGRAM_ID
      );

      const data = Buffer.concat([
        ixDiscriminator("create_agent"),
        agentIdBuf,
        encodePubkey(aeonAuthority.publicKey),
        encodeU8(1),      // Evaluator
        encodeU8(0),      // Never (correct for evaluator)
        encodeU64LE(new BN(500_000_000)),
        encodeU64LE(new BN(50_000_000)),
        encodeI64LE(ttl),
        encodeBytes32(randomHash()),
      ]);

      const ix = new TransactionInstruction({
        programId: CORE_PROGRAM_ID,
        keys: [
          { pubkey: aeonConfigPda, isSigner: false, isWritable: true },
          { pubkey: agentManifestPda, isSigner: false, isWritable: true },
          { pubkey: aeonAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [aeonAuthority]);

      const acct = await getAccountData(provider, agentManifestPda);
      expect(acct).to.not.be.null;
      // agent_type = 1 (Evaluator) at offset 42
      expect(acct!.readUInt8(42)).to.equal(1);
      // execution_permission = 0 (Never) at offset 44
      expect(acct!.readUInt8(44)).to.equal(0);
    });

    it("trigger_circuit_breaker (update_circuit_breaker): escalates Normal -> Cautious", async () => {
      const triggerHash = randomHash();

      const data = Buffer.concat([
        ixDiscriminator("trigger_circuit_breaker"),
        encodeU8(1),                       // new_mode: Cautious
        encodeBytes32(triggerHash),         // trigger_reason_hash
      ]);

      const ix = new TransactionInstruction({
        programId: CORE_PROGRAM_ID,
        keys: [
          { pubkey: aeonConfigPda, isSigner: false, isWritable: true },
          { pubkey: aeonAuthority.publicKey, isSigner: true, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [aeonAuthority]);

      const acct = await getAccountData(provider, aeonConfigPda);
      // circuit_breaker_mode at offset 8 + 32*6 + 2 = 202 (after 6 pubkeys + active_agent_count)
      const cbOffset = 8 + 32 + 32 + 32 + 32 + 32 + 32 + 2;
      expect(acct!.readUInt8(cbOffset)).to.equal(1); // Cautious
    });

    it("trigger_circuit_breaker: de-escalation is rejected", async () => {
      const data = Buffer.concat([
        ixDiscriminator("trigger_circuit_breaker"),
        encodeU8(0),                       // Normal (de-escalation from Cautious!)
        encodeBytes32(randomHash()),
      ]);

      const ix = new TransactionInstruction({
        programId: CORE_PROGRAM_ID,
        keys: [
          { pubkey: aeonConfigPda, isSigner: false, isWritable: true },
          { pubkey: aeonAuthority.publicKey, isSigner: true, isWritable: false },
        ],
        data,
      });

      try {
        await sendTx(provider, ix, [aeonAuthority]);
        expect.fail("Should have rejected de-escalation");
      } catch (err: any) {
        expect(err.toString()).to.contain("custom program error");
      }
    });

    it("trigger_circuit_breaker: keeper_authority can also escalate", async () => {
      const data = Buffer.concat([
        ixDiscriminator("trigger_circuit_breaker"),
        encodeU8(2),                       // Restricted (escalation from Cautious)
        encodeBytes32(randomHash()),
      ]);

      const ix = new TransactionInstruction({
        programId: CORE_PROGRAM_ID,
        keys: [
          { pubkey: aeonConfigPda, isSigner: false, isWritable: true },
          { pubkey: keeperAuthority.publicKey, isSigner: true, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [keeperAuthority]);

      const acct = await getAccountData(provider, aeonConfigPda);
      const cbOffset = 8 + 32 + 32 + 32 + 32 + 32 + 32 + 2;
      expect(acct!.readUInt8(cbOffset)).to.equal(2); // Restricted
    });
  });

  // ================================================================
  //  2. NOUMEN PROOF
  // ================================================================
  describe("noumen_proof", () => {
    it("initialize_proof: creates ProofConfig PDA", async () => {
      const data = Buffer.concat([
        ixDiscriminator("initialize_proof"),
        encodePubkey(keeperAuthority.publicKey),   // keeper_authority
      ]);

      const ix = new TransactionInstruction({
        programId: PROOF_PROGRAM_ID,
        keys: [
          { pubkey: proofConfigPda, isSigner: false, isWritable: true },
          { pubkey: superAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, []);

      const acct = await getAccountData(provider, proofConfigPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("ProofConfig"))).to.be.true;

      // keeper_authority at offset 8
      expect(new PublicKey(acct!.subarray(8, 40)).equals(keeperAuthority.publicKey)).to.be.true;
      // is_initialized at offset 40
      expect(acct!.readUInt8(40)).to.equal(1);
    });

    it("log_decision: creates immutable DecisionLog (A0-6)", async () => {
      const agentId = 1;
      const nonce = new BN(1);
      const agentIdBuf = encodeU16LE(agentId);
      const nonceBuf = encodeU64LE(nonce);
      const inputHash = randomHash();
      const decisionHash = randomHash();
      const justHash = randomHash();

      const [decisionLogPda] = findPda(
        [Buffer.from("decision"), agentIdBuf, nonceBuf],
        PROOF_PROGRAM_ID
      );

      // LogDecisionArgs: agent_id, nonce, input_hash, decision_hash,
      //   justification_hash, evidence_families_bitmap, decision_class, is_execution_class
      const data = Buffer.concat([
        ixDiscriminator("log_decision"),
        agentIdBuf,                            // agent_id
        nonceBuf,                              // nonce
        encodeBytes32(inputHash),              // input_hash
        encodeBytes32(decisionHash),           // decision_hash
        encodeBytes32(justHash),               // justification_hash
        encodeU8(0b00011),                     // evidence_families_bitmap (families A+B)
        encodeU8(2),                           // decision_class: RiskWarning
        encodeBool(true),                      // is_execution_class
      ]);

      const ix = new TransactionInstruction({
        programId: PROOF_PROGRAM_ID,
        keys: [
          { pubkey: proofConfigPda, isSigner: false, isWritable: false },
          { pubkey: decisionLogPda, isSigner: false, isWritable: true },
          { pubkey: keeperAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [keeperAuthority]);

      const acct = await getAccountData(provider, decisionLogPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("DecisionLog"))).to.be.true;
      expect(acct!.readUInt16LE(8)).to.equal(agentId);
    });

    it("log_decision: execution-class with < 2 evidence families fails (A0-17)", async () => {
      const nonce = new BN(900);
      const agentIdBuf = encodeU16LE(1);
      const nonceBuf = encodeU64LE(nonce);

      const [decisionLogPda] = findPda(
        [Buffer.from("decision"), agentIdBuf, nonceBuf],
        PROOF_PROGRAM_ID
      );

      const data = Buffer.concat([
        ixDiscriminator("log_decision"),
        agentIdBuf,
        nonceBuf,
        encodeBytes32(randomHash()),
        encodeBytes32(randomHash()),
        encodeBytes32(randomHash()),
        encodeU8(0b00001),                     // only 1 evidence family
        encodeU8(0),
        encodeBool(true),                      // is_execution_class
      ]);

      const ix = new TransactionInstruction({
        programId: PROOF_PROGRAM_ID,
        keys: [
          { pubkey: proofConfigPda, isSigner: false, isWritable: false },
          { pubkey: decisionLogPda, isSigner: false, isWritable: true },
          { pubkey: keeperAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      try {
        await sendTx(provider, ix, [keeperAuthority]);
        expect.fail("Should have thrown InsufficientEvidenceFamilies");
      } catch (err: any) {
        expect(err.toString()).to.contain("custom program error");
      }
    });

    it("log_decision: non-execution-class with 1 family succeeds (A0-17 only applies to execution)", async () => {
      const nonce = new BN(901);
      const agentIdBuf = encodeU16LE(1);
      const nonceBuf = encodeU64LE(nonce);

      const [decisionLogPda] = findPda(
        [Buffer.from("decision"), agentIdBuf, nonceBuf],
        PROOF_PROGRAM_ID
      );

      const data = Buffer.concat([
        ixDiscriminator("log_decision"),
        agentIdBuf,
        nonceBuf,
        encodeBytes32(randomHash()),
        encodeBytes32(randomHash()),
        encodeBytes32(randomHash()),
        encodeU8(0b00001),                     // only 1 evidence family
        encodeU8(0),                           // Info
        encodeBool(false),                     // NOT execution_class
      ]);

      const ix = new TransactionInstruction({
        programId: PROOF_PROGRAM_ID,
        keys: [
          { pubkey: proofConfigPda, isSigner: false, isWritable: false },
          { pubkey: decisionLogPda, isSigner: false, isWritable: true },
          { pubkey: keeperAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [keeperAuthority]);

      const acct = await getAccountData(provider, decisionLogPda);
      expect(acct).to.not.be.null;
    });

    it("confirm_execution (log_execution_result): links ExecutionResult to DecisionLog", async () => {
      const agentIdBuf = encodeU16LE(1);
      const nonceBuf = encodeU64LE(new BN(1));
      const resultHash = randomHash();

      const [decisionLogPda] = findPda(
        [Buffer.from("decision"), agentIdBuf, nonceBuf],
        PROOF_PROGRAM_ID
      );
      const [executionResultPda] = findPda(
        [Buffer.from("execution"), decisionLogPda.toBuffer()],
        PROOF_PROGRAM_ID
      );

      // ConfirmExecutionArgs: result_hash, status
      const data = Buffer.concat([
        ixDiscriminator("confirm_execution"),
        encodeBytes32(resultHash),             // result_hash
        encodeU8(1),                           // status: success
      ]);

      const ix = new TransactionInstruction({
        programId: PROOF_PROGRAM_ID,
        keys: [
          { pubkey: proofConfigPda, isSigner: false, isWritable: false },
          { pubkey: decisionLogPda, isSigner: false, isWritable: true },
          { pubkey: executionResultPda, isSigner: false, isWritable: true },
          { pubkey: keeperAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [keeperAuthority]);

      const acct = await getAccountData(provider, executionResultPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("ExecutionResult"))).to.be.true;

      // decision_log pubkey at offset 8
      expect(new PublicKey(acct!.subarray(8, 40)).equals(decisionLogPda)).to.be.true;

      // Verify DecisionLog.execution_confirmed is now true
      const logAcct = await getAccountData(provider, decisionLogPda);
      // execution_confirmed at: 8+2+8+32+32+32+1+1+8+1 = 125
      const execConfOffset = 8 + 2 + 8 + 32 + 32 + 32 + 1 + 1 + 8 + 1;
      expect(logAcct!.readUInt8(execConfOffset)).to.equal(1);
    });
  });

  // ================================================================
  //  3. NOUMEN TREASURY
  // ================================================================
  describe("noumen_treasury", () => {
    it("initialize_treasury: creates TreasuryConfig and TreasuryVault (step 1)", async () => {
      // Args are bare pubkeys: aeon_authority, keeper_authority, creator_wallet
      const data = Buffer.concat([
        ixDiscriminator("initialize_treasury"),
        encodePubkey(aeonAuthority.publicKey),
        encodePubkey(keeperAuthority.publicKey),
        encodePubkey(creatorWallet.publicKey),
      ]);

      const ix = new TransactionInstruction({
        programId: TREASURY_PROGRAM_ID,
        keys: [
          { pubkey: superAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: treasuryConfigPda, isSigner: false, isWritable: true },
          { pubkey: treasuryVaultPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, []);

      // TreasuryConfig
      const configAcct = await getAccountData(provider, treasuryConfigPda);
      expect(configAcct).to.not.be.null;
      expect(configAcct!.subarray(0, 8).equals(accountDiscriminator("TreasuryConfig"))).to.be.true;
      expect(new PublicKey(configAcct!.subarray(8, 40)).equals(superAuthority.publicKey)).to.be.true;

      // TreasuryVault
      const vaultAcct = await getAccountData(provider, treasuryVaultPda);
      expect(vaultAcct).to.not.be.null;
      expect(vaultAcct!.subarray(0, 8).equals(accountDiscriminator("TreasuryVault"))).to.be.true;
    });

    it("initialize_donations: creates DonationVault and CCSConfig (step 2)", async () => {
      const data = Buffer.concat([
        ixDiscriminator("initialize_donations"),
      ]);

      const ix = new TransactionInstruction({
        programId: TREASURY_PROGRAM_ID,
        keys: [
          { pubkey: superAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: treasuryConfigPda, isSigner: false, isWritable: false },
          { pubkey: donationVaultPda, isSigner: false, isWritable: true },
          { pubkey: ccsConfigPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, []);

      // DonationVault
      const donAcct = await getAccountData(provider, donationVaultPda);
      expect(donAcct).to.not.be.null;
      expect(donAcct!.subarray(0, 8).equals(accountDiscriminator("DonationVault"))).to.be.true;

      // CCSConfig
      const ccsAcct = await getAccountData(provider, ccsConfigPda);
      expect(ccsAcct).to.not.be.null;
      expect(ccsAcct!.subarray(0, 8).equals(accountDiscriminator("CCSConfig"))).to.be.true;
    });

    it("record_donation_receipt (accept_donation): records donation with hashed wallet (A0-27)", async () => {
      const nonce = new BN(1);
      const amount = new BN(500_000_000); // 0.5 SOL
      const sourceWalletHash = randomHash();
      const receiptHash = randomHash();

      const [donationReceiptPda] = findPda(
        [Buffer.from("donation_receipt"), encodeU64LE(nonce)],
        TREASURY_PROGRAM_ID
      );

      // Args: nonce, amount, source_wallet_hash, disclosure_mode, receipt_hash
      const data = Buffer.concat([
        ixDiscriminator("record_donation_receipt"),
        encodeU64LE(nonce),
        encodeU64LE(amount),
        encodeBytes32(sourceWalletHash),
        encodeU8(0),                           // Pseudonymous
        encodeBytes32(receiptHash),
      ]);

      const ix = new TransactionInstruction({
        programId: TREASURY_PROGRAM_ID,
        keys: [
          { pubkey: keeperAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: treasuryConfigPda, isSigner: false, isWritable: false },
          { pubkey: donationReceiptPda, isSigner: false, isWritable: true },
          { pubkey: donationVaultPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [keeperAuthority]);

      // Receipt PDA
      const receiptAcct = await getAccountData(provider, donationReceiptPda);
      expect(receiptAcct).to.not.be.null;
      expect(receiptAcct!.subarray(0, 8).equals(accountDiscriminator("DonationReceipt"))).to.be.true;

      // DonationVault: total_received=0.5SOL, pending_sweep=0.5SOL
      const donAcct = await getAccountData(provider, donationVaultPda);
      const totalReceived = new BN(donAcct!.subarray(8, 16), "le");
      expect(totalReceived.eq(amount)).to.be.true;
      const pendingSweep = new BN(donAcct!.subarray(16, 24), "le");
      expect(pendingSweep.eq(amount)).to.be.true;
    });

    it("update_revenue_averages (record_revenue): keeper updates CCS averages", async () => {
      const avg7d = new BN(2_000_000_000);
      const avg30d = new BN(5_000_000_000);

      const data = Buffer.concat([
        ixDiscriminator("update_revenue_averages"),
        encodeU64LE(avg7d),
        encodeU64LE(avg30d),
      ]);

      const ix = new TransactionInstruction({
        programId: TREASURY_PROGRAM_ID,
        keys: [
          { pubkey: keeperAuthority.publicKey, isSigner: true, isWritable: false },
          { pubkey: treasuryConfigPda, isSigner: false, isWritable: false },
          { pubkey: ccsConfigPda, isSigner: false, isWritable: true },
        ],
        data,
      });

      await sendTx(provider, ix, [keeperAuthority]);

      const ccsAcct = await getAccountData(provider, ccsConfigPda);
      expect(ccsAcct).to.not.be.null;
    });
  });

  // ================================================================
  //  4. NOUMEN APOLLO
  // ================================================================
  describe("noumen_apollo", () => {
    it("initialize_apollo: hardcoded max_weight_bps = 4000 (A0-16)", async () => {
      // InitializeApolloArgs: authority, max_mli_pools, mli_tvl_minimum_lamports
      const data = Buffer.concat([
        ixDiscriminator("initialize_apollo"),
        encodePubkey(apolloAuthority.publicKey),    // authority
        encodeU16LE(50),                            // max_mli_pools
        encodeU64LE(new BN(100_000_000)),           // mli_tvl_minimum_lamports
      ]);

      const ix = new TransactionInstruction({
        programId: APOLLO_PROGRAM_ID,
        keys: [
          { pubkey: apolloConfigPda, isSigner: false, isWritable: true },
          { pubkey: aeonAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [aeonAuthority]);

      const acct = await getAccountData(provider, apolloConfigPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("ApolloConfig"))).to.be.true;

      // authority at offset 8
      expect(new PublicKey(acct!.subarray(8, 40)).equals(apolloAuthority.publicKey)).to.be.true;
      // aeon_authority at offset 40
      expect(new PublicKey(acct!.subarray(40, 72)).equals(aeonAuthority.publicKey)).to.be.true;
      // max_weight_bps at offset 72 (u16 LE): MUST be 4000
      expect(acct!.readUInt16LE(72)).to.equal(4000);
    });

    it("register_pool: creates PoolTaxonomy PDA", async () => {
      const poolAddress = Keypair.generate().publicKey;

      const [poolTaxonomyPda] = findPda(
        [Buffer.from("pool_tax"), poolAddress.toBuffer()],
        APOLLO_PROGRAM_ID
      );

      // RegisterPoolArgs: pool_address, pool_type, protocol, risk_profile,
      //   il_sensitivity, pair_class, tvl_lamports
      const data = Buffer.concat([
        ixDiscriminator("register_pool"),
        encodePubkey(poolAddress),
        encodeU8(0),                           // CLAMM
        encodeU8(0),                           // Orca
        encodeU8(1),                           // risk_profile
        encodeU8(2),                           // il_sensitivity
        encodeU8(0),                           // pair_class
        encodeU64LE(new BN(50_000_000_000)),   // 50 SOL TVL
      ]);

      const ix = new TransactionInstruction({
        programId: APOLLO_PROGRAM_ID,
        keys: [
          { pubkey: apolloConfigPda, isSigner: false, isWritable: true },
          { pubkey: poolTaxonomyPda, isSigner: false, isWritable: true },
          { pubkey: apolloAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [apolloAuthority]);

      const acct = await getAccountData(provider, poolTaxonomyPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("PoolTaxonomy"))).to.be.true;
      expect(new PublicKey(acct!.subarray(8, 40)).equals(poolAddress)).to.be.true;

      // Verify pool_count incremented on config
      const configAcct = await getAccountData(provider, apolloConfigPda);
      // pool_count at offset: 8+32+32+2+2+8 = 84 (u16)
      expect(configAcct!.readUInt16LE(84)).to.equal(1);
    });

    it("publish_assessment: creates AssessmentRecord with valid APR pair (A0-23)", async () => {
      const poolAddress = Keypair.generate().publicKey;
      const assessmentNonce = new BN(1);
      const decisionLogRef = Keypair.generate().publicKey;

      const [assessmentRecordPda] = findPda(
        [
          Buffer.from("assessment"),
          poolAddress.toBuffer(),
          encodeU64LE(assessmentNonce),
        ],
        APOLLO_PROGRAM_ID
      );

      // PublishAssessmentArgs: pool_address, assessment_nonce, risk_level,
      //   confidence_score, evidence_families_bitmap, composite_score,
      //   mli_score, effective_apr_bps, headline_apr_bps, il_projected_bps,
      //   sustainability_score, expiry, decision_log_ref
      const data = Buffer.concat([
        ixDiscriminator("publish_assessment"),
        encodePubkey(poolAddress),
        encodeU64LE(assessmentNonce),
        encodeU8(1),                           // Medium risk
        encodeU8(85),                          // confidence
        encodeU8(0b00111),                     // 3 evidence families
        encodeU16LE(3500),                     // composite_score
        encodeU16LE(7200),                     // mli_score
        encodeU16LE(1500),                     // effective_apr_bps (>0)
        encodeU16LE(2800),                     // headline_apr_bps (>0)
        encodeU16LE(400),                      // il_projected_bps
        encodeU16LE(6500),                     // sustainability_score
        encodeI64LE(new BN(Math.floor(Date.now() / 1000) + 86400)),
        encodePubkey(decisionLogRef),
      ]);

      const ix = new TransactionInstruction({
        programId: APOLLO_PROGRAM_ID,
        keys: [
          { pubkey: apolloConfigPda, isSigner: false, isWritable: true },
          { pubkey: assessmentRecordPda, isSigner: false, isWritable: true },
          { pubkey: apolloAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [apolloAuthority]);

      const acct = await getAccountData(provider, assessmentRecordPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("AssessmentRecord"))).to.be.true;
    });

    it("publish_assessment: effective_apr_bps=0 is rejected (A0-23)", async () => {
      const poolAddress = Keypair.generate().publicKey;
      const assessmentNonce = new BN(2);

      const [assessmentRecordPda] = findPda(
        [
          Buffer.from("assessment"),
          poolAddress.toBuffer(),
          encodeU64LE(assessmentNonce),
        ],
        APOLLO_PROGRAM_ID
      );

      const data = Buffer.concat([
        ixDiscriminator("publish_assessment"),
        encodePubkey(poolAddress),
        encodeU64LE(assessmentNonce),
        encodeU8(0),
        encodeU8(50),
        encodeU8(0b00011),
        encodeU16LE(2000),
        encodeU16LE(5000),
        encodeU16LE(0),                        // effective_apr_bps=0 (INVALID)
        encodeU16LE(1500),
        encodeU16LE(200),
        encodeU16LE(4000),
        encodeI64LE(new BN(Math.floor(Date.now() / 1000) + 86400)),
        encodePubkey(Keypair.generate().publicKey),
      ]);

      const ix = new TransactionInstruction({
        programId: APOLLO_PROGRAM_ID,
        keys: [
          { pubkey: apolloConfigPda, isSigner: false, isWritable: true },
          { pubkey: assessmentRecordPda, isSigner: false, isWritable: true },
          { pubkey: apolloAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      try {
        await sendTx(provider, ix, [apolloAuthority]);
        expect.fail("Should have thrown MissingAPRPair");
      } catch (err: any) {
        expect(err.toString()).to.contain("custom program error");
      }
    });
  });

  // ================================================================
  //  5. NOUMEN HERMES
  // ================================================================
  describe("noumen_hermes", () => {
    it("initialize_hermes: creates HermesConfig PDA", async () => {
      const data = Buffer.concat([
        ixDiscriminator("initialize_hermes"),
        encodePubkey(hermesAuthority.publicKey),
      ]);

      const ix = new TransactionInstruction({
        programId: HERMES_PROGRAM_ID,
        keys: [
          { pubkey: hermesConfigPda, isSigner: false, isWritable: true },
          { pubkey: aeonAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [aeonAuthority]);

      const acct = await getAccountData(provider, hermesConfigPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("HermesConfig"))).to.be.true;

      // authority at offset 8
      expect(new PublicKey(acct!.subarray(8, 40)).equals(hermesAuthority.publicKey)).to.be.true;

      // is_initialized at offset 8+32+32+8 = 80
      expect(acct!.readUInt8(80)).to.equal(1);
    });

    it("publish_report: creates terminal IntelligenceReport (A0-30)", async () => {
      const reportNonce = new BN(1);
      const subjectPool = Keypair.generate().publicKey;
      const contentHash = randomHash();
      const decisionLogRef = Keypair.generate().publicKey;
      const expiry = new BN(Math.floor(Date.now() / 1000) + 86400);

      const [reportPda] = findPda(
        [Buffer.from("report"), encodeU64LE(reportNonce)],
        HERMES_PROGRAM_ID
      );

      // PublishReportArgs: report_nonce, report_type, subject_pool,
      //   content_hash, confidence_score, expiry, decision_log_ref
      const data = Buffer.concat([
        ixDiscriminator("publish_report"),
        encodeU64LE(reportNonce),
        encodeU8(0),                           // EffectiveAPR
        encodePubkey(subjectPool),
        encodeBytes32(contentHash),
        encodeU8(90),                          // confidence
        encodeI64LE(expiry),
        encodePubkey(decisionLogRef),
      ]);

      const ix = new TransactionInstruction({
        programId: HERMES_PROGRAM_ID,
        keys: [
          { pubkey: hermesConfigPda, isSigner: false, isWritable: true },
          { pubkey: reportPda, isSigner: false, isWritable: true },
          { pubkey: hermesAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [hermesAuthority]);

      const acct = await getAccountData(provider, reportPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("IntelligenceReport"))).to.be.true;

      // report_nonce at offset 8
      expect(new BN(acct!.subarray(8, 16), "le").eq(reportNonce)).to.be.true;
      // report_type at offset 16 -> 0 (EffectiveAPR)
      expect(acct!.readUInt8(16)).to.equal(0);

      // Verify report_count incremented
      const configAcct = await getAccountData(provider, hermesConfigPda);
      // report_count at offset 8+32+32 = 72 (u64)
      const reportCount = new BN(configAcct!.subarray(72, 80), "le");
      expect(reportCount.eq(new BN(1))).to.be.true;
    });

    it("publish_report: invalid report_type > 4 is rejected (A0-30)", async () => {
      const reportNonce = new BN(888);
      const [reportPda] = findPda(
        [Buffer.from("report"), encodeU64LE(reportNonce)],
        HERMES_PROGRAM_ID
      );

      const data = Buffer.concat([
        ixDiscriminator("publish_report"),
        encodeU64LE(reportNonce),
        encodeU8(5),                           // invalid type
        encodePubkey(Keypair.generate().publicKey),
        encodeBytes32(randomHash()),
        encodeU8(50),
        encodeI64LE(new BN(Math.floor(Date.now() / 1000) + 86400)),
        encodePubkey(Keypair.generate().publicKey),
      ]);

      const ix = new TransactionInstruction({
        programId: HERMES_PROGRAM_ID,
        keys: [
          { pubkey: hermesConfigPda, isSigner: false, isWritable: true },
          { pubkey: reportPda, isSigner: false, isWritable: true },
          { pubkey: hermesAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      try {
        await sendTx(provider, ix, [hermesAuthority]);
        expect.fail("Should have thrown InvalidReportType");
      } catch (err: any) {
        expect(err.toString()).to.contain("custom program error");
      }
    });
  });

  // ================================================================
  //  6. NOUMEN AUDITOR
  // ================================================================
  describe("noumen_auditor", () => {
    it("initialize_auditor: creates AuditorConfig PDA", async () => {
      const data = Buffer.concat([
        ixDiscriminator("initialize_auditor"),
        encodePubkey(aeonAuthority.publicKey),  // aeon_authority
      ]);

      const ix = new TransactionInstruction({
        programId: AUDITOR_PROGRAM_ID,
        keys: [
          { pubkey: auditorConfigPda, isSigner: false, isWritable: true },
          { pubkey: auditorAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [auditorAuthority]);

      const acct = await getAccountData(provider, auditorConfigPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("AuditorConfig"))).to.be.true;

      // authority at offset 8
      expect(new PublicKey(acct!.subarray(8, 40)).equals(auditorAuthority.publicKey)).to.be.true;
      // aeon_authority at offset 40
      expect(new PublicKey(acct!.subarray(40, 72)).equals(aeonAuthority.publicKey)).to.be.true;
    });

    it("record_truth_label: creates TruthLabel for resolved window (A0-20, A0-21)", async () => {
      const signalNonce = new BN(1);
      const signalId = randomHash();
      const evidenceHash = randomHash();
      const now = Math.floor(Date.now() / 1000);

      const [truthLabelPda] = findPda(
        [Buffer.from("truth_label"), encodeU64LE(signalNonce)],
        AUDITOR_PROGRAM_ID
      );

      // RecordTruthLabelArgs: signal_nonce, signal_id, htl_result, eol_result,
      //   signal_type, window_start, window_end, evidence_hash
      const data = Buffer.concat([
        ixDiscriminator("record_truth_label"),
        encodeU64LE(signalNonce),
        encodeBytes32(signalId),
        encodeU8(0),                           // Correct
        encodeU8(0),                           // Correct
        encodeU8(1),                           // signal_type
        encodeI64LE(new BN(now - 86400)),      // window_start: yesterday
        encodeI64LE(new BN(now - 3600)),       // window_end: 1h ago (resolved)
        encodeBytes32(evidenceHash),
      ]);

      const ix = new TransactionInstruction({
        programId: AUDITOR_PROGRAM_ID,
        keys: [
          { pubkey: auditorConfigPda, isSigner: false, isWritable: true },
          { pubkey: truthLabelPda, isSigner: false, isWritable: true },
          { pubkey: auditorAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [auditorAuthority]);

      const acct = await getAccountData(provider, truthLabelPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("TruthLabel"))).to.be.true;

      // Verify total_truth_labels incremented on config
      const configAcct = await getAccountData(provider, auditorConfigPda);
      // total_truth_labels at offset 8+32+32 = 72 (u64)
      const count = new BN(configAcct!.subarray(72, 80), "le");
      expect(count.eq(new BN(1))).to.be.true;
    });

    it("record_truth_label: future window_end is rejected (A0-21)", async () => {
      const signalNonce = new BN(998);
      const now = Math.floor(Date.now() / 1000);

      const [truthLabelPda] = findPda(
        [Buffer.from("truth_label"), encodeU64LE(signalNonce)],
        AUDITOR_PROGRAM_ID
      );

      const data = Buffer.concat([
        ixDiscriminator("record_truth_label"),
        encodeU64LE(signalNonce),
        encodeBytes32(randomHash()),
        encodeU8(0),
        encodeU8(0),
        encodeU8(0),
        encodeI64LE(new BN(now - 3600)),
        encodeI64LE(new BN(now + 86400)),      // future window_end!
        encodeBytes32(randomHash()),
      ]);

      const ix = new TransactionInstruction({
        programId: AUDITOR_PROGRAM_ID,
        keys: [
          { pubkey: auditorConfigPda, isSigner: false, isWritable: true },
          { pubkey: truthLabelPda, isSigner: false, isWritable: true },
          { pubkey: auditorAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      try {
        await sendTx(provider, ix, [auditorAuthority]);
        expect.fail("Should have thrown WindowNotResolved");
      } catch (err: any) {
        expect(err.toString()).to.contain("custom program error");
      }
    });

    it("register_security_incident: creates SecurityIncident PDA (A0-19)", async () => {
      const incidentNonce = new BN(1);
      const affectedPool = Keypair.generate().publicKey;
      const detectionHash = randomHash();

      const [incidentPda] = findPda(
        [Buffer.from("incident"), encodeU64LE(incidentNonce)],
        AUDITOR_PROGRAM_ID
      );

      // RegisterSecurityIncidentArgs: incident_nonce, affected_pool,
      //   incident_type, detection_evidence_hash
      const data = Buffer.concat([
        ixDiscriminator("register_security_incident"),
        encodeU64LE(incidentNonce),
        encodePubkey(affectedPool),
        encodeU8(0),                           // Exploit
        encodeBytes32(detectionHash),
      ]);

      const ix = new TransactionInstruction({
        programId: AUDITOR_PROGRAM_ID,
        keys: [
          { pubkey: auditorConfigPda, isSigner: false, isWritable: true },
          { pubkey: incidentPda, isSigner: false, isWritable: true },
          { pubkey: auditorAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [auditorAuthority]);

      const acct = await getAccountData(provider, incidentPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("SecurityIncident"))).to.be.true;

      // incident_nonce at offset 8
      expect(new BN(acct!.subarray(8, 16), "le").eq(incidentNonce)).to.be.true;
      // affected_pool at offset 16
      expect(new PublicKey(acct!.subarray(16, 48)).equals(affectedPool)).to.be.true;
      // incident_type at offset 48 -> 0 (Exploit)
      expect(acct!.readUInt8(48)).to.equal(0);
      // status at offset 49 -> 0 (Unconfirmed)
      expect(acct!.readUInt8(49)).to.equal(0);

      // Verify total_incidents incremented
      const configAcct = await getAccountData(provider, auditorConfigPda);
      // total_incidents at offset 80 (after total_truth_labels u64)
      const incidentCount = new BN(configAcct!.subarray(80, 88), "le");
      expect(incidentCount.eq(new BN(1))).to.be.true;
    });

    it("register_security_incident: invalid incident_type > 4 is rejected", async () => {
      const incidentNonce = new BN(997);

      const [incidentPda] = findPda(
        [Buffer.from("incident"), encodeU64LE(incidentNonce)],
        AUDITOR_PROGRAM_ID
      );

      const data = Buffer.concat([
        ixDiscriminator("register_security_incident"),
        encodeU64LE(incidentNonce),
        encodePubkey(Keypair.generate().publicKey),
        encodeU8(5),                           // Invalid incident_type
        encodeBytes32(randomHash()),
      ]);

      const ix = new TransactionInstruction({
        programId: AUDITOR_PROGRAM_ID,
        keys: [
          { pubkey: auditorConfigPda, isSigner: false, isWritable: true },
          { pubkey: incidentPda, isSigner: false, isWritable: true },
          { pubkey: auditorAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      try {
        await sendTx(provider, ix, [auditorAuthority]);
        expect.fail("Should have thrown InvalidIncidentType");
      } catch (err: any) {
        expect(err.toString()).to.contain("custom program error");
      }
    });
  });

  // ================================================================
  //  7. NOUMEN SERVICE
  // ================================================================
  describe("noumen_service", () => {
    const serviceId = 1;
    const serviceIdBuf = encodeU16LE(serviceId);

    it("initialize_service_config: creates ServiceConfig PDA", async () => {
      // Args: aeon_authority, keeper_authority (bare pubkeys)
      const data = Buffer.concat([
        ixDiscriminator("initialize_service_config"),
        encodePubkey(aeonAuthority.publicKey),
        encodePubkey(keeperAuthority.publicKey),
      ]);

      const ix = new TransactionInstruction({
        programId: SERVICE_PROGRAM_ID,
        keys: [
          { pubkey: serviceConfigPda, isSigner: false, isWritable: true },
          { pubkey: superAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, []);

      const acct = await getAccountData(provider, serviceConfigPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("ServiceConfig"))).to.be.true;

      // aeon_authority at offset 8
      expect(new PublicKey(acct!.subarray(8, 40)).equals(aeonAuthority.publicKey)).to.be.true;
      // keeper_authority at offset 40
      expect(new PublicKey(acct!.subarray(40, 72)).equals(keeperAuthority.publicKey)).to.be.true;
      // service_count at offset 72 (u16)
      expect(acct!.readUInt16LE(72)).to.equal(0);
      // is_initialized at offset 74
      expect(acct!.readUInt8(74)).to.equal(1);
    });

    it("register_service: creates ServiceEntry with A0-8 margin validation (cost*1.2)", async () => {
      const [serviceEntryPda] = findPda(
        [Buffer.from("service"), serviceIdBuf],
        SERVICE_PROGRAM_ID
      );

      const costLamports = new BN(100_000_000);     // 0.1 SOL
      const priceLamports = new BN(120_000_000);     // 0.12 SOL (exactly 20% margin)

      // Args: service_id, owning_agent_id, service_tier, price_lamports, cost_lamports
      const data = Buffer.concat([
        ixDiscriminator("register_service"),
        serviceIdBuf,
        encodeU16LE(1),                        // owning_agent_id
        encodeU8(0),                           // Entry tier
        encodeU64LE(priceLamports),
        encodeU64LE(costLamports),
      ]);

      const ix = new TransactionInstruction({
        programId: SERVICE_PROGRAM_ID,
        keys: [
          { pubkey: serviceConfigPda, isSigner: false, isWritable: true },
          { pubkey: serviceEntryPda, isSigner: false, isWritable: true },
          { pubkey: aeonAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [aeonAuthority]);

      const acct = await getAccountData(provider, serviceEntryPda);
      expect(acct).to.not.be.null;
      expect(acct!.subarray(0, 8).equals(accountDiscriminator("ServiceEntry"))).to.be.true;

      // service_id at offset 8
      expect(acct!.readUInt16LE(8)).to.equal(serviceId);

      // Verify service_count incremented
      const configAcct = await getAccountData(provider, serviceConfigPda);
      expect(configAcct!.readUInt16LE(72)).to.equal(1);
    });

    it("register_service: price below 20% margin is rejected (A0-8)", async () => {
      const badId = 77;
      const badIdBuf = encodeU16LE(badId);

      const [serviceEntryPda] = findPda(
        [Buffer.from("service"), badIdBuf],
        SERVICE_PROGRAM_ID
      );

      const costLamports = new BN(100_000_000);     // 0.1 SOL
      const priceLamports = new BN(110_000_000);     // 0.11 SOL (10% margin, too low)

      const data = Buffer.concat([
        ixDiscriminator("register_service"),
        badIdBuf,
        encodeU16LE(1),
        encodeU8(0),
        encodeU64LE(priceLamports),
        encodeU64LE(costLamports),
      ]);

      const ix = new TransactionInstruction({
        programId: SERVICE_PROGRAM_ID,
        keys: [
          { pubkey: serviceConfigPda, isSigner: false, isWritable: true },
          { pubkey: serviceEntryPda, isSigner: false, isWritable: true },
          { pubkey: aeonAuthority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      try {
        await sendTx(provider, ix, [aeonAuthority]);
        expect.fail("Should have thrown PriceBelowMinMargin");
      } catch (err: any) {
        expect(err.toString()).to.contain("custom program error");
      }
    });

    it("update_service_price: updates price/cost with margin revalidation", async () => {
      const [serviceEntryPda] = findPda(
        [Buffer.from("service"), serviceIdBuf],
        SERVICE_PROGRAM_ID
      );

      const newCost = new BN(200_000_000);       // 0.2 SOL
      const newPrice = new BN(250_000_000);       // 0.25 SOL (25% margin)

      // Args: service_id, new_price, new_cost
      const data = Buffer.concat([
        ixDiscriminator("update_service_price"),
        serviceIdBuf,
        encodeU64LE(newPrice),
        encodeU64LE(newCost),
      ]);

      const ix = new TransactionInstruction({
        programId: SERVICE_PROGRAM_ID,
        keys: [
          { pubkey: serviceConfigPda, isSigner: false, isWritable: false },
          { pubkey: serviceEntryPda, isSigner: false, isWritable: true },
          { pubkey: aeonAuthority.publicKey, isSigner: true, isWritable: false },
        ],
        data,
      });

      await sendTx(provider, ix, [aeonAuthority]);

      const acct = await getAccountData(provider, serviceEntryPda);
      expect(acct).to.not.be.null;

      // price_lamports at offset: 8+2+2+1+1 = 14
      const storedPrice = new BN(acct!.subarray(14, 22), "le");
      expect(storedPrice.eq(newPrice)).to.be.true;

      // cost_lamports at offset 22
      const storedCost = new BN(acct!.subarray(22, 30), "le");
      expect(storedCost.eq(newCost)).to.be.true;
    });

    it("update_service_price: price below margin after update is rejected (A0-8)", async () => {
      const [serviceEntryPda] = findPda(
        [Buffer.from("service"), serviceIdBuf],
        SERVICE_PROGRAM_ID
      );

      const newCost = new BN(200_000_000);       // 0.2 SOL
      const newPrice = new BN(220_000_000);       // 0.22 SOL (10% margin, too low)

      const data = Buffer.concat([
        ixDiscriminator("update_service_price"),
        serviceIdBuf,
        encodeU64LE(newPrice),
        encodeU64LE(newCost),
      ]);

      const ix = new TransactionInstruction({
        programId: SERVICE_PROGRAM_ID,
        keys: [
          { pubkey: serviceConfigPda, isSigner: false, isWritable: false },
          { pubkey: serviceEntryPda, isSigner: false, isWritable: true },
          { pubkey: aeonAuthority.publicKey, isSigner: true, isWritable: false },
        ],
        data,
      });

      try {
        await sendTx(provider, ix, [aeonAuthority]);
        expect.fail("Should have thrown PriceBelowMinMargin");
      } catch (err: any) {
        expect(err.toString()).to.contain("custom program error");
      }
    });
  });

  // ================================================================
  //  CROSS-CUTTING AXIOM VALIDATION SUMMARY
  // ================================================================
  describe("cross-cutting axiom validations", () => {
    it("A0-9: operational_agent_cap <= 100 (hard limit)", async () => {
      const acct = await getAccountData(provider, aeonConfigPda);
      // operational_agent_cap at: 8 + 32*6 + 2 + 1 + 1 = 204 (6 pubkeys, not 5)
      const opCapOffset = 8 + 32 + 32 + 32 + 32 + 32 + 32 + 2 + 1 + 1;
      const opCap = acct!.readUInt32LE(opCapOffset);
      expect(opCap).to.equal(50);
      expect(opCap).to.be.at.most(100);
    });

    it("A0-16: APOLLO max_weight_bps is always 4000 (40%)", async () => {
      const acct = await getAccountData(provider, apolloConfigPda);
      expect(acct!.readUInt16LE(72)).to.equal(4000);
    });

    it("A0-6: DecisionLog.execution_confirmed was correctly set after confirm_execution", async () => {
      const agentIdBuf = encodeU16LE(1);
      const nonceBuf = encodeU64LE(new BN(1));

      const [decisionLogPda] = findPda(
        [Buffer.from("decision"), agentIdBuf, nonceBuf],
        PROOF_PROGRAM_ID
      );

      const acct = await getAccountData(provider, decisionLogPda);
      const execConfOffset = 8 + 2 + 8 + 32 + 32 + 32 + 1 + 1 + 8 + 1;
      expect(acct!.readUInt8(execConfOffset)).to.equal(1); // true
    });

    it("A0-24: donations tracked separately (DonationVault pending_sweep independent of treasury)", async () => {
      const donAcct = await getAccountData(provider, donationVaultPda);
      expect(donAcct).to.not.be.null;

      // The treasury vault total_balance should still be 0 (donations not yet swept)
      const vaultAcct = await getAccountData(provider, treasuryVaultPda);
      const totalBalance = new BN(vaultAcct!.subarray(8, 16), "le");
      expect(totalBalance.eq(new BN(0))).to.be.true;
    });
  });
});
