/**
 * AXIONBLADE — propose_policy_change (mainnet)
 * Submete uma proposta Layer 2 (Operational) com delay obrigatório de 24h.
 * Prova que o sistema de governança com timelock funciona on-chain.
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

const RPC_URL      = "https://api.mainnet-beta.solana.com";
const PROJECT_ROOT = path.join(process.env.HOME!, "Desktop/AXIONBLADE/contracts");
const CORE_PROGRAM = new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE");

const PROPOSAL_ID    = 1;
const POLICY_LAYER   = 2;               // Layer 2: Operational (>= 24h)
const DELAY_SECONDS  = new anchor.BN(86400); // 24h exactly (minimum)

// change_hash: sha256 da descrição da mudança proposta
const CHANGE_DESCRIPTION = "AXIONBLADE Layer 2 governance test: adjust heartbeat_interval 300s→600s";
const changeHash = Array.from(
  createHash("sha256").update(CHANGE_DESCRIPTION).digest()
);

function loadKeypair(filePath: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  AXIONBLADE — propose_policy_change (mainnet)");
  console.log("═══════════════════════════════════════════════\n");

  const connection    = new Connection(RPC_URL, "confirmed");
  const aeonAuthority = loadKeypair(path.join(PROJECT_ROOT, "keys/aeon_authority.json"));

  console.log(`aeon_authority: ${aeonAuthority.publicKey.toBase58()}`);
  const balance = await connection.getBalance(aeonAuthority.publicKey);
  console.log(`balance:        ${(balance / 1e9).toFixed(6)} SOL\n`);

  const [aeonConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("aeon_config")], CORE_PROGRAM
  );

  const proposalIdBuf = Buffer.alloc(4);
  proposalIdBuf.writeUInt32LE(PROPOSAL_ID);
  const [policyProposalPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("proposal"), proposalIdBuf], CORE_PROGRAM
  );

  console.log(`Proposal ID:    #${PROPOSAL_ID}`);
  console.log(`Policy Layer:   ${POLICY_LAYER} (Operational — 24h min delay)`);
  console.log(`Delay:          ${DELAY_SECONDS.toNumber()}s (24h)`);
  console.log(`Proposal PDA:   ${policyProposalPDA.toBase58()}`);
  console.log(`Change:         ${CHANGE_DESCRIPTION}\n`);

  const existing = await connection.getAccountInfo(policyProposalPDA);
  // Only skip if the account has program data (discriminator = 8 bytes min)
  if (existing && existing.data.length >= 8 && !existing.owner.equals(SystemProgram.programId)) {
    console.log("✓ Proposta #1 já existe on-chain.");
    return;
  }

  const idl = JSON.parse(fs.readFileSync(
    path.join(PROJECT_ROOT, "target/idl/noumen_core.json"), "utf-8"
  ));

  const wallet   = new anchor.Wallet(aeonAuthority);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program  = new anchor.Program(idl, provider);

  console.log("Enviando propose_policy_change...");

  const tx = await (program.methods as any)
    .proposePolicyChange({
      proposalId:   PROPOSAL_ID,
      policyLayer:  POLICY_LAYER,
      changeHash,
      delaySeconds: DELAY_SECONDS,
    })
    .accounts({
      aeonConfig:     aeonConfigPDA,
      policyProposal: policyProposalPDA,
      aeonAuthority:  aeonAuthority.publicKey,
      systemProgram:  SystemProgram.programId,
    })
    .signers([aeonAuthority])
    .rpc();

  // Ler proposta criada
  const proposalAccount = await connection.getAccountInfo(policyProposalPDA);
  const d = proposalAccount!.data;
  // status (u8) offset 8+4+32 = 44
  const status    = d[44];
  // delay_until (i64) offset 8+4+32+1+1+32 = 78
  const delayUntil = d.readBigInt64LE(78);
  const delayDate  = new Date(Number(delayUntil) * 1000).toISOString();

  console.log(`\n✓ Proposta submetida com sucesso!`);
  console.log(`  Tx:           ${tx}`);
  console.log(`  Proposal PDA: ${policyProposalPDA.toBase58()}`);
  console.log(`  Status:       ${status === 0 ? "Pending (0)" : status}`);
  console.log(`  delay_until:  ${delayDate}  ← executável apenas após este timestamp`);
  console.log(`\n  A proposta só pode ser executada após 24h (on-chain enforçado).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n✗ ERRO:", err.message);
    if (err.logs) console.error("Logs:", err.logs.slice(-5).join("\n"));
    process.exit(1);
  });
