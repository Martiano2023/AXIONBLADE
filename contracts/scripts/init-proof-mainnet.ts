/**
 * AXIONBLADE — initialize_proof (mainnet)
 * Inicializa o noumen_proof com keeper_authority.
 * Cria o proof_config PDA que governa todo o sistema de log_decision.
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const RPC_URL      = "https://api.mainnet-beta.solana.com";
const PROJECT_ROOT = path.join(process.env.HOME!, "Desktop/AXIONBLADE/contracts");
const PROOF_PROGRAM = new PublicKey("3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV");

function loadKeypair(filePath: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  AXIONBLADE — initialize_proof (mainnet)     ");
  console.log("═══════════════════════════════════════════════\n");

  const connection   = new Connection(RPC_URL, "confirmed");
  // deploy wallet is the authority (payer) — clean wallet, no data
  const authority    = loadKeypair(path.join(process.env.HOME!, ".config/solana/id.json"));
  const keeperAuth   = loadKeypair(path.join(PROJECT_ROOT, "keys/keeper_authority.json"));

  console.log(`authority:        ${authority.publicKey.toBase58()}`);
  console.log(`keeper_authority: ${keeperAuth.publicKey.toBase58()}`);
  const balance = await connection.getBalance(authority.publicKey);
  console.log(`balance:          ${(balance / 1e9).toFixed(6)} SOL\n`);

  const [proofConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("proof_config")], PROOF_PROGRAM
  );
  console.log(`proof_config PDA: ${proofConfigPDA.toBase58()}`);

  // Check if already initialized
  const existing = await connection.getAccountInfo(proofConfigPDA);
  if (existing && existing.data.length > 8 && existing.owner.equals(PROOF_PROGRAM)) {
    console.log("\n✓ proof_config já existe on-chain.");
    const d = existing.data;
    const keeper = new PublicKey(d.slice(8, 40));
    const isInit = d[40];
    console.log(`  keeper_authority: ${keeper.toBase58()}`);
    console.log(`  is_initialized:   ${isInit}`);
    return;
  }

  const idl = JSON.parse(fs.readFileSync(
    path.join(PROJECT_ROOT, "target/idl/noumen_proof.json"), "utf-8"
  ));

  const wallet   = new anchor.Wallet(authority);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program  = new anchor.Program(idl, provider);

  console.log("\nEnviando initialize_proof...");

  const tx = await (program.methods as any)
    .initializeProof({
      keeperAuthority: keeperAuth.publicKey,
    })
    .accounts({
      proofConfig:   proofConfigPDA,
      authority:     authority.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([authority])
    .rpc();

  // Read result
  const info = await connection.getAccountInfo(proofConfigPDA);
  const d    = info!.data;
  const keeper = new PublicKey(d.slice(8, 40));
  const isInit = d[40];

  console.log(`\n✓ noumen_proof inicializado com sucesso!`);
  console.log(`  Tx:               ${tx}`);
  console.log(`  proof_config PDA: ${proofConfigPDA.toBase58()}`);
  console.log(`  keeper_authority: ${keeper.toBase58()}`);
  console.log(`  is_initialized:   ${isInit}`);
  console.log(`\n  log_decision agora disponível on-chain (A0-5 ✓)`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n✗ ERRO:", err.message);
    if (err.logs) console.error("Logs:", err.logs.slice(-5).join("\n"));
    process.exit(1);
  });
