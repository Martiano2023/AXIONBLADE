/**
 * AXIONBLADE — Initialize AEON (noumen_core) on Mainnet
 * Chama initialize_aeon uma única vez para criar o aeon_config PDA.
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const PROJECT_ROOT = path.join(process.env.HOME!, "Desktop/AXIONBLADE/contracts");

const PROGRAM_IDS = {
  core:     new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"),
  proof:    new PublicKey("3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV"),
  treasury: new PublicKey("EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu"),
};

function loadKeypair(filePath: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  AXIONBLADE — initialize_aeon (mainnet)");
  console.log("═══════════════════════════════════════════\n");

  const connection = new Connection(RPC_URL, "confirmed");

  const superAuthority  = loadKeypair(path.join(PROJECT_ROOT, "keys/super_authority.json"));
  const aeonAuthority   = loadKeypair(path.join(PROJECT_ROOT, "keys/aeon_authority.json"));
  const keeperAuthority = loadKeypair(path.join(PROJECT_ROOT, "keys/keeper_authority.json"));

  console.log("Keys:");
  console.log(`  super_authority:  ${superAuthority.publicKey.toBase58()}`);
  console.log(`  aeon_authority:   ${aeonAuthority.publicKey.toBase58()}`);
  console.log(`  keeper_authority: ${keeperAuthority.publicKey.toBase58()}`);
  console.log(`  treasury_program: ${PROGRAM_IDS.treasury.toBase58()}`);
  console.log(`  proof_program:    ${PROGRAM_IDS.proof.toBase58()}\n`);

  const balance = await connection.getBalance(superAuthority.publicKey);
  console.log(`super_authority balance: ${(balance / 1e9).toFixed(6)} SOL\n`);

  if (balance < 5_000_000) {
    throw new Error("super_authority needs at least 0.005 SOL");
  }

  // Derive PDA
  const [aeonConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("aeon_config")],
    PROGRAM_IDS.core
  );
  console.log(`aeon_config PDA: ${aeonConfigPDA.toBase58()}\n`);

  // Check if already initialized
  const existing = await connection.getAccountInfo(aeonConfigPDA);
  if (existing) {
    console.log("✓ AEON já está inicializado. Nada a fazer.");
    return;
  }

  // Load IDL and call initialize_aeon
  const idl = JSON.parse(fs.readFileSync(
    path.join(PROJECT_ROOT, "target/idl/noumen_core.json"), "utf-8"
  ));

  const wallet = new anchor.Wallet(superAuthority);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);

  console.log("Enviando initialize_aeon...");

  const tx = await (program.methods as any)
    .initializeAeon({
      keeperAuthority:      keeperAuthority.publicKey,
      aeonAuthority:        aeonAuthority.publicKey,
      treasuryProgram:      PROGRAM_IDS.treasury,
      proofProgram:         PROGRAM_IDS.proof,
      heartbeatInterval:    new anchor.BN(300), // 5 minutos
      operationalAgentCap:  100,
    })
    .accounts({
      aeonConfig:    aeonConfigPDA,
      superAuthority: superAuthority.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([superAuthority])
    .rpc();

  console.log(`\n✓ AEON inicializado com sucesso!`);
  console.log(`  Tx: ${tx}`);
  console.log(`  PDA: ${aeonConfigPDA.toBase58()}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n✗ ERRO:", err.message);
    if (err.logs) console.error("Logs:", err.logs.slice(-5).join("\n"));
    process.exit(1);
  });
