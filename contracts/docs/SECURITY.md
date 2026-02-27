# AXIONBLADE Security Reference

**Version:** v3.4.0
**Last audit:** 2026-02-10 (automated static analysis — see `SECURITY_REVIEW.md`)
**Scope:** 7 Anchor programs + shared-types library

---

## Threat Model

### Assets at Risk

| Asset | Location | Value |
|-------|----------|-------|
| SOL in TreasuryVault | `noumen-treasury` TreasuryVault PDA | Operational reserves |
| SOL in DonationVault | `noumen-treasury` DonationVault PDA | Pending sweep amount |
| Authority keys | Off-chain (super, aeon, keeper) | System control |
| Agent manifests | `noumen-core` AgentManifest PDAs | Agent lifecycle control |
| Risk assessment data | `noumen-apollo` AssessmentRecord PDAs | Risk signal integrity |
| User permissions | `noumen-core` AgentPermissionConfig PDAs | Autonomous execution authorization |
| Proof records | `noumen-proof` DecisionLog PDAs | Audit trail integrity |

### Threat Actors

| Actor | Capabilities | Mitigations |
|-------|-------------|-------------|
| External attacker | No keys, can submit any transaction | PDA seeds + authority constraints; all SOL in PDAs not accessible without proper signer |
| Compromised keeper | Hot wallet access | Keeper can only write proofs, record metrics, sweep donations; cannot withdraw SOL |
| Compromised aeon | AEON key access | Cannot touch treasury directly (only budget allocation); two-step super rotation |
| Compromised super | Root key access | Two-step rotation to new super; hardware wallet recommended |
| Malicious agent | Agent authority key | Budget constraints on-chain; proof requirement before execution |
| Front-runner (initialization) | First-to-submit transactions | Initialize all programs immediately after deployment (same block) |

---

## Access Control Matrix

Legend: Y=Authorized, N=Not authorized, R=Read-only

| Instruction | super | aeon | keeper | user | anyone |
|-------------|-------|------|--------|------|--------|
| `initialize_aeon` | Y | N | N | N | N |
| `update_system_actors` | Y | N | N | N | N |
| `accept_super_authority` | Y (pending) | N | N | N | N |
| `create_agent` | N | Y | N | N | N |
| `update_agent` | N | Y | N | N | N |
| `pause_agent` | N | Y | N | N | N |
| `kill_agent` | N | Y | N | N | N |
| `propose_policy_change` | N | Y | N | N | N |
| `execute_policy_change` | N | Y | N | N | N |
| `trigger_circuit_breaker` | N | Y | Y | N | N |
| `reset_circuit_breaker` | Y | N | N | N | N |
| `record_heartbeat` | N | N | Y | N | N |
| `register_agent_subscription` | N | N | N | Y | N |
| `update_agent_permissions` | N | N | N | Y (own) | N |
| `revoke_agent_permissions` | N | N | N | Y (own) | N |
| `aeon_pause_hermes` | N | Y | N | N | N |
| `initialize_treasury` | Y | N | N | N | N |
| `initialize_donations` | Y | N | N | N | N |
| `process_service_payment` | N | N | N | N | Y (any payer) |
| `allocate_agent_budget` | N | Y | N | N | N |
| `update_agent_budget` | N | Y | N | N | N |
| `sweep_donations` | N | N | Y | N | N |
| `record_donation_receipt` | N | N | Y | N | N |
| `withdraw_creator_split` | N | N | N | creator | N |
| `update_revenue_averages` | N | N | Y | N | N |
| `initialize_volume_tracker` | N | N | N | N | Y (self) |
| `track_volume_usage` | N | N | Y | N | N |
| `log_decision` | N | N | Y | N | N |
| `confirm_execution` | N | N | Y | N | N |
| `submit_batch_proof` | N | N | Y | N | N |
| `close_expired_batch` | N | N | Y | N | N |
| `initialize_apollo` | N | Y | N | N | N |
| `publish_assessment` | N | N | N | N | apollo-authority |
| `register_pool` | N | N | N | N | apollo-authority |
| `update_pool_taxonomy` | N | N | N | N | apollo-authority |
| `initialize_hermes` | N | Y | N | N | N |
| `publish_report` | N | N | N | N | hermes-authority |
| `publish_pool_comparison` | N | N | N | N | hermes-authority |
| `log_agent_action_proof` | N | N | N | N | hermes-authority |
| `confirm_agent_action_executed` | N | N | N | N | hermes-authority |
| `initialize_auditor` | N | N | N | N | first caller |
| `record_truth_label` | N | N | N | N | auditor-authority |
| `register_security_incident` | N | N | N | N | auditor-authority |
| `resolve_incident` | N | N | N | N | auditor-authority |
| `publish_accuracy_snapshot` | N | N | N | N | auditor-authority |
| `initialize_service_config` | Y | N | N | N | N |
| `register_service` | N | Y | N | N | N |
| `update_service_price` | N | Y | N | N | N |
| `update_service_level` | N | Y | N | N | N |
| `update_service_metrics` | N | N | Y | N | N |

