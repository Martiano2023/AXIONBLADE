/**
 * AXIONBLADE Protocol — Mainnet Account Initialization Script
 *
 * Connects to mainnet-beta, loads the deployer wallet, and calls each
 * program's initialization instruction to set up on-chain config accounts.
 *
 * Usage:
 *   npx ts-node scripts/init-mainnet.ts
 *
 * Prerequisites:
 *   - Programs already deployed to mainnet via deploy-mainnet.sh
 *   - Wallet keypair at ~/.config/solana/id.json
 *   - IDLs built at contracts/target/idl/
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const CLUSTER_URL = clusterApiUrl("mainnet-beta");
const WALLET_PATH = path.join(os.homedir(), ".config", "solana", "id.json");
const IDL_DIR = path.join(__dirname, "..", "contracts", "target", "idl");

const PROGRAM_IDS: Record<string, string> = {
  noumen_core: "9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE",
  noumen_proof: "3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV",
  noumen_treasury: "EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu",
  noumen_apollo: "92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee",
  noumen_hermes: "Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj",
  noumen_auditor: "CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe",
  noumen_service: "9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function loadWallet(): Keypair {
  if (!fs.existsSync(WALLET_PATH)) {
    throw new Error(`Wallet keypair not found at ${WALLET_PATH}`);
  }
  const raw = JSON.parse(fs.readFileSync(WALLET_PATH, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function loadIdl(programName: string): any {
  const idlPath = path.join(IDL_DIR, `${programName}.json`);
  if (!fs.existsSync(idlPath)) {
    throw new Error(`IDL not found at ${idlPath}. Run 'anchor build' first.`);
  }
  return JSON.parse(fs.readFileSync(idlPath, "utf-8"));
}

function createProgram(
  programName: string,
  provider: AnchorProvider
): Program<any> {
  const idl = loadIdl(programName);
  const programId = new PublicKey(PROGRAM_IDS[programName]);
  return new Program(idl, provider);
}

interface InitResult {
  program: string;
  instruction: string;
  accounts: Record<string, string>;
  signature: string;
  status: "success" | "error" | "skipped";
  error?: string;
}

const results: InitResult[] = [];

// ---------------------------------------------------------------------------
// Initialization functions for each program
// ---------------------------------------------------------------------------

async function initializeCore(
  provider: AnchorProvider,
  wallet: Keypair
): Promise<void> {
  console.log("\n--- Initializing noumen_core (AEON) ---");
  const program = createProgram("noumen_core", provider);

  const [aeonConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("aeon_config")],
    new PublicKey(PROGRAM_IDS.noumen_core)
  );

  try {
    // Check if already initialized
    const existing = await provider.connection.getAccountInfo(aeonConfig);
    if (existing) {
      console.log("  aeon_config already exists. Skipping.");
      results.push({
        program: "noumen_core",
        instruction: "initialize_aeon",
        accounts: { aeon_config: aeonConfig.toBase58() },
        signature: "N/A",
        status: "skipped",
      });
      return;
    }

    const tx = await program.methods
      .initializeAeon({
        keeperAuthority: wallet.publicKey,
        aeonAuthority: wallet.publicKey,
        treasuryProgram: new PublicKey(PROGRAM_IDS.noumen_treasury),
        proofProgram: new PublicKey(PROGRAM_IDS.noumen_proof),
        heartbeatInterval: new BN(300), // 5 minutes
        operationalAgentCap: 20, // start conservative, can increase later
      })
      .accounts({
        aeonConfig,
        superAuthority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();

    console.log(`  TX: ${tx}`);
    console.log(`  aeon_config PDA: ${aeonConfig.toBase58()}`);

    results.push({
      program: "noumen_core",
      instruction: "initialize_aeon",
      accounts: { aeon_config: aeonConfig.toBase58() },
      signature: tx,
      status: "success",
    });
  } catch (err: any) {
    console.error(`  ERROR: ${err.message}`);
    results.push({
      program: "noumen_core",
      instruction: "initialize_aeon",
      accounts: { aeon_config: aeonConfig.toBase58() },
      signature: "N/A",
      status: "error",
      error: err.message,
    });
  }
}

async function initializeTreasury(
  provider: AnchorProvider,
  wallet: Keypair
): Promise<void> {
  console.log("\n--- Initializing noumen_treasury ---");
  const program = createProgram("noumen_treasury", provider);
  const treasuryProgramId = new PublicKey(PROGRAM_IDS.noumen_treasury);

  const [treasuryConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury_config")],
    treasuryProgramId
  );
  const [treasuryVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury_vault")],
    treasuryProgramId
  );
  const [donationVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("donation_vault")],
    treasuryProgramId
  );
  const [ccsConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("ccs_config")],
    treasuryProgramId
  );

  try {
    // Check if already initialized
    const existing = await provider.connection.getAccountInfo(treasuryConfig);
    if (existing) {
      console.log("  treasury_config already exists. Skipping.");
      results.push({
        program: "noumen_treasury",
        instruction: "initialize_treasury",
        accounts: {
          treasury_config: treasuryConfig.toBase58(),
          treasury_vault: treasuryVault.toBase58(),
          donation_vault: donationVault.toBase58(),
          ccs_config: ccsConfig.toBase58(),
        },
        signature: "N/A",
        status: "skipped",
      });
      return;
    }

    const tx = await program.methods
      .initializeTreasury(
        wallet.publicKey, // aeon_authority (self initially, update later)
        wallet.publicKey, // keeper_authority
        wallet.publicKey  // creator_wallet (creator receives 15% CCS)
      )
      .accounts({
        superAuthority: wallet.publicKey,
        treasuryConfig,
        treasuryVault,
        donationVault,
        ccsConfig,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();

    console.log(`  TX: ${tx}`);
    console.log(`  treasury_config PDA: ${treasuryConfig.toBase58()}`);
    console.log(`  treasury_vault PDA:  ${treasuryVault.toBase58()}`);
    console.log(`  donation_vault PDA:  ${donationVault.toBase58()}`);
    console.log(`  ccs_config PDA:      ${ccsConfig.toBase58()}`);

    results.push({
      program: "noumen_treasury",
      instruction: "initialize_treasury",
      accounts: {
        treasury_config: treasuryConfig.toBase58(),
        treasury_vault: treasuryVault.toBase58(),
        donation_vault: donationVault.toBase58(),
        ccs_config: ccsConfig.toBase58(),
      },
      signature: tx,
      status: "success",
    });
  } catch (err: any) {
    console.error(`  ERROR: ${err.message}`);
    results.push({
      program: "noumen_treasury",
      instruction: "initialize_treasury",
      accounts: {
        treasury_config: treasuryConfig.toBase58(),
        treasury_vault: treasuryVault.toBase58(),
        donation_vault: donationVault.toBase58(),
        ccs_config: ccsConfig.toBase58(),
      },
      signature: "N/A",
      status: "error",
      error: err.message,
    });
  }
}

async function initializeProof(
  provider: AnchorProvider,
  wallet: Keypair
): Promise<void> {
  console.log("\n--- Initializing noumen_proof ---");
  const program = createProgram("noumen_proof", provider);
  const proofProgramId = new PublicKey(PROGRAM_IDS.noumen_proof);

  const [proofConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("proof_config")],
    proofProgramId
  );

  try {
    const existing = await provider.connection.getAccountInfo(proofConfig);
    if (existing) {
      console.log("  proof_config already exists. Skipping.");
      results.push({
        program: "noumen_proof",
        instruction: "initialize_proof",
        accounts: { proof_config: proofConfig.toBase58() },
        signature: "N/A",
        status: "skipped",
      });
      return;
    }

    const tx = await program.methods
      .initializeProof({
        keeperAuthority: wallet.publicKey,
      })
      .accounts({
        proofConfig,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();

    console.log(`  TX: ${tx}`);
    console.log(`  proof_config PDA: ${proofConfig.toBase58()}`);

    results.push({
      program: "noumen_proof",
      instruction: "initialize_proof",
      accounts: { proof_config: proofConfig.toBase58() },
      signature: tx,
      status: "success",
    });
  } catch (err: any) {
    console.error(`  ERROR: ${err.message}`);
    results.push({
      program: "noumen_proof",
      instruction: "initialize_proof",
      accounts: { proof_config: proofConfig.toBase58() },
      signature: "N/A",
      status: "error",
      error: err.message,
    });
  }
}

async function initializeApollo(
  provider: AnchorProvider,
  wallet: Keypair
): Promise<void> {
  console.log("\n--- Initializing noumen_apollo ---");
  const program = createProgram("noumen_apollo", provider);
  const apolloProgramId = new PublicKey(PROGRAM_IDS.noumen_apollo);

  const [apolloConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("apollo_config")],
    apolloProgramId
  );

  try {
    const existing = await provider.connection.getAccountInfo(apolloConfig);
    if (existing) {
      console.log("  apollo_config already exists. Skipping.");
      results.push({
        program: "noumen_apollo",
        instruction: "initialize_apollo",
        accounts: { apollo_config: apolloConfig.toBase58() },
        signature: "N/A",
        status: "skipped",
      });
      return;
    }

    const tx = await program.methods
      .initializeApollo({
        authority: wallet.publicKey,
        maxMliPools: 50,
        mliTvlMinimumLamports: new BN(1_000_000_000), // 1 SOL minimum TVL
      })
      .accounts({
        apolloConfig,
        aeonAuthority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();

    console.log(`  TX: ${tx}`);
    console.log(`  apollo_config PDA: ${apolloConfig.toBase58()}`);

    results.push({
      program: "noumen_apollo",
      instruction: "initialize_apollo",
      accounts: { apollo_config: apolloConfig.toBase58() },
      signature: tx,
      status: "success",
    });
  } catch (err: any) {
    console.error(`  ERROR: ${err.message}`);
    results.push({
      program: "noumen_apollo",
      instruction: "initialize_apollo",
      accounts: { apollo_config: apolloConfig.toBase58() },
      signature: "N/A",
      status: "error",
      error: err.message,
    });
  }
}

async function initializeHermes(
  provider: AnchorProvider,
  wallet: Keypair
): Promise<void> {
  console.log("\n--- Initializing noumen_hermes ---");
  const program = createProgram("noumen_hermes", provider);
  const hermesProgramId = new PublicKey(PROGRAM_IDS.noumen_hermes);

  const [hermesConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("hermes_config")],
    hermesProgramId
  );

  try {
    const existing = await provider.connection.getAccountInfo(hermesConfig);
    if (existing) {
      console.log("  hermes_config already exists. Skipping.");
      results.push({
        program: "noumen_hermes",
        instruction: "initialize_hermes",
        accounts: { hermes_config: hermesConfig.toBase58() },
        signature: "N/A",
        status: "skipped",
      });
      return;
    }

    const tx = await program.methods
      .initializeHermes({
        hermesAuthority: wallet.publicKey,
      })
      .accounts({
        hermesConfig,
        aeonAuthority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();

    console.log(`  TX: ${tx}`);
    console.log(`  hermes_config PDA: ${hermesConfig.toBase58()}`);

    results.push({
      program: "noumen_hermes",
      instruction: "initialize_hermes",
      accounts: { hermes_config: hermesConfig.toBase58() },
      signature: tx,
      status: "success",
    });
  } catch (err: any) {
    console.error(`  ERROR: ${err.message}`);
    results.push({
      program: "noumen_hermes",
      instruction: "initialize_hermes",
      accounts: { hermes_config: hermesConfig.toBase58() },
      signature: "N/A",
      status: "error",
      error: err.message,
    });
  }
}

async function initializeAuditor(
  provider: AnchorProvider,
  wallet: Keypair
): Promise<void> {
  console.log("\n--- Initializing noumen_auditor ---");
  const program = createProgram("noumen_auditor", provider);
  const auditorProgramId = new PublicKey(PROGRAM_IDS.noumen_auditor);

  const [auditorConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("auditor_config")],
    auditorProgramId
  );

  try {
    const existing = await provider.connection.getAccountInfo(auditorConfig);
    if (existing) {
      console.log("  auditor_config already exists. Skipping.");
      results.push({
        program: "noumen_auditor",
        instruction: "initialize_auditor",
        accounts: { auditor_config: auditorConfig.toBase58() },
        signature: "N/A",
        status: "skipped",
      });
      return;
    }

    const tx = await program.methods
      .initializeAuditor({
        aeonAuthority: wallet.publicKey,
      })
      .accounts({
        auditorConfig,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();

    console.log(`  TX: ${tx}`);
    console.log(`  auditor_config PDA: ${auditorConfig.toBase58()}`);

    results.push({
      program: "noumen_auditor",
      instruction: "initialize_auditor",
      accounts: { auditor_config: auditorConfig.toBase58() },
      signature: tx,
      status: "success",
    });
  } catch (err: any) {
    console.error(`  ERROR: ${err.message}`);
    results.push({
      program: "noumen_auditor",
      instruction: "initialize_auditor",
      accounts: { auditor_config: auditorConfig.toBase58() },
      signature: "N/A",
      status: "error",
      error: err.message,
    });
  }
}

async function initializeService(
  provider: AnchorProvider,
  wallet: Keypair
): Promise<void> {
  console.log("\n--- Initializing noumen_service ---");
  const program = createProgram("noumen_service", provider);
  const serviceProgramId = new PublicKey(PROGRAM_IDS.noumen_service);

  const [serviceConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("service_config")],
    serviceProgramId
  );

  try {
    const existing = await provider.connection.getAccountInfo(serviceConfig);
    if (existing) {
      console.log("  service_config already exists. Skipping.");
      results.push({
        program: "noumen_service",
        instruction: "initialize_service_config",
        accounts: { service_config: serviceConfig.toBase58() },
        signature: "N/A",
        status: "skipped",
      });
      return;
    }

    const tx = await program.methods
      .initializeServiceConfig(
        wallet.publicKey, // aeon_authority
        wallet.publicKey  // keeper_authority
      )
      .accounts({
        serviceConfig,
        superAuthority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();

    console.log(`  TX: ${tx}`);
    console.log(`  service_config PDA: ${serviceConfig.toBase58()}`);

    results.push({
      program: "noumen_service",
      instruction: "initialize_service_config",
      accounts: { service_config: serviceConfig.toBase58() },
      signature: tx,
      status: "success",
    });
  } catch (err: any) {
    console.error(`  ERROR: ${err.message}`);
    results.push({
      program: "noumen_service",
      instruction: "initialize_service_config",
      accounts: { service_config: serviceConfig.toBase58() },
      signature: "N/A",
      status: "error",
      error: err.message,
    });
  }
}

// ---------------------------------------------------------------------------
// Verification — fetch all config accounts to confirm they exist
// ---------------------------------------------------------------------------

async function verifyAllAccounts(provider: AnchorProvider): Promise<void> {
  console.log("\n=== Verifying all config accounts ===\n");

  const checks: Array<{ name: string; pda: PublicKey }> = [
    {
      name: "aeon_config",
      pda: PublicKey.findProgramAddressSync(
        [Buffer.from("aeon_config")],
        new PublicKey(PROGRAM_IDS.noumen_core)
      )[0],
    },
    {
      name: "treasury_config",
      pda: PublicKey.findProgramAddressSync(
        [Buffer.from("treasury_config")],
        new PublicKey(PROGRAM_IDS.noumen_treasury)
      )[0],
    },
    {
      name: "treasury_vault",
      pda: PublicKey.findProgramAddressSync(
        [Buffer.from("treasury_vault")],
        new PublicKey(PROGRAM_IDS.noumen_treasury)
      )[0],
    },
    {
      name: "donation_vault",
      pda: PublicKey.findProgramAddressSync(
        [Buffer.from("donation_vault")],
        new PublicKey(PROGRAM_IDS.noumen_treasury)
      )[0],
    },
    {
      name: "ccs_config",
      pda: PublicKey.findProgramAddressSync(
        [Buffer.from("ccs_config")],
        new PublicKey(PROGRAM_IDS.noumen_treasury)
      )[0],
    },
    {
      name: "proof_config",
      pda: PublicKey.findProgramAddressSync(
        [Buffer.from("proof_config")],
        new PublicKey(PROGRAM_IDS.noumen_proof)
      )[0],
    },
    {
      name: "apollo_config",
      pda: PublicKey.findProgramAddressSync(
        [Buffer.from("apollo_config")],
        new PublicKey(PROGRAM_IDS.noumen_apollo)
      )[0],
    },
    {
      name: "hermes_config",
      pda: PublicKey.findProgramAddressSync(
        [Buffer.from("hermes_config")],
        new PublicKey(PROGRAM_IDS.noumen_hermes)
      )[0],
    },
    {
      name: "auditor_config",
      pda: PublicKey.findProgramAddressSync(
        [Buffer.from("auditor_config")],
        new PublicKey(PROGRAM_IDS.noumen_auditor)
      )[0],
    },
    {
      name: "service_config",
      pda: PublicKey.findProgramAddressSync(
        [Buffer.from("service_config")],
        new PublicKey(PROGRAM_IDS.noumen_service)
      )[0],
    },
  ];

  for (const check of checks) {
    const info = await provider.connection.getAccountInfo(check.pda);
    const status = info ? "EXISTS" : "MISSING";
    const size = info ? `${info.data.length} bytes` : "N/A";
    console.log(
      `  ${check.name.padEnd(20)} ${check.pda.toBase58()}  ${status}  ${size}`
    );
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("===========================================================");
  console.log("  NOUMEN MAINNET INITIALIZATION");
  console.log("===========================================================\n");

  // Load wallet
  const wallet = loadWallet();
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);

  // Connect to mainnet
  const connection = new Connection(CLUSTER_URL, "confirmed");
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`Balance: ${(balance / 1e9).toFixed(4)} SOL`);
  console.log(`Cluster: mainnet-beta\n`);

  // Create provider
  const anchorWallet = new Wallet(wallet);
  const provider = new AnchorProvider(connection, anchorWallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  // Initialize all programs (order matters: core first, then treasury)
  await initializeCore(provider, wallet);
  await initializeTreasury(provider, wallet);
  await initializeProof(provider, wallet);
  await initializeApollo(provider, wallet);
  await initializeHermes(provider, wallet);
  await initializeAuditor(provider, wallet);
  await initializeService(provider, wallet);

  // Verify all accounts
  await verifyAllAccounts(provider);

  // Print summary
  console.log("\n===========================================================");
  console.log("  INITIALIZATION SUMMARY");
  console.log("===========================================================\n");

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const r of results) {
    const icon =
      r.status === "success" ? "[OK]" : r.status === "skipped" ? "[SKIP]" : "[ERR]";

    console.log(`  ${icon} ${r.program} -> ${r.instruction}`);
    if (r.status === "success") {
      console.log(`       TX: ${r.signature}`);
      successCount++;
    } else if (r.status === "skipped") {
      skippedCount++;
    } else {
      console.log(`       Error: ${r.error}`);
      errorCount++;
    }

    for (const [name, addr] of Object.entries(r.accounts)) {
      console.log(`       ${name}: ${addr}`);
    }
    console.log("");
  }

  console.log("-----------------------------------------------------------");
  console.log(`  Successful: ${successCount}`);
  console.log(`  Skipped:    ${skippedCount}`);
  console.log(`  Errors:     ${errorCount}`);
  console.log("===========================================================\n");

  if (errorCount > 0) {
    console.log("Some initializations failed. Review the errors above and retry.");
  } else {
    console.log("All initializations completed. Run ./scripts/verify-mainnet.sh next.");
  }
}

main().catch((err) => {
  console.error("\nFATAL ERROR:", err.message);
  console.error(err.stack);
});
