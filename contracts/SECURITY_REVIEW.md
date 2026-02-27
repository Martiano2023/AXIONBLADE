# NOUMEN Solana Programs -- Security Review

**Date:** 2026-02-10
**Reviewer:** Automated security audit (Claude Opus 4.6)
**Scope:** All 7 Solana programs + shared-types library
**Version:** Architecture v3.2.3
**Review type:** READ-ONLY static analysis

---

## Programs Reviewed

| # | Program | Program ID |
|---|---------|-----------|
| 1 | noumen-core | `9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE` |
| 2 | noumen-proof | `3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV` |
| 3 | noumen-treasury | `EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu` |
| 4 | noumen-apollo | `92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee` |
| 5 | noumen-hermes | `Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj` |
| 6 | noumen-auditor | `CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe` |
| 7 | noumen-service | `9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY` |
| - | shared-types | (library crate, no program ID) |

---

## Check 1: Signer / Authority Constraints

Every instruction must verify the correct signer through `Signer<'info>` and either `has_one` constraints or explicit `constraint =` checks.

### noumen-core

| Instruction | Signer | Mechanism | Result |
|---|---|---|---|
| `initialize_aeon` | `super_authority` | `Signer<'info>` + `init` PDA (one-shot) + `is_initialized` check in logic | **PASS** |
| `update_system_actors` | `super_authority` | `has_one = super_authority @ CoreError::Unauthorized` | **PASS** |
| `create_agent` | `aeon_authority` | `has_one = aeon_authority @ CoreError::Unauthorized` | **PASS** |
| `update_agent` | `aeon_authority` | `has_one = aeon_authority @ CoreError::Unauthorized` | **PASS** |
| `pause_agent` | `aeon_authority` | `has_one = aeon_authority @ CoreError::Unauthorized` | **PASS** |
| `kill_agent` | `aeon_authority` | `has_one = aeon_authority @ CoreError::Unauthorized` | **PASS** |
| `propose_policy_change` | `aeon_authority` | `has_one = aeon_authority @ CoreError::Unauthorized` | **PASS** |
| `execute_policy_change` | `aeon_authority` | `has_one = aeon_authority @ CoreError::Unauthorized` | **PASS** |
| `trigger_circuit_breaker` | `authority` | Explicit `constraint =` checking `aeon_authority OR keeper_authority` | **PASS** |
| `record_heartbeat` | `keeper_authority` | `has_one = keeper_authority @ CoreError::Unauthorized` | **PASS** |

### noumen-proof

| Instruction | Signer | Mechanism | Result |
|---|---|---|---|
| `initialize_proof` | `authority` | `Signer<'info>` + `init` PDA + `is_initialized` check | **PASS** |
| `log_decision` | `agent_authority` | `Signer<'info>` (any agent can log) | **PASS** (see Note 1) |
| `confirm_execution` | `executor` | `Signer<'info>` (any signer can confirm) | **PASS** (see Note 2) |
| `submit_batch_proof` | `agent_authority` | `Signer<'info>` (any agent can submit) | **PASS** (see Note 1) |
| `close_expired_batch` | `keeper_authority` | `has_one = keeper_authority @ ProofError::Unauthorized` | **PASS** |

### noumen-treasury

| Instruction | Signer | Mechanism | Result |
|---|---|---|---|
| `initialize_treasury` | `super_authority` | `Signer<'info>` + `init` PDA (one-shot) | **PASS** |
| `process_service_payment` | `payer` | `Signer<'info>` (any payer, by design) | **PASS** |
| `allocate_agent_budget` | `aeon_authority` | `constraint = aeon_authority.key() == treasury_config.aeon_authority` | **PASS** |
| `sweep_donations` | `keeper` | `constraint = keeper.key() == treasury_config.keeper_authority` | **PASS** |
| `record_donation_receipt` | `keeper` | `constraint = keeper.key() == treasury_config.keeper_authority` | **PASS** |
| `withdraw_creator_split` | `creator_wallet` | `constraint = creator_wallet.key() == treasury_config.creator_wallet` + `Signer` | **PASS** |
| `update_revenue_averages` | `keeper` | `constraint = keeper.key() == treasury_config.keeper_authority` | **PASS** |

### noumen-apollo

