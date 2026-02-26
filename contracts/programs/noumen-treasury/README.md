# noumen-treasury

**Program ID:** `EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu`
**Network:** Devnet / Localnet
**Anchor version:** 0.30.1
**Crate name:** `noumen_treasury` (on-chain identifier — do not rename)

---

## Purpose

`noumen-treasury` is the financial backbone of AXIONBLADE. It handles all SOL flows: service payments, revenue splits, agent budget allocations, donation management, creator withdrawals, and volume discount tracking.

The program enforces:
- A 4-way revenue split on every service payment: 40% Ops / 30% Reserve / 15% Dev Fund / 15% Creator
- Reserve ratio >= 25% at all times during withdrawals (A0-3)
- Daily treasury spend cap <= 3% of free balance
- Agent budget cap <= 15% of free balance per agent allocation
- Donations isolated from CCS split (A0-24: donations confer no rights)
- Donation privacy via hashed wallet addresses (A0-27)
- Creator split withdrawal with dual reserve + daily cap check

The `economic_engine.rs` module (not yet integrated into the instruction set) defines account structures for future features: CostOracle, PriceEpoch, StakingTier, AirdropEligibility, and BurnBudgetConfig. These are designed but the instructions that use them are not yet live.

---

## Revenue Split (basis points)

```
Payment received
       |
       |--- 15% (1500 bps) ---> creator_wallet  (CPI transfer, immediate)
       |
       `--- 85% vault_total ---> treasury_vault PDA
              |
              |--- 40% (4000 bps) operations_lamports
              |--- 30% (3000 bps) reserved_lamports
              `--- 15% (1500 bps) dev_fund_lamports
```

Creator always gets the arithmetic remainder (`amount - floor(amount * 85%)`), ensuring no dust accumulates.

**Invariant enforced in code:** `operations + treasury_reserve + dev_fund + creator == amount_lamports` exactly.

---

## CCS Bands (Creator Compensation Schedule)

4 revenue-based bands configured at genesis:

| Band | Threshold | base_split_bps | max_stipend_bps |
|------|-----------|----------------|-----------------|
| 0 | 0 SOL | 1200 (12%) | 300 (3%) |
| 1 | 1 SOL | 1000 (10%) | 500 (5%) |
| 2 | 10 SOL | 700 (7%) | 500 (5%) |
| 3 | 50 SOL | 400 (4%) | 500 (5%) |

Global caps from `shared-types`: `CCS_CAP_TOTAL_BPS = 1500`, `CCS_FLOOR_BASE_SPLIT_BPS = 400`, `CCS_CAP_STIPEND_BPS = 500`.

Note: The current instruction set uses a fixed 15% creator split in `process_service_payment`, not the CCS band system. The CCS bands exist for future additional creator compensation mechanics. The fixed split and the CCS `creator_accumulated` tracker are updated together on every payment.

---

## ASCII Architecture

```
  [super_authority]
         |
         | initialize_treasury()   => TreasuryConfig + TreasuryVault
         | initialize_donations()  => DonationVault + CCSConfig

  [payer (any)]
         |
         | process_service_payment()
         |   => 15% CPI to creator_wallet
         |   => 85% to treasury_vault PDA
         |   => Updates: reserved_lamports, dev_fund, operations, CCS tracker

  [aeon_authority]
         |
         | allocate_agent_budget()  => BudgetAllocation PDA (init, one-shot)
         | update_agent_budget()    => BudgetAllocation PDA (update only, preserves spent)

  [keeper]
         |
         | sweep_donations()        => DonationVault -> TreasuryVault (CPI signed by vault PDA)
         | record_donation_receipt()=> DonationReceipt PDA
         | update_revenue_averages()=> CCSConfig (avg_7d, avg_30d)
         | track_volume_usage()     => VolumeDiscountTracker PDA

  [creator_wallet]
         |
         | withdraw_creator_split() => TreasuryVault -> creator_wallet (reserve + daily cap check)

  [any wallet]
         |
         | initialize_volume_tracker() => VolumeDiscountTracker PDA (self-funded)
```

