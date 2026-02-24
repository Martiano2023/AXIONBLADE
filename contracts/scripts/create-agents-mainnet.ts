/**
 * AXIONBLADE — Create 4 Agents on Mainnet
 * Registra AEON, APOLLO, HERMES e KRONOS como AgentManifest PDAs no noumen_core.
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

const RPC_URL     = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const PROJECT_ROOT = path.join(process.env.HOME!, "Desktop/AXIONBLADE/contracts");

const CORE_PROGRAM = new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE");

// AgentType enum values (shared-types)
const AgentType = { Collector: 0, Evaluator: 1, Executor: 2, Auditor: 3 };
// ExecutionPermission enum values
const ExecPerm  = { Never: 0, Limited: 1, Full: 2 };

function loadKeypair(filePath: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function creationProof(label: string): number[] {
  return Array.from(createHash("sha256").update(`axionblade:agent:${label}:mainnet:2026`).digest());
}

// TTL: 2 anos a partir de agora
const TTL = new anchor.BN(Math.floor(Date.now() / 1000) + 2 * 365 * 24 * 3600);

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  AXIONBLADE — create_agent x4 (mainnet)");
  console.log("═══════════════════════════════════════════════\n");

  const connection = new Connection(RPC_URL, "confirmed");

  const aeonAuthority   = loadKeypair(path.join(PROJECT_ROOT, "keys/aeon_authority.json"));
  const keeperAuthority = loadKeypair(path.join(PROJECT_ROOT, "keys/keeper_authority.json"));

  console.log("Signers:");
  console.log(`  aeon_authority:   ${aeonAuthority.publicKey.toBase58()}`);
  console.log(`  keeper_authority: ${keeperAuthority.publicKey.toBase58()}\n`);

  const balance = await connection.getBalance(aeonAuthority.publicKey);
  console.log(`aeon_authority balance: ${(balance / 1e9).toFixed(6)} SOL`);

  if (balance < 5_000_000) {
    throw new Error("aeon_authority precisa de pelo menos 0.005 SOL para pagar os PDAs");
  }

  const [aeonConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("aeon_config")], CORE_PROGRAM
  );

  const idl = JSON.parse(fs.readFileSync(
    path.join(PROJECT_ROOT, "target/idl/noumen_core.json"), "utf-8"
  ));

  const wallet   = new anchor.Wallet(aeonAuthority);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program  = new anchor.Program(idl, provider);

  // Definição dos 4 agentes
  const agents = [
    {
      id:        1,
      name:      "AEON",
      color:     "rose",
      type:      AgentType.Executor,
      execPerm:  ExecPerm.Full,
      authority: aeonAuthority.publicKey,
      budget:    new anchor.BN(0),
      dailyCap:  new anchor.BN(0),
    },
    {
      id:        2,
      name:      "APOLLO",
      color:     "cyan",
      type:      AgentType.Evaluator,
      execPerm:  ExecPerm.Never,          // A0-14: evaluator nunca executa
      authority: aeonAuthority.publicKey,
      budget:    new anchor.BN(0),
      dailyCap:  new anchor.BN(0),
    },
    {
      id:        3,
      name:      "HERMES",
      color:     "purple",
      type:      AgentType.Evaluator,
      execPerm:  ExecPerm.Never,          // A0-14: evaluator nunca executa
      authority: aeonAuthority.publicKey,
      budget:    new anchor.BN(0),
      dailyCap:  new anchor.BN(0),
    },
    {
      id:        4,
      name:      "KRONOS",
      color:     "amber",
      type:      AgentType.Executor,
      execPerm:  ExecPerm.Limited,        // Crank ops — limitado
      authority: keeperAuthority.publicKey,
      budget:    new anchor.BN(0),
      dailyCap:  new anchor.BN(0),
    },
  ];

  for (const agent of agents) {
    const [manifestPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(new Uint16Array([agent.id]).buffer)],
      CORE_PROGRAM
    );

    console.log(`\n───────────────────────────────────────────────`);
    console.log(`  Agente ${agent.id}: ${agent.name} (${agent.color})`);
    console.log(`  Manifest PDA: ${manifestPDA.toBase58()}`);

    // Verifica se já existe
    const existing = await connection.getAccountInfo(manifestPDA);
    if (existing) {
      console.log(`  ✓ Já existe. Pulando.`);
      continue;
    }

    try {
      const tx = await (program.methods as any)
        .createAgent({
          agentId:                 agent.id,
          authority:               agent.authority,
          agentType:               agent.type,
          executionPermission:     agent.execPerm,
          budgetLamports:          agent.budget,
          budgetDailyCapLamports:  agent.dailyCap,
          ttl:                     TTL,
          creationProof:           creationProof(agent.name),
        })
        .accounts({
          aeonConfig:    aeonConfigPDA,
          agentManifest: manifestPDA,
          aeonAuthority: aeonAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([aeonAuthority])
        .rpc();

      console.log(`  ✓ ${agent.name} criado. Tx: ${tx}`);
    } catch (err: any) {
      console.error(`  ✗ Erro ao criar ${agent.name}:`, err.message);
      if (err.logs) console.error("  Logs:", err.logs.slice(-3).join("\n"));
    }
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("  Verificando aeon_config.active_agent_count...");

  const configAccount = await connection.getAccountInfo(aeonConfigPDA);
  if (configAccount) {
    // active_agent_count está no offset 200 (u16 little-endian)
    const count = configAccount.data.readUInt16LE(200);
    console.log(`  active_agent_count: ${count}/100`);
  }

  console.log("═══════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n✗ FATAL:", err.message);
    process.exit(1);
  });
