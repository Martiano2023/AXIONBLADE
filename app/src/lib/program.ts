import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";
import {
  findAeonConfigPDA,
  findTreasuryConfigPDA,
  findTreasuryVaultPDA,
  findDonationVaultPDA,
  findCCSConfigPDA,
  findProofConfigPDA,
  findApolloConfigPDA,
  findHermesConfigPDA,
  findAuditorConfigPDA,
  findServiceEntryPDA,
  findAgentManifestPDA,
  findDecisionLogPDA,
  findAssessmentRecordPDA,
  findDonationReceiptPDA,
} from "./pda";

// ---------------------------------------------------------------------------
// Account discriminator computation
// ---------------------------------------------------------------------------

/**
 * Compute the 8-byte Anchor account discriminator.
 * discriminator = sha256("account:<AccountName>")[0..8]
 *
 * We use the Web Crypto API (available in both Node 18+ and browsers).
 */
async function accountDiscriminator(accountName: string): Promise<Uint8Array> {
  const msgBuffer = new TextEncoder().encode(`account:${accountName}`);
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    msgBuffer as unknown as ArrayBuffer,
  );
  return new Uint8Array(hashBuffer).slice(0, 8);
}

// ---------------------------------------------------------------------------
// Generic account fetcher with discriminator validation
// ---------------------------------------------------------------------------

async function fetchAndValidate(
  connection: Connection,
  pda: PublicKey,
  accountName: string,
): Promise<Buffer | null> {
  const info = await connection.getAccountInfo(pda);
  if (!info || !info.data || info.data.length < 8) return null;

  const disc = await accountDiscriminator(accountName);
  const dataDisc = info.data.slice(0, 8);

  for (let i = 0; i < 8; i++) {
    if (dataDisc[i] !== disc[i]) return null;
  }

  return Buffer.from(info.data);
}

// ---------------------------------------------------------------------------
// Deserialization helpers
// ---------------------------------------------------------------------------

/** Read a u8 from a buffer at a given offset. */
function readU8(buf: Buffer, offset: number): number {
  return buf.readUInt8(offset);
}

/** Read a u16 (LE) from a buffer at a given offset. */
function readU16(buf: Buffer, offset: number): number {
  return buf.readUInt16LE(offset);
}

/** Read a u32 (LE) from a buffer at a given offset. */
function readU32(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset);
}

/** Read a u64 (LE) as BN from a buffer at a given offset. */
function readU64(buf: Buffer, offset: number): BN {
  return new BN(buf.slice(offset, offset + 8), "le");
}

/** Read an i64 (LE) as number from a buffer at a given offset. */
function readI64AsNumber(buf: Buffer, offset: number): number {
  return Number(buf.readBigInt64LE(offset));
}

/** Read a Pubkey (32 bytes) from a buffer at a given offset. */
function readPubkey(buf: Buffer, offset: number): PublicKey {
  return new PublicKey(buf.slice(offset, offset + 32));
}

/** Read a boolean (1 byte) from a buffer at a given offset. */
function readBool(buf: Buffer, offset: number): boolean {
  return buf.readUInt8(offset) !== 0;
}

// ---------------------------------------------------------------------------
// Account type definitions
// ---------------------------------------------------------------------------

export interface AeonConfig {
  authority: PublicKey;
  activeAgentCount: number;
  maxAgents: number;
  totalDecisions: BN;
  circuitBreakerMode: number; // 0=Normal, 1=Cautious, 2=Halted
  lastHeartbeat: number;
  bump: number;
}

export interface TreasuryConfig {
  authority: PublicKey;
  reserveRatioBps: number;
  dailySpendCapBps: number;
  bump: number;
}

export interface TreasuryVaultData {
  totalBalance: BN;
  reserveBalance: BN;
  freeBalance: BN;
  lastDailyReset: number;
  dailySpent: BN;
  bump: number;
}

export interface DonationVaultData {
  totalDonated: BN;
  donationCount: number;
  lastSweepTimestamp: number;
  bump: number;
}

export interface CCSConfig {
  totalCapBps: number;
  floorBps: number;
  stipendCapBps: number;
  currentRateBps: number;
  bump: number;
}

export interface ProofConfig {
  authority: PublicKey;
  totalDecisions: BN;
  totalExecutions: BN;
  totalBatches: number;
  bump: number;
}

export interface ApolloConfig {
  authority: PublicKey;
  maxWeightBps: number;
  totalAssessments: BN;
  monitoredPoolCount: number;
  bump: number;
}

export interface HermesConfig {
  authority: PublicKey;
  totalReports: BN;
  activeServiceCount: number;
  bump: number;
}

export interface AuditorConfig {
  authority: PublicKey;
  totalLabels: number;
  totalIncidents: number;
  totalSnapshots: number;
  bump: number;
}