---

## Accounts

### TreasuryConfig

**PDA seeds:** `[b"treasury_config"]`
**Space:** 172 bytes

| Field | Type | Description |
|-------|------|-------------|
| `super_authority` | `Pubkey` | Highest privilege; set at init. |
| `aeon_authority` | `Pubkey` | Can allocate agent budgets. |
| `keeper_authority` | `Pubkey` | Automates sweeps, receipts, averages, volume tracking. |
| `creator_wallet` | `Pubkey` | Receives creator split; only key that can withdraw creator split. |
| `is_initialized` | `bool` | Anti-re-init guard. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 32]` | Reserved. |

### TreasuryVault

**PDA seeds:** `[b"treasury_vault"]`
**Space:** 153 bytes

The SOL-holding PDA. SOL balance in this account must match `total_balance_lamports` plus the rent-exempt minimum.

| Field | Type | Description |
|-------|------|-------------|
| `total_balance_lamports` | `u64` | Total SOL tracked in vault (excluding rent-exempt minimum). |
| `reserved_lamports` | `u64` | Portion designated as emergency reserve (A0-3). Updated by `process_service_payment`. |
| `free_balance_lamports` | `u64` | `total_balance - reserved`. Derived field, recalculated after every mutation. |
| `total_revenue_lifetime` | `u64` | Cumulative gross revenue received (includes creator portion). |
| `total_spent_lifetime` | `u64` | Cumulative withdrawals. |
| `daily_spend_lamports` | `u64` | Current day's total withdrawals. Reset after 86400s. |
| `daily_spend_reset_at` | `i64` | Epoch boundary for daily cap reset. |
| `total_donations_swept` | `u64` | Cumulative donation SOL swept from DonationVault. |
| `dev_fund_lamports` | `u64` | Dev fund sub-bucket tracker (15% of revenue). |
| `operations_lamports` | `u64` | Operations sub-bucket tracker (40% of revenue). |
| `updated_at` | `i64` | Timestamp of last mutation. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 48]` | Reserved. |

### DonationVault

**PDA seeds:** `[b"donation_vault"]`
**Space:** 50 bytes

Staging account for donations before daily sweep. Donations never trigger CCS split.

| Field | Type | Description |
|-------|------|-------------|
| `total_received` | `u64` | Cumulative donations received. |
| `pending_sweep` | `u64` | Amount waiting to be swept to treasury_vault. |
| `sweep_count` | `u32` | Number of completed sweeps. |
| `last_sweep_at` | `i64` | Timestamp of last sweep. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 21]` | Reserved. |

### CCSConfig

**PDA seeds:** `[b"ccs_config"]`
**Space:** calculated (8 + 4*12 + 6 + 8+8+8+8 + 1 + 48)

| Field | Type | Description |
|-------|------|-------------|
| `bands` | `[CCSBand; 4]` | 4 revenue bands set at genesis. Never mutated post-init. |
| `cap_total_bps` | `u16` | Global cap: 1500 (15%). |
| `floor_base_split_bps` | `u16` | Global floor: 400 (4%). |
| `cap_stipend_bps` | `u16` | Stipend cap: 500 (5%). |
| `avg_7d_revenue` | `u64` | 7-day rolling revenue average (updated by keeper). |
| `avg_30d_revenue` | `u64` | 30-day rolling revenue average (updated by keeper). |
| `total_creator_paid` | `u64` | Lifetime cumulative creator payments. |
| `creator_accumulated` | `u64` | Pending creator withdrawable balance. Incremented on payment, decremented on withdrawal. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 48]` | Reserved. |

**CCSBand struct:**

| Field | Type | Description |
|-------|------|-------------|
| `threshold_lamports` | `u64` | Revenue threshold that activates this band. |
| `base_split_bps` | `u16` | Creator base split in basis points. |
| `max_stipend_bps` | `u16` | Maximum stipend in basis points. |

### BudgetAllocation

**PDA seeds:** `[b"budget", agent_id.to_le_bytes()]`
**Space:** 91 bytes

