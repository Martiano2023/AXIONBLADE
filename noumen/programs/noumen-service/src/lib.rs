use anchor_lang::prelude::*;
use shared_types::*;

declare_id!("9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY");

// ──────────────────────────────────────────────
// Program
// ──────────────────────────────────────────────

#[program]
pub mod noumen_service {
    use super::*;

    /// Initializes the global service configuration PDA.
    /// Can only be called once by the super_authority (deployer).
    pub fn initialize_service_config(
        ctx: Context<InitializeServiceConfig>,
        aeon_authority: Pubkey,
        keeper_authority: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.service_config;

        require!(!config.is_initialized, NoumenServiceError::AlreadyInitialized);

        config.aeon_authority = aeon_authority;
        config.keeper_authority = keeper_authority;
        config.service_count = 0;
        config.is_initialized = true;
        config.bump = ctx.bumps.service_config;
        config._reserved = [0u8; 32];

        emit!(ServiceConfigInitialized {
            aeon_authority,
            keeper_authority,
        });

        Ok(())
    }

    /// Registers a new service entry.
    /// Signer must be aeon_authority. Validates A0-8 price margin.
    pub fn register_service(
        ctx: Context<RegisterService>,
        service_id: u16,
        owning_agent_id: u16,
        service_tier: u8,
        price_lamports: u64,
        cost_lamports: u64,
    ) -> Result<()> {
        require!(
            ctx.accounts.aeon_authority.key() == ctx.accounts.service_config.aeon_authority,
            NoumenServiceError::Unauthorized
        );

        // A0-8: price >= cost * 12000 / 10000 (i.e., cost + 20% margin minimum)
        let min_price = cost_lamports
            .checked_mul(PRICE_MARGIN_MULTIPLIER_BPS as u64)
            .ok_or(NoumenServiceError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(NoumenServiceError::MathOverflow)?;

        require!(
            price_lamports >= min_price,
            NoumenServiceError::PriceBelowMinMargin
        );

        let clock = Clock::get()?;
        let now = clock.unix_timestamp;

        // Populate service entry
        let entry = &mut ctx.accounts.service_entry;
        entry.service_id = service_id;
        entry.owning_agent_id = owning_agent_id;
        entry.service_tier = service_tier;
        entry.level = 0; // Declared
        entry.price_lamports = price_lamports;
        entry.cost_lamports = cost_lamports;
        entry.min_price_lamports = min_price;
        entry.request_count_7d = 0;
        entry.revenue_7d_lamports = 0;
        entry.subsidy_start = 0;
        entry.created_at = now;
        entry.updated_at = now;
        entry.requires_not_advice_flag = true;  // A0-26
        entry.requires_uncertainty_flags = true; // A0-26
        entry.bump = ctx.bumps.service_entry;
        entry._reserved = [0u8; 48];

        // Increment service count
        let config = &mut ctx.accounts.service_config;
        config.service_count = config
            .service_count
            .checked_add(1)
            .ok_or(NoumenServiceError::MathOverflow)?;

        emit!(ServiceRegistered {
            service_id,
            owning_agent_id,
            service_tier,
            price_lamports,
            cost_lamports,
            min_price_lamports: min_price,
        });

        Ok(())
    }

    /// Updates the price and cost of an existing service.
    /// Revalidates A0-8 margin constraint.
    pub fn update_service_price(
        ctx: Context<UpdateServicePrice>,
        _service_id: u16,
        new_price: u64,
        new_cost: u64,
    ) -> Result<()> {
        let config = &ctx.accounts.service_config;
        require!(
            ctx.accounts.aeon_authority.key() == config.aeon_authority,
            NoumenServiceError::Unauthorized
        );

        // A0-8: revalidate margin
        let min_price = new_cost
            .checked_mul(PRICE_MARGIN_MULTIPLIER_BPS as u64)
            .ok_or(NoumenServiceError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(NoumenServiceError::MathOverflow)?;

        require!(
            new_price >= min_price,
            NoumenServiceError::PriceBelowMinMargin
        );

        let clock = Clock::get()?;
        let entry = &mut ctx.accounts.service_entry;
        entry.price_lamports = new_price;
        entry.cost_lamports = new_cost;
        entry.min_price_lamports = min_price;
        entry.updated_at = clock.unix_timestamp;

        emit!(ServicePriceUpdated {
            service_id: entry.service_id,
            new_price,
            new_cost,
            min_price_lamports: min_price,
        });

        Ok(())
    }

    /// Updates the service level (Declared <-> Simulated <-> Active).
    /// Only allows +-1 transitions; no skipping levels.
    pub fn update_service_level(
        ctx: Context<UpdateServiceLevel>,
        _service_id: u16,
        new_level: u8,
    ) -> Result<()> {
        let config = &ctx.accounts.service_config;
        require!(
            ctx.accounts.aeon_authority.key() == config.aeon_authority,
            NoumenServiceError::Unauthorized
        );

        let entry = &mut ctx.accounts.service_entry;
        let old_level = entry.level;

        // Only allow +-1 transitions: 0->1, 1->0, 1->2, 2->1
        let valid_transition = (old_level == 0 && new_level == 1)
            || (old_level == 1 && new_level == 0)
            || (old_level == 1 && new_level == 2)
            || (old_level == 2 && new_level == 1);

        require!(valid_transition, NoumenServiceError::InvalidLevelTransition);

        let clock = Clock::get()?;
        entry.level = new_level;
        entry.updated_at = clock.unix_timestamp;

        emit!(ServiceLevelChanged {
            service_id: entry.service_id,
            old_level,
            new_level,
        });

        Ok(())
    }

    /// Updates rolling 7-day metrics for a service.
    /// Signer must be keeper_authority.
    pub fn update_service_metrics(
        ctx: Context<UpdateServiceMetrics>,
        _service_id: u16,
        request_count_7d: u16,
        revenue_7d_lamports: u64,
    ) -> Result<()> {
        let config = &ctx.accounts.service_config;
        require!(
            ctx.accounts.keeper_authority.key() == config.keeper_authority,
            NoumenServiceError::Unauthorized
        );

        let clock = Clock::get()?;
        let entry = &mut ctx.accounts.service_entry;
        entry.request_count_7d = request_count_7d;
        entry.revenue_7d_lamports = revenue_7d_lamports;
        entry.updated_at = clock.unix_timestamp;

        emit!(ServiceMetricsUpdated {
            service_id: entry.service_id,
            request_count_7d,
            revenue_7d_lamports,
        });

        Ok(())
    }
}

// ──────────────────────────────────────────────
// Accounts (PDAs)
// ──────────────────────────────────────────────

#[account]
pub struct ServiceConfig {
    pub aeon_authority: Pubkey,     // 32
    pub keeper_authority: Pubkey,   // 32
    pub service_count: u16,        // 2
    pub is_initialized: bool,      // 1
    pub bump: u8,                  // 1
    pub _reserved: [u8; 32],       // 32
    // Total: 8 (discriminator) + 32 + 32 + 2 + 1 + 1 + 32 = 108
}

#[account]
pub struct ServiceEntry {
    pub service_id: u16,                  // 2
    pub owning_agent_id: u16,             // 2
    pub service_tier: u8,                 // 1 (0=Entry, 1=Premium, 2=B2B)
    pub level: u8,                        // 1 (0=Declared, 1=Simulated, 2=Active)
    pub price_lamports: u64,              // 8
    pub cost_lamports: u64,               // 8
    pub min_price_lamports: u64,          // 8 (computed: cost * 12000 / 10000 per A0-8)
    pub request_count_7d: u16,            // 2
    pub revenue_7d_lamports: u64,         // 8
    pub subsidy_start: i64,               // 8
    pub created_at: i64,                  // 8
    pub updated_at: i64,                  // 8
    pub requires_not_advice_flag: bool,   // 1 (A0-26)
    pub requires_uncertainty_flags: bool, // 1 (A0-26)
    pub bump: u8,                         // 1
    pub _reserved: [u8; 48],              // 48
    // Total: 8 (discriminator) + 2+2+1+1+8+8+8+2+8+8+8+8+1+1+1+48 = 123
}

// ──────────────────────────────────────────────
// Instruction contexts
// ──────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeServiceConfig<'info> {
    #[account(
        init,
        payer = super_authority,
        space = 8 + 32 + 32 + 2 + 1 + 1 + 32,
        seeds = [b"service_config"],
        bump,
    )]
    pub service_config: Account<'info, ServiceConfig>,

    #[account(mut)]
    pub super_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(service_id: u16)]
