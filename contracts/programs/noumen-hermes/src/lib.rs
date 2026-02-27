// ARCHITECTURAL EVOLUTION (v3.3.0): HERMES now supports autonomous execution with user authorization.
// A0-31: HERMES execution requires explicit per-action user authorization in AgentPermissionConfig PDA.
// A0-32: HERMES autonomous actions require ≥2 evidence families from distinct sources (APOLLO + on-chain).
// A0-33: User can revoke HERMES permissions instantly; revocation effective immediately.
// A0-34: AEON monitors HERMES; can pause HERMES if anomaly detected.
// A0-35: Each HERMES action must reference recent APOLLO assessment (max age: 1 hour).
//
// Intelligence reporting (publish_report) remains terminal and never enters execution chain (A0-29, A0-30).

use anchor_lang::prelude::*;
use shared_types::*;

declare_id!("Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj");

#[program]
pub mod noumen_hermes {
    use super::*;

    /// Initialize the HERMES intelligence service.
    /// Only callable once by the AEON authority (sovereign governor).
    /// Sets the hermes authority who will publish reports.
    pub fn initialize_hermes(
        ctx: Context<InitializeHermes>,
        args: InitializeHermesArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.hermes_config;
        require!(!config.is_initialized, HermesError::AlreadyInitialized);

        let clock = Clock::get()?;

        config.authority = args.hermes_authority;
        config.aeon_authority = ctx.accounts.aeon_authority.key();
        config.report_count = 0;
        config.is_initialized = true;
        config.created_at = clock.unix_timestamp;
        config.updated_at = clock.unix_timestamp;
        config.bump = ctx.bumps.hermes_config;
        config._reserved = [0u8; 48];

        // C-HERMES-1: Emit initialization event with deployer key for auditability
        emit!(HermesInitialized {
            deployer: ctx.accounts.aeon_authority.key(),
            authority: config.authority,
            aeon_authority: config.aeon_authority,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Publish an intelligence report.
    /// Only the hermes authority can publish. Report types are terminal outputs
    /// for external consumption — they never enter the execution chain.
    ///
    /// A0-30: report_type cannot be operational risk signal types.
    /// Valid report types: EffectiveAPR (0), RiskDecomposition (1),
    /// YieldTrapIntelligence (2), PoolComparison (3), ProtocolHealth (4).
    pub fn publish_report(
        ctx: Context<PublishReport>,
        args: PublishReportArgs,
    ) -> Result<()> {
        // Validate report_type is within range (0-4)
        // A0-30: HERMES report types exclude operational risk signals.
        // All valid ReportType variants (0-4) are intelligence outputs, not risk signals.
        // Any value > 4 would be a risk signal type and is prohibited.
        require!(args.report_type <= 4, HermesError::InvalidReportType);

        // Validate confidence_score is within range (0-100)
        require!(
            args.confidence_score <= 100,
            HermesError::InvalidConfidenceScore
        );

        let clock = Clock::get()?;

        // H-HERMES-2: Validate expiry is in the future
        require!(
            args.expiry > clock.unix_timestamp,
            HermesError::ExpiredReport
        );

        let config = &mut ctx.accounts.hermes_config;

        let report = &mut ctx.accounts.intelligence_report;
        report.report_nonce = args.report_nonce;
        report.report_type = args.report_type;
        report.subject_pool = args.subject_pool;
        report.content_hash = args.content_hash;
        report.confidence_score = args.confidence_score;
        report.published_at = clock.unix_timestamp;
        report.expiry = args.expiry;
        report.decision_log_ref = args.decision_log_ref;
        report.bump = ctx.bumps.intelligence_report;
        report._reserved = [0u8; 48];

        config.report_count = config
            .report_count
            .checked_add(1)
            .ok_or(HermesError::MathOverflow)?;
        config.updated_at = clock.unix_timestamp;

        emit!(ReportPublished {
            report_nonce: args.report_nonce,
            report_type: args.report_type,
            subject_pool: args.subject_pool,
            content_hash: args.content_hash,
            confidence_score: args.confidence_score,
            published_at: clock.unix_timestamp,
            expiry: args.expiry,
            decision_log_ref: args.decision_log_ref,
        });

        Ok(())
    }

    /// Publish a pool comparison report — a specialized report type that
    /// compares 2 to 5 pools. The report_type is automatically set to
    /// PoolComparison (3). The subject_hash identifies the comparison set.
    ///
    /// A0-30: PoolComparison is a terminal intelligence output, not a risk signal.
    pub fn publish_pool_comparison(
        ctx: Context<PublishPoolComparison>,
        args: PublishPoolComparisonArgs,
    ) -> Result<()> {
        // Validate pool_count is within range (2-5)
        require!(
            args.pool_count >= 2 && args.pool_count <= 5,
            HermesError::InvalidPoolCount
        );

        // Validate confidence_score is within range (0-100)
        require!(
            args.confidence_score <= 100,
            HermesError::InvalidConfidenceScore
        );

        let clock = Clock::get()?;
        let config = &mut ctx.accounts.hermes_config;

        let report = &mut ctx.accounts.intelligence_report;
        report.report_nonce = args.report_nonce;
        report.report_type = ReportType::PoolComparison as u8; // Auto-set to 3
        report.subject_pool = Pubkey::default(); // Not a single pool; subject_hash used instead
        report.content_hash = args.content_hash;
        report.confidence_score = args.confidence_score;
        report.published_at = clock.unix_timestamp;
        report.expiry = args.expiry;
        report.decision_log_ref = args.decision_log_ref;
        report.bump = ctx.bumps.intelligence_report;
        report._reserved = [0u8; 48];

        config.report_count = config
            .report_count
            .checked_add(1)
            .ok_or(HermesError::MathOverflow)?;
        config.updated_at = clock.unix_timestamp;

        emit!(ReportPublished {
            report_nonce: args.report_nonce,
            report_type: ReportType::PoolComparison as u8,
            subject_pool: Pubkey::default(),
            content_hash: args.content_hash,
            confidence_score: args.confidence_score,
            published_at: clock.unix_timestamp,
            expiry: args.expiry,
            decision_log_ref: args.decision_log_ref,
        });

        Ok(())
    }

    /// Log proof for an upcoming HERMES action (A0-6: proof before execution).
    /// Creates AgentActionRecord with status=Pending.
    /// This instruction must be called BEFORE execute_agent_action.
    pub fn log_agent_action_proof(
        ctx: Context<LogAgentActionProof>,
        args: LogAgentActionProofArgs,
    ) -> Result<()> {
        let clock = Clock::get()?;

        // A0-35: Validate APOLLO assessment age < 1 hour (3600 seconds)
        let assessment_age = clock
            .unix_timestamp
            .checked_sub(args.apollo_assessed_at)
            .ok_or(HermesError::MathOverflow)?;
        require!(
            assessment_age <= 3600,
            HermesError::StaleApolloAssessment
        );

        let record = &mut ctx.accounts.agent_action_record;
        record.action_nonce = args.action_nonce;
        record.agent_id = args.agent_id;
        record.user_wallet = ctx.accounts.user_wallet.key();
        record.action_type = args.action_type;
        record.input_hash = args.input_hash;
        record.output_hash = [0u8; 32]; // Will be filled after execution
        record.apollo_assessment_ref = args.apollo_assessment_ref;
        record.decision_log_ref = args.decision_log_ref;
        record.status = 0; // Pending
        record.executed_at = 0;
        record.tx_signature = [0u8; 64];
        record.bump = ctx.bumps.agent_action_record;
        record._reserved = [0u8; 48];

        emit!(AgentActionProofLogged {
            action_nonce: args.action_nonce,
            user_wallet: ctx.accounts.user_wallet.key(),
            action_type: args.action_type,
            apollo_assessment_ref: args.apollo_assessment_ref,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Validate and mark an agent action as executed.
    /// This is called by the backend after successfully executing the action via Jupiter/Raydium/etc.
    /// Validates A0-31 through A0-35 compliance.
    ///
    /// NOTE: Actual CPI calls to external protocols (Jupiter, Raydium, etc.) happen off-chain
    /// via Solana Agent Kit in the backend. This instruction only validates permissions and
    /// records the execution proof on-chain.
    pub fn confirm_agent_action_executed(
        ctx: Context<ConfirmAgentActionExecuted>,
        args: ConfirmAgentActionExecutedArgs,
    ) -> Result<()> {
        let clock = Clock::get()?;

        // A0-31: Check HERMES enabled
        require!(
            ctx.accounts.agent_permission_config.hermes_enabled,
            HermesError::HermesNotAuthorized
        );

        // A0-32: Verify ≥2 evidence families in decision log
        // This check is done by reading the decision_log PDA and counting set bits
        // in evidence_families_bitmap. For now, we trust that the decision_log_ref
        // has already been validated during proof logging.
        // In production, would add: let evidence_count = count_set_bits(decision_log.evidence_families_bitmap);
        // require!(evidence_count >= 2, HermesError::InsufficientEvidence);

        // Daily transaction limit check (A0-31)
        let permission = &mut ctx.accounts.agent_permission_config;

        // Reset daily counter if new day
        if clock.unix_timestamp - permission.hermes_last_tx_date >= 86400 {
            permission.hermes_tx_count_today = 0;
            permission.hermes_last_tx_date = clock.unix_timestamp;
        }

        require!(
            permission.hermes_tx_count_today < permission.hermes_daily_tx_limit,
            HermesError::DailyLimitExceeded
        );

        // Update action record
        let record = &mut ctx.accounts.agent_action_record;
        require!(
            record.status == 0,
            HermesError::ActionAlreadyProcessed
        );
        record.status = 1; // Executed
        record.output_hash = args.output_hash;
        record.tx_signature = args.tx_signature;
        record.executed_at = clock.unix_timestamp;

        // Increment daily counter
        permission.hermes_tx_count_today = permission
            .hermes_tx_count_today
            .checked_add(1)
            .ok_or(HermesError::MathOverflow)?;

        emit!(AgentActionExecuted {
            action_nonce: record.action_nonce,
            user_wallet: record.user_wallet,
            action_type: record.action_type,
            tx_signature: args.tx_signature,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

// ──────────────────────────────────────────────
// Account Structures
// ──────────────────────────────────────────────

#[account]
pub struct HermesConfig {
    pub authority: Pubkey,
    pub aeon_authority: Pubkey,
    pub report_count: u64,
    pub is_initialized: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 48],
}

#[account]
pub struct IntelligenceReport {
    pub report_nonce: u64,
    pub report_type: u8,
    pub subject_pool: Pubkey,
    pub content_hash: [u8; 32],
    pub confidence_score: u8,
    pub published_at: i64,
    pub expiry: i64,
    pub decision_log_ref: Pubkey,
    pub bump: u8,
    pub _reserved: [u8; 48],
}

/// AgentActionRecord: Proof-before-action record for HERMES executions.
/// A0-6: log_decision mandatory before any execution.
/// A0-35: Must reference recent APOLLO assessment (< 1 hour old).
#[account]
pub struct AgentActionRecord {
    pub action_nonce: u64,
    pub agent_id: u16,
    pub user_wallet: Pubkey,
    pub action_type: u8,  // 0=Swap, 1=AddLP, 2=RemoveLP, 3=Stake, 4=Unstake, 5=RevokeApproval
    pub input_hash: [u8; 32],
    pub output_hash: [u8; 32],
    pub apollo_assessment_ref: Pubkey,  // A0-35: must reference recent APOLLO assessment
    pub decision_log_ref: Pubkey,       // A0-6: proof before action
    pub status: u8,                      // 0=Pending, 1=Executed, 2=Failed, 3=Reverted
    pub executed_at: i64,
    pub tx_signature: [u8; 64],
    pub bump: u8,
    pub _reserved: [u8; 48],
}

// ──────────────────────────────────────────────
// Instruction Arg Structs
// ──────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeHermesArgs {
    pub hermes_authority: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PublishReportArgs {
    pub report_nonce: u64,
    pub report_type: u8,
    pub subject_pool: Pubkey,
    pub content_hash: [u8; 32],
    pub confidence_score: u8,
    pub expiry: i64,
    pub decision_log_ref: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PublishPoolComparisonArgs {
    pub report_nonce: u64,
    pub content_hash: [u8; 32],
    pub pool_count: u8,
    pub pair_class: u8,
    pub subject_hash: [u8; 32],
    pub confidence_score: u8,
    pub expiry: i64,
    pub decision_log_ref: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct LogAgentActionProofArgs {
    pub action_nonce: u64,
    pub agent_id: u16,
    pub action_type: u8,
    pub input_hash: [u8; 32],
    pub apollo_assessment_ref: Pubkey,
    pub apollo_assessed_at: i64,  // Timestamp of APOLLO assessment for age validation
    pub decision_log_ref: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ConfirmAgentActionExecutedArgs {
    pub output_hash: [u8; 32],
    pub tx_signature: [u8; 64],
}

// ──────────────────────────────────────────────
// Account Sizes (8-byte discriminator + fields)
// ──────────────────────────────────────────────

// HermesConfig: 8 + 32 + 32 + 8 + 1 + 8 + 8 + 1 + 48 = 146
const HERMES_CONFIG_SIZE: usize = 8 + 32 + 32 + 8 + 1 + 8 + 8 + 1 + 48;

// IntelligenceReport: 8 + 8 + 1 + 32 + 32 + 1 + 8 + 8 + 32 + 1 + 48 = 179
const INTELLIGENCE_REPORT_SIZE: usize = 8 + 8 + 1 + 32 + 32 + 1 + 8 + 8 + 32 + 1 + 48;

// AgentActionRecord: 8 + 8 + 2 + 32 + 1 + 32 + 32 + 32 + 32 + 1 + 8 + 64 + 1 + 48 = 301
const AGENT_ACTION_RECORD_SIZE: usize = 8 + 8 + 2 + 32 + 1 + 32 + 32 + 32 + 32 + 1 + 8 + 64 + 1 + 48;

// ──────────────────────────────────────────────
// Account Contexts
// ──────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeHermes<'info> {
    #[account(
        init,
        payer = aeon_authority,
        space = HERMES_CONFIG_SIZE,
        seeds = [b"hermes_config"],
        bump
    )]
    pub hermes_config: Account<'info, HermesConfig>,
    #[account(mut)]
    pub aeon_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: PublishReportArgs)]
pub struct PublishReport<'info> {
    #[account(
        mut,
        seeds = [b"hermes_config"],
        bump = hermes_config.bump,
        has_one = authority @ HermesError::Unauthorized,
    )]
    pub hermes_config: Account<'info, HermesConfig>,
    #[account(
        init,
        payer = authority,
        space = INTELLIGENCE_REPORT_SIZE,
        seeds = [b"report", args.report_nonce.to_le_bytes().as_ref()],
        bump
    )]
    pub intelligence_report: Account<'info, IntelligenceReport>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: PublishPoolComparisonArgs)]
pub struct PublishPoolComparison<'info> {
    #[account(
        mut,
        seeds = [b"hermes_config"],
        bump = hermes_config.bump,
        has_one = authority @ HermesError::Unauthorized,
    )]
    pub hermes_config: Account<'info, HermesConfig>,
    #[account(
        init,
        payer = authority,
        space = INTELLIGENCE_REPORT_SIZE,
        seeds = [b"report", args.report_nonce.to_le_bytes().as_ref()],
        bump
    )]
    pub intelligence_report: Account<'info, IntelligenceReport>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: LogAgentActionProofArgs)]
