import { PublicKey } from "@solana/web3.js";
import { PROGRAM_IDS, SEEDS } from "./constants";

// ---------------------------------------------------------------------------
// Helper: encode a little-endian u16 into a 2-byte buffer
// ---------------------------------------------------------------------------

function u16LE(value: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(value);
  return buf;
}

// ---------------------------------------------------------------------------
// Helper: encode a little-endian u32 into a 4-byte buffer
// ---------------------------------------------------------------------------

function u32LE(value: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value);
  return buf;
}

// ---------------------------------------------------------------------------
// Helper: encode a little-endian u64 into an 8-byte buffer
// ---------------------------------------------------------------------------

function u64LE(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

// ---------------------------------------------------------------------------
// noumen_core PDAs
// ---------------------------------------------------------------------------

/** Singleton AEON governor configuration. */
export function findAeonConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.aeonConfig],
    PROGRAM_IDS.core,
  );
}

/** Per-agent manifest. `agentId` is the 0-based index (u16). */
export function findAgentManifestPDA(agentId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.agentManifest, u16LE(agentId)],
    PROGRAM_IDS.core,
  );
}

/** Policy proposal. `proposalId` is a u32 counter. */
export function findPolicyProposalPDA(proposalId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.policyProposal, u32LE(proposalId)],
    PROGRAM_IDS.core,
  );
}

// ---------------------------------------------------------------------------
// noumen_proof PDAs
// ---------------------------------------------------------------------------

/** Singleton proof system configuration. */
export function findProofConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.proofConfig],
    PROGRAM_IDS.proof,
  );
}

/** Decision log entry. `decisionId` is a u64 counter. */
export function findDecisionLogPDA(
  decisionId: number | bigint,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.decisionLog, u64LE(decisionId)],
    PROGRAM_IDS.proof,
  );
}

/** Execution result PDA. `executionId` is a u64 counter. */
export function findExecutionResultPDA(
  executionId: number | bigint,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.executionResult, u64LE(executionId)],
    PROGRAM_IDS.proof,
  );
}

/** Batch proof PDA. `batchId` is a u32 counter. */
export function findBatchProofPDA(batchId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.batchProof, u32LE(batchId)],
    PROGRAM_IDS.proof,
  );
}

// ---------------------------------------------------------------------------
// noumen_treasury PDAs
// ---------------------------------------------------------------------------

/** Singleton treasury configuration. */
export function findTreasuryConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.treasuryConfig],
    PROGRAM_IDS.treasury,
  );
}

/** Main treasury vault (holds SOL). */
export function findTreasuryVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.treasuryVault],
    PROGRAM_IDS.treasury,
  );
}

/** Donation vault (separate from treasury per axioms). */
export function findDonationVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.donationVault],
    PROGRAM_IDS.treasury,
  );
}

/** CCS (Creator Capture Split) configuration. */
export function findCCSConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.ccsConfig],
    PROGRAM_IDS.treasury,
  );
}

/** Budget allocation for a specific agent. `agentId` is a u16. */
export function findBudgetAllocationPDA(
  agentId: number,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.budgetAllocation, u16LE(agentId)],
    PROGRAM_IDS.treasury,
  );
}

/** Donation receipt. `nonce` is a u32 counter. */
export function findDonationReceiptPDA(nonce: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.donationReceipt, u32LE(nonce)],
    PROGRAM_IDS.treasury,
  );
}

// ---------------------------------------------------------------------------
// noumen_apollo PDAs
// ---------------------------------------------------------------------------

/** Singleton APOLLO risk evaluator configuration. */
export function findApolloConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.apolloConfig],
    PROGRAM_IDS.apollo,
  );
}

/** Assessment record PDA. `assessmentId` is a u64 counter. */
export function findAssessmentRecordPDA(
  assessmentId: number | bigint,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.assessmentRecord, u64LE(assessmentId)],
    PROGRAM_IDS.apollo,
  );
}

// ---------------------------------------------------------------------------
// noumen_hermes PDAs
// ---------------------------------------------------------------------------

/** Singleton HERMES intelligence configuration. */
export function findHermesConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.hermesConfig],
    PROGRAM_IDS.hermes,
  );
}

/** Intelligence report PDA. `reportId` is a u64 counter. */
export function findIntelligenceReportPDA(
  reportId: number | bigint,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.intelligenceReport, u64LE(reportId)],
    PROGRAM_IDS.hermes,
  );
}

// ---------------------------------------------------------------------------
// noumen_auditor PDAs
// ---------------------------------------------------------------------------

/** Singleton auditor configuration. */
export function findAuditorConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.auditorConfig],
    PROGRAM_IDS.auditor,
  );
}

/** Truth label for a specific signal. `signalId` is a u32. */
export function findTruthLabelPDA(signalId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.truthLabel, u32LE(signalId)],
    PROGRAM_IDS.auditor,
  );
}

/** Security incident PDA. `incidentId` is a u32 counter. */
export function findSecurityIncidentPDA(
  incidentId: number,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.securityIncident, u32LE(incidentId)],
    PROGRAM_IDS.auditor,
  );
}

/** Accuracy snapshot PDA. `snapshotId` is a u32 counter. */
export function findAccuracySnapshotPDA(
  snapshotId: number,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.accuracySnapshot, u32LE(snapshotId)],
    PROGRAM_IDS.auditor,
  );
}

// ---------------------------------------------------------------------------
// noumen_service PDAs
// ---------------------------------------------------------------------------

/** Service entry PDA. `serviceId` is a u16. */
export function findServiceEntryPDA(serviceId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.serviceEntry, u16LE(serviceId)],
    PROGRAM_IDS.service,
  );
}
