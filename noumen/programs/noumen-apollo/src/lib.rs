// STRUCTURAL GUARANTEE: This program contains ZERO CPI calls. APOLLO outputs are read-only PDAs. (A0-14, A0-15)

use anchor_lang::prelude::*;
use shared_types::*;

declare_id!("92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee");

#[program]
pub mod noumen_apollo {
    use super::*;

    /// Initialize the APOLLO risk evaluation engine.
    /// Only callable once by the AEON authority (sovereign governor).
    /// max_weight_bps is hardcoded to APOLLO_MAX_WEIGHT_BPS (4000 = 40%) per A0-16.
    pub fn initialize_apollo(
        ctx: Context<InitializeApollo>,
        args: InitializeApolloArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.apollo_config;
        require!(!config.is_initialized, ApolloError::AlreadyInitialized);

        let clock = Clock::get()?;

        config.authority = args.authority;
        config.aeon_authority = ctx.accounts.aeon_authority.key();
        // A0-16: hardcoded max weight — never from user input
        config.max_weight_bps = APOLLO_MAX_WEIGHT_BPS;
        config.max_mli_pools = args.max_mli_pools;
        config.assessment_count = 0;
        config.pool_count = 0;
        config.is_initialized = true;
        config.mli_tvl_minimum_lamports = args.mli_tvl_minimum_lamports;
        config.created_at = clock.unix_timestamp;
        config.updated_at = clock.unix_timestamp;
        config.bump = ctx.bumps.apollo_config;
        config._reserved = [0u8; 64];

        emit!(ApolloInitialized {
            authority: config.authority,
            aeon_authority: config.aeon_authority,
            max_weight_bps: config.max_weight_bps,
            max_mli_pools: config.max_mli_pools,
            mli_tvl_minimum_lamports: config.mli_tvl_minimum_lamports,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Publish a risk assessment for a pool.
    /// Only callable by the APOLLO authority. Writes to an AssessmentRecord PDA.
    /// A0-23: both headline_apr_bps and effective_apr_bps must be > 0 (always reported together).
    pub fn publish_assessment(
        ctx: Context<PublishAssessment>,
        args: PublishAssessmentArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.apollo_config;
        let clock = Clock::get()?;

        // A0-23: APR pair must always be reported together
        require!(
            args.headline_apr_bps > 0 && args.effective_apr_bps > 0,
            ApolloError::MissingAPRPair
        );

        // Confidence score must be 0-100
        require!(
            args.confidence_score <= 100,
            ApolloError::InvalidConfidenceScore
        );

        // Validate risk_level enum range (0..=3)
        require!(args.risk_level <= 3, ApolloError::InvalidEnumValue);

        let record = &mut ctx.accounts.assessment_record;
        record.pool_address = args.pool_address;
        record.assessment_nonce = args.assessment_nonce;
        record.timestamp = clock.unix_timestamp;
        record.risk_level = args.risk_level;
        record.confidence_score = args.confidence_score;
        record.evidence_families_bitmap = args.evidence_families_bitmap;
        record.composite_score = args.composite_score;
        record.mli_score = args.mli_score;
        record.effective_apr_bps = args.effective_apr_bps;
        record.headline_apr_bps = args.headline_apr_bps;
        record.il_projected_bps = args.il_projected_bps;
        record.sustainability_score = args.sustainability_score;
        record.expiry = args.expiry;
        record.decision_log_ref = args.decision_log_ref;
        record.bump = ctx.bumps.assessment_record;
        record._reserved = [0u8; 48];

        // Increment assessment count
        config.assessment_count = config
            .assessment_count
            .checked_add(1)
            .ok_or(ApolloError::MathOverflow)?;
        config.updated_at = clock.unix_timestamp;

        emit!(AssessmentPublished {
            pool_address: record.pool_address,
            assessment_nonce: record.assessment_nonce,
            risk_level: record.risk_level,
            confidence_score: record.confidence_score,
            composite_score: record.composite_score,
            effective_apr_bps: record.effective_apr_bps,
            headline_apr_bps: record.headline_apr_bps,
            evidence_families_bitmap: record.evidence_families_bitmap,
            decision_log_ref: record.decision_log_ref,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Register a new pool in the APOLLO taxonomy.
    /// Only callable by the APOLLO authority. Creates a PoolTaxonomy PDA.
    pub fn register_pool(
        ctx: Context<RegisterPool>,
        args: RegisterPoolArgs,
    ) -> Result<()> {
        let config = &mut ctx.accounts.apollo_config;
        let clock = Clock::get()?;

        // Validate enum ranges
        require!(args.pool_type <= 3, ApolloError::InvalidEnumValue);
        require!(args.protocol <= 2, ApolloError::InvalidEnumValue);

        let taxonomy = &mut ctx.accounts.pool_taxonomy;
        taxonomy.pool_address = args.pool_address;
        taxonomy.pool_type = args.pool_type;
        taxonomy.protocol = args.protocol;
        taxonomy.risk_profile = args.risk_profile;
        taxonomy.il_sensitivity = args.il_sensitivity;
        taxonomy.pair_class = args.pair_class;
        taxonomy.tvl_lamports = args.tvl_lamports;
        taxonomy.last_updated = clock.unix_timestamp;
        taxonomy.created_at = clock.unix_timestamp;
        taxonomy.bump = ctx.bumps.pool_taxonomy;
        taxonomy._reserved = [0u8; 32];

        // Increment pool count
        config.pool_count = config
            .pool_count
            .checked_add(1)
            .ok_or(ApolloError::MathOverflow)?;
        config.updated_at = clock.unix_timestamp;

        emit!(PoolRegistered {
            pool_address: taxonomy.pool_address,
            pool_type: taxonomy.pool_type,
            protocol: taxonomy.protocol,
            risk_profile: taxonomy.risk_profile,
            tvl_lamports: taxonomy.tvl_lamports,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update an existing pool's taxonomy fields and TVL.
    /// Only callable by the APOLLO authority.
    pub fn update_pool_taxonomy(
        ctx: Context<UpdatePoolTaxonomy>,
        args: UpdatePoolTaxonomyArgs,
    ) -> Result<()> {
        let taxonomy = &mut ctx.accounts.pool_taxonomy;
        let clock = Clock::get()?;

        if let Some(pool_type) = args.pool_type {
            require!(pool_type <= 3, ApolloError::InvalidEnumValue);
            taxonomy.pool_type = pool_type;
        }
        if let Some(protocol) = args.protocol {
            require!(protocol <= 2, ApolloError::InvalidEnumValue);
            taxonomy.protocol = protocol;
        }
        if let Some(risk_profile) = args.risk_profile {
            taxonomy.risk_profile = risk_profile;
        }
        if let Some(il_sensitivity) = args.il_sensitivity {
            taxonomy.il_sensitivity = il_sensitivity;
        }
        if let Some(pair_class) = args.pair_class {
            taxonomy.pair_class = pair_class;
        }
        if let Some(tvl_lamports) = args.tvl_lamports {
            taxonomy.tvl_lamports = tvl_lamports;
        }

        taxonomy.last_updated = clock.unix_timestamp;

        emit!(TaxonomyUpdated {
            pool_address: taxonomy.pool_address,
            pool_type: taxonomy.pool_type,
            protocol: taxonomy.protocol,
            risk_profile: taxonomy.risk_profile,
            tvl_lamports: taxonomy.tvl_lamports,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

// ──────────────────────────────────────────────
// Account Structures
// ──────────────────────────────────────────────

#[account]
pub struct ApolloConfig {
    /// APOLLO agent authority key
    pub authority: Pubkey,
    /// AEON sovereign governor authority (admin)
    pub aeon_authority: Pubkey,
    /// A0-16: hardcoded max 4000 = 40%
    pub max_weight_bps: u16,
    /// Maximum number of pools tracked by MLI
    pub max_mli_pools: u16,
    /// Total number of assessments published
    pub assessment_count: u64,
    /// Total number of registered pools
    pub pool_count: u16,
    /// Whether the config has been initialized
    pub is_initialized: bool,
    /// Minimum TVL in lamports for MLI inclusion
    pub mli_tvl_minimum_lamports: u64,
    /// Timestamp of creation
    pub created_at: i64,
    /// Timestamp of last update
    pub updated_at: i64,
    /// PDA bump seed
    pub bump: u8,
    /// Reserved for future use
    pub _reserved: [u8; 64],
}

#[account]
pub struct AssessmentRecord {
    /// The pool being assessed
    pub pool_address: Pubkey,
    /// Monotonic nonce for this pool's assessments
    pub assessment_nonce: u64,
    /// When this assessment was created
    pub timestamp: i64,
    /// RiskLevel enum as u8 (0=Low, 1=Medium, 2=High, 3=Critical)
    pub risk_level: u8,
    /// Confidence 0-100
    pub confidence_score: u8,
    /// Bitmap of evidence families used (5 families, bits 0-4)
    pub evidence_families_bitmap: u8,
    /// Composite risk score in bps (0-10000)
    pub composite_score: u16,
    /// Market Liquidity Index score
    pub mli_score: u16,
    /// Effective APR in bps (after IL, fees, decay)
    pub effective_apr_bps: u16,
    /// Headline/advertised APR in bps
    pub headline_apr_bps: u16,
    /// Projected impermanent loss in bps
    pub il_projected_bps: u16,
    /// Yield sustainability score
    pub sustainability_score: u16,
    /// Expiry timestamp for this assessment
    pub expiry: i64,
    /// Reference to the DecisionLog PDA in noumen_proof
    pub decision_log_ref: Pubkey,
    /// PDA bump seed
    pub bump: u8,
    /// Reserved for future use
    pub _reserved: [u8; 48],
}

#[account]
pub struct PoolTaxonomy {
    /// The pool's on-chain address
    pub pool_address: Pubkey,
    /// Pool type: 0=CLAMM, 1=ConstProduct, 2=Stable, 3=Weighted
    pub pool_type: u8,
    /// Protocol: 0=Orca, 1=Raydium, 2=Meteora
    pub protocol: u8,
    /// Risk profile classification
    pub risk_profile: u8,
    /// IL sensitivity classification
    pub il_sensitivity: u8,
    /// Pair class classification
    pub pair_class: u8,
    /// Total value locked in lamports
    pub tvl_lamports: u64,
    /// Last time this taxonomy was updated
    pub last_updated: i64,
    /// When this pool was first registered
    pub created_at: i64,
    /// PDA bump seed
    pub bump: u8,
    /// Reserved for future use
    pub _reserved: [u8; 32],
}

// ──────────────────────────────────────────────
// Instruction Arg Structs
// ──────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeApolloArgs {
    /// The APOLLO agent authority pubkey
    pub authority: Pubkey,
    /// Maximum pools for MLI tracking
    pub max_mli_pools: u16,
    /// Minimum TVL for MLI inclusion
    pub mli_tvl_minimum_lamports: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PublishAssessmentArgs {
    pub pool_address: Pubkey,
    pub assessment_nonce: u64,
    pub risk_level: u8,
    pub confidence_score: u8,
    pub evidence_families_bitmap: u8,
    pub composite_score: u16,
    pub mli_score: u16,
    pub effective_apr_bps: u16,
    pub headline_apr_bps: u16,
    pub il_projected_bps: u16,
    pub sustainability_score: u16,
    pub expiry: i64,
    pub decision_log_ref: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RegisterPoolArgs {
    pub pool_address: Pubkey,
    pub pool_type: u8,
    pub protocol: u8,
    pub risk_profile: u8,
    pub il_sensitivity: u8,
    pub pair_class: u8,
    pub tvl_lamports: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdatePoolTaxonomyArgs {
    pub pool_type: Option<u8>,
    pub protocol: Option<u8>,
    pub risk_profile: Option<u8>,
    pub il_sensitivity: Option<u8>,
    pub pair_class: Option<u8>,
    pub tvl_lamports: Option<u64>,
}

// ──────────────────────────────────────────────
// Account Sizes (8 discriminator + field sizes)
// ──────────────────────────────────────────────

// ApolloConfig: 8 + 32 + 32 + 2 + 2 + 8 + 2 + 1 + 8 + 8 + 8 + 1 + 64 = 176
const APOLLO_CONFIG_SIZE: usize = 8 + 32 + 32 + 2 + 2 + 8 + 2 + 1 + 8 + 8 + 8 + 1 + 64;

// AssessmentRecord: 8 + 32 + 8 + 8 + 1 + 1 + 1 + 2 + 2 + 2 + 2 + 2 + 2 + 8 + 32 + 1 + 48 = 160
const ASSESSMENT_RECORD_SIZE: usize = 8 + 32 + 8 + 8 + 1 + 1 + 1 + 2 + 2 + 2 + 2 + 2 + 2 + 8 + 32 + 1 + 48;

// PoolTaxonomy: 8 + 32 + 1 + 1 + 1 + 1 + 1 + 8 + 8 + 8 + 1 + 32 = 102
const POOL_TAXONOMY_SIZE: usize = 8 + 32 + 1 + 1 + 1 + 1 + 1 + 8 + 8 + 8 + 1 + 32;

// ──────────────────────────────────────────────
// Account Contexts
// ──────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeApollo<'info> {
    #[account(
        init,
        payer = aeon_authority,
        space = APOLLO_CONFIG_SIZE,
        seeds = [b"apollo_config"],
        bump
    )]
    pub apollo_config: Account<'info, ApolloConfig>,
    #[account(mut)]
    pub aeon_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: PublishAssessmentArgs)]
pub struct PublishAssessment<'info> {
    #[account(
        mut,
        seeds = [b"apollo_config"],
        bump = apollo_config.bump,
        has_one = authority @ ApolloError::Unauthorized
    )]
    pub apollo_config: Account<'info, ApolloConfig>,
    #[account(
        init,
        payer = authority,
        space = ASSESSMENT_RECORD_SIZE,
        seeds = [
            b"assessment",
            args.pool_address.as_ref(),
            &args.assessment_nonce.to_le_bytes()
        ],
        bump
    )]
    pub assessment_record: Account<'info, AssessmentRecord>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: RegisterPoolArgs)]
pub struct RegisterPool<'info> {
    #[account(
        mut,
        seeds = [b"apollo_config"],
        bump = apollo_config.bump,
        has_one = authority @ ApolloError::Unauthorized
    )]
    pub apollo_config: Account<'info, ApolloConfig>,
    #[account(
        init,
        payer = authority,
        space = POOL_TAXONOMY_SIZE,
        seeds = [b"pool_tax", args.pool_address.as_ref()],
        bump
    )]
    pub pool_taxonomy: Account<'info, PoolTaxonomy>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePoolTaxonomy<'info> {
    #[account(
        seeds = [b"apollo_config"],
        bump = apollo_config.bump,
        has_one = authority @ ApolloError::Unauthorized
    )]
    pub apollo_config: Account<'info, ApolloConfig>,
    #[account(
        mut,
        seeds = [b"pool_tax", pool_taxonomy.pool_address.as_ref()],
        bump = pool_taxonomy.bump,
    )]
    pub pool_taxonomy: Account<'info, PoolTaxonomy>,
    pub authority: Signer<'info>,
}

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────

