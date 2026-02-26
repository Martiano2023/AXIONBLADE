/**
 * AXIONBLADE — initialize_treasury (mainnet)
 * Inicializa o noumen_treasury com super_authority, aeon_authority e keeper_authority.
 * Cria: treasury_config, treasury_vault, donation_vault, ccs_config PDAs.
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const RPC_URL       = "https://api.mainnet-beta.solana.com";
const PROJECT_ROOT  = path.join(process.env.HOME!, "Desktop/AXIONBLADE/contracts");
const TREASURY_PROGRAM = new PublicKey("EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu");

function loadKeypair(filePath: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  AXIONBLADE — initialize_treasury (mainnet)  ");
  console.log("═══════════════════════════════════════════════\n");

  const connection    = new Connection(RPC_URL, "confirmed");
  const superAuth     = loadKeypair(path.join(process.env.HOME!, ".config/solana/id.json"));
  const aeonAuth      = loadKeypair(path.join(PROJECT_ROOT, "keys/aeon_authority.json"));
  const keeperAuth    = loadKeypair(path.join(PROJECT_ROOT, "keys/keeper_authority.json"));

  // creator_wallet = super_authority (deploy wallet) — protocol's designated recipient
  const creatorWallet = superAuth.publicKey;

  console.log(`super_authority:  ${superAuth.publicKey.toBase58()}`);
  console.log(`aeon_authority:   ${aeonAuth.publicKey.toBase58()}`);
  console.log(`keeper_authority: ${keeperAuth.publicKey.toBase58()}`);
  console.log(`creator_wallet:   ${creatorWallet.toBase58()}`);
  const balance = await connection.getBalance(superAuth.publicKey);
  console.log(`balance:          ${(balance / 1e9).toFixed(6)} SOL\n`);

  const [treasuryConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury_config")], TREASURY_PROGRAM
  );
  const [treasuryVaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury_vault")], TREASURY_PROGRAM
  );
  const [donationVaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("donation_vault")], TREASURY_PROGRAM
  );
  const [ccsConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("ccs_config")], TREASURY_PROGRAM
  );

  console.log(`treasury_config PDA: ${treasuryConfigPDA.toBase58()}`);
  console.log(`treasury_vault  PDA: ${treasuryVaultPDA.toBase58()}`);
  console.log(`donation_vault  PDA: ${donationVaultPDA.toBase58()}`);
  console.log(`ccs_config      PDA: ${ccsConfigPDA.toBase58()}`);

  // Check if already initialized
  const existing = await connection.getAccountInfo(treasuryConfigPDA);
  if (existing && existing.data.length > 8 && !existing.owner.equals(SystemProgram.programId)) {
    console.log("\n✓ treasury_config já existe on-chain.");
    return;
  }

  const idl = JSON.parse(fs.readFileSync(
    path.join(PROJECT_ROOT, "target/idl/noumen_treasury.json"), "utf-8"
  ));

  const wallet   = new anchor.Wallet(superAuth);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program  = new anchor.Program(idl, provider);

  console.log("\nEnviando initialize_treasury...");

  const tx = await (program.methods as any)
    .initializeTreasury({
      aeonAuthority:   aeonAuth.publicKey,
      keeperAuthority: keeperAuth.publicKey,
      creatorWallet:   creatorWallet,
    })
    .accounts({
      superAuthority: superAuth.publicKey,
      treasuryConfig: treasuryConfigPDA,
      treasuryVault:  treasuryVaultPDA,
      donationVault:  donationVaultPDA,
      ccsConfig:      ccsConfigPDA,
      systemProgram:  SystemProgram.programId,
    })
    .signers([superAuth])
    .rpc();

  console.log(`\n✓ noumen_treasury inicializado com sucesso!`);
  console.log(`  Tx:                  ${tx}`);
  console.log(`  treasury_config PDA: ${treasuryConfigPDA.toBase58()}`);
  console.log(`  treasury_vault  PDA: ${treasuryVaultPDA.toBase58()}`);
  console.log(`  donation_vault  PDA: ${donationVaultPDA.toBase58()}`);
  console.log(`  ccs_config      PDA: ${ccsConfigPDA.toBase58()}`);
  console.log(`\n  Treasury operacional — CCS split, vault e doações disponíveis on-chain`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n✗ ERRO:", err.message);
    if (err.logs) console.error("Logs:", err.logs.slice(-5).join("\n"));
    process.exit(1);
  });