Per-agent budget record. Created via `allocate_agent_budget` (one-shot, uses `init`). Updated in-place via `update_agent_budget` without resetting `spent` or `daily_spent`.

| Field | Type | Description |
|-------|------|-------------|
| `agent_id` | `u16` | Agent this budget belongs to. |
| `allocated` | `u64` | Total budget granted. |
| `spent` | `u64` | Cumulative spend (managed externally). |
| `daily_cap` | `u64` | Maximum per-day spend. |
| `daily_spent` | `u64` | Current-day spend (managed externally). |
| `daily_reset_at` | `i64` | Daily reset boundary. |
| `updated_at` | `i64` | Last update timestamp. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 32]` | Reserved. |

### DonationReceipt

**PDA seeds:** `[b"donation_receipt", nonce.to_le_bytes()]`
**Space:** 147 bytes

Immutable record of a received donation. Source wallet is stored hashed for privacy (A0-27).

| Field | Type | Description |
|-------|------|-------------|
| `nonce` | `u64` | Sequential receipt number. PDA seed. |
| `amount` | `u64` | Donation amount in lamports. |
| `timestamp` | `i64` | When the receipt was recorded. |
| `source_wallet_hash` | `[u8; 32]` | Keccak256 of donor's wallet address (A0-27). |
| `disclosure_mode` | `u8` | 0=Pseudonymous, 1=Disclosed |
| `receipt_status` | `u8` | 0=Active |
| `counts_as_donation` | `bool` | Always true. Anti-masquerade flag. |
| `correlated_payments` | `u32` | Number of payments correlated with this donation (anti-masquerade tracking). |
| `correlated_flag` | `bool` | If true, donation is flagged as suspicious (conditional). |
| `receipt_hash` | `[u8; 32]` | Hash of the full receipt document. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 42]` | Reserved. |

### VolumeDiscountTracker

**PDA seeds:** `[b"volume_tracker", wallet.as_ref()]`
**Space:** 88 bytes

Tracks monthly query volume for a wallet to apply tiered discounts.