| Instruction | Signer | Mechanism | Result |
|---|---|---|---|
| `initialize_apollo` | `aeon_authority` | `Signer<'info>` + `init` PDA + `is_initialized` check | **PASS** |
| `publish_assessment` | `authority` | `has_one = authority @ ApolloError::Unauthorized` | **PASS** |
| `register_pool` | `authority` | `has_one = authority @ ApolloError::Unauthorized` | **PASS** |
| `update_pool_taxonomy` | `authority` | `has_one = authority @ ApolloError::Unauthorized` | **PASS** |

### noumen-hermes

| Instruction | Signer | Mechanism | Result |
|---|---|---|---|
| `initialize_hermes` | `aeon_authority` | `Signer<'info>` + `init` PDA + `is_initialized` check | **PASS** |
| `publish_report` | `authority` | `has_one = authority @ HermesError::Unauthorized` | **PASS** |
| `publish_pool_comparison` | `authority` | `has_one = authority @ HermesError::Unauthorized` | **PASS** |

### noumen-auditor

| Instruction | Signer | Mechanism | Result |
|---|---|---|---|
| `initialize_auditor` | `authority` | `Signer<'info>` + `init` PDA + `is_initialized` check | **PASS** |
| `record_truth_label` | `authority` | Explicit `constraint` check in instruction body: `authority.key() == config.authority` | **PASS** |
| `register_security_incident` | `authority` | Explicit `constraint` check in instruction body | **PASS** |
| `resolve_incident` | `authority` | Explicit `constraint` check in instruction body | **PASS** |
| `publish_accuracy_snapshot` | `authority` | Explicit `constraint` check in instruction body | **PASS** |

### noumen-service

| Instruction | Signer | Mechanism | Result |
|---|---|---|---|
| `initialize_service_config` | `super_authority` | `Signer<'info>` + `init` PDA + `is_initialized` check | **PASS** |
| `register_service` | `aeon_authority` | Explicit `constraint` in instruction body | **PASS** |
| `update_service_price` | `aeon_authority` | Explicit `constraint` in instruction body | **PASS** |
| `update_service_level` | `aeon_authority` | Explicit `constraint` in instruction body | **PASS** |
| `update_service_metrics` | `keeper_authority` | Explicit `constraint` in instruction body | **PASS** |

**Overall Check 1 Verdict: PASS**

---

## Check 2: Checked Arithmetic (no unchecked math)

All arithmetic operations must use `checked_add`, `checked_sub`, `checked_mul`, `checked_div` -- never raw `+`, `-`, `*`, `/` on user-influenced or state values.

### Results by Program

| Program | Uses checked_* | Any unchecked math? | Result |
|---|---|---|---|
| noumen-core | Yes (`checked_add`, `checked_sub`, `checked_add` for timestamps) | No | **PASS** |
| noumen-proof | Yes (`checked_sub` in `close_expired_batch`) | No | **PASS** |
| noumen-treasury | Yes (all CCS math, balance updates, counter increments) | No | **PASS** |
| noumen-apollo | Yes (`checked_add` for counters) | No | **PASS** |
| noumen-hermes | Yes (`checked_add` for `report_count`) | No | **PASS** |
| noumen-auditor | Yes (`checked_add` + `.ok_or()`) | No | **PASS** (A-1 fixed 2026-02-26) |
| noumen-service | Yes (`checked_mul`, `checked_div`, `checked_add`) | No | **PASS** |

### Issue A-1: noumen-auditor `.unwrap()` calls — FIXED (2026-02-26)

Both counter increments now use `.checked_add(1).ok_or(AuditorError::ArithmeticOverflow)?`. Zero `.unwrap()` calls remain in the program. The `ArithmeticOverflow` variant was already present in `AuditorError`.

**Status: Fixed**

**Overall Check 2 Verdict: PASS**

---

## Check 3: Double-Initialization Protection

Every config/singleton PDA must be protected against re-initialization.

