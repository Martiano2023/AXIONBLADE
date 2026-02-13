// ══════════════════════════════════════════════════════════════════════════════
// AXIONBLADE ECONOMIC ENGINE - C1-C4 CRITICAL CORRECTIONS
// ══════════════════════════════════════════════════════════════════════════════
//
// This module implements the complete economic system rebuild with:
// - C1: Cost Oracle System (multisig-signed cost tracking)
// - C2: Monthly Credits System (replaces "Pro forever")
// - C3: Deterministic Airdrop (on-chain usage only)
// - C4: Burn Budget (reserve-protected buyback)
//
// Integration: Add `pub mod economic_engine;` to lib.rs
//
// ══════════════════════════════════════════════════════════════════════════════

use anchor_lang::prelude::*;

// ──────────────────────────────────────────────
// C1: COST ORACLE SYSTEM
// ──────────────────────────────────────────────

/// Cost Oracle tracks real operational costs with multisig validation.
/// Only the multisig authority can update cost indices.
///
/// **Axiom A0-48**: KRONOS cannot modify pricing without cost oracle signature
#[account]
pub struct CostOracle {
    /// Cost per 1000 queries (in lamports)
    pub cost_index_sol_per_1k_queries: u64,

    /// RPC cost per query (Helius/Quicknode)
    pub rpc_cost_sol: u64,

    /// AI model cost per query (OpenAI/Anthropic)
    pub ai_cost_sol: u64,

    /// Storage cost per query (IPFS/Arweave)
    pub storage_cost_sol: u64,

    /// Last update timestamp
    pub last_update: i64,

    /// Multisig authority (2-of-3 required)
    pub multisig_authority: Pubkey,

    /// Total updates count (for audit trail)
    pub update_count: u32,

    /// PDA bump seed
    pub bump: u8,

    /// Reserved for future fields
    pub _reserved: [u8; 32],
}

impl CostOracle {
    pub const LEN: usize = 8  // discriminator
        + 8   // cost_index_sol_per_1k_queries
        + 8   // rpc_cost_sol
        + 8   // ai_cost_sol
        + 8   // storage_cost_sol
        + 8   // last_update
        + 32  // multisig_authority
        + 4   // update_count
        + 1   // bump
        + 32; // _reserved

    /// Seeds: [b"cost_oracle"]
    pub const SEEDS: &'static [u8] = b"cost_oracle";
}

/// Price Epoch tracks actual costs over 12-hour periods for dynamic pricing.
///
/// **Axiom A0-49**: Revenue distribution requires epoch completion proof
#[account]
pub struct PriceEpoch {
    /// Epoch sequential ID
    pub epoch_id: u32,

    /// Start timestamp (Unix)
    pub start_time: i64,

    /// End timestamp (Unix)
    pub end_time: i64,

    /// Total queries processed in epoch
    pub total_queries: u32,

    /// Total revenue collected (before splits)
    pub total_revenue_lamports: u64,

    /// Average transaction fee paid per query
    pub avg_tx_fee_lamports: u64,

    /// Average cost index at epoch (from CostOracle)
    pub avg_cost_index_lamports: u64,

    /// Calculated margin (basis points, 150 = 150%)
    pub calculated_margin_bps: u16,

    /// PDA bump seed
    pub bump: u8,

    /// Reserved for future fields
    pub _reserved: [u8; 48],
}

impl PriceEpoch {
    pub const LEN: usize = 8  // discriminator
        + 4   // epoch_id
        + 8   // start_time
        + 8   // end_time
        + 4   // total_queries
        + 8   // total_revenue_lamports
        + 8   // avg_tx_fee_lamports
        + 8   // avg_cost_index_lamports
        + 2   // calculated_margin_bps
        + 1   // bump
        + 48; // _reserved

    /// Seeds: [b"price_epoch", epoch_id.to_le_bytes()]
    pub const SEEDS: &'static [u8] = b"price_epoch";

    /// Epoch duration: 12 hours (43200 seconds)
    pub const EPOCH_DURATION_SECONDS: i64 = 43200;
}

