use anchor_lang::prelude::*;
use anchor_lang::system_program;
use shared_types::*;

declare_id!("EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu");

// ──────────────────────────────────────────────
// Revenue split percentages (basis points)
// 40% Operations + 30% Treasury Reserve + 15% Dev Fund + 15% Creator = 100%
// ──────────────────────────────────────────────
const OPERATIONS_SPLIT_BPS: u16 = 4000;    // 40%
const TREASURY_RESERVE_BPS: u16 = 3000;    // 30%
const DEV_FUND_SPLIT_BPS: u16 = 1500;      // 15%
const CREATOR_SPLIT_BPS: u16 = 1500;       // 15%

// ──────────────────────────────────────────────
// Program
// ──────────────────────────────────────────────

#[program]
pub mod noumen_treasury {
    use super::*;

    /// Step 1: Initializes TreasuryConfig and TreasuryVault.
    /// Signer: super_authority (becomes the immutable super_authority).
    /// Must call initialize_donations afterwards to complete setup.
    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
        aeon_authority: Pubkey,
        keeper_authority: Pubkey,
        creator_wallet: Pubkey,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;

        // --- TreasuryConfig ---
        let config = &mut ctx.accounts.treasury_config;
        config.super_authority = ctx.accounts.super_authority.key();
        config.aeon_authority = aeon_authority;
        config.keeper_authority = keeper_authority;
        config.creator_wallet = creator_wallet;
        config.is_initialized = true;
        config.bump = ctx.bumps.treasury_config;
        config._reserved = [0u8; 32];

        // --- TreasuryVault ---
        let vault = &mut ctx.accounts.treasury_vault;
        vault.total_balance_lamports = 0;
        vault.reserved_lamports = 0;
        vault.free_balance_lamports = 0;
        vault.total_revenue_lifetime = 0;
        vault.total_spent_lifetime = 0;
        vault.daily_spend_lamports = 0;
        vault.daily_spend_reset_at = now;
        vault.total_donations_swept = 0;
        vault.dev_fund_lamports = 0;
        vault.operations_lamports = 0;
        vault.updated_at = now;
        vault.bump = ctx.bumps.treasury_vault;
        vault._reserved = [0u8; 48];

        emit!(TreasuryInitialized {
            super_authority: ctx.accounts.super_authority.key(),
            aeon_authority,
            keeper_authority,
            creator_wallet,
            timestamp: now,
        });

