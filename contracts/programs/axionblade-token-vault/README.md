# axionblade-token-vault

**Program ID:** `AXI0nTokenVau1tProgramAddress111111111111111` (placeholder — not yet deployed)
**Network:** Not yet deployed
**Anchor version:** 0.30.1
**Crate name:** `axionblade_token_vault`

**Status: Pre-deployment. This program is NOT in the Anchor.toml workspace and does NOT have an assigned mainnet/devnet Program ID. It uses a placeholder `declare_id!` value. Do not deploy until KRONOS launch conditions are met (Axiom A0-46).**

---

## Purpose

`axionblade-token-vault` manages the conditional $AXION token launch and the associated vesting schedules. The token only launches when KRONOS proves all required conditions have been met and a mandatory 72-hour delay has elapsed after approval (A0-46).

The program is structured around three phases:

1. **Pre-launch:** `TokenVaultConfig` initialized, conditions not yet met
2. **Approval:** All conditions met, 72h delay begins
3. **Execution:** After 72h, token mint is created, tokens distributed to vesting PDAs, mint authority revoked

After launch, vesting release is permissionless — anyone can crank the release for a beneficiary once the cliff is reached (A0-47).

---

## Launch Conditions

All of the following must be true simultaneously:

| Condition | Threshold | Source |
|-----------|-----------|--------|
| Treasury USD value | >= $100,000 (100,000,000,000 with 6 decimals) | Off-chain (passed to instruction) |
| Revenue growth weeks | >= 3 consecutive | Off-chain (passed to instruction) |
| Stability check | true (no market anomalies) | Off-chain (passed to instruction) |

After all conditions pass, `vault_config.launch_status` becomes `Approved` and `conditions_met_at` is recorded. `execute_token_launch` can only be called >= 72 hours later.

**Note:** The condition inputs are passed as instruction arguments by KRONOS, not pulled from on-chain oracles in the current implementation. A production deployment should integrate Pyth for the treasury USD value to prevent KRONOS from supplying false values.

---

## ASCII Architecture

```
  [kronos_authority]
         |
         | initialize_vault(total_supply) => TokenVaultConfig PDA [b"token_vault_config"]
         |
         | check_launch_conditions(treasury_usd, growth_weeks, stability)
         |   => LaunchConditions PDA [b"launch_conditions"]
         |   => If all met: launch_status = Approved, records conditions_met_at
         |
         | (wait 72 hours)
         |
         | execute_token_launch()
         |   => Creates SPL token Mint account
         |   => launch_status = Executed
         |   => (mint authority should be revoked externally after vesting setup)

  [kronos_authority]
         |
         | create_vesting_schedule(beneficiary, total, cliff, duration)
         |   => VestingSchedule PDA [b"vesting_schedule", beneficiary]

  [anyone (permissionless crank)]
         |
         | release_vesting()
         |   => Validates cliff passed
         |   => Calculates linear vested amount
         |   => CPI to token program: transfers releasable tokens
```

---

## Accounts

### TokenVaultConfig

**PDA seeds:** `[b"token_vault_config"]`
**Space:** 8 + 32 + 33 + 1 + 8 + 8 + 8 + 1 + 32 = 131 bytes

| Field | Type | Description |
|-------|------|-------------|
| `authority` | `Pubkey` | KRONOS agent authority. |
| `token_mint` | `Option<Pubkey>` | None before launch; set to mint address after `execute_token_launch`. |
| `launch_status` | `u8` | 0=Pending, 1=Approved, 2=Executed |
| `conditions_met_at` | `i64` | Timestamp when all conditions passed. Used for 72h delay. |
| `token_launched_at` | `i64` | Timestamp of `execute_token_launch`. |
| `total_supply` | `u64` | Total $AXION token supply (e.g., 1,000,000,000 * 10^9). |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 32]` | Reserved. |

### LaunchConditions

**PDA seeds:** `[b"launch_conditions"]`
**Space:** 8 + 8 + 1 + 1 + 1 + 8 + 32 + 1 + 32 = 92 bytes
Uses `init_if_needed` — updated on every `check_launch_conditions` call.

| Field | Type | Description |
|-------|------|-------------|
| `treasury_usd_threshold` | `u64` | Required threshold ($100k = 100,000,000,000 with 6 decimals). |
| `required_growth_weeks` | `u8` | Consecutive growth weeks required (3). |
| `stability_check` | `bool` | Whether stability check passed. |
| `anomaly_detected` | `bool` | Whether anomaly was detected (hardcoded false in current implementation). |
| `checked_at` | `i64` | Last check timestamp. |
| `proof_hash` | `[u8; 32]` | Reserved for KRONOS proof hash (not populated in current implementation). |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 32]` | Reserved. |

### VestingSchedule

**PDA seeds:** `[b"vesting_schedule", beneficiary.as_ref()]`
**Space:** 8 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 32 = 113 bytes

