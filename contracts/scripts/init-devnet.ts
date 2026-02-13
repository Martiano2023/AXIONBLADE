/**
 * AXIONBLADE Devnet Initialization Script
 *
 * Deploys and initializes all 7 AXIONBLADE programs on Solana devnet.
 * Usage: npx ts-node scripts/init-devnet.ts
 *
 * Prerequisites:
 *   - Programs deployed via `anchor deploy --provider.cluster devnet`
 *   - Wallet at ~/.config/solana/id.json funded with devnet SOL
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

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";

// Creator wallet — receives 15% of revenue via CCS (Creator Compensation Structure)
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

/** Borsh-serialize i64 as little-endian */
function serializeI64(val: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(val);
  return buf;
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

/** Borsh-serialize u16 as little-endian */
function serializeU16(val: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(val);
  return buf;
}

/** Borsh-serialize u8 */
function serializeU8(val: number): Buffer {
  return Buffer.from([val]);
}

/** Borsh-serialize bool */
function serializeBool(val: boolean): Buffer {
  return Buffer.from([val ? 1 : 0]);
}

async function airdropIfNeeded(connection: Connection, pubkey: PublicKey) {
  const balance = await connection.getBalance(pubkey);
  if (balance < 2 * LAMPORTS_PER_SOL) {
    console.log(`  Airdropping 2 SOL to ${pubkey.toBase58().slice(0, 8)}...`);
    const sig = await connection.requestAirdrop(pubkey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
    console.log(`  Airdrop confirmed.`);
  }
}

// ──────────────────────────────────────────
// Initialization functions
// ──────────────────────────────────────────

async function initializeAeon(
  connection: Connection,
  payer: Keypair,
  aeonAuthority: PublicKey,
  keeperAuthority: PublicKey,
): Promise<string> {
  console.log("\n[1/7] Initializing AEON (noumen_core)...");

  const [aeonConfigPDA] = findPDA(
    [Buffer.from("aeon_config")],
    PROGRAM_IDS.core,
  );

  // Check if already initialized
  const existing = await connection.getAccountInfo(aeonConfigPDA);
  if (existing) {
    console.log("  Already initialized, skipping.");
    return "skipped";
  }

  // Build InitializeAeonArgs
  // Fields: keeper_authority, aeon_authority, treasury_program, proof_program,
  //         heartbeat_interval (i64), operational_agent_cap (u32)
  const argsData = Buffer.concat([
    serializePubkey(keeperAuthority),
    serializePubkey(aeonAuthority),
    serializePubkey(PROGRAM_IDS.treasury),
    serializePubkey(PROGRAM_IDS.proof),
    serializeI64(BigInt(60)), // heartbeat_interval: 60 seconds
    serializeU32(100), // operational_agent_cap: 100 (A0-9)
  ]);

  const data = Buffer.concat([ixDiscriminator("initialize_aeon"), argsData]);

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: aeonConfigPDA, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_IDS.core,
    data,
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "confirmed",
  });
  console.log(`  AeonConfig PDA: ${aeonConfigPDA.toBase58()}`);
  console.log(`  TX: ${sig}`);
  return sig;
}

async function initializeProof(
  connection: Connection,
  payer: Keypair,
  keeperAuthority: PublicKey,
): Promise<string> {
  console.log("\n[2/7] Initializing Proof (noumen_proof)...");

  const [proofConfigPDA] = findPDA(
    [Buffer.from("proof_config")],
    PROGRAM_IDS.proof,
  );

  const existing = await connection.getAccountInfo(proofConfigPDA);
  if (existing) {
    console.log("  Already initialized, skipping.");
    return "skipped";
  }

  // InitializeProofArgs: keeper_authority: Pubkey
  const argsData = serializePubkey(keeperAuthority);
  const data = Buffer.concat([ixDiscriminator("initialize_proof"), argsData]);

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: proofConfigPDA, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_IDS.proof,
    data,
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "confirmed",
  });
  console.log(`  ProofConfig PDA: ${proofConfigPDA.toBase58()}`);
  console.log(`  TX: ${sig}`);
  return sig;
}

