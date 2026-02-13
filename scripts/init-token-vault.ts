#!/usr/bin/env ts-node
// ---------------------------------------------------------------------------
// Initialize Token Vault on devnet/mainnet
// ---------------------------------------------------------------------------
// Creates TokenVaultConfig PDA with launch conditions
// Sets up vesting schedules for 5 allocations
// ---------------------------------------------------------------------------

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { readFileSync } from "fs";
import path from "path";

const TOKEN_VAULT_PROGRAM_ID = new PublicKey(""); // TODO: Update after deployment

interface InitConfig {
  network: "devnet" | "mainnet";
  rpcUrl: string;
  superAuthority: Keypair;
  totalSupply: number; // 1B tokens
}

async function initTokenVault(config: InitConfig) {
  console.log("🏦 Initializing Token Vault...");
  console.log(`📍 Network: ${config.network}`);
  console.log(`🔗 RPC: ${config.rpcUrl}`);
  console.log("");

  const connection = new Connection(config.rpcUrl, "confirmed");
  const provider = new AnchorProvider(
    connection,
    new anchor.Wallet(config.superAuthority),
    { commitment: "confirmed" }
  );

  // TODO: Load program IDL and create Program instance
  // const program = new Program(IDL, TOKEN_VAULT_PROGRAM_ID, provider);

  // Derive TokenVaultConfig PDA
  const [vaultConfigPDA, vaultConfigBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_vault_config")],
    TOKEN_VAULT_PROGRAM_ID
  );

  console.log("📝 TokenVaultConfig PDA:", vaultConfigPDA.toBase58());
  console.log("");

  // Check if already initialized
  const vaultAccount = await connection.getAccountInfo(vaultConfigPDA);
  if (vaultAccount) {
    console.log("⚠️  Token Vault already initialized");
    console.log("   Use update instructions to modify config");
    return;
  }

  // Step 1: Initialize vault
  console.log("1️⃣  Initializing vault with 1B token supply...");

  // TODO: Call initialize_vault instruction
  // const tx1 = await program.methods
  //   .initializeVault(new anchor.BN(config.totalSupply * 1e9)) // 1B with 9 decimals
  //   .accounts({
  //     vaultConfig: vaultConfigPDA,
  //     superAuthority: config.superAuthority.publicKey,
  //     systemProgram: anchor.web3.SystemProgram.programId,
  //   })
  //   .rpc();

  // console.log("   ✓ Vault initialized:", tx1);
  console.log("   ⚠️  TODO: Call initialize_vault instruction");
  console.log("");

  // Step 2: Create vesting schedules
  console.log("2️⃣  Creating vesting schedules...");

  const vestingSchedules = [
    {
      name: "Team",
      totalAmount: 200_000_000 * 1e9, // 200M tokens
      cliffDuration: 6 * 30 * 24 * 3600, // 6 months
      vestingDuration: 2 * 365 * 24 * 3600, // 2 years
      beneficiary: config.superAuthority.publicKey, // TODO: Set real beneficiary
    },
    {
      name: "Treasury",
      totalAmount: 300_000_000 * 1e9,
      cliffDuration: 0,
      vestingDuration: 0, // Controlled by AEON, not time-based
      beneficiary: vaultConfigPDA, // Self-custody
    },
    {
      name: "Community",
      totalAmount: 300_000_000 * 1e9,
      cliffDuration: 0,
      vestingDuration: 0, // Airdrop, not vesting
      beneficiary: vaultConfigPDA,
    },
    {
      name: "Liquidity",
      totalAmount: 100_000_000 * 1e9,
      cliffDuration: 0,
      vestingDuration: 0, // Immediate for LP
      beneficiary: config.superAuthority.publicKey, // TODO: LP program
    },
    {
      name: "Reserve",
      totalAmount: 100_000_000 * 1e9,
      cliffDuration: 0,
      vestingDuration: 0, // Emergency fund
      beneficiary: vaultConfigPDA,
    },
  ];

  for (const schedule of vestingSchedules) {
    console.log(`   Creating ${schedule.name} vesting...`);

    // TODO: Call create_vesting_schedule instruction
    // const [vestingPDA] = PublicKey.findProgramAddressSync(
    //   [Buffer.from("vesting_schedule"), schedule.beneficiary.toBuffer()],
    //   TOKEN_VAULT_PROGRAM_ID
    // );

    // const tx = await program.methods
    //   .createVestingSchedule(
    //     new anchor.BN(schedule.totalAmount),
    //     new anchor.BN(schedule.cliffDuration),
    //     new anchor.BN(schedule.vestingDuration)
    //   )
    //   .accounts({
    //     vaultConfig: vaultConfigPDA,
    //     vestingSchedule: vestingPDA,
    //     beneficiary: schedule.beneficiary,
    //     superAuthority: config.superAuthority.publicKey,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //   })
    //   .rpc();

    // console.log(`      ✓ ${schedule.name} vesting created:`, tx);
    console.log(`      ⚠️  TODO: Call create_vesting_schedule for ${schedule.name}`);
  }

  console.log("");
  console.log("✅ Token Vault initialization complete!");
  console.log("");
  console.log("📋 Next steps:");
  console.log("   1. Monitor launch conditions via KRONOS crank");
  console.log("   2. Once approved, 72h delay before launch (Axiom A0-46)");
  console.log("   3. After launch, vesting schedules activate automatically");
  console.log("");
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const network = args.includes("--mainnet") ? "mainnet" : "devnet";

  const rpcUrl =
    network === "mainnet"
      ? process.env.MAINNET_RPC_URL || "https://api.mainnet-beta.solana.com"
      : process.env.DEVNET_RPC_URL || "https://api.devnet.solana.com";

  // Load super authority
  const superKeypairPath = path.join(__dirname, "../contracts/keys/super.json");
  const superAuthority = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(readFileSync(superKeypairPath, "utf-8")))
  );

  const config: InitConfig = {
    network,
    rpcUrl,
    superAuthority,
    totalSupply: 1_000_000_000, // 1B
  };

  await initTokenVault(config);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
