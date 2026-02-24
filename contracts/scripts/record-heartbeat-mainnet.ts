/**
 * AXIONBLADE — record_heartbeat (mainnet)
 * Prova de liveness: keeper_authority registra batimento cardíaco no aeon_config.
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const RPC_URL      = "https://api.mainnet-beta.solana.com";
const PROJECT_ROOT = path.join(process.env.HOME!, "Desktop/AXIONBLADE/contracts");
const CORE_PROGRAM = new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE");

function loadKeypair(filePath: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  AXIONBLADE — record_heartbeat (mainnet)");
  console.log("═══════════════════════════════════════════\n");

  const connection     = new Connection(RPC_URL, "confirmed");
  const keeperAuthority = loadKeypair(path.join(PROJECT_ROOT, "keys/keeper_authority.json"));

  console.log(`keeper_authority: ${keeperAuthority.publicKey.toBase58()}`);

  const balance = await connection.getBalance(keeperAuthority.publicKey);
  console.log(`balance: ${(balance / 1e9).toFixed(6)} SOL\n`);

  const [aeonConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("aeon_config")], CORE_PROGRAM
  );
  console.log(`aeon_config PDA: ${aeonConfigPDA.toBase58()}`);

  const idl = JSON.parse(fs.readFileSync(
    path.join(PROJECT_ROOT, "target/idl/noumen_core.json"), "utf-8"
  ));

  const wallet   = new anchor.Wallet(keeperAuthority);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program  = new anchor.Program(idl, provider);

  console.log("\nEnviando record_heartbeat...");

  const tx = await (program.methods as any)
    .recordHeartbeat()
    .accounts({
      aeonConfig:       aeonConfigPDA,
      keeperAuthority:  keeperAuthority.publicKey,
    })
    .signers([keeperAuthority])
    .rpc();

  // Lê o last_heartbeat do aeon_config (offset 208, i64 LE)
  const account = await connection.getAccountInfo(aeonConfigPDA);
  const lastHeartbeat = account!.data.readBigInt64LE(208);
  const heartbeatDate = new Date(Number(lastHeartbeat) * 1000).toISOString();

  console.log(`\n✓ Heartbeat registrado com sucesso!`);
  console.log(`  Tx:             ${tx}`);
  console.log(`  last_heartbeat: ${heartbeatDate}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n✗ ERRO:", err.message);
    if (err.logs) console.error("Logs:", err.logs.slice(-3).join("\n"));
    process.exit(1);
  });