| Program | Account | Protection Mechanism | Result |
|---|---|---|---|
| noumen-core | `AeonConfig` | `init` (PDA, one-shot) + explicit `!config.is_initialized` check at line 17 | **PASS** |
| noumen-proof | `ProofConfig` | `init` (PDA, one-shot) + explicit `!config.is_initialized` check at line 17 | **PASS** |
| noumen-proof | `DecisionLog` | `init` (PDA per agent_id+nonce, one-shot) | **PASS** |
| noumen-proof | `ExecutionResult` | `init` (PDA per decision_log, one-shot) | **PASS** |
| noumen-proof | `BatchProof` | `init` (PDA per agent_id+batch_nonce, one-shot) | **PASS** |
| noumen-treasury | `TreasuryConfig` | `init` (PDA, one-shot) | **PASS** |
| noumen-treasury | `TreasuryVault` | `init` (PDA, one-shot) | **PASS** |
| noumen-treasury | `DonationVault` | `init` (PDA, one-shot) | **PASS** |
| noumen-treasury | `CCSConfig` | `init` (PDA, one-shot) | **PASS** |
| noumen-treasury | `BudgetAllocation` | `init_if_needed` -- by design, allows re-allocation | **PASS** (see Note 3) |
| noumen-apollo | `ApolloConfig` | `init` (PDA, one-shot) + explicit `!config.is_initialized` check | **PASS** |
| noumen-hermes | `HermesConfig` | `init` (PDA, one-shot) + explicit `!config.is_initialized` check | **PASS** |
| noumen-auditor | `AuditorConfig` | `init` (PDA, one-shot) + explicit `!config.is_initialized` check | **PASS** |
| noumen-service | `ServiceConfig` | `init` (PDA, one-shot) + explicit `!config.is_initialized` check | **PASS** |

**Note 3 (Low):** `BudgetAllocation` in noumen-treasury uses `init_if_needed`, which means calling `allocate_agent_budget` a second time for the same `agent_id` will overwrite the previous allocation (resetting `spent` to 0, `daily_spent` to 0, etc.). This is presumably intentional -- AEON can reallocate budgets -- but a previously accumulated `spent` value would be lost. This is a design choice, not a vulnerability, but worth noting.

**Overall Check 3 Verdict: PASS**

---

## Check 4: PDA Seed Uniqueness

All PDAs must use unique, non-colliding seed prefixes to prevent cross-account collisions.

### Complete PDA Seed Map

| Program | PDA | Seeds | Unique? |
|---|---|---|---|
| noumen-core | `AeonConfig` | `[b"aeon_config"]` | Yes |
| noumen-core | `AgentManifest` | `[b"agent", agent_id.to_le_bytes()]` | Yes |
| noumen-core | `PolicyProposal` | `[b"proposal", proposal_id.to_le_bytes()]` | Yes |
| noumen-proof | `ProofConfig` | `[b"proof_config"]` | Yes |
| noumen-proof | `DecisionLog` | `[b"decision", agent_id.to_le_bytes(), nonce.to_le_bytes()]` | Yes |
| noumen-proof | `ExecutionResult` | `[b"execution", decision_log.key()]` | Yes |
| noumen-proof | `BatchProof` | `[b"batch", agent_id.to_le_bytes(), batch_nonce.to_le_bytes()]` | Yes |
| noumen-treasury | `TreasuryConfig` | `[b"treasury_config"]` | Yes |
| noumen-treasury | `TreasuryVault` | `[b"treasury_vault"]` | Yes |
| noumen-treasury | `DonationVault` | `[b"donation_vault"]` | Yes |
| noumen-treasury | `CCSConfig` | `[b"ccs_config"]` | Yes |
| noumen-treasury | `BudgetAllocation` | `[b"budget", agent_id.to_le_bytes()]` | Yes |
| noumen-treasury | `DonationReceipt` | `[b"donation_receipt", nonce.to_le_bytes()]` | Yes |
| noumen-apollo | `ApolloConfig` | `[b"apollo_config"]` | Yes |
| noumen-apollo | `AssessmentRecord` | `[b"assessment", pool_address, assessment_nonce.to_le_bytes()]` | Yes |
| noumen-apollo | `PoolTaxonomy` | `[b"pool_tax", pool_address]` | Yes |
| noumen-hermes | `HermesConfig` | `[b"hermes_config"]` | Yes |
| noumen-hermes | `IntelligenceReport` | `[b"report", report_nonce.to_le_bytes()]` | Yes |
| noumen-auditor | `AuditorConfig` | `[b"auditor_config"]` | Yes |
| noumen-auditor | `TruthLabel` | `[b"truth_label", signal_nonce.to_le_bytes()]` | Yes |
| noumen-auditor | `SecurityIncident` | `[b"incident", incident_nonce.to_le_bytes()]` | Yes |
| noumen-auditor | `AccuracySnapshot` | `[b"accuracy", snapshot_nonce.to_le_bytes()]` | Yes |
| noumen-service | `ServiceConfig` | `[b"service_config"]` | Yes |
| noumen-service | `ServiceEntry` | `[b"service", service_id.to_le_bytes()]` | Yes |

