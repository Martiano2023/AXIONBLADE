/**
 * Simple initialization using direct Anchor SDK calls
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

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

function loadIDL(name: string): any {
  const idlPath = path.join(
    process.env.HOME!,
    `Desktop/AXIONBLADE/contracts/target/idl/noumen_${name}.json`
  );
  return JSON.parse(fs.readFileSync(idlPath, "utf-8"));
}

async function main() {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║  AXIONBLADE Simple Init                   ║");
  console.log("╚═══════════════════════════════════════╝\n");

  const connection = new Connection(RPC_URL, "confirmed");

  // Load authorities
  const projectRoot = path.join(process.env.HOME!, "Desktop/AXIONBLADE/contracts");
  const superAuthority = loadKeypair(path.join(projectRoot, "keys/super_authority.json"));
  const aeonAuthority = loadKeypair(path.join(projectRoot, "keys/aeon_authority.json"));
  const keeperAuthority = loadKeypair(path.join(projectRoot, "keys/keeper_authority.json"));
  const payer = loadKeypair("~/.config/solana/id.json");

  console.log("Keys loaded:");
  console.log(`  Super:   ${superAuthority.publicKey.toBase58()}`);
  console.log(`  AEON:    ${aeonAuthority.publicKey.toBase58()}`);
  console.log(`  Keeper:  ${keeperAuthority.publicKey.toBase58()}`);
  console.log(`  Creator: ${CREATOR_WALLET.toBase58()}\n`);

  const programIds = {
    core: new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"),
    proof: new PublicKey("3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV"),
    apollo: new PublicKey("92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee"),
    treasury: new PublicKey("EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu"),
    service: new PublicKey("9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY"),
    auditor: new PublicKey("CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe"),
    hermes: new PublicKey("Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj"),
  };

  // Setup provider for CORE
  const wallet = new anchor.Wallet(superAuthority);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load IDLs
  const coreIDL = loadIDL("core");
  const proofIDL = loadIDL("proof");
  const apolloIDL = loadIDL("apollo");
  const treasuryIDL = loadIDL("treasury");
  const serviceIDL = loadIDL("service");
  const auditorIDL = loadIDL("auditor");
  const hermesIDL = loadIDL("hermes");

  // ──────────────────────────────────────────
  // 1. Initialize AEON (core)
  // ──────────────────────────────────────────

  console.log("═══════════════════════════════════════");
  console.log("  [1/7] Initializing AEON (core)");
  console.log("═══════════════════════════════════════\n");

  try {
    const program = new anchor.Program(coreIDL, provider);

    const [aeonConfigPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("aeon_config")],
      programIds.core
    );

    console.log(`AEON Config PDA: ${aeonConfigPDA.toBase58()}`);

    const aeonAccount = await connection.getAccountInfo(aeonConfigPDA);
    if (aeonAccount) {
      console.log("✓ AEON already initialized.\n");
    } else {
      const tx = await (program.methods as any)
        .initializeAeon({
          keeperAuthority: keeperAuthority.publicKey,
          aeonAuthority: aeonAuthority.publicKey,
          treasuryProgram: programIds.treasury,
          proofProgram: programIds.proof,
          heartbeatInterval: new anchor.BN(300),
          operationalAgentCap: 100,
        })
        .accounts({
          aeonConfig: aeonConfigPDA,
          superAuthority: superAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([superAuthority])
        .rpc();

      console.log(`✓ AEON initialized. Tx: ${tx}\n`);
    }
  } catch (err: any) {
    console.error(`✗ Error:`, err.message);
    if (err.logs) console.error("Logs:", err.logs.slice(-3).join("\n"));
  }

  // ──────────────────────────────────────────
  // 2-7. Initialize other programs
  // ──────────────────────────────────────────

  const payerWallet = new anchor.Wallet(payer);
  const payerProvider = new anchor.AnchorProvider(connection, payerWallet, {
    commitment: "confirmed",
  });

  const programs = [
    { name: "Proof", idl: proofIDL, id: programIds.proof, seed: "proof_config", method: "initializeProof", args: { keeperAuthority: keeperAuthority.publicKey } },
    { name: "Apollo", idl: apolloIDL, id: programIds.apollo, seed: "apollo_config", method: "initializeApollo", args: { keeperAuthority: keeperAuthority.publicKey, riskWeightCapBps: 4000 } },
    { name: "Treasury", idl: treasuryIDL, id: programIds.treasury, seed: "treasury_config", method: "initializeTreasury", args: { aeonAuthority: aeonAuthority.publicKey, keeperAuthority: keeperAuthority.publicKey, creatorWallet: CREATOR_WALLET }, useSuper: true },
    { name: "Service", idl: serviceIDL, id: programIds.service, seed: "service_config", method: "initializeServiceConfig", args: { aeonAuthority: aeonAuthority.publicKey, keeperAuthority: keeperAuthority.publicKey } },
    { name: "Auditor", idl: auditorIDL, id: programIds.auditor, seed: "auditor_config", method: "initializeAuditor", args: { authority: payer.publicKey, totalAxioms: 29 } },
    { name: "Hermes", idl: hermesIDL, id: programIds.hermes, seed: "hermes_config", method: "initializeHermes", args: { authority: payer.publicKey, totalServices: 5 } },
  ];

  let index = 2;
  for (const { name, idl, id, seed, method, args, useSuper } of programs as any[]) {
    console.log("═══════════════════════════════════════");
    console.log(`  [${index}/7] Initializing ${name}`);
    console.log("═══════════════════════════════════════\n");

    try {
      const program = new anchor.Program(idl, useSuper ? provider : payerProvider);

      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(seed)],
        id
      );

      console.log(`${name} Config PDA: ${configPDA.toBase58()}`);

      const account = await connection.getAccountInfo(configPDA);
      if (account) {
        console.log(`✓ ${name} already initialized.\n`);
        index++;
        continue;
      }

      // Build accounts object
      let accounts: any;
      let signers: Keypair[];

      if (name === "Treasury") {
        // Step 1: initialize_treasury (4 accounts: super_authority, treasury_config, treasury_vault, system_program)
        const ixDisc = createHash("sha256").update("global:initialize_treasury").digest().subarray(0, 8);
        const [treasuryVaultPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("treasury_vault")], id
        );

        const ix1 = new TransactionInstruction({
          programId: id,
          keys: [
            { pubkey: superAuthority.publicKey, isSigner: true, isWritable: true },
            { pubkey: configPDA, isSigner: false, isWritable: true },
            { pubkey: treasuryVaultPDA, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          data: Buffer.concat([
            ixDisc,
            aeonAuthority.publicKey.toBuffer(),
            keeperAuthority.publicKey.toBuffer(),
            CREATOR_WALLET.toBuffer(),
          ]),
        });

        const tx1 = new Transaction().add(ix1);
        const sig1 = await sendAndConfirmTransaction(connection, tx1, [superAuthority], {
          commitment: "confirmed",
        });
        console.log(`✓ Treasury config + vault initialized (creator: ${CREATOR_WALLET.toBase58()}). Tx: ${sig1}`);

        // Step 2: initialize_donations (donation_vault + ccs_config)
        const ixDisc2 = createHash("sha256").update("global:initialize_donations").digest().subarray(0, 8);
        const [donationVaultPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("donation_vault")], id
        );
        const [ccsConfigPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("ccs_config")], id
        );

        const ix2 = new TransactionInstruction({
          programId: id,
          keys: [
            { pubkey: superAuthority.publicKey, isSigner: true, isWritable: true },
            { pubkey: configPDA, isSigner: false, isWritable: false },
            { pubkey: donationVaultPDA, isSigner: false, isWritable: true },
            { pubkey: ccsConfigPDA, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          data: ixDisc2,
        });

        const tx2 = new Transaction().add(ix2);
        const sig2 = await sendAndConfirmTransaction(connection, tx2, [superAuthority], {
          commitment: "confirmed",
        });
        console.log(`✓ Donations + CCS initialized. Tx: ${sig2}\n`);
      } else if (name === "Service") {
        // Service also needs raw instruction due to Anchor 0.30 PDA resolution issues
        const ixDisc = createHash("sha256").update("global:initialize_service_config").digest().subarray(0, 8);
        const ix = new TransactionInstruction({
          programId: id,
          keys: [
            { pubkey: configPDA, isSigner: false, isWritable: true },
            { pubkey: payer.publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          data: Buffer.concat([
            ixDisc,
            aeonAuthority.publicKey.toBuffer(),
            keeperAuthority.publicKey.toBuffer(),
          ]),
        });

        const rawTx = new Transaction().add(ix);
        const sig = await sendAndConfirmTransaction(connection, rawTx, [payer], {
          commitment: "confirmed",
        });
        console.log(`✓ ${name} initialized. Tx: ${sig}\n`);
      } else {
        accounts = {
          superAuthority: payer.publicKey,
        };
        signers = [payer];

        const tx = await (program.methods as any)[method](args)
          .accounts(accounts)
          .signers(signers)
          .rpc();

        console.log(`✓ ${name} initialized. Tx: ${tx}\n`);
      }
    } catch (err: any) {
      console.error(`✗ Error initializing ${name}:`, err.message);
      if (err.logs) console.error("  Logs:", err.logs.slice(-3).join("\n"));
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
    console.error("\n❌ FATAL:", err);
    process.exit(1);
  });