pub struct RegisterService<'info> {
    #[account(
        mut,
        seeds = [b"service_config"],
        bump = service_config.bump,
    )]
    pub service_config: Account<'info, ServiceConfig>,

    #[account(
        init,
        payer = aeon_authority,
        space = 8 + 2 + 2 + 1 + 1 + 8 + 8 + 8 + 2 + 8 + 8 + 8 + 8 + 1 + 1 + 1 + 48,
        seeds = [b"service", service_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub service_entry: Account<'info, ServiceEntry>,

    #[account(mut)]
    pub aeon_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(service_id: u16)]
pub struct UpdateServicePrice<'info> {
    #[account(
        seeds = [b"service_config"],
        bump = service_config.bump,
    )]
    pub service_config: Account<'info, ServiceConfig>,

    #[account(
        mut,
        seeds = [b"service", service_id.to_le_bytes().as_ref()],
        bump = service_entry.bump,
    )]
    pub service_entry: Account<'info, ServiceEntry>,

    pub aeon_authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(service_id: u16)]
pub struct UpdateServiceLevel<'info> {
    #[account(
        seeds = [b"service_config"],
        bump = service_config.bump,
    )]
    pub service_config: Account<'info, ServiceConfig>,

    #[account(
        mut,
        seeds = [b"service", service_id.to_le_bytes().as_ref()],
        bump = service_entry.bump,
    )]
    pub service_entry: Account<'info, ServiceEntry>,

    pub aeon_authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(service_id: u16)]