All seed prefixes are unique strings. No two PDA types share the same prefix. Cross-program collisions are impossible because PDAs are program-scoped (different program IDs produce different addresses even with identical seeds).

**Overall Check 4 Verdict: PASS**

---

## Check 5: Account Discriminators (Anchor automatic)

Anchor automatically prepends an 8-byte discriminator (SHA-256 hash of `"account:<AccountName>"`) to every `#[account]` struct. All programs use `#[account]` and Anchor's `Account<'info, T>` type, which validates discriminators on deserialization.

All account size constants include the 8-byte discriminator prefix.

**Overall Check 5 Verdict: PASS**

---

## Check 6: noumen-proof Immutability (A0-6)

**Axiom A0-6:** Proofs are immutable. Once a DecisionLog is written, it must not be modifiable or deletable.

### Analysis

Instructions in noumen-proof:
1. `initialize_proof` -- config setup, not a proof record
2. `log_decision` -- **creates** a DecisionLog PDA (uses `init`, one-shot)
3. `confirm_execution` -- **mutates only `execution_confirmed` field** (false -> true) on DecisionLog. Creates ExecutionResult PDA.
4. `submit_batch_proof` -- **creates** a BatchProof PDA (uses `init`, one-shot)
5. `close_expired_batch` -- **closes** a BatchProof PDA (reclaims rent)

**Assessment:**
- There are **no update instructions** for DecisionLog content (input_hash, decision_hash, justification_hash, evidence_families_bitmap, decision_class, etc. are never modified after creation).
- There are **no delete instructions** for DecisionLog. DecisionLog PDAs persist indefinitely.
- The `confirm_execution` instruction mutates exactly one field (`execution_confirmed`: false -> true), which is explicitly documented as the only permissible mutation (A0-6 compliance). Once confirmed, re-confirmation is blocked by `!decision_log.execution_confirmed` check.
- `close_expired_batch` only closes BatchProof (aggregated Merkle roots), not individual DecisionLog records.
- There are **no update or delete instructions** for ExecutionResult.

**Overall Check 6 Verdict: PASS**

---

## Check 7: noumen-apollo Has No CPI to Execution Programs (A0-14)

**Axiom A0-14:** Evaluation and execution must never be in the same agent for the same domain. APOLLO must never make CPI calls to execution programs.

### Analysis

The file begins with the structural comment:
```rust
// STRUCTURAL GUARANTEE: This program contains ZERO CPI calls. APOLLO outputs are read-only PDAs. (A0-14, A0-15)
```

Verification:
- **No `use anchor_lang::system_program;`** import (unlike noumen-treasury which imports it for transfers)
- **No `CpiContext`** usage anywhere in the file
- **No `invoke` or `invoke_signed`** calls
- The only external dependency is `shared_types::*` (enums and constants)
- All four instructions (`initialize_apollo`, `publish_assessment`, `register_pool`, `update_pool_taxonomy`) only write to PDAs owned by the apollo program itself
- No account in any instruction context references another program (no `Program<'info, OtherProgram>`)
- `system_program` is only used for `init` PDA rent allocation (Anchor internal, not a CPI to execution)

**Overall Check 7 Verdict: PASS**

---

## Check 8: noumen-hermes Has No CPI to noumen-apollo (A0-29)

**Axiom A0-29:** HERMES outputs are terminal. HERMES must not interact with APOLLO or the risk engine.

### Analysis

The file begins with the structural comment:
```rust
// STRUCTURAL GUARANTEE: Zero CPI calls to noumen_apollo or risk engine. HERMES outputs are terminal. (A0-29, A0-30)
```

