import { PublicKey } from "@solana/web3.js";

// ---------------------------------------------------------------------------
// Program IDs (devnet deployments)
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
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

export const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER ?? "devnet") as
  | "devnet"
  | "mainnet-beta";

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