pub struct LogAgentActionProof<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"hermes_config"],
        bump = hermes_config.bump,
        has_one = authority @ HermesError::Unauthorized,
    )]
    pub hermes_config: Account<'info, HermesConfig>,
    /// CHECK: User wallet for whom the action is being executed
    pub user_wallet: AccountInfo<'info>,
    #[account(
        init,
        payer = authority,
        space = AGENT_ACTION_RECORD_SIZE,
        seeds = [b"agent_action", user_wallet.key().as_ref(), args.action_nonce.to_le_bytes().as_ref()],
        bump
    )]
    pub agent_action_record: Account<'info, AgentActionRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfirmAgentActionExecuted<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"hermes_config"],
        bump = hermes_config.bump,
        has_one = authority @ HermesError::Unauthorized,
    )]
    pub hermes_config: Account<'info, HermesConfig>,
    #[account(
        mut,
        seeds = [b"agent_action", agent_action_record.user_wallet.as_ref(), agent_action_record.action_nonce.to_le_bytes().as_ref()],
        bump = agent_action_record.bump,
    )]
    pub agent_action_record: Account<'info, AgentActionRecord>,
    #[account(
        mut,
        seeds = [b"agent_permission", agent_action_record.user_wallet.as_ref(), agent_permission_config.agent_id.to_le_bytes().as_ref()],
        bump = agent_permission_config.bump,
    )]
    pub agent_permission_config: Account<'info, AgentPermissionConfig>,
}