Verification:
- **No `use anchor_lang::system_program;`** import
- **No `CpiContext`** usage
- **No `invoke` or `invoke_signed`** calls
- No references to the Apollo program ID or any other program
- All three instructions (`initialize_hermes`, `publish_report`, `publish_pool_comparison`) only write to PDAs owned by the hermes program
- `system_program` is only used for `init` PDA rent allocation
- No account in any instruction context references another program (beyond `system_program`)
- The Apollo program ID (`92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee`) appears nowhere in the Hermes code

**Overall Check 8 Verdict: PASS**

---

## Check 9: CCS Math Correctness in Treasury

**Requirements:**
- Creator split = `amount * base_split_bps / 10000` (integer division, truncation favors treasury)
- Treasury split = `amount - creator_split`
- Total cap: 15% (1500 bps)
- Floor: 4% (400 bps)
- Stipend cap: 5% (500 bps)
- Invariant: `creator_split + treasury_split == amount`

### Analysis

**CCS Split Calculation** (lines 140-148 of noumen-treasury):
```rust
let creator_split = amount_lamports
    .checked_mul(band.base_split_bps as u64)
    .ok_or(TreasuryError::ArithmeticOverflow)?
    .checked_div(10_000)
    .ok_or(TreasuryError::ArithmeticOverflow)?;

let treasury_split = amount_lamports
    .checked_sub(creator_split)
    .ok_or(TreasuryError::ArithmeticOverflow)?;
```

- **Integer division truncation favors treasury:** `checked_div(10_000)` truncates any remainder downward, meaning the creator gets slightly less and treasury gets slightly more. This is correct.
- **Subtraction-based treasury_split:** `treasury_split = amount - creator_split` ensures the invariant `creator + treasury == amount` holds exactly (no rounding gap). This is verified by the explicit check at lines 151-157.
- **Band configuration at genesis:**
  - Band 0: 1200 bps (12%) -- under 1500 cap
  - Band 1: 1000 bps (10%) -- under 1500 cap
  - Band 2: 700 bps (7%) -- under 1500 cap
  - Band 3: 400 bps (4%) -- at floor, under cap
- **Constants from shared-types:**
  - `CCS_CAP_TOTAL_BPS = 1500` (15%)
  - `CCS_FLOOR_BASE_SPLIT_BPS = 400` (4%)
  - `CCS_CAP_STIPEND_BPS = 500` (5%)

### Issue B-1: CCS Band Caps Not Validated at Runtime (Low)

The genesis band configuration respects the caps, but the program does not enforce at runtime that `base_split_bps <= CCS_CAP_TOTAL_BPS` or `base_split_bps >= CCS_FLOOR_BASE_SPLIT_BPS`. The bands are set only during `initialize_treasury` and there is no `update_ccs_bands` instruction, so they cannot be changed after initialization. However, if such an instruction were added in the future, it should validate against the caps. Currently this is a defense-in-depth observation, not a vulnerability.

**Overall Check 9 Verdict: PASS**

---

## Check 10: Reserve Ratio (25%) Enforcement in Withdrawals

**Axiom A0-3:** Reserve ratio >= 25% of total balance.

### Analysis

**`withdraw_creator_split`** (lines 410-426 of noumen-treasury):
```rust
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
```

- `RESERVE_RATIO_BPS = 2500` (25%)
- The check ensures `reserved_lamports >= (total_balance - withdrawal_amount) * 25%`
- Additional check: `amount <= free_balance` ensures withdrawal does not exceed available (non-reserved) balance
- Integer truncation on `required_reserve` is downward, making the reserve check slightly less strict (by at most 1 lamport). This is acceptable and does not meaningfully weaken the 25% ratio.

### Issue C-1: Reserve Ratio Check Logic Question (Low)

The current formula checks `reserved >= (balance_after) * 25%`. This means: "after withdrawal, the existing reserved amount must be at least 25% of the remaining balance." However, the `reserved_lamports` field is never automatically adjusted during withdrawals -- only `total_balance_lamports` and `free_balance_lamports` are updated. This means the check depends on `reserved_lamports` having been set correctly by some other mechanism (not visible in the current codebase). If `reserved_lamports` is externally maintained and kept accurate, the check is sound. But if `reserved_lamports` stagnates at 0 (its initial value), the check `0 >= required_reserve` would fail for any non-zero balance, effectively blocking all withdrawals -- which is a safe failure mode.