        msg!("noumen_treasury: config + vault initialized");
        Ok(())
    }

    /// Step 2: Initializes DonationVault and CCSConfig with genesis bands.
    /// Must be called after initialize_treasury.
    /// Signer: super_authority (same as initialize_treasury).
    pub fn initialize_donations(
        ctx: Context<InitializeDonations>,
    ) -> Result<()> {
        // --- DonationVault ---
        let donation = &mut ctx.accounts.donation_vault;
        donation.total_received = 0;
        donation.pending_sweep = 0;
        donation.sweep_count = 0;
        donation.last_sweep_at = 0;
        donation.bump = ctx.bumps.donation_vault;
        donation._reserved = [0u8; 21];

        // --- CCSConfig with genesis bands ---
        let ccs = &mut ctx.accounts.ccs_config;

        // Band 0: threshold 0 lamports, 12% split, 3% stipend
        ccs.bands[0] = CCSBand {
            threshold_lamports: 0,
            base_split_bps: 1200,
            max_stipend_bps: 300,
        };
        // Band 1: threshold 1 SOL, 10% split, 5% stipend
        ccs.bands[1] = CCSBand {
            threshold_lamports: LAMPORTS_PER_SOL,
            base_split_bps: 1000,
            max_stipend_bps: 500,
        };
        // Band 2: threshold 10 SOL, 7% split, 5% stipend
        ccs.bands[2] = CCSBand {
            threshold_lamports: 10 * LAMPORTS_PER_SOL,
            base_split_bps: 700,
            max_stipend_bps: 500,
        };
        // Band 3: threshold 50 SOL, 4% split, 5% stipend
        ccs.bands[3] = CCSBand {
            threshold_lamports: 50 * LAMPORTS_PER_SOL,
            base_split_bps: 400,
            max_stipend_bps: 500,
        };

        // CCS caps from axioms
        ccs.cap_total_bps = CCS_CAP_TOTAL_BPS;
        ccs.floor_base_split_bps = CCS_FLOOR_BASE_SPLIT_BPS;
        ccs.cap_stipend_bps = CCS_CAP_STIPEND_BPS;

        ccs.avg_7d_revenue = 0;
        ccs.avg_30d_revenue = 0;
        ccs.total_creator_paid = 0;
        ccs.creator_accumulated = 0;
        ccs.bump = ctx.bumps.ccs_config;
        ccs._reserved = [0u8; 48];

        msg!("noumen_treasury: donations + CCS initialized");
        Ok(())
    }

    /// Processes an incoming service payment with a 4-way revenue split:
    ///   40% Operations (stays in vault, tracked separately)
    ///   30% Treasury Reserve (marked as reserved in vault)
    ///   15% Development Fund (stays in vault, tracked separately)
    ///   15% Creator wallet (transferred via CPI)
    /// The creator split uses the FIXED 15% (CREATOR_SPLIT_BPS), not the CCS band system.
    /// CCS bands remain available for additional creator compensation mechanics.
    /// Signer: payer (any external user paying for a service).
    pub fn process_service_payment(
        ctx: Context<ProcessServicePayment>,
        service_id: u16,
        amount_lamports: u64,
    ) -> Result<()> {
        require!(amount_lamports > 0, TreasuryError::ZeroAmount);

        // ── 4-way revenue split (basis points) ──
        // Operations:        40% (4000 bps) — stays in vault for operational use
        // Treasury Reserve:  30% (3000 bps) — marked as reserved in vault
        // Development Fund:  15% (1500 bps) — stays in vault, tracked separately
        // Creator:           15% (1500 bps) — transferred to creator_wallet via CPI

        let operations_amount = amount_lamports
            .checked_mul(OPERATIONS_SPLIT_BPS as u64)
            .ok_or(TreasuryError::ArithmeticOverflow)?
            .checked_div(10_000)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        let treasury_reserve_amount = amount_lamports
            .checked_mul(TREASURY_RESERVE_BPS as u64)
            .ok_or(TreasuryError::ArithmeticOverflow)?
            .checked_div(10_000)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        let dev_fund_amount = amount_lamports
            .checked_mul(DEV_FUND_SPLIT_BPS as u64)
            .ok_or(TreasuryError::ArithmeticOverflow)?
            .checked_div(10_000)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        // Creator gets the remainder to absorb any truncation dust,
        // ensuring operations + treasury_reserve + dev_fund + creator == total_amount
        let vault_total = operations_amount
            .checked_add(treasury_reserve_amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?
            .checked_add(dev_fund_amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        let creator_amount = amount_lamports
            .checked_sub(vault_total)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        // Invariant check: operations + treasury_reserve + dev_fund + creator == total_amount
        require!(
            operations_amount
                .checked_add(treasury_reserve_amount)
                .ok_or(TreasuryError::ArithmeticOverflow)?
                .checked_add(dev_fund_amount)
                .ok_or(TreasuryError::ArithmeticOverflow)?
                .checked_add(creator_amount)
                .ok_or(TreasuryError::ArithmeticOverflow)?
                == amount_lamports,
            TreasuryError::SplitMismatch
        );

        // Transfer creator portion from payer -> creator_wallet via SystemProgram
        if creator_amount > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.payer.to_account_info(),
                        to: ctx.accounts.creator_wallet.to_account_info(),
                    },
                ),
                creator_amount,
            )?;
        }

        // Transfer vault portion (operations + treasury_reserve + dev_fund) from payer -> treasury_vault PDA
        if vault_total > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.payer.to_account_info(),
                        to: ctx.accounts.treasury_vault.to_account_info(),
                    },
                ),
                vault_total,
            )?;
        }

        // Now take mutable references for state updates (after CPI calls)
        let now = Clock::get()?.unix_timestamp;

        let vault = &mut ctx.accounts.treasury_vault;
        vault.total_balance_lamports = vault
            .total_balance_lamports
            .checked_add(vault_total)
            .ok_or(TreasuryError::ArithmeticOverflow)?;
        vault.total_revenue_lifetime = vault
            .total_revenue_lifetime
            .checked_add(amount_lamports)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        // Track reserved lamports (treasury reserve portion)
        vault.reserved_lamports = vault
            .reserved_lamports
            .checked_add(treasury_reserve_amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        // Track dev fund and operations separately
        vault.dev_fund_lamports = vault
            .dev_fund_lamports
            .checked_add(dev_fund_amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?;
        vault.operations_lamports = vault
            .operations_lamports
            .checked_add(operations_amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        // Recalculate free balance: total - reserved
        vault.free_balance_lamports = vault
            .total_balance_lamports
            .checked_sub(vault.reserved_lamports)
            .ok_or(TreasuryError::ArithmeticOverflow)?;
        vault.updated_at = now;

        // Update CCS creator accumulated (tracks total creator payouts)
        let ccs = &mut ctx.accounts.ccs_config;
        ccs.total_creator_paid = ccs
            .total_creator_paid
            .checked_add(creator_amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?;
        ccs.creator_accumulated = ccs
            .creator_accumulated
            .checked_add(creator_amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        emit!(ServicePaymentProcessed {
            service_id,
            amount_lamports,
            creator_split: creator_amount,
            treasury_reserve_split: treasury_reserve_amount,
            dev_fund_split: dev_fund_amount,
            operations_split: operations_amount,
            timestamp: now,
        });

        Ok(())
    }

    /// Allocates a budget to a specific agent. The allocated amount cannot exceed
    /// 15% (AGENT_BUDGET_CAP_BPS) of the treasury's current free balance.
    /// Signer: aeon_authority.
    pub fn allocate_agent_budget(
        ctx: Context<AllocateAgentBudget>,
        agent_id: u16,
        allocated: u64,
        daily_cap: u64,
    ) -> Result<()> {
        // Validate: allocated <= free_balance * AGENT_BUDGET_CAP_BPS / 10000
        let free_balance = ctx.accounts.treasury_vault.free_balance_lamports;
        let max_allocation = free_balance
            .checked_mul(AGENT_BUDGET_CAP_BPS as u64)
            .ok_or(TreasuryError::ArithmeticOverflow)?
            .checked_div(10_000)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        require!(
            allocated <= max_allocation,
            TreasuryError::AgentBudgetCapExceeded
        );

        let now = Clock::get()?.unix_timestamp;

        let budget = &mut ctx.accounts.budget_allocation;
        budget.agent_id = agent_id;
        budget.allocated = allocated;
        budget.spent = 0;
        budget.daily_cap = daily_cap;
        budget.daily_spent = 0;
        budget.daily_reset_at = now;
        budget.updated_at = now;
        budget.bump = ctx.bumps.budget_allocation;
        budget._reserved = [0u8; 32];

        emit!(BudgetAllocated {
            agent_id,
            allocated,
            daily_cap,
            timestamp: now,
        });

        Ok(())
    }

    /// Sweeps ALL pending SOL from DonationVault PDA to TreasuryVault PDA.
    /// No CCS split applied (A0-24: donations confer no rights/priority/influence).
    /// Signer: keeper_authority.
    pub fn sweep_donations(ctx: Context<SweepDonations>) -> Result<()> {
        let sweep_amount = ctx.accounts.donation_vault.pending_sweep;
        require!(sweep_amount > 0, TreasuryError::NothingToSweep);

        // Transfer SOL from donation_vault PDA -> treasury_vault PDA
        // PDA signing with donation_vault seeds
        let donation_bump = ctx.accounts.donation_vault.bump;
        let seeds: &[&[u8]] = &[b"donation_vault", &[donation_bump]];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.donation_vault.to_account_info(),
                    to: ctx.accounts.treasury_vault.to_account_info(),
                },
                signer_seeds,
            ),
            sweep_amount,
        )?;

        let now = Clock::get()?.unix_timestamp;

        // Update donation vault (mutable borrow after CPI)
        let donation = &mut ctx.accounts.donation_vault;
        donation.pending_sweep = 0;
        donation.sweep_count = donation
            .sweep_count
            .checked_add(1)
            .ok_or(TreasuryError::ArithmeticOverflow)?;
        donation.last_sweep_at = now;

        // Update treasury vault - donations go to total balance but do NOT
        // count as revenue (they confer no CCS split)
        let vault = &mut ctx.accounts.treasury_vault;
        vault.total_balance_lamports = vault
            .total_balance_lamports
            .checked_add(sweep_amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?;
        vault.total_donations_swept = vault
            .total_donations_swept
            .checked_add(sweep_amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        // Recalculate free balance
        vault.free_balance_lamports = vault
            .total_balance_lamports
            .checked_sub(vault.reserved_lamports)
            .ok_or(TreasuryError::ArithmeticOverflow)?;
        vault.updated_at = now;

        emit!(DonationSwept {
            amount: sweep_amount,
            sweep_count: ctx.accounts.donation_vault.sweep_count,
            timestamp: now,
        });

        Ok(())
    }

    /// Records a donation receipt with a hashed wallet address (A0-27 privacy).
    /// Signer: keeper_authority.
    pub fn record_donation_receipt(
        ctx: Context<RecordDonationReceipt>,
        nonce: u64,
        amount: u64,
        source_wallet_hash: [u8; 32],
        disclosure_mode: u8,
        receipt_hash: [u8; 32],
    ) -> Result<()> {
        require!(amount > 0, TreasuryError::ZeroAmount);

        let now = Clock::get()?.unix_timestamp;

        let receipt = &mut ctx.accounts.donation_receipt;
        receipt.nonce = nonce;
        receipt.amount = amount;
        receipt.timestamp = now;
        receipt.source_wallet_hash = source_wallet_hash;
        receipt.disclosure_mode = disclosure_mode;
        receipt.receipt_status = 0; // Active
        receipt.counts_as_donation = true;
        receipt.correlated_payments = 0;
        receipt.correlated_flag = false;
        receipt.receipt_hash = receipt_hash;
        receipt.bump = ctx.bumps.donation_receipt;
        receipt._reserved = [0u8; 42];

        // Update donation vault pending amount
        let donation = &mut ctx.accounts.donation_vault;
        donation.total_received = donation
            .total_received
            .checked_add(amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?;
        donation.pending_sweep = donation
            .pending_sweep
            .checked_add(amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        emit!(DonationReceiptCreated {
            nonce,
            amount,
            disclosure_mode,
            timestamp: now,
        });

        Ok(())
    }

    /// Withdraws accumulated creator CCS split from treasury vault.
    /// Validates that withdrawal does not breach the 25% reserve ratio (A0-3).
    /// Signer: creator_wallet.
    pub fn withdraw_creator_split(
        ctx: Context<WithdrawCreatorSplit>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, TreasuryError::ZeroAmount);

        // Read state for validations before CPI
        let creator_accumulated = ctx.accounts.ccs_config.creator_accumulated;
        let total_balance = ctx.accounts.treasury_vault.total_balance_lamports;
        let reserved = ctx.accounts.treasury_vault.reserved_lamports;
        let free_balance = ctx.accounts.treasury_vault.free_balance_lamports;
        let vault_bump = ctx.accounts.treasury_vault.bump;

        // Validate amount <= creator_accumulated
        require!(
            amount <= creator_accumulated,
            TreasuryError::InsufficientCreatorBalance
        );

        // Validate reserve ratio after withdrawal.
        // After withdrawal, remaining balance = total_balance - amount.
        // reserved_lamports must be >= (total_balance - amount) * RESERVE_RATIO_BPS / 10000
        let balance_after = total_balance
            .checked_sub(amount)
            .ok_or(TreasuryError::InsufficientTreasuryBalance)?;

        let required_reserve = balance_after
            .checked_mul(RESERVE_RATIO_BPS as u64)
            .ok_or(TreasuryError::ArithmeticOverflow)?
            .checked_div(10_000)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        require!(
            reserved >= required_reserve,
            TreasuryError::ReserveRatioBreach
        );

        // Also ensure we have enough free balance
        require!(
            amount <= free_balance,
            TreasuryError::InsufficientTreasuryBalance
        );

        // H-TREAS-4: Daily spend limit enforcement
        // daily_spend_lamports + amount <= free_balance * DAILY_SPEND_CAP_BPS / 10000
        let now = Clock::get()?.unix_timestamp;
        let daily_spend_reset_at = ctx.accounts.treasury_vault.daily_spend_reset_at;
        let mut current_daily_spend = ctx.accounts.treasury_vault.daily_spend_lamports;

        // Reset daily spend counter if a new day has started (86400 seconds)
        if now - daily_spend_reset_at >= 86400 {
            current_daily_spend = 0;
        }

        let daily_limit = free_balance
            .checked_mul(DAILY_SPEND_CAP_BPS as u64)
            .ok_or(TreasuryError::ArithmeticOverflow)?
            .checked_div(10_000)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        require!(
            current_daily_spend.checked_add(amount).ok_or(TreasuryError::ArithmeticOverflow)? <= daily_limit,
            TreasuryError::DailySpendCapExceeded
        );

        // Transfer SOL from treasury_vault PDA -> creator_wallet
        let seeds: &[&[u8]] = &[b"treasury_vault", &[vault_bump]];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.treasury_vault.to_account_info(),
                    to: ctx.accounts.creator_wallet.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        let withdrawal_time = Clock::get()?.unix_timestamp;

        // Update vault (mutable borrow after CPI)
        let vault = &mut ctx.accounts.treasury_vault;
        vault.total_balance_lamports = balance_after;
        vault.total_spent_lifetime = vault
            .total_spent_lifetime
            .checked_add(amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?;
        vault.free_balance_lamports = vault
            .total_balance_lamports
            .checked_sub(vault.reserved_lamports)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        // H-TREAS-4: Update daily spend tracking
        if withdrawal_time - vault.daily_spend_reset_at >= 86400 {
            vault.daily_spend_lamports = amount;
            vault.daily_spend_reset_at = withdrawal_time;
        } else {
            vault.daily_spend_lamports = current_daily_spend
                .checked_add(amount)
                .ok_or(TreasuryError::ArithmeticOverflow)?;
        }

        vault.updated_at = withdrawal_time;

        // Update CCS
        let ccs = &mut ctx.accounts.ccs_config;
        ccs.creator_accumulated = ccs
            .creator_accumulated
            .checked_sub(amount)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        emit!(CreatorWithdrawal {
            amount,
            remaining_accumulated: ccs.creator_accumulated,
            timestamp: now,
        });

        Ok(())
    }

    /// H-TREAS-2: Updates an existing agent budget allocation without resetting spent fields.
    /// Signer: aeon_authority. Only modifies allocated and daily_cap.
    pub fn update_agent_budget(
        ctx: Context<UpdateAgentBudget>,
        _agent_id: u16,
        new_allocated: u64,
        new_daily_cap: u64,
    ) -> Result<()> {
        // Validate: new_allocated <= free_balance * AGENT_BUDGET_CAP_BPS / 10000
        let free_balance = ctx.accounts.treasury_vault.free_balance_lamports;
        let max_allocation = free_balance
            .checked_mul(AGENT_BUDGET_CAP_BPS as u64)
            .ok_or(TreasuryError::ArithmeticOverflow)?
            .checked_div(10_000)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        require!(
            new_allocated <= max_allocation,
            TreasuryError::AgentBudgetCapExceeded
        );

        let now = Clock::get()?.unix_timestamp;
        let budget = &mut ctx.accounts.budget_allocation;

        // Only update allocation and cap; do NOT reset spent/daily_spent
        budget.allocated = new_allocated;
        budget.daily_cap = new_daily_cap;
        budget.updated_at = now;

        emit!(BudgetUpdated {
            agent_id: budget.agent_id,
            new_allocated,
            new_daily_cap,
            timestamp: now,
        });

        Ok(())
    }

    /// Updates the 7-day and 30-day rolling revenue averages used for CCS band selection.
    /// Signer: keeper_authority.
    /// L-TREAS-2: Now emits RevenueAveragesUpdated event for auditability.
    pub fn update_revenue_averages(
        ctx: Context<UpdateRevenueAverages>,
        avg_7d_revenue: u64,
        avg_30d_revenue: u64,
    ) -> Result<()> {
        let ccs = &mut ctx.accounts.ccs_config;
        ccs.avg_7d_revenue = avg_7d_revenue;
        ccs.avg_30d_revenue = avg_30d_revenue;

        emit!(RevenueAveragesUpdated {
            avg_7d_revenue,
            avg_30d_revenue,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Initialize volume discount tracker for a wallet.
    /// Creates VolumeDiscountTracker PDA with zero usage.
    /// Signer: user wallet.
    pub fn initialize_volume_tracker(
        ctx: Context<InitializeVolumeTracker>,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let tracker = &mut ctx.accounts.volume_tracker;

        tracker.wallet = ctx.accounts.wallet.key();
        tracker.monthly_scan_count = 0;
        tracker.monthly_reset_at = now
            .checked_add(2592000)
            .ok_or(TreasuryError::ArithmeticOverflow)?; // +30 days
        tracker.lifetime_scans = 0;
        tracker.current_discount_tier = 0; // No discount
        tracker.total_spent_lamports = 0;
        tracker.bump = ctx.bumps.volume_tracker;
        tracker._reserved = [0u8; 32];

        emit!(VolumeTrackerInitialized {
            wallet: tracker.wallet,
            timestamp: now,
        });

        Ok(())
    }

    /// Track volume usage after a service payment.
    /// Auto-resets monthly counter every 30 days, updates discount tier.
    /// Signer: keeper_authority (called after successful payment).
    pub fn track_volume_usage(
        ctx: Context<TrackVolumeUsage>,
        service_id: u16,
        amount_lamports: u64,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let tracker = &mut ctx.accounts.volume_tracker;

        // Auto-reset monthly counter every 30 days
        if now >= tracker.monthly_reset_at {
            tracker.monthly_scan_count = 0;
            tracker.monthly_reset_at = now
                .checked_add(2592000)
                .ok_or(TreasuryError::ArithmeticOverflow)?;
        }

        // Increment counters
        tracker.monthly_scan_count = tracker
            .monthly_scan_count
            .checked_add(1)
            .ok_or(TreasuryError::ArithmeticOverflow)?;
        tracker.lifetime_scans = tracker
            .lifetime_scans
            .checked_add(1)
            .ok_or(TreasuryError::ArithmeticOverflow)?;
        tracker.total_spent_lamports = tracker
            .total_spent_lamports
            .checked_add(amount_lamports)
            .ok_or(TreasuryError::ArithmeticOverflow)?;

        // Update discount tier based on monthly scan count
        // 0-9: 0% discount (tier 0)
        // 10-49: 10% discount (tier 1)
        // 50-99: 20% discount (tier 2)
        // 100+: 30% discount (tier 3)
        tracker.current_discount_tier = match tracker.monthly_scan_count {
            0..=9 => 0,
            10..=49 => 1,
            50..=99 => 2,
            _ => 3,
        };

        emit!(VolumeDiscountUpdated {
            wallet: tracker.wallet,
            service_id,
            monthly_scans: tracker.monthly_scan_count,
            discount_tier: tracker.current_discount_tier,
            timestamp: now,
        });

        Ok(())
    }
}

// ──────────────────────────────────────────────
// Accounts (State)
// ──────────────────────────────────────────────

#[account]
pub struct TreasuryConfig {
    pub super_authority: Pubkey,
    pub aeon_authority: Pubkey,
    pub keeper_authority: Pubkey,
    pub creator_wallet: Pubkey,
    pub is_initialized: bool,
    pub bump: u8,
    pub _reserved: [u8; 32],
}

impl TreasuryConfig {
    pub const LEN: usize = 8  // discriminator
        + 32  // super_authority
        + 32  // aeon_authority
        + 32  // keeper_authority
        + 32  // creator_wallet
        + 1   // is_initialized
        + 1   // bump
        + 32; // _reserved
}

#[account]
pub struct TreasuryVault {
    pub total_balance_lamports: u64,
    pub reserved_lamports: u64,
    pub free_balance_lamports: u64,
    pub total_revenue_lifetime: u64,
    pub total_spent_lifetime: u64,
    pub daily_spend_lamports: u64,
    pub daily_spend_reset_at: i64,
    pub total_donations_swept: u64,
    pub dev_fund_lamports: u64,
    pub operations_lamports: u64,
    pub updated_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 48],
}

impl TreasuryVault {
    pub const LEN: usize = 8  // discriminator
        + 8   // total_balance_lamports
        + 8   // reserved_lamports
        + 8   // free_balance_lamports
        + 8   // total_revenue_lifetime
        + 8   // total_spent_lifetime
        + 8   // daily_spend_lamports
        + 8   // daily_spend_reset_at
        + 8   // total_donations_swept
        + 8   // dev_fund_lamports
        + 8   // operations_lamports
        + 8   // updated_at
        + 1   // bump
        + 48; // _reserved
}

#[account]
pub struct CCSConfig {
    pub bands: [CCSBand; 4],
    pub cap_total_bps: u16,
    pub floor_base_split_bps: u16,
    pub cap_stipend_bps: u16,
    pub avg_7d_revenue: u64,
    pub avg_30d_revenue: u64,
    pub total_creator_paid: u64,
    pub creator_accumulated: u64,
    pub bump: u8,
    pub _reserved: [u8; 48],
}

impl CCSConfig {
    pub const LEN: usize = 8  // discriminator
        + CCSBand::LEN * 4    // 4 bands
        + 2   // cap_total_bps
        + 2   // floor_base_split_bps
        + 2   // cap_stipend_bps
        + 8   // avg_7d_revenue
        + 8   // avg_30d_revenue
        + 8   // total_creator_paid
        + 8   // creator_accumulated
        + 1   // bump
        + 48; // _reserved
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct CCSBand {
    pub threshold_lamports: u64,
    pub base_split_bps: u16,
    pub max_stipend_bps: u16,
}

impl CCSBand {
    pub const LEN: usize = 8  // threshold_lamports
        + 2  // base_split_bps
        + 2; // max_stipend_bps
}

#[account]
pub struct DonationVault {
    pub total_received: u64,
    pub pending_sweep: u64,
    pub sweep_count: u32,
    pub last_sweep_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 21],
}

impl DonationVault {
    pub const LEN: usize = 8  // discriminator
        + 8   // total_received
        + 8   // pending_sweep
        + 4   // sweep_count
        + 8   // last_sweep_at
        + 1   // bump
        + 21; // _reserved
}

#[account]
pub struct BudgetAllocation {
    pub agent_id: u16,
    pub allocated: u64,
    pub spent: u64,
    pub daily_cap: u64,
    pub daily_spent: u64,
    pub daily_reset_at: i64,
    pub updated_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 32],
}

impl BudgetAllocation {
    pub const LEN: usize = 8  // discriminator
        + 2   // agent_id
        + 8   // allocated
        + 8   // spent
        + 8   // daily_cap
        + 8   // daily_spent
        + 8   // daily_reset_at
        + 8   // updated_at
        + 1   // bump
        + 32; // _reserved
}

#[account]
pub struct DonationReceipt {
    pub nonce: u64,
    pub amount: u64,
    pub timestamp: i64,
    pub source_wallet_hash: [u8; 32],
    pub disclosure_mode: u8,
    pub receipt_status: u8,
    pub counts_as_donation: bool,
    pub correlated_payments: u32,
    pub correlated_flag: bool,
    pub receipt_hash: [u8; 32],
    pub bump: u8,
    pub _reserved: [u8; 42],
}

impl DonationReceipt {
    pub const LEN: usize = 8  // discriminator
        + 8   // nonce
        + 8   // amount
        + 8   // timestamp
        + 32  // source_wallet_hash
        + 1   // disclosure_mode
        + 1   // receipt_status
        + 1   // counts_as_donation
        + 4   // correlated_payments
        + 1   // correlated_flag
        + 32  // receipt_hash
        + 1   // bump
        + 42; // _reserved
}

/// VolumeDiscountTracker: Tracks user's service usage for volume-based discounts.
/// Monthly counter auto-resets every 30 days.
/// Discount tiers: 0% (0-9), 10% (10-49), 20% (50-99), 30% (100+).
#[account]
pub struct VolumeDiscountTracker {
    pub wallet: Pubkey,
    pub monthly_scan_count: u16,
    pub monthly_reset_at: i64,
    pub lifetime_scans: u32,
    pub current_discount_tier: u8, // 0=none, 1=10%, 2=20%, 3=30%
    pub total_spent_lamports: u64,
    pub bump: u8,
    pub _reserved: [u8; 32],
}

impl VolumeDiscountTracker {
    pub const LEN: usize = 8  // discriminator
        + 32  // wallet
        + 2   // monthly_scan_count
        + 8   // monthly_reset_at
        + 4   // lifetime_scans
        + 1   // current_discount_tier
        + 8   // total_spent_lamports
        + 1   // bump
        + 32; // _reserved
}

// ──────────────────────────────────────────────
// Instruction Contexts
// ──────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    pub super_authority: Signer<'info>,

    #[account(
        init,
        payer = super_authority,
        space = TreasuryConfig::LEN,
        seeds = [b"treasury_config"],
        bump,
    )]
    pub treasury_config: Box<Account<'info, TreasuryConfig>>,

    #[account(
        init,
        payer = super_authority,
        space = TreasuryVault::LEN,
        seeds = [b"treasury_vault"],
        bump,
    )]
    pub treasury_vault: Box<Account<'info, TreasuryVault>>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeDonations<'info> {
    #[account(mut)]
    pub super_authority: Signer<'info>,

    #[account(
        seeds = [b"treasury_config"],
        bump = treasury_config.bump,
        constraint = treasury_config.is_initialized @ TreasuryError::NotInitialized,
        constraint = super_authority.key() == treasury_config.super_authority @ TreasuryError::UnauthorizedAeon,
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,

    #[account(
        init,
        payer = super_authority,
        space = DonationVault::LEN,
        seeds = [b"donation_vault"],
        bump,
    )]
    pub donation_vault: Box<Account<'info, DonationVault>>,

    #[account(
        init,
        payer = super_authority,
        space = CCSConfig::LEN,
        seeds = [b"ccs_config"],
        bump,
    )]
    pub ccs_config: Box<Account<'info, CCSConfig>>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(service_id: u16, amount_lamports: u64)]