async function initializeTreasury(
  connection: Connection,
  payer: Keypair,
  aeonAuthority: PublicKey,
  keeperAuthority: PublicKey,
  creatorWallet: PublicKey,
): Promise<string> {
  console.log("\n[3/7] Initializing Treasury (noumen_treasury)...");

  const [treasuryConfigPDA] = findPDA(
    [Buffer.from("treasury_config")],
    PROGRAM_IDS.treasury,
  );
  const [treasuryVaultPDA] = findPDA(
    [Buffer.from("treasury_vault")],
    PROGRAM_IDS.treasury,
  );
  const [donationVaultPDA] = findPDA(
    [Buffer.from("donation_vault")],
    PROGRAM_IDS.treasury,
  );
  const [ccsConfigPDA] = findPDA(
    [Buffer.from("ccs_config")],
    PROGRAM_IDS.treasury,
  );

  const existing = await connection.getAccountInfo(treasuryConfigPDA);
  if (existing) {
    console.log("  Already initialized, skipping.");
    return "skipped";
  }

  // Step 1: initialize_treasury(aeon_authority, keeper_authority, creator_wallet)
  const argsData = Buffer.concat([
    serializePubkey(aeonAuthority),
    serializePubkey(keeperAuthority),
    serializePubkey(creatorWallet),
  ]);
  const data1 = Buffer.concat([
    ixDiscriminator("initialize_treasury"),
    argsData,
  ]);

  const ix1 = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: treasuryConfigPDA, isSigner: false, isWritable: true },
      { pubkey: treasuryVaultPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_IDS.treasury,
    data: data1,
  });

  const tx1 = new Transaction().add(ix1);
  const sig1 = await sendAndConfirmTransaction(connection, tx1, [payer], {
    commitment: "confirmed",
  });
  console.log(`  TreasuryConfig PDA: ${treasuryConfigPDA.toBase58()}`);
  console.log(`  TreasuryVault PDA:  ${treasuryVaultPDA.toBase58()}`);
  console.log(`  TX (step 1): ${sig1}`);

  // Step 2: initialize_donations() - creates DonationVault + CCSConfig
  const data2 = ixDiscriminator("initialize_donations");

  const ix2 = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: treasuryConfigPDA, isSigner: false, isWritable: false },
      { pubkey: donationVaultPDA, isSigner: false, isWritable: true },
      { pubkey: ccsConfigPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_IDS.treasury,
    data: data2,
  });

  const tx2 = new Transaction().add(ix2);
  const sig2 = await sendAndConfirmTransaction(connection, tx2, [payer], {
    commitment: "confirmed",
  });
  console.log(`  DonationVault PDA:  ${donationVaultPDA.toBase58()}`);
  console.log(`  CCSConfig PDA:      ${ccsConfigPDA.toBase58()}`);
  console.log(`  TX (step 2): ${sig2}`);
  return sig2;
}

async function initializeApollo(
  connection: Connection,
  aeonKeypair: Keypair,
  apolloAuthority: PublicKey,
): Promise<string> {
  console.log("\n[4/7] Initializing APOLLO (noumen_apollo)...");

  const [apolloConfigPDA] = findPDA(
    [Buffer.from("apollo_config")],
    PROGRAM_IDS.apollo,
  );

  const existing = await connection.getAccountInfo(apolloConfigPDA);
  if (existing) {
    console.log("  Already initialized, skipping.");
    return "skipped";
  }

  // InitializeApolloArgs: authority (Pubkey), max_mli_pools (u16), mli_tvl_minimum_lamports (u64)
  const argsData = Buffer.concat([
    serializePubkey(apolloAuthority),
    serializeU16(50), // max 50 MLI pools
    serializeU64(BigInt(1_000_000_000)), // 1 SOL minimum TVL
  ]);
  const data = Buffer.concat([
    ixDiscriminator("initialize_apollo"),
    argsData,
  ]);

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: apolloConfigPDA, isSigner: false, isWritable: true },
      { pubkey: aeonKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_IDS.apollo,
    data,
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [aeonKeypair], {
    commitment: "confirmed",
  });
  console.log(`  ApolloConfig PDA: ${apolloConfigPDA.toBase58()}`);
  console.log(`  TX: ${sig}`);
  return sig;
}

async function initializeHermes(
  connection: Connection,
  aeonKeypair: Keypair,
  hermesAuthority: PublicKey,
): Promise<string> {
  console.log("\n[5/7] Initializing HERMES (noumen_hermes)...");

  const [hermesConfigPDA] = findPDA(
    [Buffer.from("hermes_config")],
    PROGRAM_IDS.hermes,
  );

  const existing = await connection.getAccountInfo(hermesConfigPDA);
  if (existing) {
    console.log("  Already initialized, skipping.");
    return "skipped";
  }

  // InitializeHermesArgs: hermes_authority (Pubkey)
  const argsData = serializePubkey(hermesAuthority);
  const data = Buffer.concat([
    ixDiscriminator("initialize_hermes"),
    argsData,
  ]);

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: hermesConfigPDA, isSigner: false, isWritable: true },
      { pubkey: aeonKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_IDS.hermes,
    data,
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [aeonKeypair], {
    commitment: "confirmed",
  });
  console.log(`  HermesConfig PDA: ${hermesConfigPDA.toBase58()}`);
  console.log(`  TX: ${sig}`);
  return sig;
}

