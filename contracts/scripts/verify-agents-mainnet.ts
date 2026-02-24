/**
 * AXIONBLADE — Verify 4 Agent Manifests on Mainnet
 */

import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL     = "https://api.mainnet-beta.solana.com";
const CORE_PROGRAM = new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE");

const AgentType  = ["Collector", "Evaluator", "Executor", "Auditor"];
const ExecPerm   = ["Never", "Limited", "Full"];
const AgentStatus = ["Active", "Paused", "Killed"];

const AGENTS = [
  { id: 1, name: "AEON",   color: "rose"   },
  { id: 2, name: "APOLLO", color: "cyan"   },
  { id: 3, name: "HERMES", color: "purple" },
  { id: 4, name: "KRONOS", color: "amber"  },
];

function readPubkey(buf: Buffer, offset: number): string {
  return new PublicKey(buf.slice(offset, offset + 32)).toBase58();
}

function readI64(buf: Buffer, offset: number): bigint {
  return buf.readBigInt64LE(offset);
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");

  console.log("═══════════════════════════════════════════════");
  console.log("  AXIONBLADE — Agent Manifests (mainnet)");
  console.log("═══════════════════════════════════════════════\n");

  for (const agent of AGENTS) {
    const [manifestPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(new Uint16Array([agent.id]).buffer)],
      CORE_PROGRAM
    );

    const account = await connection.getAccountInfo(manifestPDA);

    console.log(`┌─ Agente ${agent.id}: ${agent.name} (${agent.color})`);
    console.log(`│  PDA: ${manifestPDA.toBase58()}`);

    if (!account) {
      console.log(`│  ✗ NÃO ENCONTRADO\n└─`);
      continue;
    }

    const d = account.data;
    // Skip 8-byte discriminator
    let o = 8;

    const agentId   = d.readUInt16LE(o);   o += 2;
    const authority = readPubkey(d, o);     o += 32;
    const agentType = d[o++];
    const status    = d[o++];
    const execPerm  = d[o++];
    const level     = d.readUInt16LE(o);   o += 2;
    const budget    = d.readBigUInt64LE(o); o += 8;
    o += 8; // budget_spent
    o += 8; // budget_daily_cap
    o += 8; // birth_bond
    const ttl       = readI64(d, o);        o += 8;
    o += 32; // creation_proof
    const createdAt = readI64(d, o);        o += 8;

    const ttlDate     = new Date(Number(ttl) * 1000).toISOString().split("T")[0];
    const createdDate = new Date(Number(createdAt) * 1000).toISOString().split("T")[0];

    console.log(`│  agent_id:            ${agentId}`);
    console.log(`│  authority:           ${authority.slice(0, 20)}...`);
    console.log(`│  agent_type:          ${AgentType[agentType]} (${agentType})`);
    console.log(`│  status:              ${AgentStatus[status]} (${status})`);
    console.log(`│  execution_permission:${ExecPerm[execPerm]} (${execPerm})`);
    console.log(`│  level:               ${level}`);
    console.log(`│  budget:              ${budget} lamports`);
    console.log(`│  ttl:                 ${ttlDate}`);
    console.log(`│  created_at:          ${createdDate}`);
    console.log(`│  owner:               ${account.owner.toBase58().slice(0, 20)}...`);
    console.log(`│  balance (rent):      ${(account.lamports / 1e9).toFixed(6)} SOL`);
    console.log(`└─ ✓ OK\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ ERRO:", err.message);
    process.exit(1);
  });
