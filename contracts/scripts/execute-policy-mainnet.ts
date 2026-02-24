/**
 * AXIONBLADE — execute_policy_change (mainnet)
 * Executa a proposta #1 após o timelock de 24h.
 *
 * Se o timelock ainda não expirou, mostra o tempo restante e aborta.
 * Só executa quando clock.unix_timestamp >= delay_until (enforçado on-chain).
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const RPC_URL      = "https://api.mainnet-beta.solana.com";
const PROJECT_ROOT = path.join(process.env.HOME!, "Desktop/AXIONBLADE/contracts");
const CORE_PROGRAM = new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE");

const PROPOSAL_ID = 1;

function loadKeypair(filePath: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  AXIONBLADE — execute_policy_change (mainnet)");
  console.log("═══════════════════════════════════════════════\n");

  const connection    = new Connection(RPC_URL, "confirmed");
  const aeonAuthority = loadKeypair(path.join(PROJECT_ROOT, "keys/aeon_authority.json"));

  console.log(`aeon_authority: ${aeonAuthority.publicKey.toBase58()}`);
  const balance = await connection.getBalance(aeonAuthority.publicKey);
  console.log(`balance:        ${(balance / 1e9).toFixed(6)} SOL\n`);

  // Derive PDAs
  const [aeonConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("aeon_config")], CORE_PROGRAM
  );
  const proposalIdBuf = Buffer.alloc(4);
  proposalIdBuf.writeUInt32LE(PROPOSAL_ID);
  const [policyProposalPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("proposal"), proposalIdBuf], CORE_PROGRAM
  );

  // Read current proposal state
  const proposalInfo = await connection.getAccountInfo(policyProposalPDA);
  if (!proposalInfo || proposalInfo.data.length < 8) {
    console.log("✗ Proposta #1 não encontrada on-chain.");
    return;
  }

  const d = proposalInfo.data;
  // PolicyProposal layout (after 8-byte discriminator):
  // proposal_id(4) + proposer(32) + policy_layer(1) + status(1) + change_hash(32)
  // + delay_until(8) + cooldown_until(8) + proposed_at(8) + executed_at(8) + expires_at(8) + bump(1)
  // PolicyProposal offsets (after 8-byte discriminator):
  // proposal_id(4) proposer(32) policy_layer(1) status(1) change_hash(32)
  // delay_until(8) cooldown_until(8) proposed_at(8) executed_at(8) expires_at(8) bump(1)
  const status     = d[8 + 4 + 32 + 1];           // offset 45
  const delayUntil = Number(d.readBigInt64LE(78)); // offset 78
  const expiresAt  = Number(d.readBigInt64LE(110));// offset 110

  const statusLabels = ["Pending", "Executed", "Rejected", "Expired"];
  console.log(`Proposal PDA:  ${policyProposalPDA.toBase58()}`);
  console.log(`Status atual:  ${status} — ${statusLabels[status] ?? "?"}`);
  console.log(`delay_until:   ${new Date(delayUntil * 1000).toISOString()}`);
  console.log(`expires_at:    ${new Date(expiresAt * 1000).toISOString()}\n`);

  if (status !== 0) {
    console.log(`✗ Proposta não está Pending (status=${status}). Nada a fazer.`);
    return;
  }

  const now = Math.floor(Date.now() / 1000);

  if (now < delayUntil) {
    const remaining = delayUntil - now;
    console.log(`⏳ Timelock ainda ativo.`);
    console.log(`   Tempo restante: ${formatDuration(remaining)}`);
    console.log(`   Executável após: ${new Date(delayUntil * 1000).toISOString()}`);
    console.log(`\n   Rode este script novamente após o timelock expirar.`);
    return;
  }

  if (now >= expiresAt) {
    console.log(`✗ Proposta expirada em ${new Date(expiresAt * 1000).toISOString()}.`);
    return;
  }

  // Timelock passou — executar
  console.log("✓ Timelock expirado. Enviando execute_policy_change...\n");

  const idl = JSON.parse(fs.readFileSync(
    path.join(PROJECT_ROOT, "target/idl/noumen_core.json"), "utf-8"
  ));

  const wallet   = new anchor.Wallet(aeonAuthority);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program  = new anchor.Program(idl, provider);

  const tx = await (program.methods as any)
    .executePolicyChange()
    .accounts({
      aeonConfig:     aeonConfigPDA,
      policyProposal: policyProposalPDA,
      aeonAuthority:  aeonAuthority.publicKey,
    })
    .signers([aeonAuthority])
    .rpc();

  // Ler estado final
  const afterInfo = await connection.getAccountInfo(policyProposalPDA);
  const d2        = afterInfo!.data;
  const newStatus  = d2[8 + 4 + 32 + 1]; // offset 45
  const executedAt = Number(d2.readBigInt64LE(102)); // offset 102

  console.log(`✓ Proposta executada com sucesso!`);
  console.log(`  Tx:          ${tx}`);
  console.log(`  Status:      ${status} (Pending) → ${newStatus} (Executed)`);
  console.log(`  executed_at: ${new Date(executedAt * 1000).toISOString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n✗ ERRO:", err.message);
    if (err.logs) console.error("Logs:", err.logs.slice(-5).join("\n"));
    process.exit(1);
  });