pub struct ProcessServicePayment<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [b"treasury_config"],
        bump = treasury_config.bump,
        constraint = treasury_config.is_initialized @ TreasuryError::NotInitialized,
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,

    #[account(
        mut,
        seeds = [b"treasury_vault"],
        bump = treasury_vault.bump,
    )]
    pub treasury_vault: Account<'info, TreasuryVault>,

    #[account(
        mut,
        seeds = [b"ccs_config"],
        bump = ccs_config.bump,
    )]
    pub ccs_config: Account<'info, CCSConfig>,

    /// CHECK: Validated against treasury_config.creator_wallet
    #[account(
        mut,
        constraint = creator_wallet.key() == treasury_config.creator_wallet @ TreasuryError::InvalidCreatorWallet,
    )]
    pub creator_wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent_id: u16)]
pub struct AllocateAgentBudget<'info> {
    #[account(
        mut,
        constraint = aeon_authority.key() == treasury_config.aeon_authority @ TreasuryError::UnauthorizedAeon,
    )]
    pub aeon_authority: Signer<'info>,

    #[account(
        seeds = [b"treasury_config"],
        bump = treasury_config.bump,
        constraint = treasury_config.is_initialized @ TreasuryError::NotInitialized,
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,

    #[account(
        seeds = [b"treasury_vault"],
        bump = treasury_vault.bump,
    )]
    pub treasury_vault: Account<'info, TreasuryVault>,

    /// H-TREAS-2: Changed from init_if_needed to init to prevent silent resets
    #[account(
        init,
        payer = aeon_authority,
        space = BudgetAllocation::LEN,
        seeds = [b"budget", agent_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub budget_allocation: Account<'info, BudgetAllocation>,

    pub system_program: Program<'info, System>,
}