| Field | Type | Description |
|-------|------|-------------|
| `wallet` | `Pubkey` | Wallet this tracker belongs to. |
| `monthly_scan_count` | `u16` | Queries this month. Auto-resets every 30 days. |
| `monthly_reset_at` | `i64` | Next reset timestamp. |
| `lifetime_scans` | `u32` | All-time query count. |
| `current_discount_tier` | `u8` | 0=none, 1=10%, 2=20%, 3=30% |
| `total_spent_lamports` | `u64` | Lifetime SOL spent on services. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 32]` | Reserved. |

**Discount tiers:**

| Monthly scans | Discount |
|---------------|----------|
| 0 – 9 | 0% (tier 0) |
| 10 – 49 | 10% (tier 1) |
| 50 – 99 | 20% (tier 2) |
| 100+ | 30% (tier 3) |

---

## Instructions

### `initialize_treasury`

**Signer:** `super_authority` (payer)
**One-time:** Yes (Anchor `init` constraint on PDAs)

Step 1 of treasury setup. Creates `TreasuryConfig` and `TreasuryVault`. Must be followed by `initialize_donations`.

**Parameters:** `aeon_authority: Pubkey`, `keeper_authority: Pubkey`, `creator_wallet: Pubkey`

**Emits:** `TreasuryInitialized`

---

### `initialize_donations`

**Signer:** `super_authority`
**Access control:** Constraint validates signer is `treasury_config.super_authority`

Step 2. Creates `DonationVault` and `CCSConfig` with genesis bands. Can only be called after `initialize_treasury`.

**Emits:** None (logs via `msg!`)

---

### `process_service_payment`

**Signer:** `payer` (any wallet)

Receives a service payment and splits it:
1. Computes `operations_amount = floor(amount * 40%)`
2. Computes `treasury_reserve_amount = floor(amount * 30%)`
3. Computes `dev_fund_amount = floor(amount * 15%)`
4. `creator_amount = amount - (operations + treasury_reserve + dev_fund)` (absorbs rounding dust)
5. Enforces invariant: all four parts sum exactly to `amount_lamports`
6. CPI: transfers `creator_amount` from payer to `creator_wallet`
7. CPI: transfers `vault_total` from payer to `treasury_vault`
8. Updates all tracking fields

**Parameters:** `service_id: u16`, `amount_lamports: u64`

**Emits:** `ServicePaymentProcessed`

---

### `allocate_agent_budget`

**Signer:** `aeon_authority`
**Access control:** Constraint checks `aeon_authority.key() == treasury_config.aeon_authority`

Creates (one-shot, uses `init`) a `BudgetAllocation` PDA. Budget cap: `allocated <= free_balance * 15%`. Returns `AgentBudgetCapExceeded` if violated.

**Parameters:** `agent_id: u16`, `allocated: u64`, `daily_cap: u64`

**Emits:** `BudgetAllocated`

---

### `update_agent_budget`

**Signer:** `aeon_authority`

Updates an existing `BudgetAllocation` without resetting `spent` or `daily_spent`. Revalidates the 15% cap. This is a separate instruction from `allocate_agent_budget` specifically to preserve spending history.

**Parameters:** `_agent_id: u16`, `new_allocated: u64`, `new_daily_cap: u64`

**Emits:** `BudgetUpdated`

---

### `sweep_donations`

**Signer:** `keeper`
**Access control:** Constraint checks `keeper.key() == treasury_config.keeper_authority`

CPI-transfers all `pending_sweep` SOL from `DonationVault` (PDA-signed) to `TreasuryVault`. No CCS split. Updates `total_donations_swept`.

**Emits:** `DonationSwept`

---

### `record_donation_receipt`

**Signer:** `keeper`
**Access control:** Constraint checks `keeper.key() == treasury_config.keeper_authority`

Creates a `DonationReceipt` PDA with hashed donor identity. Updates `DonationVault.pending_sweep` and `total_received`.

**Parameters:** `nonce: u64`, `amount: u64`, `source_wallet_hash: [u8; 32]`, `disclosure_mode: u8`, `receipt_hash: [u8; 32]`

**Emits:** `DonationReceiptCreated`

---

### `withdraw_creator_split`

**Signer:** `creator_wallet`
**Access control:** Constraint checks `creator_wallet.key() == treasury_config.creator_wallet`

Withdraws accumulated creator split. Enforces:
1. `amount <= ccs_config.creator_accumulated`
2. `reserved_lamports >= (total_balance - amount) * 25%` (A0-3 reserve ratio)
3. `amount <= free_balance`
4. `current_daily_spend + amount <= free_balance * 3%` (daily cap)

CPI-transfers from `treasury_vault` PDA (PDA-signed).

**Parameters:** `amount: u64`

**Emits:** `CreatorWithdrawal`

---

### `update_revenue_averages`

**Signer:** `keeper`

Updates `avg_7d_revenue` and `avg_30d_revenue` in `CCSConfig`. These rolling averages are used off-chain for CCS band selection.

**Parameters:** `avg_7d_revenue: u64`, `avg_30d_revenue: u64`

**Emits:** `RevenueAveragesUpdated`

---

### `initialize_volume_tracker`

**Signer:** `wallet` (self-funded, any wallet)

Creates a `VolumeDiscountTracker` PDA for the signing wallet. Initializes all counters to zero and sets `monthly_reset_at = now + 30 days`.

**Emits:** `VolumeTrackerInitialized`

---

### `track_volume_usage`

**Signer:** `keeper`

Called by keeper after a successful service payment to update the user's volume tracker. Auto-resets monthly counter if `now >= monthly_reset_at`. Updates `current_discount_tier` based on `monthly_scan_count`.

**Parameters:** `service_id: u16`, `amount_lamports: u64`

**Emits:** `VolumeDiscountUpdated`

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | `ZeroAmount` | Payment or withdrawal amount is 0 |
| 6001 | `SplitMismatch` | Split sum does not equal total amount |
| 6002 | `NotInitialized` | TreasuryConfig not initialized |
| 6003 | `UnauthorizedAeon` | Signer is not `aeon_authority` |
| 6004 | `UnauthorizedKeeper` | Signer is not `keeper_authority` |
| 6005 | `InvalidCreatorWallet` | Creator wallet does not match config |
| 6006 | `InsufficientCreatorBalance` | Withdrawal > `creator_accumulated` |
| 6007 | `ReserveRatioBreach` | Post-withdrawal reserve would drop below 25% (A0-3) |
| 6008 | `InsufficientTreasuryBalance` | Insufficient free balance for withdrawal |
| 6009 | `DailySpendCapExceeded` | Daily spend cap (3% of free balance) would be breached |
| 6010 | `AgentBudgetCapExceeded` | Allocation would exceed 15% of free balance |
| 6011 | `NothingToSweep` | `pending_sweep == 0` |
| 6012 | `ArithmeticOverflow` | Checked arithmetic returned `None` |

---

## Security Considerations

1. **Split invariant:** The code explicitly asserts `operations + treasury_reserve + dev_fund + creator == amount_lamports` and returns `SplitMismatch` if this fails. The creator always receives the arithmetic remainder to prevent dust accumulation.

2. **Reserve ratio enforcement:** `withdraw_creator_split` checks that after the withdrawal, `reserved_lamports >= (remaining_balance) * 25%`. This is the A0-3 enforcement point. If `reserved_lamports` is stale, all withdrawals will be blocked (safe failure mode).

3. **PDA signing for vault withdrawals:** Both `sweep_donations` (from DonationVault) and `withdraw_creator_split` (from TreasuryVault) use `CpiContext::new_with_signer` with PDA seeds. No external keypair can transfer from these PDAs.

4. **Donation isolation:** Donations flow DonationVault → TreasuryVault without triggering CCS split. `counts_as_donation = true` is hardcoded. Anti-masquerade: `correlated_flag` can be set externally if patterns suggest the donation is a conditional payment.

5. **Budget allocation is one-shot:** `allocate_agent_budget` uses `init` (not `init_if_needed`). A second call for the same `agent_id` will fail with `AccountAlreadyInitialized`. Budget modifications must use `update_agent_budget`, which preserves historical spending.

6. **Daily cap reset race condition:** The daily cap is reset when `now - daily_spend_reset_at >= 86400`. If two withdrawals are processed in the same second after a reset boundary, both will observe the same reset and the second may incorrectly compute the daily spend. This is a known edge case inherent to Unix timestamp granularity.

---

## Integration Examples

### Process a service payment

```typescript
await treasuryProgram.methods
  .processServicePayment(1, new anchor.BN(10_000_000))  // service_id=1, 0.01 SOL
  .accounts({
    payer: userKeypair.publicKey,
    treasuryConfig: treasuryConfigPda,
    treasuryVault: treasuryVaultPda,
    ccsConfig: ccsConfigPda,
    creatorWallet: creatorWallet,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([userKeypair])
  .rpc();
```

### Withdraw creator split

```typescript
await treasuryProgram.methods
  .withdrawCreatorSplit(new anchor.BN(5_000_000))
  .accounts({
    creatorWallet: creatorKeypair.publicKey,
    treasuryConfig: treasuryConfigPda,
    treasuryVault: treasuryVaultPda,
    ccsConfig: ccsConfigPda,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([creatorKeypair])
  .rpc();
```

---

## Known Limitations

1. `reserved_lamports` in `TreasuryVault` is initialized to 0 and incremented via `process_service_payment` (the 30% reserve portion). There is no keeper instruction to manually sync `reserved_lamports`. If the field becomes out of sync with actual vault holdings, reserve ratio checks may give unexpected results.

2. The CCS band system in `CCSConfig` is not currently used for creator payment distribution in `process_service_payment`. The fixed 15% split is used instead. The bands are available for future use.

3. Volume discount tiers affect off-chain pricing but are not enforced in `process_service_payment`. The keeper must ensure the discounted price is passed as `amount_lamports`.
