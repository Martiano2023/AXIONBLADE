// STRUCTURAL GUARANTEE: Zero CPI calls to noumen_apollo or risk engine. HERMES outputs are terminal. (A0-29, A0-30)

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

        emit!(HermesInitialized {
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
        require!(args.report_type <= 4, HermesError::InvalidReportType);

        // A0-30: HERMES report types exclude operational risk signals.
        // All valid ReportType variants (0-4) are intelligence outputs, not risk signals.
        // Any value > 4 would be a risk signal type and is prohibited.
        require!(args.report_type <= 4, HermesError::RiskSignalProhibited);

        // Validate confidence_score is within range (0-100)
        require!(
            args.confidence_score <= 100,
            HermesError::InvalidConfidenceScore
        );

        let clock = Clock::get()?;
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

// ──────────────────────────────────────────────
// Account Sizes (8-byte discriminator + fields)
// ──────────────────────────────────────────────

// HermesConfig: 8 + 32 + 32 + 8 + 1 + 8 + 8 + 1 + 48 = 146
const HERMES_CONFIG_SIZE: usize = 8 + 32 + 32 + 8 + 1 + 8 + 8 + 1 + 48;

// IntelligenceReport: 8 + 8 + 1 + 32 + 32 + 1 + 8 + 8 + 32 + 1 + 48 = 179
const INTELLIGENCE_REPORT_SIZE: usize = 8 + 8 + 1 + 32 + 32 + 1 + 8 + 8 + 32 + 1 + 48;

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

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────

#[event]
pub struct HermesInitialized {
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
}