/// H-TREAS-2: Separate context for updating an existing budget allocation
#[derive(Accounts)]
#[instruction(_agent_id: u16)]
pub struct UpdateAgentBudget<'info> {
    #[account(
        constraint = aeon_authority.key() == treasury_config.aeon_authority @ TreasuryError::UnauthorizedAeon,
    )]
    pub aeon_authority: Signer<'info>,

    #[account(
        seeds = [b"treasury_config"],
        bump = treasury_config.bump,
        constraint = treasury_config.is_initialized @ TreasuryError::NotInitialized,
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,

    #[account(
        seeds = [b"treasury_vault"],
        bump = treasury_vault.bump,
    )]
    pub treasury_vault: Account<'info, TreasuryVault>,

    #[account(
        mut,
        seeds = [b"budget", _agent_id.to_le_bytes().as_ref()],
        bump = budget_allocation.bump,
    )]
    pub budget_allocation: Account<'info, BudgetAllocation>,
}

#[derive(Accounts)]
pub struct SweepDonations<'info> {
    #[account(
        constraint = keeper.key() == treasury_config.keeper_authority @ TreasuryError::UnauthorizedKeeper,
    )]
    pub keeper: Signer<'info>,

    #[account(
        seeds = [b"treasury_config"],
        bump = treasury_config.bump,
        constraint = treasury_config.is_initialized @ TreasuryError::NotInitialized,
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,

    #[account(
        mut,
        seeds = [b"donation_vault"],
        bump = donation_vault.bump,
    )]
    pub donation_vault: Account<'info, DonationVault>,

    #[account(
        mut,
        seeds = [b"treasury_vault"],
        bump = treasury_vault.bump,
    )]
    pub treasury_vault: Account<'info, TreasuryVault>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct RecordDonationReceipt<'info> {
    #[account(mut)]
    pub keeper: Signer<'info>,

    #[account(
        seeds = [b"treasury_config"],
        bump = treasury_config.bump,
        constraint = treasury_config.is_initialized @ TreasuryError::NotInitialized,
        constraint = keeper.key() == treasury_config.keeper_authority @ TreasuryError::UnauthorizedKeeper,
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,

    #[account(
        init,
        payer = keeper,
        space = DonationReceipt::LEN,
        seeds = [b"donation_receipt", nonce.to_le_bytes().as_ref()],
        bump,
    )]
    pub donation_receipt: Account<'info, DonationReceipt>,

    #[account(
        mut,
        seeds = [b"donation_vault"],
        bump = donation_vault.bump,
    )]
    pub donation_vault: Account<'info, DonationVault>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawCreatorSplit<'info> {
    #[account(
        mut,
        constraint = creator_wallet.key() == treasury_config.creator_wallet @ TreasuryError::InvalidCreatorWallet,
    )]
    pub creator_wallet: Signer<'info>,

    #[account(
        seeds = [b"treasury_config"],
        bump = treasury_config.bump,
        constraint = treasury_config.is_initialized @ TreasuryError::NotInitialized,
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,

    #[account(
        mut,
        seeds = [b"treasury_vault"],
        bump = treasury_vault.bump,
    )]
    pub treasury_vault: Account<'info, TreasuryVault>,

    #[account(
        mut,
        seeds = [b"ccs_config"],
        bump = ccs_config.bump,
    )]
    pub ccs_config: Account<'info, CCSConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRevenueAverages<'info> {
    #[account(
        constraint = keeper.key() == treasury_config.keeper_authority @ TreasuryError::UnauthorizedKeeper,
    )]
    pub keeper: Signer<'info>,

    #[account(
        seeds = [b"treasury_config"],
        bump = treasury_config.bump,
        constraint = treasury_config.is_initialized @ TreasuryError::NotInitialized,
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,

    #[account(
        mut,
        seeds = [b"ccs_config"],
        bump = ccs_config.bump,
    )]
    pub ccs_config: Account<'info, CCSConfig>,
}