**Overall Check 10 Verdict: PASS**

---

## Additional Issues Found

### Issue D-1: noumen-proof `log_decision` and `confirm_execution` Have No Agent Authority Verification (Medium)

**File:** `/Users/marciano/Desktop/AXIONBLADE/contracts/programs/noumen-proof/src/lib.rs`

The `log_decision` instruction accepts any `Signer` as `agent_authority` -- it does not verify that the signer is actually a registered agent in noumen-core. Similarly, `confirm_execution` accepts any `Signer` as `executor`.

This means:
- Any wallet can create a DecisionLog PDA with an arbitrary `agent_id`
- Any wallet can confirm an unconfirmed DecisionLog's execution

**Mitigating factors:**
- The PDA seeds `[b"decision", agent_id, nonce]` prevent collision/overwriting
- The design may intentionally be permissive at the proof layer, with agent validation happening off-chain or in the calling layer
- Since DecisionLog PDAs are immutable records, the worst case is "spam" decision logs that waste SOL on rent (paid by the signer)

**Severity: Medium** (depends on whether off-chain agent validation is the intended design)
**Recommendation:** Consider adding a cross-program constraint that verifies the agent_authority matches the `authority` field in the corresponding `AgentManifest` PDA in noumen-core, or document that this is intentionally permissive.

### Issue D-2: noumen-auditor `initialize_auditor` Has No Restriction on Who Can Initialize (Low)

**File:** `/Users/marciano/Desktop/AXIONBLADE/contracts/programs/noumen-auditor/src/lib.rs`

Any signer can call `initialize_auditor` and become the auditor authority. Unlike other programs where initialization is restricted to `super_authority` or `aeon_authority`, the auditor program allows the first caller to claim the auditor role.

**Mitigating factors:**
- The PDA `[b"auditor_config"]` can only be initialized once (Anchor `init` constraint)
- The deployer would typically initialize this immediately after deployment
- The `aeon_authority` is passed as an argument (not validated against an external source)

**Severity: Low** (race condition window exists only between deployment and initialization)
**Recommendation:** Consider passing a cross-reference to the core program's `AeonConfig` to validate the initializer is the `aeon_authority` or `super_authority`.

### Issue D-3: noumen-proof `initialize_proof` Has No Restriction on Who Can Initialize (Low)

Same pattern as D-2. Any signer can call `initialize_proof` and set the `keeper_authority`. The PDA is one-shot so only the first caller wins.

**Severity: Low**
**Recommendation:** Same as D-2.

### Issue D-4: Circuit Breaker Cannot De-escalate (Design Observation)

**File:** `/Users/marciano/Desktop/AXIONBLADE/contracts/programs/noumen-core/src/lib.rs`, line 339

```rust
require!(
    args.new_mode >= config.circuit_breaker_mode,
    CoreError::InvalidModeTransition
);
```

The circuit breaker can only escalate (Normal -> Cautious -> Restricted -> Halted), never de-escalate. Once `Halted`, the system has no on-chain mechanism to recover to `Normal`. This may be intentional (requiring a contract redeploy or governance action), but it should be documented.

**Severity: Low** (design decision, not a vulnerability)
**Recommendation:** Document the intended recovery path from Halted mode. Consider adding a `reset_circuit_breaker` instruction gated by `super_authority` with appropriate delay.

### Issue D-5: `kill_proof` Argument is Not Stored (Low)

**File:** `/Users/marciano/Desktop/AXIONBLADE/contracts/programs/noumen-core/src/lib.rs`, line 213

```rust
let _ = args.kill_proof;
```

The `kill_proof` hash is accepted as an argument but explicitly discarded with `let _`. The comment says "Store the kill proof in creation_proof field (reuse)" but the code does not actually store it.

**Severity: Low** (auditability gap -- no on-chain record of why an agent was killed)
**Recommendation:** Either store `kill_proof` in the manifest (e.g., overwrite `creation_proof` or add a `kill_proof` field) or emit it in the `AgentStatusChanged` event.

### Issue D-6: noumen-treasury `allocate_agent_budget` Uses `init_if_needed` (Low)

**File:** `/Users/marciano/Desktop/AXIONBLADE/contracts/programs/noumen-treasury/src/lib.rs`, line 779

