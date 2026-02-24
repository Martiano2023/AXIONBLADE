import { PublicKey } from "@solana/web3.js";

// ---------------------------------------------------------------------------
// Program IDs (mainnet — noumen_core + noumen_proof live 2026-02-24)
// ---------------------------------------------------------------------------

export const PROGRAM_IDS = {
  core: new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"),
  proof: new PublicKey("3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV"),
  treasury: new PublicKey("EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu"),
  apollo: new PublicKey("92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee"),
  hermes: new PublicKey("Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj"),
  auditor: new PublicKey("CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe"),
  service: new PublicKey("9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY"),
} as const;

// ---------------------------------------------------------------------------
// Network configuration
// ---------------------------------------------------------------------------

export const DEVNET_RPC =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.mainnet-beta.solana.com";

export const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER ?? "mainnet-beta") as
  | "devnet"
  | "mainnet-beta";

// ---------------------------------------------------------------------------
// Mainnet on-chain state (initialized 2026-02-24)
// ---------------------------------------------------------------------------

export const AEON_CONFIG_PDA = new PublicKey(
  process.env.NEXT_PUBLIC_AEON_CONFIG_PDA ??
    "2mdu4o1p2isEHQeZ2KYHYFnnDdHd183p7HzKQ3Nh8pN3"
);

export const PROOF_CONFIG_PDA = new PublicKey(
  "9q4QmPjWc7GGG5zVqLs9pBbra4LgkjHYZBui3HAKEnZX"
);

export const MAINNET_STATUS = {
  deployedPrograms: ["noumen_core", "noumen_proof"] as string[],
  pendingPrograms: [
    "noumen_treasury",
    "noumen_apollo",
    "noumen_hermes",
    "noumen_auditor",
    "noumen_service",
  ] as string[],
  activeAgentCount: 4,
  agentCap: 100,
  deployDate: "2026-02-24",
} as const;

// ---------------------------------------------------------------------------
// PDA seeds matching the on-chain programs
// ---------------------------------------------------------------------------

export const SEEDS = {
  // noumen_core
  aeonConfig: Buffer.from("aeon_config"),
  agentManifest: Buffer.from("agent"),
  policyProposal: Buffer.from("proposal"),

  // noumen_proof
  proofConfig: Buffer.from("proof_config"),
  decisionLog: Buffer.from("decision"),
  executionResult: Buffer.from("execution"),
  batchProof: Buffer.from("batch"),

  // noumen_treasury
  treasuryConfig: Buffer.from("treasury_config"),
  treasuryVault: Buffer.from("treasury_vault"),
  donationVault: Buffer.from("donation_vault"),
  ccsConfig: Buffer.from("ccs_config"),
  budgetAllocation: Buffer.from("budget"),
  donationReceipt: Buffer.from("donation_receipt"),

  // noumen_apollo
  apolloConfig: Buffer.from("apollo_config"),
  assessmentRecord: Buffer.from("assessment"),

  // noumen_hermes
  hermesConfig: Buffer.from("hermes_config"),
  intelligenceReport: Buffer.from("report"),

  // noumen_auditor
  auditorConfig: Buffer.from("auditor_config"),
  truthLabel: Buffer.from("truth_label"),
  securityIncident: Buffer.from("incident"),
  accuracySnapshot: Buffer.from("accuracy"),

  // noumen_service
  serviceEntry: Buffer.from("service"),
} as const;