export interface ServiceEntry {
  serviceId: number;
  name: string;
  tier: number;
  priceLamports: BN;
  active: boolean;
  totalPayments: BN;
  bump: number;
}

export interface AgentManifest {
  agentId: number;
  agentType: number;
  permission: number;
  active: boolean;
  createdAt: number;
  bump: number;
}

export interface DecisionLogEntry {
  decisionId: BN;
  agentId: number;
  decisionHash: Uint8Array;
  evidenceFamilies: number;
  timestamp: number;
  bump: number;
}

export interface AssessmentRecord {
  assessmentId: BN;
  poolId: Uint8Array;
  riskLevel: number;
  effectiveAprBps: number;
  mliScore: number;
  timestamp: number;
  bump: number;
}

export interface DonationReceipt {
  nonce: number;
  amountLamports: BN;
  sourceHash: Uint8Array;
  correlated: boolean;
  timestamp: number;
  bump: number;
}

// ---------------------------------------------------------------------------
// Account deserializers
//
// Layout assumptions based on Anchor's default serialization:
//   8 bytes discriminator + fields in declaration order
// ---------------------------------------------------------------------------

const DISC_SIZE = 8;

function deserializeAeonConfig(buf: Buffer): AeonConfig {
  let offset = DISC_SIZE;
  const authority = readPubkey(buf, offset);
  offset += 32;
  const activeAgentCount = readU16(buf, offset);
  offset += 2;
  const maxAgents = readU16(buf, offset);
  offset += 2;
  const totalDecisions = readU64(buf, offset);
  offset += 8;
  const circuitBreakerMode = readU8(buf, offset);
  offset += 1;
  const lastHeartbeat = readI64AsNumber(buf, offset);
  offset += 8;
  const bump = readU8(buf, offset);

  return {
    authority,
    activeAgentCount,
    maxAgents,
    totalDecisions,
    circuitBreakerMode,
    lastHeartbeat,
    bump,
  };
}

function deserializeTreasuryConfig(buf: Buffer): TreasuryConfig {
  let offset = DISC_SIZE;
  const authority = readPubkey(buf, offset);
  offset += 32;
  const reserveRatioBps = readU16(buf, offset);
  offset += 2;
  const dailySpendCapBps = readU16(buf, offset);
  offset += 2;
  const bump = readU8(buf, offset);

  return { authority, reserveRatioBps, dailySpendCapBps, bump };
}

function deserializeTreasuryVault(buf: Buffer): TreasuryVaultData {
  let offset = DISC_SIZE;
  const totalBalance = readU64(buf, offset);
  offset += 8;
  const reserveBalance = readU64(buf, offset);
  offset += 8;
  const freeBalance = readU64(buf, offset);
  offset += 8;
  const lastDailyReset = readI64AsNumber(buf, offset);
  offset += 8;
  const dailySpent = readU64(buf, offset);
  offset += 8;
  const bump = readU8(buf, offset);

  return {
    totalBalance,
    reserveBalance,
    freeBalance,
    lastDailyReset,
    dailySpent,
    bump,
  };
}

function deserializeDonationVault(buf: Buffer): DonationVaultData {
  let offset = DISC_SIZE;
  const totalDonated = readU64(buf, offset);
  offset += 8;
  const donationCount = readU32(buf, offset);
  offset += 4;
  const lastSweepTimestamp = readI64AsNumber(buf, offset);
  offset += 8;
  const bump = readU8(buf, offset);

  return { totalDonated, donationCount, lastSweepTimestamp, bump };
}

function deserializeCCSConfig(buf: Buffer): CCSConfig {
  let offset = DISC_SIZE;
  const totalCapBps = readU16(buf, offset);
  offset += 2;
  const floorBps = readU16(buf, offset);
  offset += 2;
  const stipendCapBps = readU16(buf, offset);
  offset += 2;
  const currentRateBps = readU16(buf, offset);
  offset += 2;
  const bump = readU8(buf, offset);

  return { totalCapBps, floorBps, stipendCapBps, currentRateBps, bump };
}

function deserializeProofConfig(buf: Buffer): ProofConfig {
  let offset = DISC_SIZE;
  const authority = readPubkey(buf, offset);
  offset += 32;
  const totalDecisions = readU64(buf, offset);
  offset += 8;
  const totalExecutions = readU64(buf, offset);
  offset += 8;
  const totalBatches = readU32(buf, offset);
  offset += 4;
  const bump = readU8(buf, offset);

  return { authority, totalDecisions, totalExecutions, totalBatches, bump };
}

