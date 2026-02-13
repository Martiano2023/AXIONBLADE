/**
 * AXIONBLADE Localnet Initialization - Using Anchor Client
 * Correctly initializes all 7 programs using generated IDLs
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// Load IDLs
import noumenCoreIDL from "../target/idl/noumen_core.json";
import noumenProofIDL from "../target/idl/noumen_proof.json";
import noumenApolloIDL from "../target/idl/noumen_apollo.json";
import noumenTreasuryIDL from "../target/idl/noumen_treasury.json";
import noumenServiceIDL from "../target/idl/noumen_service.json";
import noumenAuditorIDL from "../target/idl/noumen_auditor.json";
import noumenHermesIDL from "../target/idl/noumen_hermes.json";

const RPC_URL = process.env.RPC_URL || "http://localhost:8899";

// Creator wallet — receives 15% of revenue via CCS (Creator Compensation Structure)
const CREATOR_WALLET = new PublicKey("HgThD22yumQsiv7ymLNNWnfzEsfrhKd5sG1X3ffYxNbk");

function loadKeypair(filePath: string): Keypair {
  const resolved = filePath.startsWith("~")
    ? path.join(process.env.HOME!, filePath.slice(1))
    : filePath;
  const raw = JSON.parse(fs.readFileSync(resolved, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main() {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║  AXIONBLADE v3.2.3 — Anchor Init          ║");
  console.log("╚═══════════════════════════════════════╝\n");

  const connection = new Connection(RPC_URL, "confirmed");

  // Load authorities
  const projectRoot = path.join(process.env.HOME!, "Desktop/AXIONBLADE/contracts");
  const superAuthority = loadKeypair(path.join(projectRoot, "keys/super_authority.json"));
  const aeonAuthority = loadKeypair(path.join(projectRoot, "keys/aeon_authority.json"));
  const keeperAuthority = loadKeypair(path.join(projectRoot, "keys/keeper_authority.json"));
  const payer = loadKeypair("~/.config/solana/id.json");

  console.log("Authorities:");
  console.log(`  Super:  ${superAuthority.publicKey.toBase58()}`);
  console.log(`  AEON:   ${aeonAuthority.publicKey.toBase58()}`);
  console.log(`  Keeper: ${keeperAuthority.publicKey.toBase58()}`);
  console.log(`  Payer:  ${payer.publicKey.toBase58()}\n`);

  // Setup provider with super_authority as wallet for core init
  const wallet = new Wallet(superAuthority);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Program IDs (from deployed programs)
  const programIds = {
    core: new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"),
    proof: new PublicKey("3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV"),
    apollo: new PublicKey("92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee"),
    treasury: new PublicKey("EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu"),
    service: new PublicKey("9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY"),
    auditor: new PublicKey("CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe"),
    hermes: new PublicKey("Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj"),
  };

  // Create program instances
  const coreProgram = new Program(noumenCoreIDL as any, programIds.core, provider);
  const proofProgram = new Program(noumenProofIDL as any, programIds.proof, provider);
  const apolloProgram = new Program(noumenApolloIDL as any, programIds.apollo, provider);
  const treasuryProgram = new Program(noumenTreasuryIDL as any, programIds.treasury, provider);
  const serviceProgram = new Program(noumenServiceIDL as any, programIds.service, provider);
  const auditorProgram = new Program(noumenAuditorIDL as any, programIds.auditor, provider);
  const hermesProgram = new Program(noumenHermesIDL as any, programIds.hermes, provider);

  // ──────────────────────────────────────────
  // 1. Initialize AEON (core)
  // ──────────────────────────────────────────

  console.log("═══════════════════════════════════════");
  console.log("  [1/7] Initializing AEON (core)");
  console.log("═══════════════════════════════════════\n");

  try {
    const [aeonConfigPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("aeon_config")],
      programIds.core
    );

    console.log(`AEON Config PDA: ${aeonConfigPDA.toBase58()}`);

    const aeonAccount = await connection.getAccountInfo(aeonConfigPDA);
    if (aeonAccount) {
      console.log("✓ AEON already initialized.\n");
    } else {
      const tx = await coreProgram.methods
        .initializeAeon({
          keeperAuthority: keeperAuthority.publicKey,
          aeonAuthority: aeonAuthority.publicKey,
          treasuryProgram: programIds.treasury,
          proofProgram: programIds.proof,
          heartbeatInterval: new anchor.BN(300), // 5 minutes
          operationalAgentCap: 100,
        })
        .accounts({
          aeonConfig: aeonConfigPDA,
          superAuthority: superAuthority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([superAuthority])
        .rpc();

      console.log(`✓ AEON initialized. Tx: ${tx}\n`);
    }
  } catch (err: any) {
    console.error(`✗ Error initializing AEON:`, err.message);
    if (err.logs) console.error("Logs:", err.logs.join("\n"));
  }

  // ──────────────────────────────────────────
  // 2-7. Initialize other programs (usando payer)
  // ──────────────────────────────────────────

  // Switch provider to use payer for other programs
  const payerWallet = new Wallet(payer);
  const payerProvider = new AnchorProvider(connection, payerWallet, {
    commitment: "confirmed",
  });

  const programs = [
    { name: "Proof", program: new Program(noumenProofIDL as any, programIds.proof, payerProvider), seed: "proof_config", args: { keeperAuthority: keeperAuthority.publicKey } },
    { name: "Apollo", program: new Program(noumenApolloIDL as any, programIds.apollo, payerProvider), seed: "apollo_config", args: { keeperAuthority: keeperAuthority.publicKey, riskWeightCapBps: 4000 } },
    { name: "Treasury", program: new Program(noumenTreasuryIDL as any, programIds.treasury, provider), seed: "treasury_config", args: { aeonAuthority: aeonAuthority.publicKey, keeperAuthority: keeperAuthority.publicKey, creatorWallet: CREATOR_WALLET } },
    { name: "Service", program: new Program(noumenServiceIDL as any, programIds.service, payerProvider), seed: "service_config", args: { ccsTotalCapBps: 1500, ccsFloorBps: 400 } },
    { name: "Auditor", program: new Program(noumenAuditorIDL as any, programIds.auditor, payerProvider), seed: "auditor_config", args: { totalAxioms: 29 } },
    { name: "Hermes", program: new Program(noumenHermesIDL as any, programIds.hermes, payerProvider), seed: "hermes_config", args: { totalServices: 5 } },
  ];

  let index = 2;
  for (const { name, program, seed, args } of programs) {
    console.log("═══════════════════════════════════════");
    console.log(`  [${index}/7] Initializing ${name}`);
    console.log("═══════════════════════════════════════\n");

    try {
      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(seed)],
        program.programId
      );

      console.log(`${name} Config PDA: ${configPDA.toBase58()}`);

      const account = await connection.getAccountInfo(configPDA);
      if (account) {
        console.log(`✓ ${name} already initialized.\n`);
      } else {
        // Construct instruction name
        const methodName = `initialize${name.replace(/\s+/g, "")}`;
        let method = (program.methods as any)[methodName];

        // Try alternative names
        if (!method) {
          const altNames = [
            `initialize${name.toLowerCase()}`,
            `initialize_${name.toLowerCase()}`,
            `init${name}`,
          ];
          for (const altName of altNames) {
            if ((program.methods as any)[altName]) {
              method = (program.methods as any)[altName];
              break;
            }
          }
        }

        if (!method) {
          console.error(`✗ Method not found for ${name}. Skipping...\n`);
          index++;
          continue;
        }

        const tx = await method(args)
          .accounts({
            [seed.replace(/_/g, "")]: configPDA,
            payer: payer.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([payer])
          .rpc();

        console.log(`✓ ${name} initialized. Tx: ${tx}\n`);
      }
    } catch (err: any) {
      console.error(`✗ Error initializing ${name}:`, err.message);
      if (err.logs) console.error("Logs:", err.logs.slice(-5).join("\n"));
    }

    index++;
  }

  console.log("═══════════════════════════════════════");
  console.log("  ✅ INITIALIZATION COMPLETE!");
  console.log("═══════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ FATAL ERROR:", err);
    process.exit(1);
  });