---

## Signer Validation Patterns

Two patterns are used across the programs. Both are audited by the security review and pass.

### Pattern 1: `has_one` constraint (Anchor)

```rust
#[account(
    has_one = aeon_authority @ CoreError::Unauthorized
)]
pub aeon_config: Account<'info, AeonConfig>,
pub aeon_authority: Signer<'info>,
```

Anchor validates that `aeon_config.aeon_authority == aeon_authority.key()`. The signer must also be `Signer<'info>`, ensuring the key actually signed the transaction.

Used by: `noumen-core` for most instructions, `noumen-apollo`, `noumen-hermes`, `noumen-service`, `noumen-proof`.

### Pattern 2: Explicit `constraint =` check

```rust
#[account(
    constraint = (
        authority.key() == aeon_config.aeon_authority ||
        authority.key() == aeon_config.keeper_authority
    ) @ CoreError::Unauthorized
)]
pub authority: Signer<'info>,
```

Used for: `trigger_circuit_breaker` (either aeon or keeper), `noumen-treasury` (validates keeper/aeon against config fields).

Both patterns are correct. `has_one` is preferred for simplicity; explicit `constraint` is used when multi-key authorization is needed.

---

## Checked Arithmetic

All programs use Rust's checked arithmetic to prevent integer overflow/underflow:

```rust
// Correct pattern (used in all programs):
value.checked_add(delta).ok_or(Error::MathOverflow)?

// Previously A-1 (fixed 2026-02-26): noumen-auditor counter increments
// now use the correct pattern:
config.total_truth_labels = config.total_truth_labels.checked_add(1)
    .ok_or(AuditorError::ArithmeticOverflow)?;
```

The workspace-level `Cargo.toml` sets `overflow-checks = true` for release builds, which causes panics on overflow in any unchecked arithmetic (`+`, `-`, `*`, `/`). This is a defense-in-depth measure; the explicit checked arithmetic in instruction logic is the primary guard.

---

## Reentrancy Protections

Anchor programs on Solana are inherently resistant to reentrancy because:

1. Solana's runtime does not allow CPI back into the calling program during the same transaction
2. All state mutations happen after CPI calls in instructions that use CPI (state is read before CPI, mutated after)
3. `noumen-treasury` follows the correct pattern: reads balance values into local variables before CPI transfers, then takes mutable borrows for state updates after CPI

```rust
// Correct pattern in process_service_payment:
let creator_amount = ...; // calculate
// CPI: transfer creator_amount
system_program::transfer(CpiContext::new(...), creator_amount)?;
// CPI: transfer vault_total
system_program::transfer(CpiContext::new(...), vault_total)?;
// Then take mutable borrows (Anchor lifetime rules prevent earlier mutation)
let vault = &mut ctx.accounts.treasury_vault;
vault.total_balance_lamports = ...;
```

---

## Integer Overflow Handling

| Scenario | Protection |
|----------|-----------|
| Revenue split calculation | `checked_mul` + `checked_div` on every intermediate |
| Split invariant | Explicit equality check: `require!(sum == amount_lamports)` |
| Counter increments | `checked_add(1).ok_or(Error)?` |
| Reserve ratio check | `checked_mul(2500).checked_div(10_000)` |
| Agent budget cap | `checked_mul(1500).checked_div(10_000)` |
| Timestamp arithmetic | `checked_add(seconds).ok_or(Error::MathOverflow)?` |
| u128 in token vault | Used for `total_amount * time_elapsed / vesting_duration` to avoid overflow |

---

## Oracle Manipulation Resistance

`noumen-apollo` does not use on-chain oracles directly. All risk calculation is off-chain. This means:

**Risk:** APOLLO authority could publish manipulated assessments.