async function initializeAuditor(
  connection: Connection,
  payer: Keypair,
  aeonAuthority: PublicKey,
): Promise<string> {
  console.log("\n[6/7] Initializing Auditor (noumen_auditor)...");

  const [auditorConfigPDA] = findPDA(
    [Buffer.from("auditor_config")],
    PROGRAM_IDS.auditor,
  );

  const existing = await connection.getAccountInfo(auditorConfigPDA);
  if (existing) {
    console.log("  Already initialized, skipping.");
    return "skipped";
  }

  // InitializeAuditorArgs: aeon_authority (Pubkey)
  const argsData = serializePubkey(aeonAuthority);
  const data = Buffer.concat([
    ixDiscriminator("initialize_auditor"),
    argsData,
  ]);

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: auditorConfigPDA, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_IDS.auditor,
    data,
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "confirmed",
  });
  console.log(`  AuditorConfig PDA: ${auditorConfigPDA.toBase58()}`);
  console.log(`  TX: ${sig}`);
  return sig;
}

async function initializeServiceAndRegister(
  connection: Connection,
  payer: Keypair,
  aeonAuthority: PublicKey,
  keeperAuthority: PublicKey,
): Promise<string> {
  console.log("\n[7/7] Initializing Service Registry (noumen_service)...");

  const [serviceConfigPDA] = findPDA(
    [Buffer.from("service_config")],
    PROGRAM_IDS.service,
  );

  const existing = await connection.getAccountInfo(serviceConfigPDA);
  if (!existing) {
    // initialize_service_config(aeon_authority, keeper_authority)
    const argsData = Buffer.concat([
      serializePubkey(aeonAuthority),
      serializePubkey(keeperAuthority),
    ]);
    const data = Buffer.concat([
      ixDiscriminator("initialize_service_config"),
      argsData,
    ]);

    const ix = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data,
    });

    const tx = new Transaction().add(ix);
    const sig = await sendAndConfirmTransaction(connection, tx, [payer], {
      commitment: "confirmed",
    });
    console.log(`  ServiceConfig PDA: ${serviceConfigPDA.toBase58()}`);
    console.log(`  TX: ${sig}`);
  } else {
    console.log("  ServiceConfig already initialized.");
  }

  // Register 3 Entry-tier services
  const services = [
    { id: 1, name: "Risk Snapshot", cost: 50_000_000, price: 100_000_000 }, // 0.05 SOL cost, 0.1 SOL price
    { id: 2, name: "Pool Health Check", cost: 100_000_000, price: 200_000_000 }, // 0.1 SOL cost, 0.2 SOL price
    { id: 3, name: "Is This Sketchy", cost: 25_000_000, price: 50_000_000 }, // 0.025 SOL cost, 0.05 SOL price
  ];

  for (const svc of services) {
    const serviceIdBuf = Buffer.alloc(2);
    serviceIdBuf.writeUInt16LE(svc.id);
    const [serviceEntryPDA] = findPDA(
      [Buffer.from("service"), serviceIdBuf],
      PROGRAM_IDS.service,
    );

    const entryExists = await connection.getAccountInfo(serviceEntryPDA);
    if (entryExists) {
      console.log(`  Service #${svc.id} (${svc.name}) already registered.`);
      continue;
    }

    // register_service(service_id: u16, owning_agent_id: u16, service_tier: u8, price_lamports: u64, cost_lamports: u64)
    const registerData = Buffer.concat([
      ixDiscriminator("register_service"),
      serializeU16(svc.id),
      serializeU16(1), // owning_agent_id = 1 (APOLLO)
      serializeU8(0), // service_tier = 0 (Entry)
      serializeU64(BigInt(svc.price)),
      serializeU64(BigInt(svc.cost)),
    ]);

    const registerIx = new TransactionInstruction({
      keys: [
        { pubkey: serviceConfigPDA, isSigner: false, isWritable: true },
        { pubkey: serviceEntryPDA, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true }, // aeon_authority
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.service,
      data: registerData,
    });

    const registerTx = new Transaction().add(registerIx);
    const registerSig = await sendAndConfirmTransaction(
      connection,
      registerTx,
      [payer],
      { commitment: "confirmed" },
    );
    console.log(
      `  Registered service #${svc.id} (${svc.name}): ${registerSig.slice(0, 16)}...`,
    );
  }

  return "done";
}