// ──────────────────────────────────────────────
// C2: MONTHLY CREDITS SYSTEM
// ──────────────────────────────────────────────

/// Staking Tier grants monthly credits based on stake amount and lock duration.
/// Replaces "Pro free forever" to prevent unlimited revenue drain.
///
/// **Axiom A0-46**: Token launch requires KRONOS proof + 72h delay
#[account]
pub struct StakingTier {
    /// User wallet address
    pub user_wallet: Pubkey,

    /// Staked amount (lamports or $AXION tokens post-launch)
    pub staked_amount: u64,

    /// Lock duration (seconds)
    pub lock_duration_seconds: i64,

    /// Lock expiry timestamp
    pub lock_expires_at: i64,

    /// Monthly credit allocation (SOL-equivalent in lamports)
    pub monthly_credit_lamports: u64,

    /// Credits remaining this month
    pub credits_remaining: u64,

    /// Monthly reset timestamp (auto-renews)
    pub monthly_reset_at: i64,

    /// Tier level (0-5: None, Bronze, Silver, Gold, Platinum, Diamond)
    pub tier_level: u8,

    /// Total credits used lifetime
    pub lifetime_credits_used: u64,

    /// PDA bump seed
    pub bump: u8,

    /// Reserved for future fields
    pub _reserved: [u8; 32],
}

impl StakingTier {
    pub const LEN: usize = 8  // discriminator
        + 32  // user_wallet
        + 8   // staked_amount
        + 8   // lock_duration_seconds
        + 8   // lock_expires_at
        + 8   // monthly_credit_lamports
        + 8   // credits_remaining
        + 8   // monthly_reset_at
        + 1   // tier_level
        + 8   // lifetime_credits_used
        + 1   // bump
        + 32; // _reserved

    /// Seeds: [b"staking_tier", user_wallet.as_ref()]
    pub const SEEDS: &'static [u8] = b"staking_tier";

    /// Tier multipliers for credit allocation
    /// Example: Diamond (tier 5) gets 5x credits vs Bronze (tier 1)
    pub fn get_tier_multiplier(tier: u8) -> f64 {
        match tier {
            0 => 0.0,  // None
            1 => 1.0,  // Bronze
            2 => 1.5,  // Silver
            3 => 2.5,  // Gold
            4 => 4.0,  // Platinum
            5 => 5.0,  // Diamond
            _ => 1.0,
        }
    }
}

// ──────────────────────────────────────────────
// C3: DETERMINISTIC AIRDROP SYSTEM
// ──────────────────────────────────────────────

/// Airdrop Eligibility tracks points from on-chain protocol usage ONLY.
/// No wallet age or transaction count as sole gate (C3 requirement).
///
/// **Axiom A0-44**: KRONOS runs only permissionless cranks with proof emission
#[account]
pub struct AirdropEligibility {
    /// User wallet address
    pub user_wallet: Pubkey,

    /// Total points accumulated
    pub total_points: u64,

    /// First interaction timestamp (for seniority bonus)
    pub first_seen_timestamp: i64,

    /// Total service payments made (lamports)
    pub total_payments_lamports: u64,

    /// Number of proofs created (DecisionLog PDAs)
    pub proof_count: u32,

    /// Number of unique services used
    pub unique_services_used: u8,

    /// Airdrop allocation (calculated, in $AXION tokens)
    pub allocation_amount: u64,

    /// Claimed status
    pub has_claimed: bool,

    /// Claimed timestamp
    pub claimed_at: i64,

    /// Off-chain heuristic bonus (labeled "advisory only")
    /// Example: wallet age > 1 year adds 10% bonus
    pub advisory_bonus_bps: u16,

    /// PDA bump seed
    pub bump: u8,

    /// Reserved for future fields
    pub _reserved: [u8; 32],
}