pub struct UpdateServiceMetrics<'info> {
    #[account(
        seeds = [b"service_config"],
        bump = service_config.bump,
    )]
    pub service_config: Account<'info, ServiceConfig>,

    #[account(
        mut,
        seeds = [b"service", service_id.to_le_bytes().as_ref()],
        bump = service_entry.bump,
    )]
    pub service_entry: Account<'info, ServiceEntry>,

    pub keeper_authority: Signer<'info>,
}

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────

#[event]
pub struct ServiceConfigInitialized {
    pub aeon_authority: Pubkey,
    pub keeper_authority: Pubkey,
}

#[event]
pub struct ServiceRegistered {
    pub service_id: u16,
    pub owning_agent_id: u16,
    pub service_tier: u8,
    pub price_lamports: u64,
    pub cost_lamports: u64,
    pub min_price_lamports: u64,
}

#[event]
pub struct ServicePriceUpdated {
    pub service_id: u16,
    pub new_price: u64,
    pub new_cost: u64,
    pub min_price_lamports: u64,
}

#[event]
pub struct ServiceLevelChanged {
    pub service_id: u16,
    pub old_level: u8,
    pub new_level: u8,
}

#[event]
pub struct ServiceMetricsUpdated {
    pub service_id: u16,
    pub request_count_7d: u16,
    pub revenue_7d_lamports: u64,
}

// ──────────────────────────────────────────────
// Errors
// ──────────────────────────────────────────────

#[error_code]
pub enum NoumenServiceError {
    #[msg("Unauthorized: signer does not match required authority")]
    Unauthorized,

    #[msg("Service config is already initialized")]
    AlreadyInitialized,

    #[msg("Price is below the minimum margin required by A0-8 (cost * 120%)")]
    PriceBelowMinMargin,

    #[msg("Invalid level transition: only +-1 steps allowed (Declared<->Simulated<->Active)")]
    InvalidLevelTransition,

    #[msg("Service not found")]
    ServiceNotFound,

    #[msg("Math overflow in checked arithmetic")]
    MathOverflow,
}
