use anchor_lang::prelude::*;
use shared_types::*;

declare_id!("CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe");

#[program]
pub mod noumen_auditor {
    use super::*;

    /// Initialize the Auditor configuration.
    /// Only callable once. The signer becomes the auditor authority;
    /// aeon_authority is recorded for cross-program reference.
    pub fn initialize_auditor(
        ctx: Context<InitializeAuditor>,
        args: InitializeAuditorArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.auditor_config;
        require!(!config.is_initialized, AuditorError::AlreadyInitialized);

        let clock = Clock::get()?;

        config.authority = ctx.accounts.authority.key();
        config.aeon_authority = args.aeon_authority;
        config.total_truth_labels = 0;
        config.total_incidents = 0;
        config.is_initialized = true;
        config.created_at = clock.unix_timestamp;
        config.updated_at = clock.unix_timestamp;
        config.bump = ctx.bumps.auditor_config;
        config._reserved = [0u8; 48];

        emit!(AuditorInitialized {
            authority: config.authority,
            aeon_authority: config.aeon_authority,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Record a truth label for a previously emitted signal/assessment (A0-20).
    /// Only the auditor authority can label outcomes.
    ///
    /// Enforces A0-21: window_end must be <= current time (resolved outcomes only).
    pub fn record_truth_label(
        ctx: Context<RecordTruthLabel>,
        args: RecordTruthLabelArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.auditor_config;

        // A0-20: only auditor authority
        require!(
            ctx.accounts.authority.key() == config.authority,
            AuditorError::Unauthorized
        );

        // Validate htl_result enum range (0=Correct, 1=Incorrect, 2=Inconclusive)
        require!(
            args.htl_result <= 2,
            AuditorError::InvalidLabelValue
        );

        // Validate eol_result enum range
        require!(
            args.eol_result <= 2,
            AuditorError::InvalidLabelValue
        );

        let clock = Clock::get()?;

        // A0-21: resolved outcomes only — window must have ended
        require!(
            args.window_end <= clock.unix_timestamp,
            AuditorError::WindowNotResolved
        );

        let label = &mut ctx.accounts.truth_label;

        label.signal_nonce = args.signal_nonce;
        label.signal_id = args.signal_id;
        label.htl_result = args.htl_result;
        label.eol_result = args.eol_result;
        label.signal_type = args.signal_type;
        label.is_resolved = true;
        label.window_start = args.window_start;
        label.window_end = args.window_end;
        label.resolved_at = clock.unix_timestamp;
        label.evidence_hash = args.evidence_hash;
        label.bump = ctx.bumps.truth_label;
        label._reserved = [0u8; 32];

        // Increment counter
        config.total_truth_labels = config
            .total_truth_labels
            .checked_add(1)
            .ok_or(AuditorError::ArithmeticOverflow)?;
        config.updated_at = clock.unix_timestamp;

        emit!(TruthLabelRecorded {
            signal_nonce: args.signal_nonce,
            signal_id: args.signal_id,
            htl_result: args.htl_result,
            eol_result: args.eol_result,
            signal_type: args.signal_type,
            resolved_at: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Register a new security incident (A0-19).
    /// Only the auditor authority can register incidents.
    /// Status starts as Unconfirmed.
    pub fn register_security_incident(
        ctx: Context<RegisterSecurityIncident>,
        args: RegisterSecurityIncidentArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.auditor_config;

        // A0-19: only auditor authority
        require!(
            ctx.accounts.authority.key() == config.authority,
            AuditorError::Unauthorized
        );

        // Validate incident_type range (0-4: Exploit, RugPull, LiquidityDrain, OracleManipulation, IncentiveCollapse)
        require!(
            args.incident_type <= 4,
            AuditorError::InvalidIncidentType
        );

        let clock = Clock::get()?;
        let incident = &mut ctx.accounts.security_incident;

        incident.incident_nonce = args.incident_nonce;
        incident.affected_pool = args.affected_pool;
        incident.incident_type = args.incident_type;
        incident.status = IncidentStatus::Unconfirmed as u8;
        incident.detected_at = clock.unix_timestamp;
        incident.resolved_at = 0;
        incident.detection_evidence_hash = args.detection_evidence_hash;
        incident.resolution_evidence_hash = [0u8; 32];
        incident.bump = ctx.bumps.security_incident;
        incident._reserved = [0u8; 48];

        // Increment counter
        config.total_incidents = config
            .total_incidents
            .checked_add(1)
            .ok_or(AuditorError::ArithmeticOverflow)?;
        config.updated_at = clock.unix_timestamp;

        emit!(SecurityIncidentRegistered {
            incident_nonce: args.incident_nonce,
            affected_pool: args.affected_pool,
            incident_type: args.incident_type,
            detected_at: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Resolve a previously registered security incident.
    /// Only the auditor authority can resolve. New status must be Confirmed or Dismissed.
    pub fn resolve_incident(
        ctx: Context<ResolveIncident>,
        args: ResolveIncidentArgs,
    ) -> Result<()> {
        let config = &ctx.accounts.auditor_config;

        // Only auditor authority
        require!(
            ctx.accounts.authority.key() == config.authority,
            AuditorError::Unauthorized
        );

        // new_status must be Confirmed (1) or Dismissed (2)
        require!(
            args.new_status == IncidentStatus::Confirmed as u8
                || args.new_status == IncidentStatus::Dismissed as u8,
            AuditorError::InvalidIncidentType
        );

        let clock = Clock::get()?;
        let incident = &mut ctx.accounts.security_incident;

        incident.status = args.new_status;
        incident.resolved_at = clock.unix_timestamp;
        incident.resolution_evidence_hash = args.resolution_evidence_hash;

        emit!(IncidentResolved {
            incident_nonce: incident.incident_nonce,
            new_status: args.new_status,
            resolved_at: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Publish an accuracy snapshot summarizing auditor performance (A0-21).
    /// Only the auditor authority can publish snapshots.
    /// sample_count must be > 0.
    pub fn publish_accuracy_snapshot(
        ctx: Context<PublishAccuracySnapshot>,
        args: PublishAccuracySnapshotArgs,
    ) -> Result<()> {
        let config = &ctx.accounts.auditor_config;

        // A0-21: only auditor authority
        require!(
            ctx.accounts.authority.key() == config.authority,
            AuditorError::Unauthorized
        );

        // Must have at least one sample
        require!(
            args.sample_count > 0,
            AuditorError::InvalidSampleSize
        );

        let clock = Clock::get()?;
        let snapshot = &mut ctx.accounts.accuracy_snapshot;

        snapshot.snapshot_nonce = args.snapshot_nonce;
        snapshot.htl_accuracy_bps = args.htl_accuracy_bps;
        snapshot.eol_positive_rate_bps = args.eol_positive_rate_bps;
        snapshot.brier_score_bps = args.brier_score_bps;
        snapshot.sample_count = args.sample_count;
        snapshot.period_start = args.period_start;
        snapshot.period_end = args.period_end;
        snapshot.snapshot_hash = args.snapshot_hash;
        snapshot.bump = ctx.bumps.accuracy_snapshot;
        snapshot._reserved = [0u8; 32];

        emit!(AccuracySnapshotPublished {
            snapshot_nonce: args.snapshot_nonce,
            htl_accuracy_bps: args.htl_accuracy_bps,
            eol_positive_rate_bps: args.eol_positive_rate_bps,
            brier_score_bps: args.brier_score_bps,
            sample_count: args.sample_count,
            period_start: args.period_start,
            period_end: args.period_end,
            published_at: clock.unix_timestamp,
        });

        Ok(())
    }
}

// ──────────────────────────────────────────────
// Account Structures
// ──────────────────────────────────────────────

#[account]
pub struct AuditorConfig {
    pub authority: Pubkey,
    pub aeon_authority: Pubkey,
    pub total_truth_labels: u64,
    pub total_incidents: u64,
    pub is_initialized: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 48],
}

#[account]
pub struct TruthLabel {
    pub signal_nonce: u64,
    pub signal_id: [u8; 32],
    pub htl_result: u8,
    pub eol_result: u8,
    pub signal_type: u8,
    pub is_resolved: bool,
    pub window_start: i64,
    pub window_end: i64,
    pub resolved_at: i64,
    pub evidence_hash: [u8; 32],
    pub bump: u8,
    pub _reserved: [u8; 32],
}

#[account]
pub struct SecurityIncident {
    pub incident_nonce: u64,
    pub affected_pool: Pubkey,
    pub incident_type: u8,
    pub status: u8,
    pub detected_at: i64,
    pub resolved_at: i64,
    pub detection_evidence_hash: [u8; 32],
    pub resolution_evidence_hash: [u8; 32],
    pub bump: u8,
    pub _reserved: [u8; 48],
}

#[account]
pub struct AccuracySnapshot {
    pub snapshot_nonce: u64,
    pub htl_accuracy_bps: u16,
    pub eol_positive_rate_bps: u16,
    pub brier_score_bps: u16,
    pub sample_count: u32,
    pub period_start: i64,
    pub period_end: i64,
    pub snapshot_hash: [u8; 32],
    pub bump: u8,
    pub _reserved: [u8; 32],
}

// ──────────────────────────────────────────────
// Instruction Arg Structs
// ──────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeAuditorArgs {
    pub aeon_authority: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RecordTruthLabelArgs {
    pub signal_nonce: u64,
    pub signal_id: [u8; 32],
    pub htl_result: u8,
    pub eol_result: u8,
    pub signal_type: u8,
    pub window_start: i64,
    pub window_end: i64,
    pub evidence_hash: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RegisterSecurityIncidentArgs {
    pub incident_nonce: u64,
    pub affected_pool: Pubkey,
    pub incident_type: u8,
    pub detection_evidence_hash: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ResolveIncidentArgs {
    pub incident_nonce: u64,
    pub new_status: u8,
    pub resolution_evidence_hash: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PublishAccuracySnapshotArgs {
    pub snapshot_nonce: u64,
    pub htl_accuracy_bps: u16,
    pub eol_positive_rate_bps: u16,
    pub brier_score_bps: u16,
    pub sample_count: u32,
    pub period_start: i64,
    pub period_end: i64,
    pub snapshot_hash: [u8; 32],
}

// ──────────────────────────────────────────────
// Account Sizes (8-byte discriminator + fields)
// ──────────────────────────────────────────────

// AuditorConfig: 8 + 32 + 32 + 8 + 8 + 1 + 8 + 8 + 1 + 48 = 154
const AUDITOR_CONFIG_SIZE: usize = 8 + 32 + 32 + 8 + 8 + 1 + 8 + 8 + 1 + 48;

// TruthLabel: 8 + 8 + 32 + 1 + 1 + 1 + 1 + 8 + 8 + 8 + 32 + 1 + 32 = 141
const TRUTH_LABEL_SIZE: usize = 8 + 8 + 32 + 1 + 1 + 1 + 1 + 8 + 8 + 8 + 32 + 1 + 32;

// SecurityIncident: 8 + 8 + 32 + 1 + 1 + 8 + 8 + 32 + 32 + 1 + 48 = 179
const SECURITY_INCIDENT_SIZE: usize = 8 + 8 + 32 + 1 + 1 + 8 + 8 + 32 + 32 + 1 + 48;

// AccuracySnapshot: 8 + 8 + 2 + 2 + 2 + 4 + 8 + 8 + 32 + 1 + 32 = 107
const ACCURACY_SNAPSHOT_SIZE: usize = 8 + 8 + 2 + 2 + 2 + 4 + 8 + 8 + 32 + 1 + 32;

// ──────────────────────────────────────────────
// Account Contexts
// ──────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeAuditor<'info> {
    #[account(
        init,
        payer = authority,
        space = AUDITOR_CONFIG_SIZE,
        seeds = [b"auditor_config"],
        bump
    )]
    pub auditor_config: Account<'info, AuditorConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: RecordTruthLabelArgs)]
pub struct RecordTruthLabel<'info> {
    #[account(
        mut,
        seeds = [b"auditor_config"],
        bump = auditor_config.bump,
        constraint = auditor_config.is_initialized @ AuditorError::IncidentNotFound,
    )]
    pub auditor_config: Account<'info, AuditorConfig>,
    #[account(
        init,
        payer = authority,
        space = TRUTH_LABEL_SIZE,
        seeds = [
            b"truth_label",
            args.signal_nonce.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub truth_label: Account<'info, TruthLabel>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: RegisterSecurityIncidentArgs)]
pub struct RegisterSecurityIncident<'info> {
    #[account(
        mut,
        seeds = [b"auditor_config"],
        bump = auditor_config.bump,
        constraint = auditor_config.is_initialized @ AuditorError::IncidentNotFound,
    )]
    pub auditor_config: Account<'info, AuditorConfig>,
    #[account(
        init,
        payer = authority,
        space = SECURITY_INCIDENT_SIZE,
        seeds = [
            b"incident",
            args.incident_nonce.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub security_incident: Account<'info, SecurityIncident>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: ResolveIncidentArgs)]
pub struct ResolveIncident<'info> {
    #[account(
        seeds = [b"auditor_config"],
        bump = auditor_config.bump,
        constraint = auditor_config.is_initialized @ AuditorError::IncidentNotFound,
    )]
    pub auditor_config: Account<'info, AuditorConfig>,
    #[account(
        mut,
        seeds = [
            b"incident",
            args.incident_nonce.to_le_bytes().as_ref(),
        ],
        bump = security_incident.bump,
    )]
    pub security_incident: Account<'info, SecurityIncident>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(args: PublishAccuracySnapshotArgs)]
pub struct PublishAccuracySnapshot<'info> {
    #[account(
        seeds = [b"auditor_config"],
        bump = auditor_config.bump,
        constraint = auditor_config.is_initialized @ AuditorError::IncidentNotFound,
    )]
    pub auditor_config: Account<'info, AuditorConfig>,
    #[account(
        init,
        payer = authority,
        space = ACCURACY_SNAPSHOT_SIZE,
        seeds = [
            b"accuracy",
            args.snapshot_nonce.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub accuracy_snapshot: Account<'info, AccuracySnapshot>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────

#[event]
pub struct AuditorInitialized {
    pub authority: Pubkey,
    pub aeon_authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TruthLabelRecorded {
    pub signal_nonce: u64,
    pub signal_id: [u8; 32],
    pub htl_result: u8,
    pub eol_result: u8,
    pub signal_type: u8,
    pub resolved_at: i64,
}

#[event]
pub struct SecurityIncidentRegistered {
    pub incident_nonce: u64,
    pub affected_pool: Pubkey,
    pub incident_type: u8,
    pub detected_at: i64,
}

#[event]
pub struct IncidentResolved {
    pub incident_nonce: u64,
    pub new_status: u8,
    pub resolved_at: i64,
}

#[event]
pub struct AccuracySnapshotPublished {
    pub snapshot_nonce: u64,
    pub htl_accuracy_bps: u16,
    pub eol_positive_rate_bps: u16,
    pub brier_score_bps: u16,
    pub sample_count: u32,
    pub period_start: i64,
    pub period_end: i64,
    pub published_at: i64,
}

// ──────────────────────────────────────────────
// Errors
// ──────────────────────────────────────────────

#[error_code]
pub enum AuditorError {
    #[msg("Unauthorized: signer is not the auditor authority")]
    Unauthorized,
    #[msg("Auditor already initialized")]
    AlreadyInitialized,
    #[msg("Window has not resolved yet (A0-21: window_end must be <= current time)")]
    WindowNotResolved,
    #[msg("Invalid label value: must be 0 (Correct), 1 (Incorrect), or 2 (Inconclusive)")]
    InvalidLabelValue,
    #[msg("Invalid incident type: must be 0-4")]
    InvalidIncidentType,
    #[msg("Invalid sample size: must be > 0")]
    InvalidSampleSize,
    #[msg("Incident not found or auditor not initialized")]
    IncidentNotFound,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