impl AirdropEligibility {
    pub const LEN: usize = 8  // discriminator
        + 32  // user_wallet
        + 8   // total_points
        + 8   // first_seen_timestamp
        + 8   // total_payments_lamports
        + 4   // proof_count
        + 1   // unique_services_used
        + 8   // allocation_amount
        + 1   // has_claimed
        + 8   // claimed_at
        + 2   // advisory_bonus_bps
        + 1   // bump
        + 32; // _reserved

    /// Seeds: [b"airdrop_eligibility", user_wallet.as_ref()]
    pub const SEEDS: &'static [u8] = b"airdrop_eligibility";

    /// Points earned per service tier
    pub const POINTS_BASIC: u64 = 10;
    pub const POINTS_PRO: u64 = 100;
    pub const POINTS_INSTITUTIONAL: u64 = 1000;

    /// Seniority bonus: +10% per 90 days since first_seen
    pub fn calculate_seniority_bonus(&self, now: i64) -> f64 {
        let days_since_first = (now - self.first_seen_timestamp) / 86400;
        let quarters = days_since_first / 90;
        1.0 + (quarters as f64 * 0.10).min(0.50) // Cap at 50% bonus
    }
}

// ──────────────────────────────────────────────
// C4: BURN BUDGET SYSTEM
// ──────────────────────────────────────────────

/// Burn Budget Config controls token buyback with safety checks.
///
/// **Axiom A0-45**: Burn budget never reduces emergency reserve below min ratio
#[account]
pub struct BurnBudgetConfig {
    /// Maximum burn spend per epoch (basis points of net revenue)
    /// Example: 500 BPS = 5% of net revenue
    pub burn_budget_bps: u16,

    /// Minimum emergency reserve ratio (basis points)
    /// Example: 2500 BPS = 25% reserve minimum (Axiom 45)
    pub min_reserve_ratio_bps: u16,

    /// Maximum slippage tolerance (basis points)
    /// Example: 100 BPS = 1% max slippage
    pub max_slippage_bps: u16,

    /// Minimum liquidity depth required (lamports)
    pub min_liquidity_depth_lamports: u64,

    /// Total burned lifetime ($AXION tokens)
    pub total_burned_tokens: u64,

    /// Total SOL spent on burns lifetime
    pub total_burn_spend_sol: u64,

    /// Last burn timestamp
    pub last_burn_at: i64,

    /// Burn cooldown (seconds between burns)
    pub burn_cooldown_seconds: i64,

    /// PDA bump seed
    pub bump: u8,

    /// Reserved for future fields
    pub _reserved: [u8; 32],
}

impl BurnBudgetConfig {
    pub const LEN: usize = 8  // discriminator
        + 2   // burn_budget_bps
        + 2   // min_reserve_ratio_bps
        + 2   // max_slippage_bps
        + 8   // min_liquidity_depth_lamports
        + 8   // total_burned_tokens
        + 8   // total_burn_spend_sol
        + 8   // last_burn_at
        + 8   // burn_cooldown_seconds
        + 1   // bump
        + 32; // _reserved

    /// Seeds: [b"burn_budget_config"]
    pub const SEEDS: &'static [u8] = b"burn_budget_config";

    /// Default burn budget: 5% of net revenue per epoch
    pub const DEFAULT_BURN_BUDGET_BPS: u16 = 500;

    /// Default cooldown: 7 days (604800 seconds)
    pub const DEFAULT_COOLDOWN_SECONDS: i64 = 604800;
}

// ──────────────────────────────────────────────
// PRICING TIER MINIMUMS
// ──────────────────────────────────────────────

/// Minimum prices per service tier (in lamports)
/// Formula: price = max(cost_basis * 2.5, tier_minimum)
/// Margin floor: 150% (cost_basis * 2.5 = 150% profit margin)
pub mod tier_minimums {
    use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;