**Mitigations:**
1. APOLLO weight in Risk Engine is capped at 40% (`APOLLO_MAX_WEIGHT_BPS = 4000`, hardcoded, not from args)
2. Every assessment references a `DecisionLog` PDA in `noumen-proof` (audit trail)
3. Evidence families bitmap is validated (bits 5-7 must be 0)
4. Assessment expiry is enforced (cannot publish already-expired assessments)
5. APOLLO has zero CPI — it cannot trigger any downstream state change
6. `noumen-auditor` retroactively labels assessment outcomes via truth labels, providing accuracy accountability

The 40% weight cap is the primary defense: even if APOLLO publishes maliciously optimistic assessments, the Risk Engine can only be influenced up to 40% of the final decision weight.

---

## Known Vulnerabilities and Mitigations

### Issue A-1 (Medium): noumen-auditor `.unwrap()` calls — FIXED

**Location:** `noumen-auditor/src/lib.rs` lines 91-94, 140-144

**Fix applied (2026-02-26):** All counter increments now use `.checked_add(1).ok_or(AuditorError::ArithmeticOverflow)?` — zero `.unwrap()` calls remain.

**Status:** Fixed

---

### Issue D-1 (Medium): noumen-proof initialization gate

**Location:** `noumen-proof::initialize_proof`, `noumen-auditor::initialize_auditor`

**Risk:** Any wallet can call `initialize_proof` or `initialize_auditor` first and claim keeper/auditor authority.

**Window:** Between program deployment and the first initialization call.

**Mitigation:** Deploy and initialize in the same block. Use `anchor deploy` followed immediately by `initialize_proof` in the same script.

**Status:** Architectural. Acceptable if deployment procedure is followed correctly.

---

### Issue D-4 (Low): Circuit breaker has no on-chain de-escalation (before fix)

**Status: FIXED** — `reset_circuit_breaker` instruction added, gated by `super_authority`. The security review noted this as a design issue; it is now resolved in the current code.

---

### Issue D-5 (Low): kill_proof was not stored

**Status: FIXED** — `kill_agent` now writes `args.kill_proof` to `manifest.creation_proof`. The security review noted this as a gap; it is resolved in the current code.

---

### Issue D-6 (Low): init_if_needed on BudgetAllocation

**Status: FIXED** — `allocate_agent_budget` now uses `init` (one-shot). A separate `update_agent_budget` instruction was added that preserves `spent` and `daily_spent` fields. The security review noted the `init_if_needed` pattern; it is resolved in the current code.

---

## Audit Checklist

Use this list when reviewing any new instruction or account added to the system.

### Signer Validation
- [ ] Every instruction has at least one `Signer<'info>` account
- [ ] All authority checks use `has_one = X @ Error::Unauthorized` or explicit `constraint`
- [ ] No instruction allows a `Pubkey` argument to bypass signer verification

### Account Initialization
- [ ] Config/singleton PDAs use `init` (not `init_if_needed`) unless re-initialization is explicitly intended
- [ ] Every `init` account has an explicit `is_initialized` guard in the instruction body
- [ ] PDA seeds are unique across all accounts in the program

### Arithmetic
- [ ] All arithmetic on user-influenced or state values uses `checked_*`
- [ ] All `.ok_or()` results propagate errors (no `.unwrap()` in instruction code)
- [ ] Invariant checks exist for any derived sums (e.g., split totals)

### CPI Safety
- [ ] All SOL transfers from PDAs use `CpiContext::new_with_signer` with correct seeds
- [ ] Mutable borrows of accounts involved in CPI are taken AFTER the CPI call
- [ ] Zero-CPI programs have no `CpiContext`, `invoke`, or `invoke_signed` calls

### Immutability Requirements
- [ ] `DecisionLog` fields (except `execution_confirmed`) have no update instruction
- [ ] `AssessmentRecord` PDAs have no update or delete instruction
- [ ] `TruthLabel` and `AccuracySnapshot` PDAs have no update or delete instruction

### Axiom Compliance
- [ ] New evaluator agent creation validates `execution_permission == Never`
- [ ] New assessment validates evidence bitmap bits 5-7 == 0
- [ ] Execution-class decisions validate >= 2 evidence families
- [ ] APOLLO `max_weight_bps` is never from user input
- [ ] Service price >= cost * 120%
- [ ] HERMES `hermes_enabled` validated before execution actions