#[event]
pub struct ApolloInitialized {
    pub authority: Pubkey,
    pub aeon_authority: Pubkey,
    pub max_weight_bps: u16,
    pub max_mli_pools: u16,
    pub mli_tvl_minimum_lamports: u64,
    pub timestamp: i64,
}

#[event]
pub struct AssessmentPublished {
    pub pool_address: Pubkey,
    pub assessment_nonce: u64,
    pub risk_level: u8,
    pub confidence_score: u8,
    pub composite_score: u16,
    pub effective_apr_bps: u16,
    pub headline_apr_bps: u16,
    pub evidence_families_bitmap: u8,
    pub decision_log_ref: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PoolRegistered {
    pub pool_address: Pubkey,
    pub pool_type: u8,
    pub protocol: u8,
    pub risk_profile: u8,
    pub tvl_lamports: u64,
    pub timestamp: i64,
}

#[event]
pub struct TaxonomyUpdated {
    pub pool_address: Pubkey,
    pub pool_type: u8,
    pub protocol: u8,
    pub risk_profile: u8,
    pub tvl_lamports: u64,
    pub timestamp: i64,
}

// ──────────────────────────────────────────────
// Errors
// ──────────────────────────────────────────────

#[error_code]
pub enum ApolloError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Weight exceeds maximum allowed (A0-16: 40%)")]
    WeightExceedsMaximum,
    #[msg("Confidence score must be between 0 and 100")]
    InvalidConfidenceScore,
    #[msg("Both headline_apr_bps and effective_apr_bps must be > 0 (A0-23)")]
    MissingAPRPair,
    #[msg("APOLLO config already initialized")]
    AlreadyInitialized,
    #[msg("Invalid enum value")]
    InvalidEnumValue,
    #[msg("Pool not found")]
    PoolNotFound,
    #[msg("MLI pool cap reached")]
    MLIPoolCapReached,
    #[msg("Math overflow")]
    MathOverflow,
}