#[derive(Accounts)]
pub struct InitializeVolumeTracker<'info> {
    #[account(mut)]
    pub wallet: Signer<'info>,

    #[account(
        init,
        payer = wallet,
        space = VolumeDiscountTracker::LEN,
        seeds = [b"volume_tracker", wallet.key().as_ref()],
        bump
    )]
    pub volume_tracker: Account<'info, VolumeDiscountTracker>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(service_id: u16)]
pub struct TrackVolumeUsage<'info> {
    #[account(
        constraint = keeper.key() == treasury_config.keeper_authority @ TreasuryError::UnauthorizedKeeper,
    )]
    pub keeper: Signer<'info>,

    #[account(
        seeds = [b"treasury_config"],
        bump = treasury_config.bump,
        constraint = treasury_config.is_initialized @ TreasuryError::NotInitialized,
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,

    #[account(
        mut,
        seeds = [b"volume_tracker", volume_tracker.wallet.as_ref()],
        bump = volume_tracker.bump,
    )]
    pub volume_tracker: Account<'info, VolumeDiscountTracker>,
}

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────

#[event]
pub struct TreasuryInitialized {
    pub super_authority: Pubkey,
    pub aeon_authority: Pubkey,
    pub keeper_authority: Pubkey,
    pub creator_wallet: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ServicePaymentProcessed {
    pub service_id: u16,
    pub amount_lamports: u64,
    pub creator_split: u64,
    pub treasury_reserve_split: u64,
    pub dev_fund_split: u64,
    pub operations_split: u64,
    pub timestamp: i64,
}

#[event]
pub struct BudgetAllocated {
    pub agent_id: u16,
    pub allocated: u64,
    pub daily_cap: u64,
    pub timestamp: i64,
}

#[event]
pub struct DonationSwept {
    pub amount: u64,
    pub sweep_count: u32,
    pub timestamp: i64,
}

#[event]
pub struct DonationReceiptCreated {
    pub nonce: u64,
    pub amount: u64,
    pub disclosure_mode: u8,
    pub timestamp: i64,
}

#[event]
pub struct CreatorWithdrawal {
    pub amount: u64,
    pub remaining_accumulated: u64,
    pub timestamp: i64,
}

#[event]
pub struct BudgetUpdated {
    pub agent_id: u16,
    pub new_allocated: u64,
    pub new_daily_cap: u64,
    pub timestamp: i64,
}

#[event]
pub struct RevenueAveragesUpdated {
    pub avg_7d_revenue: u64,
    pub avg_30d_revenue: u64,
    pub timestamp: i64,
}

#[event]
pub struct VolumeTrackerInitialized {
    pub wallet: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VolumeDiscountUpdated {
    pub wallet: Pubkey,
    pub service_id: u16,
    pub monthly_scans: u16,
    pub discount_tier: u8,
    pub timestamp: i64,
}

// ──────────────────────────────────────────────
// Errors
// ──────────────────────────────────────────────

#[error_code]
pub enum TreasuryError {
    #[msg("Treasury has not been initialized")]
    NotInitialized,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Operations + treasury reserve + dev fund + creator split does not equal total amount")]
    SplitMismatch,
    #[msg("Invalid creator wallet")]
    InvalidCreatorWallet,
    #[msg("Unauthorized: not the AEON authority")]
    UnauthorizedAeon,
    #[msg("Unauthorized: not the keeper authority")]
    UnauthorizedKeeper,
    #[msg("Agent budget allocation exceeds 15% cap of free balance")]
    AgentBudgetCapExceeded,
    #[msg("Nothing to sweep: pending donation balance is zero")]
    NothingToSweep,
    #[msg("Insufficient creator accumulated balance")]
    InsufficientCreatorBalance,
    #[msg("Withdrawal would breach 25% reserve ratio (A0-3)")]
    ReserveRatioBreach,
    #[msg("Insufficient treasury balance for withdrawal")]
    InsufficientTreasuryBalance,
    #[msg("Daily spend cap exceeded (A0-3: daily treasury spend <= 3% of free balance)")]
    DailySpendCapExceeded,
}