// ──────────────────────────────────────────
// Verification
// ──────────────────────────────────────────

async function verifyDeployment(connection: Connection) {
  console.log("\n═══════════════════════════════════════");
  console.log("  Verifying Deployment");
  console.log("═══════════════════════════════════════\n");

  const pdas = [
    {
      name: "AeonConfig",
      pda: findPDA([Buffer.from("aeon_config")], PROGRAM_IDS.core)[0],
    },
    {
      name: "ProofConfig",
      pda: findPDA([Buffer.from("proof_config")], PROGRAM_IDS.proof)[0],
    },
    {
      name: "TreasuryConfig",
      pda: findPDA([Buffer.from("treasury_config")], PROGRAM_IDS.treasury)[0],
    },
    {
      name: "TreasuryVault",
      pda: findPDA([Buffer.from("treasury_vault")], PROGRAM_IDS.treasury)[0],
    },
    {
      name: "DonationVault",
      pda: findPDA([Buffer.from("donation_vault")], PROGRAM_IDS.treasury)[0],
    },
    {
      name: "CCSConfig",
      pda: findPDA([Buffer.from("ccs_config")], PROGRAM_IDS.treasury)[0],
    },
    {
      name: "ApolloConfig",
      pda: findPDA([Buffer.from("apollo_config")], PROGRAM_IDS.apollo)[0],
    },
    {
      name: "HermesConfig",
      pda: findPDA([Buffer.from("hermes_config")], PROGRAM_IDS.hermes)[0],
    },
    {
      name: "AuditorConfig",
      pda: findPDA([Buffer.from("auditor_config")], PROGRAM_IDS.auditor)[0],
    },
    {
      name: "ServiceConfig",
      pda: findPDA([Buffer.from("service_config")], PROGRAM_IDS.service)[0],
    },
  ];

  for (const { name, pda } of pdas) {
    const info = await connection.getAccountInfo(pda);
    const status = info ? `OK (${info.data.length} bytes)` : "MISSING";
    console.log(`  ${name.padEnd(20)} ${pda.toBase58().slice(0, 12)}... ${status}`);
  }
}

// ──────────────────────────────────────────
// Main
// ──────────────────────────────────────────

async function main() {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║  AXIONBLADE v3.2.3 — Devnet Initialization ║");
  console.log("║  Proof Before Action                    ║");
  console.log("╚═══════════════════════════════════════╝");

  const connection = new Connection(RPC_URL, "confirmed");

  // Load the deployer keypair (acts as super_authority)
  const walletPath = process.env.WALLET_PATH || "~/.config/solana/id.json";
  const payer = loadKeypair(walletPath);
  console.log(`\nDeployer: ${payer.publicKey.toBase58()}`);

  // For devnet, we use the same keypair for all authority roles
  // In production, these would be separate keypairs or multi-sigs
  const superAuthority = payer;
  const aeonAuthority = payer.publicKey;
  const keeperAuthority = payer.publicKey;
  const creatorWallet = CREATOR_WALLET;
  const apolloAuthority = payer.publicKey;
  const hermesAuthority = payer.publicKey;

  // Ensure sufficient SOL
  await airdropIfNeeded(connection, payer.publicKey);

  // Initialize all programs
  await initializeAeon(connection, superAuthority, aeonAuthority, keeperAuthority);
  await initializeProof(connection, superAuthority, keeperAuthority);
  await initializeTreasury(connection, superAuthority, aeonAuthority, keeperAuthority, creatorWallet);
  await initializeApollo(connection, superAuthority, apolloAuthority);
  await initializeHermes(connection, superAuthority, hermesAuthority);
  await initializeAuditor(connection, superAuthority, aeonAuthority);
  await initializeServiceAndRegister(connection, superAuthority, aeonAuthority, keeperAuthority);

  // Verify all accounts exist
  await verifyDeployment(connection);

  console.log("\n  Devnet initialization complete.");
  console.log("  All AXIONBLADE programs are ready.");
}

main().catch((err) => {
  console.error("Initialization failed:", err);
  process.exit(1);
});