    pub const BASIC_ANALYSIS: u64 = (LAMPORTS_PER_SOL as f64 * 0.008) as u64;          // 0.008 SOL
    pub const WALLET_SCANNER: u64 = (LAMPORTS_PER_SOL as f64 * 0.08) as u64;          // 0.08 SOL
    pub const POOL_ANALYZER: u64 = (LAMPORTS_PER_SOL as f64 * 0.008) as u64;          // 0.008 SOL
    pub const TOKEN_DEEP_DIVE: u64 = (LAMPORTS_PER_SOL as f64 * 0.008) as u64;        // 0.008 SOL
    pub const PROTOCOL_AUDITOR: u64 = (LAMPORTS_PER_SOL as f64 * 0.015) as u64;       // 0.015 SOL
    pub const YIELD_OPTIMIZER: u64 = (LAMPORTS_PER_SOL as f64 * 0.015) as u64;        // 0.015 SOL
    pub const PRO_ANALYSIS: u64 = (LAMPORTS_PER_SOL as f64 * 0.15) as u64;            // 0.15 SOL
    pub const INSTITUTIONAL: u64 = (LAMPORTS_PER_SOL as f64 * 3.0) as u64;            // 3.0 SOL
}

// ──────────────────────────────────────────────
// VOLUME SCALING MULTIPLIERS
// ──────────────────────────────────────────────

/// Calculate volume discount multiplier based on monthly query count
/// Never reduces margin below 100% (cost basis * 2.0)
pub fn calculate_volume_multiplier(monthly_queries: u32) -> f64 {
    if monthly_queries < 1000 {
        1.0  // No discount
    } else if monthly_queries < 10_000 {
        0.95  // 5% discount
    } else if monthly_queries < 100_000 {
        0.85  // 15% discount
    } else {
        0.75  // 25% discount (max)
    }
}

// ──────────────────────────────────────────────
// EVENTS
// ──────────────────────────────────────────────

#[event]
pub struct CostIndexUpdated {
    pub cost_index_sol_per_1k_queries: u64,
    pub rpc_cost_sol: u64,
    pub ai_cost_sol: u64,
    pub storage_cost_sol: u64,
    pub multisig_signer: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PriceAdjusted {
    pub epoch_id: u32,
    pub service_id: u8,
    pub old_price_lamports: u64,
    pub new_price_lamports: u64,
    pub margin_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct CreditsAllocated {
    pub user_wallet: Pubkey,
    pub tier_level: u8,
    pub monthly_credits: u64,
    pub reset_at: i64,
}

#[event]
pub struct PointsAccumulated {
    pub user_wallet: Pubkey,
    pub points_earned: u64,
    pub total_points: u64,
    pub source: String,
}

#[event]
pub struct BurnExecuted {
    pub sol_spent: u64,
    pub tokens_burned: u64,
    pub slippage_actual_bps: u16,
    pub reserve_ratio_after_bps: u16,
    pub timestamp: i64,
}

// ══════════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION NOTES
// ══════════════════════════════════════════════════════════════════════════════
//
// To integrate this module:
//
// 1. Add to lib.rs:
//    ```rust
//    pub mod economic_engine;
//    use economic_engine::*;
//    ```
//
// 2. Add instruction handlers:
//    - initialize_cost_oracle(multisig_authority: Pubkey)
//    - update_cost_index(cost_index, rpc, ai, storage, signatures: Vec<[u8; 64]>)
//    - adjust_prices_permissionless() // KRONOS crank
//    - stake_for_credits(amount: u64, lock_duration: i64)
//    - claim_airdrop()
//    - buy_and_burn(max_sol_spend: u64, min_tokens_received: u64)
//
// 3. Frontend integration:
//    - Poll CostOracle every 30s for pricing transparency
//    - Display "On-chain fees + Signed CostIndex" label (C1 requirement)
//    - Show monthly credits balance and reset timer (C2)
//    - Display points accumulation from on-chain events only (C3)
//    - Show burn history and reserve protection status (C4)
//
// 4. KRONOS crank (scripts/kronos-crank.ts):
//    - adjust_prices() every 12 hours (PriceEpoch)
//    - check_launch_conditions() daily
//    - distribute_revenue() weekly
//    - buy_and_burn() monthly (with safety checks)
//
// ══════════════════════════════════════════════════════════════════════════════