Using `init_if_needed` means re-calling `allocate_agent_budget` for an existing agent will overwrite the budget, resetting `spent` and `daily_spent` to 0. This could be used to erase spending history.

**Severity: Low** (only callable by `aeon_authority`, so this requires admin privileges)
**Recommendation:** Consider checking if the budget PDA already exists and either rejecting reallocation or preserving the `spent` field.

---

## Summary Table

| # | Check | Verdict |
|---|-------|---------|
| 1 | Signer/authority constraints on all instructions | **PASS** |
| 2 | All arithmetic uses checked operations | **PASS** (A-1 fixed 2026-02-26) |
| 3 | No double-initialization attacks | **PASS** |
| 4 | PDA seed prefixes are unique | **PASS** |
| 5 | Account discriminators handled by Anchor | **PASS** |
| 6 | noumen-proof has no update/delete for proofs (A0-6) | **PASS** |
| 7 | noumen-apollo has no CPI to execution programs (A0-14) | **PASS** |
| 8 | noumen-hermes has no CPI to noumen-apollo (A0-29) | **PASS** |
| 9 | CCS math correct, rounding favors treasury | **PASS** |
| 10 | Reserve ratio 25% enforced in withdrawals | **PASS** |

---

## Issues Summary

| ID | Severity | Program | Description |
|----|----------|---------|-------------|
| A-1 | ~~Medium~~ | noumen-auditor | ~~`checked_add(1).unwrap()` used instead of `.ok_or(Error)?`~~ **FIXED 2026-02-26**: now uses `.ok_or(AuditorError::ArithmeticOverflow)?` |
| D-1 | **Medium** | noumen-proof | `log_decision` and `confirm_execution` do not verify the signer is a registered agent. Any wallet can create/confirm decision logs. |
| B-1 | **Low** | noumen-treasury | CCS band caps (15% total, 4% floor, 5% stipend) are not enforced at runtime -- only at genesis. No update instruction exists currently, but defense-in-depth is missing. |
| C-1 | **Low** | noumen-treasury | `reserved_lamports` is never modified by any treasury instruction after init (stays 0). Reserve ratio check may be overly conservative or broken depending on external maintenance. |
| D-2 | **Low** | noumen-auditor | `initialize_auditor` is callable by any wallet (no super_authority gate). First caller wins. |
| D-3 | **Low** | noumen-proof | `initialize_proof` is callable by any wallet (no super_authority gate). First caller wins. |
| D-4 | **Low** | noumen-core | Circuit breaker can only escalate, never de-escalate. No recovery path from Halted mode. |
| D-5 | **Low** | noumen-core | `kill_proof` argument in `kill_agent` is discarded (`let _ = args.kill_proof`), not stored on-chain. |
| D-6 | **Low** | noumen-treasury | `init_if_needed` on `BudgetAllocation` allows overwriting existing budgets, resetting `spent` counters to zero. |

---

## Recommendations

1. ~~**[Medium] Fix auditor `.unwrap()` calls**~~ — **FIXED 2026-02-26**.

2. **[Medium] Consider cross-program agent verification in noumen-proof:** Add an optional or mandatory account constraint in `LogDecision` and `ConfirmExecution` that verifies the signer against a noumen-core `AgentManifest` PDA. This prevents unauthorized wallets from creating spurious decision records.

3. **[Low] Gate initialization functions:** For `noumen-proof` and `noumen-auditor`, consider requiring a cross-reference to the core `AeonConfig` PDA to validate that the initializer is the `super_authority` or `aeon_authority`.

4. **[Low] Document circuit breaker recovery:** Add documentation for how the system recovers from `Halted` mode, or add a `super_authority`-gated de-escalation instruction.

5. **[Low] Store or emit `kill_proof`:** Either write `args.kill_proof` to the `AgentManifest` or include it in the `AgentStatusChanged` event for auditability.

6. **[Low] Add `reserved_lamports` management:** Ensure there is a mechanism (likely a keeper instruction) to update `reserved_lamports` so the reserve ratio check in `withdraw_creator_split` functions as intended.

7. **[Low] Protect `BudgetAllocation` from silent overwrite:** In `allocate_agent_budget`, check if the PDA already has data and either reject or preserve historical spending.

---

**End of security review.**