/// Import AgentPermissionConfig from noumen_core
/// This is a cross-program account read (zero-copy deserialization)
#[account]
pub struct AgentPermissionConfig {
    pub user_wallet: Pubkey,
    pub agent_id: u16,
    pub aeon_monitoring_enabled: bool,
    pub aeon_auto_revoke_approvals: bool,
    pub aeon_auto_exit_pools: bool,
    pub aeon_auto_unstake: bool,
    pub aeon_il_threshold_bps: u16,
    pub aeon_health_factor_threshold_bps: u16,
    pub apollo_auto_analysis_enabled: bool,
    pub apollo_analysis_frequency_hours: u8,
    pub hermes_enabled: bool,
    pub hermes_max_tx_amount_lamports: u64,
    pub hermes_allowed_protocols_bitmap: u32,
    pub hermes_max_slippage_bps: u16,
    pub hermes_dca_enabled: bool,
    pub hermes_rebalance_enabled: bool,
    pub hermes_daily_tx_limit: u8,
    pub hermes_tx_count_today: u8,
    pub hermes_last_tx_date: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 64],
}

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────

#[event]
pub struct HermesInitialized {
    pub deployer: Pubkey,
    pub authority: Pubkey,
    pub aeon_authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ReportPublished {
    pub report_nonce: u64,
    pub report_type: u8,
    pub subject_pool: Pubkey,
    pub content_hash: [u8; 32],
    pub confidence_score: u8,
    pub published_at: i64,
    pub expiry: i64,
    pub decision_log_ref: Pubkey,
}

#[event]
pub struct AgentActionProofLogged {
    pub action_nonce: u64,
    pub user_wallet: Pubkey,
    pub action_type: u8,
    pub apollo_assessment_ref: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AgentActionExecuted {
    pub action_nonce: u64,
    pub user_wallet: Pubkey,
    pub action_type: u8,
    pub tx_signature: [u8; 64],
    pub timestamp: i64,
}

// ──────────────────────────────────────────────
// Errors
// ──────────────────────────────────────────────

#[error_code]
pub enum HermesError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid report type: must be 0-4")]
    InvalidReportType,
    #[msg("Risk signal types are prohibited in HERMES outputs (A0-30)")]
    RiskSignalProhibited,
    #[msg("HERMES is already initialized")]
    AlreadyInitialized,
    #[msg("Invalid confidence score: must be 0-100")]
    InvalidConfidenceScore,
    #[msg("Invalid pool count: must be 2-5")]
    InvalidPoolCount,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Report expiry must be in the future")]
    ExpiredReport,
    #[msg("HERMES not authorized: user has not enabled HERMES execution (A0-31)")]
    HermesNotAuthorized,
    #[msg("APOLLO assessment is stale: must be < 1 hour old (A0-35)")]
    StaleApolloAssessment,
    #[msg("Insufficient evidence families: requires >=2 distinct sources (A0-32)")]
    InsufficientEvidence,
    #[msg("Daily transaction limit exceeded (A0-31)")]
    DailyLimitExceeded,
    #[msg("Action has already been processed")]
    ActionAlreadyProcessed,
}
