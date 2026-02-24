/**
 * AXIONBLADE — update_agent (mainnet)
 * Atualiza o daily budget cap do KRONOS (agent_id=4).
 * Prova que a modificação de parâmetros de agentes funciona on-chain.
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const RPC_URL      = "https://api.mainnet-beta.solana.com";
const PROJECT_ROOT = path.join(process.env.HOME!, "Desktop/AXIONBLADE/contracts");
const CORE_PROGRAM = new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE");

// KRONOS: agent_id=4, Executor/Limited
const AGENT_ID = 4;
// New daily budget cap: 5_000_000 lamports = 0.005 SOL/day
const NEW_DAILY_CAP = new anchor.BN(5_000_000);

function loadKeypair(filePath: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  AXIONBLADE — update_agent KRONOS (mainnet)  ");
  console.log("═══════════════════════════════════════════════\n");

  const connection    = new Connection(RPC_URL, "confirmed");
  const aeonAuthority = loadKeypair(path.join(PROJECT_ROOT, "keys/aeon_authority.json"));

  console.log(`aeon_authority: ${aeonAuthority.publicKey.toBase58()}`);
  const balance = await connection.getBalance(aeonAuthority.publicKey);
  console.log(`balance:        ${(balance / 1e9).toFixed(6)} SOL\n`);

  const [aeonConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("aeon_config")], CORE_PROGRAM
  );

  const agentIdBuf = Buffer.alloc(2);
  agentIdBuf.writeUInt16LE(AGENT_ID);
  const [agentManifestPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), agentIdBuf], CORE_PROGRAM
  );

  console.log(`Agent ID:       #${AGENT_ID} (KRONOS)`);
  console.log(`Agent PDA:      ${agentManifestPDA.toBase58()}`);
  console.log(`New Daily Cap:  ${NEW_DAILY_CAP.toNumber()} lamports (${NEW_DAILY_CAP.toNumber() / 1e9} SOL/day)\n`);

  // Read current state before update
  const beforeInfo = await connection.getAccountInfo(agentManifestPDA);
  if (!beforeInfo) {
    console.log("✗ Agent PDA not found on-chain.");
    return;
  }
  const d = beforeInfo.data;
  // AgentManifest: discriminator(8) + agent_id(2) + authority(32) + agent_type(1) + status(1) + exec_perm(1)
  //   + level(2) + budget_lamports(8) + budget_spent(8) + budget_daily_cap(8) + ...
  const currentCap = Number(d.readBigUInt64LE(8 + 2 + 32 + 1 + 1 + 1 + 2 + 8 + 8));
  console.log(`Current daily cap: ${currentCap} lamports (${currentCap / 1e9} SOL/day)`);

  const idl = JSON.parse(fs.readFileSync(
    path.join(PROJECT_ROOT, "target/idl/noumen_core.json"), "utf-8"
  ));

  const wallet   = new anchor.Wallet(aeonAuthority);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program  = new anchor.Program(idl, provider);

  console.log("\nEnviando update_agent...");

  const tx = await (program.methods as any)
    .updateAgent({
      newAuthority:     null,
      newBudgetDailyCap: NEW_DAILY_CAP,
      newTtl:           null,
    })
    .accounts({
      aeonConfig:    aeonConfigPDA,
      agentManifest: agentManifestPDA,
      aeonAuthority: aeonAuthority.publicKey,
    })
    .signers([aeonAuthority])
    .rpc();

  // Read updated state
  const afterInfo = await connection.getAccountInfo(agentManifestPDA);
  const d2 = afterInfo!.data;
  const newCap = Number(d2.readBigUInt64LE(8 + 2 + 32 + 1 + 1 + 1 + 2 + 8 + 8));

  console.log(`\n✓ Agente atualizado com sucesso!`);
  console.log(`  Tx:           ${tx}`);
  console.log(`  Agent PDA:    ${agentManifestPDA.toBase58()}`);
  console.log(`  Daily cap:    ${currentCap} → ${newCap} lamports`);
  console.log(`  (${currentCap / 1e9} → ${newCap / 1e9} SOL/day)`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n✗ ERRO:", err.message);
    if (err.logs) console.error("Logs:", err.logs.slice(-5).join("\n"));
    process.exit(1);
  });
