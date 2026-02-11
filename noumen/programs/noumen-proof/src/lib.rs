use anchor_lang::prelude::*;
use shared_types::*;

declare_id!("3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV");

#[program]
pub mod noumen_proof {
    use super::*;

    /// Initialize the Proof-of-Agency configuration.
    /// Only callable once. Sets the keeper_authority used for housekeeping operations.
    pub fn initialize_proof(
        ctx: Context<InitializeProof>,
        args: InitializeProofArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.proof_config;
        require!(!config.is_initialized, ProofError::AlreadyInitialized);

        config.keeper_authority = args.keeper_authority;
        config.is_initialized = true;
        config.bump = ctx.bumps.proof_config;
        config._reserved = [0u8; 32];

        msg!("noumen_proof: initialized");
        Ok(())
    }

    /// Log an immutable decision record before any execution can occur (A0-6).
    /// Every significant action in NOUMEN must first pass through this gate.
    ///
    /// Enforces:
    /// - A0-18: evidence_families_bitmap only uses bits 0-4 (5 families)
    /// - A0-17: execution-class decisions require >= 2 independent evidence families
    /// - decision_class must be a valid value (0-3)
    pub fn log_decision(
        ctx: Context<LogDecision>,
        args: LogDecisionArgs,
    ) -> Result<()> {
        // A0-18: bitmap must only use bits 0-4 (families A through E)
        require!(
            args.evidence_families_bitmap & 0b11100000 == 0,
            ProofError::InvalidEvidenceBitmap
        );

        // A0-17: execution-class decisions require >= 2 evidence families
        if args.is_execution_class {
            let family_count = count_set_bits(args.evidence_families_bitmap);
            require!(
                family_count >= MIN_EVIDENCE_FAMILIES,
                ProofError::InsufficientEvidenceFamilies
            );
        }

        // Validate decision_class is within range (0-3: Info, LimitedReliability, RiskWarning, DangerSignal)
        require!(
            args.decision_class <= 3,
            ProofError::InvalidDecisionClass
        );

        let clock = Clock::get()?;
        let log = &mut ctx.accounts.decision_log;

        log.agent_id = args.agent_id;
        log.nonce = args.nonce;
        log.input_hash = args.input_hash;
        log.decision_hash = args.decision_hash;
        log.justification_hash = args.justification_hash;
        log.evidence_families_bitmap = args.evidence_families_bitmap;
        log.decision_class = args.decision_class;
        log.timestamp = clock.unix_timestamp;
        log.is_execution_class = args.is_execution_class;
        log.execution_confirmed = false;
        log.bump = ctx.bumps.decision_log;
        log._reserved = [0u8; 48];

        emit!(DecisionLogged {
            agent_id: args.agent_id,
            nonce: args.nonce,
            decision_hash: args.decision_hash,
            evidence_families_bitmap: args.evidence_families_bitmap,
            decision_class: args.decision_class,
            is_execution_class: args.is_execution_class,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Confirm that a previously logged decision has been executed.
    /// Creates an ExecutionResult PDA linked to the DecisionLog.
    ///
    /// A0-6: The ONLY field mutated on DecisionLog is execution_confirmed (false -> true).
    /// This ensures the decision record remains immutable apart from its confirmation flag.
    pub fn confirm_execution(
        ctx: Context<ConfirmExecution>,
        args: ConfirmExecutionArgs,
    ) -> Result<()> {
        // Capture the key before taking mutable borrows
        let decision_log_key = ctx.accounts.decision_log.key();
        let executor_key = ctx.accounts.executor.key();

        let decision_log = &mut ctx.accounts.decision_log;

        // Cannot confirm an already-confirmed execution
        require!(
            !decision_log.execution_confirmed,
            ProofError::ExecutionAlreadyConfirmed
        );

        let clock = Clock::get()?;

        // A0-6: ONLY field mutated on DecisionLog
        decision_log.execution_confirmed = true;

        // Create the execution result record
        let execution_result = &mut ctx.accounts.execution_result;
        execution_result.decision_log = decision_log_key;
        execution_result.result_hash = args.result_hash;
        execution_result.status = args.status;
        execution_result.executed_at = clock.unix_timestamp;
        execution_result.executor = executor_key;
        execution_result.bump = ctx.bumps.execution_result;
        execution_result._reserved = [0u8; 44];

        emit!(ExecutionConfirmed {
            decision_log: decision_log_key,
            result_hash: args.result_hash,
            status: args.status,
            executor: executor_key,
            executed_at: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Submit a batch proof (Merkle root) covering a range of decisions.
    /// Used for efficient on-chain auditability without storing every leaf.
    pub fn submit_batch_proof(
        ctx: Context<SubmitBatchProof>,
        args: SubmitBatchProofArgs,
    ) -> Result<()> {
        // leaf_count must be > 0
        require!(
            args.leaf_count > 0,
            ProofError::InvalidBatchNonce
        );

        // start_timestamp must be strictly before end_timestamp
        require!(
            args.start_timestamp < args.end_timestamp,
            ProofError::InvalidTimestampRange
        );

        let clock = Clock::get()?;
        let batch = &mut ctx.accounts.batch_proof;

        batch.agent_id = args.agent_id;
        batch.batch_nonce = args.batch_nonce;
        batch.merkle_root = args.merkle_root;
        batch.leaf_count = args.leaf_count;
        batch.start_timestamp = args.start_timestamp;
        batch.end_timestamp = args.end_timestamp;
        batch.submitted_at = clock.unix_timestamp;
        batch.bump = ctx.bumps.batch_proof;
        batch._reserved = [0u8; 34];

        emit!(BatchProofSubmitted {
            agent_id: args.agent_id,
            batch_nonce: args.batch_nonce,
            merkle_root: args.merkle_root,
            leaf_count: args.leaf_count,
            start_timestamp: args.start_timestamp,
            end_timestamp: args.end_timestamp,
            submitted_at: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Close an expired batch proof PDA to reclaim rent.
    /// Only callable by the keeper_authority defined in ProofConfig.
    /// The batch must be older than min_age_seconds.
    pub fn close_expired_batch(
        ctx: Context<CloseExpiredBatch>,
        args: CloseExpiredBatchArgs,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let batch = &ctx.accounts.batch_proof;

        // Verify the batch is old enough to close
        let age = clock
            .unix_timestamp
            .checked_sub(batch.submitted_at)
            .ok_or(ProofError::MathOverflow)?;
        require!(
            age >= args.min_age_seconds,
            ProofError::BatchNotExpired
        );

        // Account closing is handled by the close constraint in the Accounts struct.
        // The batch_proof account's lamports will be transferred to rent_destination.

        Ok(())
    }
}

// ──────────────────────────────────────────────
// Account Structures
// ──────────────────────────────────────────────

#[account]
pub struct ProofConfig {
    pub keeper_authority: Pubkey,
    pub is_initialized: bool,
    pub bump: u8,
    pub _reserved: [u8; 32],
}

#[account]
pub struct DecisionLog {
    pub agent_id: u16,
    pub nonce: u64,
    pub input_hash: [u8; 32],
    pub decision_hash: [u8; 32],
    pub justification_hash: [u8; 32],
    pub evidence_families_bitmap: u8,
    pub decision_class: u8,
    pub timestamp: i64,
    pub is_execution_class: bool,
    pub execution_confirmed: bool,
    pub bump: u8,
    pub _reserved: [u8; 48],
}

#[account]
pub struct ExecutionResult {
    pub decision_log: Pubkey,
    pub result_hash: [u8; 32],
    pub status: u8,
    pub executed_at: i64,
    pub executor: Pubkey,
    pub bump: u8,
    pub _reserved: [u8; 44],
}

#[account]
pub struct BatchProof {
    pub agent_id: u16,
    pub batch_nonce: u64,
    pub merkle_root: [u8; 32],
    pub leaf_count: u32,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
    pub submitted_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 34],
}

// ──────────────────────────────────────────────
// Instruction Arg Structs
// ──────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeProofArgs {
    pub keeper_authority: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct LogDecisionArgs {
    pub agent_id: u16,
    pub nonce: u64,
    pub input_hash: [u8; 32],
    pub decision_hash: [u8; 32],
    pub justification_hash: [u8; 32],
    pub evidence_families_bitmap: u8,
    pub decision_class: u8,
    pub is_execution_class: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ConfirmExecutionArgs {
    pub result_hash: [u8; 32],
    pub status: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SubmitBatchProofArgs {
    pub agent_id: u16,
    pub batch_nonce: u64,
    pub merkle_root: [u8; 32],
    pub leaf_count: u32,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CloseExpiredBatchArgs {
    pub min_age_seconds: i64,
}

// ──────────────────────────────────────────────
// Account Sizes (8-byte discriminator + fields)
// ──────────────────────────────────────────────

// ProofConfig: 8 + 32 + 1 + 1 + 32 = 74
const PROOF_CONFIG_SIZE: usize = 8 + 32 + 1 + 1 + 32;

// DecisionLog: 8 + 2 + 8 + 32 + 32 + 32 + 1 + 1 + 8 + 1 + 1 + 1 + 48 = 175
const DECISION_LOG_SIZE: usize = 8 + 2 + 8 + 32 + 32 + 32 + 1 + 1 + 8 + 1 + 1 + 1 + 48;

// ExecutionResult: 8 + 32 + 32 + 1 + 8 + 32 + 1 + 44 = 158
const EXECUTION_RESULT_SIZE: usize = 8 + 32 + 32 + 1 + 8 + 32 + 1 + 44;

// BatchProof: 8 + 2 + 8 + 32 + 4 + 8 + 8 + 8 + 1 + 34 = 113
const BATCH_PROOF_SIZE: usize = 8 + 2 + 8 + 32 + 4 + 8 + 8 + 8 + 1 + 34;

// ──────────────────────────────────────────────
// Account Contexts
// ──────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeProof<'info> {
    #[account(
        init,
        payer = authority,
        space = PROOF_CONFIG_SIZE,
        seeds = [b"proof_config"],
        bump
    )]
    pub proof_config: Account<'info, ProofConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: LogDecisionArgs)]
pub struct LogDecision<'info> {
    #[account(
        init,
        payer = agent_authority,
        space = DECISION_LOG_SIZE,
        seeds = [
            b"decision",
            args.agent_id.to_le_bytes().as_ref(),
            args.nonce.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub decision_log: Account<'info, DecisionLog>,
    #[account(mut)]
    pub agent_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfirmExecution<'info> {
    #[account(mut)]
    pub decision_log: Account<'info, DecisionLog>,
    #[account(
        init,
        payer = executor,
        space = EXECUTION_RESULT_SIZE,
        seeds = [
            b"execution",
            decision_log.key().as_ref(),
        ],
        bump
    )]
    pub execution_result: Account<'info, ExecutionResult>,
    #[account(mut)]
    pub executor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: SubmitBatchProofArgs)]
pub struct SubmitBatchProof<'info> {
    #[account(
        init,
        payer = agent_authority,
        space = BATCH_PROOF_SIZE,
        seeds = [
            b"batch",
            args.agent_id.to_le_bytes().as_ref(),
            args.batch_nonce.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub batch_proof: Account<'info, BatchProof>,
    #[account(mut)]
    pub agent_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseExpiredBatch<'info> {
    #[account(
        seeds = [b"proof_config"],
        bump = proof_config.bump,
        constraint = proof_config.is_initialized @ ProofError::NotInitialized,
        has_one = keeper_authority @ ProofError::Unauthorized,
    )]
    pub proof_config: Account<'info, ProofConfig>,
    #[account(
        mut,
        seeds = [
            b"batch",
            batch_proof.agent_id.to_le_bytes().as_ref(),
            batch_proof.batch_nonce.to_le_bytes().as_ref(),
        ],
        bump = batch_proof.bump,
        close = rent_destination,
    )]
    pub batch_proof: Account<'info, BatchProof>,
    pub keeper_authority: Signer<'info>,
    /// CHECK: Receives the reclaimed rent. Can be any account.
    #[account(mut)]
    pub rent_destination: AccountInfo<'info>,
}

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────

#[event]
pub struct DecisionLogged {
    pub agent_id: u16,
    pub nonce: u64,
    pub decision_hash: [u8; 32],
    pub evidence_families_bitmap: u8,
    pub decision_class: u8,
    pub is_execution_class: bool,
    pub timestamp: i64,
}

#[event]
pub struct ExecutionConfirmed {
    pub decision_log: Pubkey,
    pub result_hash: [u8; 32],
    pub status: u8,
    pub executor: Pubkey,
    pub executed_at: i64,
}

#[event]
pub struct BatchProofSubmitted {
    pub agent_id: u16,
    pub batch_nonce: u64,
    pub merkle_root: [u8; 32],
    pub leaf_count: u32,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
    pub submitted_at: i64,
}

// ──────────────────────────────────────────────
// Errors
// ──────────────────────────────────────────────

#[error_code]
pub enum ProofError {
    #[msg("System already initialized")]
    AlreadyInitialized,
    #[msg("System not initialized")]
    NotInitialized,
    #[msg("Invalid evidence bitmap: only bits 0-4 are valid (A0-18)")]
    InvalidEvidenceBitmap,
    #[msg("Execution-class decisions require >= 2 evidence families (A0-17)")]
    InsufficientEvidenceFamilies,
    #[msg("Invalid decision class: must be 0-3")]
    InvalidDecisionClass,
    #[msg("Execution already confirmed for this decision")]
    ExecutionAlreadyConfirmed,
    #[msg("Invalid batch nonce or leaf count")]
    InvalidBatchNonce,
    #[msg("Invalid timestamp range: start must be before end")]
    InvalidTimestampRange,
    #[msg("Batch proof has not expired yet")]
    BatchNotExpired,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Math overflow")]
    MathOverflow,
}
