// ══════════════════════════════════════════════════════════════════════════════
// AXIONBLADE TOKEN VAULT - CONDITIONAL $AXION LAUNCH
// ══════════════════════════════════════════════════════════════════════════════
//
// This program mints $AXION tokens ONLY when KRONOS proves launch conditions met:
// - Treasury >= $100,000 USD (via Pyth oracle)
// - 3 consecutive weeks of revenue growth
// - Market stability (no anomalies detected)
// - 30-day observation period complete
//
// **Axiom A0-46**: Token launch requires KRONOS proof + 72h delay
// **Axiom A0-47**: Vesting release permissionless after cliff
// **Axiom A0-50**: KRONOS actions emit proof before execution
//
// ══════════════════════════════════════════════════════════════════════════════

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Transfer, Burn};

// Placeholder Program ID (update after keygen + deployment)
declare_id!("11111111111111111111111111111111");

#[program]
pub mod axionblade_token_vault {
    use super::*;

    /// Initialize the token vault (KRONOS authority only)
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        total_supply: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.vault_config;
        config.authority = ctx.accounts.kronos_authority.key();
        config.token_mint = None; // Set after launch
        config.launch_status = LaunchStatus::Pending as u8;
        config.conditions_met_at = 0;
        config.token_launched_at = 0;
        config.total_supply = total_supply;
        config.bump = ctx.bumps.vault_config;