function deserializeApolloConfig(buf: Buffer): ApolloConfig {
  let offset = DISC_SIZE;
  const authority = readPubkey(buf, offset);
  offset += 32;
  const maxWeightBps = readU16(buf, offset);
  offset += 2;
  const totalAssessments = readU64(buf, offset);
  offset += 8;
  const monitoredPoolCount = readU16(buf, offset);
  offset += 2;
  const bump = readU8(buf, offset);

  return {
    authority,
    maxWeightBps,
    totalAssessments,
    monitoredPoolCount,
    bump,
  };
}

function deserializeHermesConfig(buf: Buffer): HermesConfig {
  let offset = DISC_SIZE;
  const authority = readPubkey(buf, offset);
  offset += 32;
  const totalReports = readU64(buf, offset);
  offset += 8;
  const activeServiceCount = readU16(buf, offset);
  offset += 2;
  const bump = readU8(buf, offset);

  return { authority, totalReports, activeServiceCount, bump };
}

function deserializeAuditorConfig(buf: Buffer): AuditorConfig {
  let offset = DISC_SIZE;
  const authority = readPubkey(buf, offset);
  offset += 32;
  const totalLabels = readU32(buf, offset);
  offset += 4;
  const totalIncidents = readU32(buf, offset);
  offset += 4;
  const totalSnapshots = readU32(buf, offset);
  offset += 4;
  const bump = readU8(buf, offset);

  return { authority, totalLabels, totalIncidents, totalSnapshots, bump };
}

function deserializeServiceEntry(buf: Buffer): ServiceEntry {
  let offset = DISC_SIZE;
  const serviceId = readU16(buf, offset);
  offset += 2;

  // Borsh string: 4 bytes length prefix + UTF-8 bytes
  const nameLen = readU32(buf, offset);
  offset += 4;
  const name = buf.slice(offset, offset + nameLen).toString("utf-8");
  offset += nameLen;

  const tier = readU8(buf, offset);
  offset += 1;
  const priceLamports = readU64(buf, offset);
  offset += 8;
  const active = readBool(buf, offset);
  offset += 1;
  const totalPayments = readU64(buf, offset);
  offset += 8;
  const bump = readU8(buf, offset);

  return { serviceId, name, tier, priceLamports, active, totalPayments, bump };
}

function deserializeAgentManifest(buf: Buffer): AgentManifest {
  let offset = DISC_SIZE;
  const agentId = readU16(buf, offset);
  offset += 2;
  const agentType = readU8(buf, offset);
  offset += 1;
  const permission = readU8(buf, offset);
  offset += 1;
  const active = readBool(buf, offset);
  offset += 1;
  const createdAt = readI64AsNumber(buf, offset);
  offset += 8;
  const bump = readU8(buf, offset);

  return { agentId, agentType, permission, active, createdAt, bump };
}

function deserializeDecisionLog(buf: Buffer): DecisionLogEntry {
  let offset = DISC_SIZE;
  const decisionId = readU64(buf, offset);
  offset += 8;
  const agentId = readU16(buf, offset);
  offset += 2;
  const decisionHash = new Uint8Array(buf.slice(offset, offset + 32));
  offset += 32;
  const evidenceFamilies = readU8(buf, offset);
  offset += 1;
  const timestamp = readI64AsNumber(buf, offset);
  offset += 8;
  const bump = readU8(buf, offset);

  return { decisionId, agentId, decisionHash, evidenceFamilies, timestamp, bump };
}

function deserializeAssessmentRecord(buf: Buffer): AssessmentRecord {
  let offset = DISC_SIZE;
  const assessmentId = readU64(buf, offset);
  offset += 8;
  const poolId = new Uint8Array(buf.slice(offset, offset + 32));
  offset += 32;
  const riskLevel = readU8(buf, offset);
  offset += 1;
  const effectiveAprBps = readU16(buf, offset);
  offset += 2;
  const mliScore = readU16(buf, offset);
  offset += 2;
  const timestamp = readI64AsNumber(buf, offset);
  offset += 8;
  const bump = readU8(buf, offset);

  return {
    assessmentId,
    poolId,
    riskLevel,
    effectiveAprBps,
    mliScore,
    timestamp,
    bump,
  };
}

function deserializeDonationReceipt(buf: Buffer): DonationReceipt {
  let offset = DISC_SIZE;
  const nonce = readU32(buf, offset);
  offset += 4;
  const amountLamports = readU64(buf, offset);
  offset += 8;
  const sourceHash = new Uint8Array(buf.slice(offset, offset + 32));
  offset += 32;
  const correlated = readBool(buf, offset);
  offset += 1;
  const timestamp = readI64AsNumber(buf, offset);
  offset += 8;
  const bump = readU8(buf, offset);

  return { nonce, amountLamports, sourceHash, correlated, timestamp, bump };
}

// ---------------------------------------------------------------------------
// Public fetch functions
// ---------------------------------------------------------------------------

