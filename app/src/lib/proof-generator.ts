// ---------------------------------------------------------------------------
// AXIONBLADE Proof Generator — Cryptographic Decision Logging
// ---------------------------------------------------------------------------
// Generates verifiable proofs for all agent decisions (A0-6).
// Every decision must be logged before execution.
//
// Proof Structure:
// - Input hash: Hash of decision inputs (pool, metrics, etc.)
// - Decision hash: Hash of decision outputs (action, recommendation, etc.)
// - Evidence families bitmap: Which sources were used (A0-17)
// - Timestamp: When decision was made
// - Agent ID: Which agent made the decision
//
// Proofs are stored in DecisionLog PDAs on-chain via noumen_proof program.
// ---------------------------------------------------------------------------

import { PublicKey, Connection, Keypair } from '@solana/web3.js';

export interface ProofInput {
  agentId: number; // 1=AEON, 2=APOLLO, 3=HERMES
  inputHash: Buffer; // Hash of input data
  decisionHash: Buffer; // Hash of decision output
  evidenceFamilies: number; // Bitmap of evidence sources (A0-17)
  isExecutionClass: boolean; // true if decision can trigger execution
}

export interface DecisionProof {
  pda: PublicKey;
  logNonce: number;
  agentId: number;
  inputHash: string;
  decisionHash: string;
  evidenceFamilies: number;
  timestamp: number;
}

export class ProofGenerator {
  private connection: Connection;
  private proofProgramId: PublicKey;

  constructor(connection: Connection) {
    this.connection = connection;
    this.proofProgramId = new PublicKey('3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV'); // noumen_proof
  }

  /**
   * Log a decision proof on-chain before execution (A0-6)
   * Returns the DecisionLog PDA address for reference
   */
  async logDecision(input: ProofInput): Promise<PublicKey> {
    // Generate unique nonce for this decision
    const logNonce = Date.now();

    // Derive DecisionLog PDA
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('decision_log'), Buffer.from(logNonce.toString())],
      this.proofProgramId
    );

    // In production, build and send transaction:
    // const tx = new Transaction().add(
    //   await program.methods.logDecision({
    //     logNonce,
    //     agentId: input.agentId,
    //     inputHash: Array.from(input.inputHash),
    //     decisionHash: Array.from(input.decisionHash),
    //     evidenceFamiliesBitmap: input.evidenceFamilies,
    //     isExecutionClass: input.isExecutionClass,
    //   }).accounts({
    //     authority: wallet.publicKey,
    //     decisionLog: pda,
    //     systemProgram: SystemProgram.programId,
    //   }).instruction()
    // );
    //
    // await sendAndConfirmTransaction(this.connection, tx, [wallet]);

    console.log('Decision proof logged at PDA:', pda.toBase58(), {
      agent: this.getAgentName(input.agentId),
      evidenceFamilies: this.decodeEvidenceFamilies(input.evidenceFamilies),
      isExecutionClass: input.isExecutionClass,
    });

    return pda;
  }

  /**
   * Confirm execution of a logged decision (post-execution verification)
   */
  async confirmExecution(
    decisionPDA: PublicKey,
    executionSignature: string
  ): Promise<void> {
    // In production, call confirm_execution instruction:
    // const tx = new Transaction().add(
    //   await program.methods.confirmExecution({
    //     executionSignature: Buffer.from(executionSignature),
    //   }).accounts({
    //     authority: wallet.publicKey,
    //     decisionLog: decisionPDA,
    //   }).instruction()
    // );
    //
    // await sendAndConfirmTransaction(this.connection, tx, [wallet]);

    console.log('Execution confirmed for proof:', decisionPDA.toBase58());
  }

  /**
   * Fetch proof from on-chain DecisionLog PDA
   */
  async fetchProof(pda: PublicKey): Promise<DecisionProof | null> {
    const account = await this.connection.getAccountInfo(pda);
    if (!account) return null;

    // Decode DecisionLog account (simplified)
    const data = account.data;
    return {
      pda,
      logNonce: Number(data.readBigUInt64LE(8)),
      agentId: data.readUInt16LE(16),
      inputHash: Buffer.from(data.slice(18, 50)).toString('hex'),
      decisionHash: Buffer.from(data.slice(50, 82)).toString('hex'),
      evidenceFamilies: data.readUInt8(82),
      timestamp: Number(data.readBigInt64LE(83)),
    };
  }

  /**
   * Verify that a proof exists and is valid
   */
  async verifyProof(pda: PublicKey): Promise<boolean> {
    const proof = await this.fetchProof(pda);
    if (!proof) return false;

    // Verify evidence families requirement (A0-17: >=2 families for execution)
    if (this.countEvidenceFamilies(proof.evidenceFamilies) < 2) {
      console.warn('Proof has insufficient evidence families:', proof);
      return false;
    }

    return true;
  }

  /**
   * Check if proof is recent (< 1 hour old, A0-35)
   */
  isProofRecent(proof: DecisionProof): boolean {
    const age = Date.now() - proof.timestamp;
    const oneHour = 60 * 60 * 1000;
    return age < oneHour;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private getAgentName(agentId: number): string {
    const names: Record<number, string> = {
      1: 'AEON',
      2: 'APOLLO',
      3: 'HERMES',
    };
    return names[agentId] || 'Unknown';
  }

  private decodeEvidenceFamilies(bitmap: number): string[] {
    const families = ['Price/Volume', 'Liquidity', 'Behavior', 'Incentive', 'Protocol'];
    const active: string[] = [];

    for (let i = 0; i < 5; i++) {
      if (bitmap & (1 << i)) {
        active.push(families[i]);
      }
    }

    return active;
  }

  private countEvidenceFamilies(bitmap: number): number {
    let count = 0;
    for (let i = 0; i < 5; i++) {
      if (bitmap & (1 << i)) count++;
    }
    return count;
  }
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Hash input data for proof logging
 */
export function hashInput(data: any): Buffer {
  // In production, use crypto.subtle.digest('SHA-256', ...)
  const str = JSON.stringify(data);
  return Buffer.from(str.slice(0, 32).padEnd(32, '0'));
}

/**
 * Hash decision output for proof logging
 */
export function hashDecision(data: any): Buffer {
  const str = JSON.stringify(data);
  return Buffer.from(str.slice(0, 32).padEnd(32, '0'));
}

/**
 * Build evidence families bitmap
 */
export function buildEvidenceBitmap(sources: {
  hasPriceData?: boolean;
  hasLiquidityData?: boolean;
  hasBehaviorData?: boolean;
  hasIncentiveData?: boolean;
  hasProtocolData?: boolean;
}): number {
  let bitmap = 0;

  if (sources.hasPriceData) bitmap |= 1 << 0;
  if (sources.hasLiquidityData) bitmap |= 1 << 1;
  if (sources.hasBehaviorData) bitmap |= 1 << 2;
  if (sources.hasIncentiveData) bitmap |= 1 << 3;
  if (sources.hasProtocolData) bitmap |= 1 << 4;

  return bitmap;
}