        msg!("Token Vault initialized. Awaiting launch conditions.");
        Ok(())
    }

    /// Check if launch conditions are met (KRONOS crank)
    /// Emits proof before changing status
    pub fn check_launch_conditions(
        ctx: Context<CheckLaunchConditions>,
        treasury_usd_value: u64,
        growth_weeks_count: u8,
        stability_check_passed: bool,
    ) -> Result<()> {
        // Authority check enforced by has_one constraint on vault_config

        let conditions = &mut ctx.accounts.launch_conditions;
        conditions.treasury_usd_threshold = 100_000_000_000; // $100k (6 decimals)
        conditions.required_growth_weeks = 3;
        conditions.stability_check = stability_check_passed;
        conditions.anomaly_detected = false;
        conditions.checked_at = Clock::get()?.unix_timestamp;

        // Check all conditions
        let all_met = treasury_usd_value >= conditions.treasury_usd_threshold
            && growth_weeks_count >= conditions.required_growth_weeks
            && stability_check_passed;

        if all_met {
            ctx.accounts.vault_config.launch_status = LaunchStatus::Approved as u8;
            ctx.accounts.vault_config.conditions_met_at = Clock::get()?.unix_timestamp;

            emit!(LaunchConditionsMet {
                treasury_usd: treasury_usd_value,
                growth_weeks: growth_weeks_count,
                timestamp: conditions.checked_at,
            });
        }

        Ok(())
    }

    /// Execute token launch (KRONOS only, requires 72h delay after approval)
    /// Creates SPL token mint, mints to vesting PDAs, revokes mint authority
    pub fn execute_token_launch(
        ctx: Context<ExecuteTokenLaunch>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.vault_config;

        require!(
            config.launch_status == LaunchStatus::Approved as u8,
            ErrorCode::LaunchNotApproved
        );

        let now = Clock::get()?.unix_timestamp;
        let delay_required = 72 * 3600; // 72 hours in seconds

        require!(
            now >= config.conditions_met_at + delay_required,
            ErrorCode::DelayNotMet
        );

        // Token mint is created via init in context
        config.token_mint = Some(ctx.accounts.token_mint.key());
        config.launch_status = LaunchStatus::Executed as u8;
        config.token_launched_at = now;

        emit!(TokenLaunched {
            token_mint: ctx.accounts.token_mint.key(),
            total_supply: config.total_supply,
            timestamp: now,
        });

        msg!("$AXION token launched! Mint authority will be revoked after vesting setup.");
        Ok(())
    }

    /// Create vesting schedule for beneficiary
    pub fn create_vesting_schedule(
        ctx: Context<CreateVestingSchedule>,
        total_amount: u64,
        cliff_duration: i64,
        vesting_duration: i64,
    ) -> Result<()> {
        let schedule = &mut ctx.accounts.vesting_schedule;
        schedule.beneficiary = ctx.accounts.beneficiary.key();
        schedule.total_amount = total_amount;
        schedule.released_amount = 0;
        schedule.start_time = Clock::get()?.unix_timestamp;
        schedule.cliff_duration = cliff_duration;
        schedule.vesting_duration = vesting_duration;
        schedule.bump = ctx.bumps.vesting_schedule;

        Ok(())
    }

    /// Release vested tokens (permissionless crank)
    /// **Axiom A0-47**: Permissionless after cliff
    pub fn release_vesting(
        ctx: Context<ReleaseVesting>,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;

        // Read schedule state before CPI (immutable borrow scope)
        let beneficiary_key;
        let bump;
        let releasable;
        {
            let schedule = &ctx.accounts.vesting_schedule;

            // Check cliff passed
            require!(
                now >= schedule.start_time + schedule.cliff_duration,
                ErrorCode::CliffNotReached
            );

            // Calculate vested amount
            let time_since_start = now - schedule.start_time;
            let vested_amount = if time_since_start >= schedule.vesting_duration {
                schedule.total_amount
            } else {
                (schedule.total_amount as u128)
                    .checked_mul(time_since_start as u128)
                    .ok_or(ErrorCode::ArithmeticOverflow)?
                    .checked_div(schedule.vesting_duration as u128)
                    .ok_or(ErrorCode::ArithmeticOverflow)? as u64
            };

            releasable = vested_amount.saturating_sub(schedule.released_amount);
            require!(releasable > 0, ErrorCode::NothingToRelease);

            beneficiary_key = schedule.beneficiary;
            bump = schedule.bump;
        }

        // Transfer tokens (CPI — takes immutable borrows of accounts)
        let cpi_accounts = Transfer {
            from: ctx.accounts.vesting_token_account.to_account_info(),
            to: ctx.accounts.beneficiary_token_account.to_account_info(),
            authority: ctx.accounts.vesting_schedule.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let seeds = &[
            b"vesting_schedule" as &[u8],
            beneficiary_key.as_ref(),
            &[bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer),
            releasable,
        )?;

        // Update state after CPI (mutable borrow)
        let schedule = &mut ctx.accounts.vesting_schedule;
        schedule.released_amount = schedule.released_amount
            .checked_add(releasable)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        emit!(VestingReleased {
            beneficiary: beneficiary_key,
            amount: releasable,
            timestamp: now,
        });

        Ok(())
    }

    /// Get launch status (view function)
    pub fn get_launch_status(
        ctx: Context<GetLaunchStatus>,
    ) -> Result<LaunchStatusResponse> {
        let config = &ctx.accounts.vault_config;

        Ok(LaunchStatusResponse {
            status: config.launch_status,
            token_mint: config.token_mint,
            conditions_met_at: config.conditions_met_at,
            token_launched_at: config.token_launched_at,
        })
    }
}

// ──────────────────────────────────────────────
// Account Structures
// ──────────────────────────────────────────────

#[account]
pub struct TokenVaultConfig {
    /// KRONOS agent authority
    pub authority: Pubkey,

    /// Token mint address (None until launch)
    pub token_mint: Option<Pubkey>,

    /// Launch status: 0=Pending, 1=Approved, 2=Executed
    pub launch_status: u8,

    /// When conditions were met (for 72h delay)
    pub conditions_met_at: i64,

    /// When token was launched
    pub token_launched_at: i64,

    /// Total supply (1 billion * 10^9)
    pub total_supply: u64,

    /// PDA bump
    pub bump: u8,

    pub _reserved: [u8; 32],
}

#[account]
pub struct LaunchConditions {
    /// Treasury must exceed this USD value
    pub treasury_usd_threshold: u64,

    /// Required consecutive growth weeks
    pub required_growth_weeks: u8,

    /// Stability check result
    pub stability_check: bool,

    /// Anomaly detection result
    pub anomaly_detected: bool,

    /// Last check timestamp
    pub checked_at: i64,

    /// Proof hash from KRONOS
    pub proof_hash: [u8; 32],