export async function fetchAeonConfig(
  connection: Connection,
): Promise<AeonConfig | null> {
  const [pda] = findAeonConfigPDA();
  const buf = await fetchAndValidate(connection, pda, "AeonConfig");
  if (!buf) return null;
  return deserializeAeonConfig(buf);
}

export async function fetchTreasuryConfig(
  connection: Connection,
): Promise<TreasuryConfig | null> {
  const [pda] = findTreasuryConfigPDA();
  const buf = await fetchAndValidate(connection, pda, "TreasuryConfig");
  if (!buf) return null;
  return deserializeTreasuryConfig(buf);
}

export async function fetchTreasuryVault(
  connection: Connection,
): Promise<TreasuryVaultData | null> {
  const [pda] = findTreasuryVaultPDA();
  const buf = await fetchAndValidate(connection, pda, "TreasuryVault");
  if (!buf) return null;
  return deserializeTreasuryVault(buf);
}

export async function fetchDonationVault(
  connection: Connection,
): Promise<DonationVaultData | null> {
  const [pda] = findDonationVaultPDA();
  const buf = await fetchAndValidate(connection, pda, "DonationVault");
  if (!buf) return null;
  return deserializeDonationVault(buf);
}

export async function fetchCCSConfig(
  connection: Connection,
): Promise<CCSConfig | null> {
  const [pda] = findCCSConfigPDA();
  const buf = await fetchAndValidate(connection, pda, "CcsConfig");
  if (!buf) return null;
  return deserializeCCSConfig(buf);
}

export async function fetchProofConfig(
  connection: Connection,
): Promise<ProofConfig | null> {
  const [pda] = findProofConfigPDA();
  const buf = await fetchAndValidate(connection, pda, "ProofConfig");
  if (!buf) return null;
  return deserializeProofConfig(buf);
}

export async function fetchApolloConfig(
  connection: Connection,
): Promise<ApolloConfig | null> {
  const [pda] = findApolloConfigPDA();
  const buf = await fetchAndValidate(connection, pda, "ApolloConfig");
  if (!buf) return null;
  return deserializeApolloConfig(buf);
}

export async function fetchHermesConfig(
  connection: Connection,
): Promise<HermesConfig | null> {
  const [pda] = findHermesConfigPDA();
  const buf = await fetchAndValidate(connection, pda, "HermesConfig");
  if (!buf) return null;
  return deserializeHermesConfig(buf);
}

export async function fetchAuditorConfig(
  connection: Connection,
): Promise<AuditorConfig | null> {
  const [pda] = findAuditorConfigPDA();
  const buf = await fetchAndValidate(connection, pda, "AuditorConfig");
  if (!buf) return null;
  return deserializeAuditorConfig(buf);
}

export async function fetchServiceEntry(
  connection: Connection,
  serviceId: number,
): Promise<ServiceEntry | null> {
  const [pda] = findServiceEntryPDA(serviceId);
  const buf = await fetchAndValidate(connection, pda, "ServiceEntry");
  if (!buf) return null;
  return deserializeServiceEntry(buf);
}

export async function fetchAgentManifest(
  connection: Connection,
  agentId: number,
): Promise<AgentManifest | null> {
  const [pda] = findAgentManifestPDA(agentId);
  const buf = await fetchAndValidate(connection, pda, "AgentManifest");
  if (!buf) return null;
  return deserializeAgentManifest(buf);
}

export async function fetchDecisionLog(
  connection: Connection,
  decisionId: number | bigint,
): Promise<DecisionLogEntry | null> {
  const [pda] = findDecisionLogPDA(decisionId);
  const buf = await fetchAndValidate(connection, pda, "DecisionLog");
  if (!buf) return null;
  return deserializeDecisionLog(buf);
}

export async function fetchAssessmentRecord(
  connection: Connection,
  assessmentId: number | bigint,
): Promise<AssessmentRecord | null> {
  const [pda] = findAssessmentRecordPDA(assessmentId);
  const buf = await fetchAndValidate(connection, pda, "AssessmentRecord");
  if (!buf) return null;
  return deserializeAssessmentRecord(buf);
}

export async function fetchDonationReceipt(
  connection: Connection,
  nonce: number,
): Promise<DonationReceipt | null> {
  const [pda] = findDonationReceiptPDA(nonce);
  const buf = await fetchAndValidate(connection, pda, "DonationReceipt");
  if (!buf) return null;
  return deserializeDonationReceipt(buf);
}

// ---------------------------------------------------------------------------
// Convenience: fetch SOL balance of a vault PDA
// ---------------------------------------------------------------------------

export async function fetchVaultSolBalance(
  connection: Connection,
  vaultPDA: PublicKey,
): Promise<number> {
  const balance = await connection.getBalance(vaultPDA);
  return balance / LAMPORTS_PER_SOL;
}

// Mark BN-related imports as used
export type { BN };