| Field | Type | Description |
|-------|------|-------------|
| `beneficiary` | `Pubkey` | Token recipient. PDA seed. |
| `total_amount` | `u64` | Total $AXION allocated. |
| `released_amount` | `u64` | Tokens already released. |
| `start_time` | `i64` | Vesting start (set to `clock.unix_timestamp` at creation). |
| `cliff_duration` | `i64` | Seconds before any tokens unlock. |
| `vesting_duration` | `i64` | Total seconds of linear vesting. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 32]` | Reserved. |

---

## Instructions

### `initialize_vault`

**Signer:** `kronos_authority` (payer)

Creates `TokenVaultConfig` PDA. Sets `launch_status = Pending`, `token_mint = None`.

**Parameters:** `total_supply: u64`

---

### `check_launch_conditions`

**Signer:** `kronos_authority`
**Access control:** Explicit check: `kronos_authority.key() == vault_config.authority`

Updates or creates `LaunchConditions`. Evaluates all three conditions. If all met, sets `launch_status = Approved` and records `conditions_met_at`.

Uses `init_if_needed` on `LaunchConditions` — can be called repeatedly until conditions are met.

**Parameters:** `treasury_usd_value: u64`, `growth_weeks_count: u8`, `stability_check_passed: bool`

**Emits:** `LaunchConditionsMet` (only if conditions all pass)

---

### `execute_token_launch`

**Signer:** `kronos_authority`
**Access control:** Explicit check via `vault_config.authority`

Validates:
- `launch_status == Approved`
- `now >= conditions_met_at + 72 * 3600`

Creates the SPL token `Mint` account via Anchor's `init`. Sets `launch_status = Executed`.

**Emits:** `TokenLaunched { token_mint, total_supply, timestamp }`

---

### `create_vesting_schedule`

**Signer:** `authority` (any signer — see Known Limitations)

Creates a `VestingSchedule` PDA for a beneficiary. `start_time` is set to current timestamp.

**Parameters:** `total_amount: u64`, `cliff_duration: i64`, `vesting_duration: i64`

---

### `release_vesting`

**Signer:** Not required (permissionless crank — A0-47)

Validates cliff has passed. Computes linear vested amount. Transfers releasable tokens from `vesting_token_account` to `beneficiary_token_account`.

Vesting formula:
```
vested = total_amount * (now - start_time) / vesting_duration
vested = min(vested, total_amount)
releasable = vested - released_amount
```

Uses `u128` intermediate to avoid overflow in multiplication.

**Emits:** `VestingReleased { beneficiary, amount, timestamp }`

**Note:** Uses `.unwrap()` in the u128 arithmetic. This is a known issue — if `vesting_duration == 0`, this panics. In practice KRONOS should prevent creating vesting schedules with zero duration.

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | `Unauthorized` | Signer is not KRONOS authority |
| 6001 | `LaunchNotApproved` | `execute_token_launch` before `check_launch_conditions` approves |
| 6002 | `DelayNotMet` | 72h delay not yet elapsed since `conditions_met_at` |
| 6003 | `CliffNotReached` | `release_vesting` before cliff duration elapsed |
| 6004 | `NothingToRelease` | No releasable tokens at this time |

---

## Security Considerations

1. **Off-chain condition inputs:** KRONOS passes `treasury_usd_value`, `growth_weeks_count`, and `stability_check_passed` as instruction arguments. These are not verified against on-chain oracles. A production deployment should integrate Pyth price feeds for the treasury USD value and implement on-chain revenue verification.

2. **72-hour delay is enforced on-chain:** `execute_token_launch` validates `now >= conditions_met_at + 72 * 3600`. This cannot be bypassed.

3. **Mint authority:** After `execute_token_launch`, the mint authority is `vault_config` (the PDA). Revoking this authority after vesting setup is a critical step that must be performed manually. The program emits a `msg!` as a reminder but does not auto-revoke.

4. **`create_vesting_schedule` is unrestricted:** Any signer can create a vesting schedule for any beneficiary. There is no validation that the authority is KRONOS or that sufficient tokens exist in the vesting token account. This must be tightened before mainnet.

5. **`release_vesting` uses `.unwrap()`:** The u128 arithmetic uses `.unwrap()` rather than returning clean errors. `vesting_duration == 0` would panic. This is a known issue.

6. **`check_launch_conditions` uses `init_if_needed`:** This means the instruction can be called multiple times, overwriting previous condition check results. Ensure the keeper verifies conditions are freshly computed before each call.

---

## Integration Examples

### Check launch conditions

```typescript
await tokenVaultProgram.methods
  .checkLaunchConditions(
    new anchor.BN("100000000000"),  // $100k (6 decimals)
    3,                               // 3 growth weeks
    true                             // stability passed
  )
  .accounts({
    kronosAuthority: kronosKeypair.publicKey,
    vaultConfig: vaultConfigPda,
    launchConditions: launchConditionsPda,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([kronosKeypair])
  .rpc();
```

---

## Known Limitations

1. Program ID is a placeholder (`AXI0nTokenVau1tProgramAddress111111111111111`). Must be replaced with actual deployment address before any use.

2. The program is not in the Anchor.toml workspace. It cannot be built or tested with `anchor build` as configured.

3. Vesting arithmetic uses `.unwrap()` — not consistent with the `.ok_or(Error)?` pattern used in other programs.

4. `create_vesting_schedule` has no authority gate. Any wallet can create schedules.

5. Oracle integration for treasury USD value is not implemented. Launch condition verification is fully trusted to KRONOS.