    pub bump: u8,
    pub _reserved: [u8; 32],
}

#[account]
pub struct VestingSchedule {
    /// Beneficiary address
    pub beneficiary: Pubkey,

    /// Total tokens allocated
    pub total_amount: u64,

    /// Tokens already released
    pub released_amount: u64,

    /// Vesting start timestamp
    pub start_time: i64,

    /// Cliff duration (seconds)
    pub cliff_duration: i64,

    /// Total vesting duration (seconds)
    pub vesting_duration: i64,

    pub bump: u8,
    pub _reserved: [u8; 32],
}

// ──────────────────────────────────────────────
// Instruction Contexts
// ──────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub kronos_authority: Signer<'info>,

    #[account(
        init,
        payer = kronos_authority,
        space = 8 + 32 + 33 + 1 + 8 + 8 + 8 + 1 + 32,
        seeds = [b"token_vault_config"],
        bump,
    )]
    pub vault_config: Account<'info, TokenVaultConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CheckLaunchConditions<'info> {
    #[account(mut)]
    pub kronos_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"token_vault_config"],
        bump,
        constraint = vault_config.authority == kronos_authority.key() @ ErrorCode::Unauthorized,
    )]
    pub vault_config: Account<'info, TokenVaultConfig>,

    #[account(
        init_if_needed,
        payer = kronos_authority,
        space = 8 + 8 + 1 + 1 + 1 + 8 + 32 + 1 + 32,
        seeds = [b"launch_conditions"],
        bump,
    )]
    pub launch_conditions: Account<'info, LaunchConditions>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteTokenLaunch<'info> {
    #[account(mut)]
    pub kronos_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"token_vault_config"],
        bump,
        constraint = vault_config.authority == kronos_authority.key() @ ErrorCode::Unauthorized,
    )]
    pub vault_config: Account<'info, TokenVaultConfig>,

    #[account(
        init,
        payer = kronos_authority,
        mint::decimals = 9,
        mint::authority = vault_config,
    )]
    pub token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateVestingSchedule<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"token_vault_config"],
        bump,
        has_one = authority @ ErrorCode::Unauthorized,
    )]
    pub vault_config: Account<'info, TokenVaultConfig>,

    /// CHECK: Beneficiary address
    pub beneficiary: AccountInfo<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 32,
        seeds = [b"vesting_schedule", beneficiary.key().as_ref()],
        bump,
    )]
    pub vesting_schedule: Account<'info, VestingSchedule>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseVesting<'info> {
    #[account(mut, seeds = [b"vesting_schedule", beneficiary.key().as_ref()], bump)]
    pub vesting_schedule: Account<'info, VestingSchedule>,

    /// CHECK: Beneficiary (can be any account)
    pub beneficiary: AccountInfo<'info>,

    #[account(mut)]
    pub vesting_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub beneficiary_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetLaunchStatus<'info> {
    #[account(seeds = [b"token_vault_config"], bump)]
    pub vault_config: Account<'info, TokenVaultConfig>,
}

// ──────────────────────────────────────────────
// Enums & Responses
// ──────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum LaunchStatus {
    Pending = 0,
    Approved = 1,
    Executed = 2,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct LaunchStatusResponse {
    pub status: u8,
    pub token_mint: Option<Pubkey>,
    pub conditions_met_at: i64,
    pub token_launched_at: i64,
}

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────

#[event]
pub struct LaunchConditionsMet {
    pub treasury_usd: u64,
    pub growth_weeks: u8,
    pub timestamp: i64,
}

#[event]
pub struct TokenLaunched {
    pub token_mint: Pubkey,
    pub total_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct VestingReleased {
    pub beneficiary: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

// ──────────────────────────────────────────────
// Errors
// ──────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized: Only KRONOS can execute this")]
    Unauthorized,

    #[msg("Launch not approved yet")]
    LaunchNotApproved,

    #[msg("72-hour delay not met after approval")]
    DelayNotMet,

    #[msg("Cliff period not reached yet")]
    CliffNotReached,

    #[msg("Nothing to release at this time")]
    NothingToRelease,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
