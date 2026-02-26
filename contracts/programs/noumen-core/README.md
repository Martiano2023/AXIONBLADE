# noumen-core

**Program ID:** `9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE`
**Network:** Devnet / Localnet (same ID on both per Anchor.toml)
**Anchor version:** 0.30.1
**Crate name:** `noumen_core` (on-chain identifier — do not rename)

---

## Purpose

`noumen-core` is the sovereign governance layer for the AXIONBLADE infrastructure. It owns the `AeonConfig` singleton PDA that acts as the system's root-of-trust. Every other program reads authority keys from this account either via CPI or off-chain lookup.

Responsibilities:

- Bootstrap the three authority hierarchy (super > aeon > keeper)
- Create, update, pause, and kill agent manifests (hard cap: 100 agents, axiom A0-9)
- Enforce the evaluator/executor firewall at creation time (axiom A0-14)
- Propose and execute time-locked policy changes (Layer 1: 72h–30d, Layer 2: 24h)
- Trigger and reset the circuit breaker
- Record keeper heartbeats for liveness proofs
- Manage per-user agent permission configurations (AEON, APOLLO, HERMES toggles)

---

## ASCII Architecture

```
  [super_authority]
         |
         | initialize_aeon()
         | update_system_actors()
         | reset_circuit_breaker()
         v
  +------------------+
  |   AeonConfig     |  PDA: [b"aeon_config"]
  |  (singleton)     |
  +------------------+
         |
         | create_agent()          => AgentManifest PDA
         | update_agent()          => AgentManifest PDA
         | pause_agent()           => AgentManifest PDA
         | kill_agent()            => AgentManifest PDA
         | propose_policy_change() => PolicyProposal PDA
         | execute_policy_change() => PolicyProposal PDA
         v
  [aeon_authority]

  [keeper_authority]
         |
         | record_heartbeat()
         | trigger_circuit_breaker()

  [user_wallet]
         |
         | register_agent_subscription() => AgentPermissionConfig PDA
         | update_agent_permissions()    => AgentPermissionConfig PDA
         | revoke_agent_permissions()    => AgentPermissionConfig PDA

  [aeon_authority]
         |
         | aeon_pause_hermes()           => AgentPermissionConfig PDA (user's)
```

---

## Accounts

### AeonConfig

**PDA seeds:** `[b"aeon_config"]`
**Space:** 325 bytes (8 discriminator + 317 fields)

| Field | Type | Description |
|-------|------|-------------|
| `super_authority` | `Pubkey` | Highest privilege. Can rotate all keys. Two-step transfer via `pending_super_authority`. |
| `pending_super_authority` | `Pubkey` | Staging field for two-step super_authority rotation. `Pubkey::default()` when no transfer is pending. |
| `aeon_authority` | `Pubkey` | Sovereign governor. Creates/manages agents. Proposes/executes policy changes. |
| `keeper_authority` | `Pubkey` | Automated ops key. Records heartbeats. Can trigger (but not reset) circuit breaker. |
| `treasury_program` | `Pubkey` | Registered address of noumen-treasury program. |
| `proof_program` | `Pubkey` | Registered address of noumen-proof program. |
| `active_agent_count` | `u16` | Current number of Active or Paused agents. Decremented on kill. |
| `circuit_breaker_mode` | `u8` | 0=Normal, 1=Cautious, 2=Restricted, 3=Halted. Monotonically escalating except via `reset_circuit_breaker`. |
| `is_initialized` | `bool` | Anti-re-initialization guard. |
| `operational_agent_cap` | `u32` | Soft cap set at init. Must be <= `HARD_AGENT_CAP` (100). |
| `last_heartbeat` | `i64` | Unix timestamp of most recent `record_heartbeat` call. |
| `heartbeat_interval` | `i64` | Expected heartbeat frequency in seconds. Off-chain monitors alert if exceeded. |
| `created_at` | `i64` | Initialization timestamp. |
| `updated_at` | `i64` | Timestamp of most recent mutation. |
| `bump` | `u8` | PDA canonical bump seed. |
| `_reserved` | `[u8; 96]` | Reserved for future fields without account migration. |

### AgentManifest

**PDA seeds:** `[b"agent", agent_id.to_le_bytes()]`
**Space:** 170 bytes

| Field | Type | Description |
|-------|------|-------------|
| `agent_id` | `u16` | Monotonic identifier. Part of PDA seed. |
| `authority` | `Pubkey` | Agent's signing key. Used by noumen-proof to validate decision logs. |
| `agent_type` | `u8` | 0=Collector, 1=Evaluator, 2=Executor, 3=Auditor |
| `status` | `u8` | 0=Pending, 1=Active, 2=Paused, 3=Killed |
| `execution_permission` | `u8` | 0=Never, 1=Limited, 2=Full. Evaluators are hard-locked to Never (A0-14). |
| `level` | `u16` | Hierarchy depth. Top-level agents are 0. |
| `budget_lamports` | `u64` | Total lifetime budget. |
| `budget_spent_lamports` | `u64` | Cumulative SOL spent (tracked externally; field available). |
| `budget_daily_cap_lamports` | `u64` | Daily spend ceiling. |
| `birth_bond_lamports` | `u64` | Reserved for future birth-bond mechanism. |
| `ttl` | `i64` | Time-to-live Unix timestamp. Must be in the future at creation and update. |
| `creation_proof` | `[u8; 32]` | Hash of off-chain creation decision document. Overwritten by `kill_proof` on `kill_agent`. |
| `created_at` | `i64` | Creation timestamp. |
| `updated_at` | `i64` | Most recent update timestamp. |
| `last_active` | `i64` | Initialized to creation time; updated externally by agent on activity. |
| `daily_spend_reset_at` | `i64` | Epoch boundary for daily cap reset. |
| `bump` | `u8` | PDA canonical bump seed. |
| `_reserved` | `[u8; 64]` | Reserved. |

### PolicyProposal

**PDA seeds:** `[b"proposal", proposal_id.to_le_bytes()]`
**Space:** 147 bytes

| Field | Type | Description |
|-------|------|-------------|
| `proposal_id` | `u32` | Unique identifier for this proposal. |
| `proposer` | `Pubkey` | Must equal `aeon_authority` at proposal time. |
| `policy_layer` | `u8` | 1=Constitutional (72h–30d delay), 2=Operational (24h delay). Layer 0 is immutable. |
| `status` | `u8` | 0=Pending, 1=Executed |
| `change_hash` | `[u8; 32]` | Keccak256 or SHA-256 of the proposed change specification. |
| `delay_until` | `i64` | Earliest execution timestamp. |
| `cooldown_until` | `i64` | Post-execution cooldown (initialized to 0; intended for future enforcement). |
| `proposed_at` | `i64` | Proposal creation timestamp. |
| `executed_at` | `i64` | Set on execution. |
| `expires_at` | `i64` | `delay_until + 604800` (7 days). Proposal must be executed before expiry. |
| `bump` | `u8` | PDA canonical bump seed. |
| `_reserved` | `[u8; 64]` | Reserved. |

### AgentPermissionConfig

**PDA seeds:** `[b"agent_permission", user.key(), agent_id.to_le_bytes()]`
**Space:** calculated per struct

Per-user, per-agent permission grant. Created by the user, readable by any off-chain process. Enforced on-chain by `noumen-hermes` during action confirmation.

| Field | Type | Description |
|-------|------|-------------|
| `user_wallet` | `Pubkey` | Owner; must match signer for all mutations. |
| `agent_id` | `u16` | Which agent these permissions apply to. |
| `aeon_monitoring_enabled` | `bool` | Allow AEON to read portfolio positions. Default: true. |
| `aeon_auto_revoke_approvals` | `bool` | Allow AEON to revoke protocol approvals autonomously. Default: false. |
| `aeon_auto_exit_pools` | `bool` | Allow AEON to exit LP positions autonomously. Default: false. |
| `aeon_auto_unstake` | `bool` | Allow AEON to unstake autonomously. Default: false. |
| `aeon_il_threshold_bps` | `u16` | IL threshold that triggers AEON action. Default: 1000 (10%). |
| `aeon_health_factor_threshold_bps` | `u16` | Health factor floor. Default: 12000 (1.2). |
| `apollo_auto_analysis_enabled` | `bool` | Allow APOLLO to auto-analyze. Default: false. |
| `apollo_analysis_frequency_hours` | `u8` | Analysis cadence. Default: 24. |
| `hermes_enabled` | `bool` | Master HERMES execution switch. A0-31: default false. |
| `hermes_max_tx_amount_lamports` | `u64` | Per-transaction spend ceiling for HERMES. |
| `hermes_allowed_protocols_bitmap` | `u32` | Bit flags indicating allowed protocol integrations. |
| `hermes_max_slippage_bps` | `u16` | Slippage tolerance for HERMES swaps. Default: 100 (1%). |
| `hermes_dca_enabled` | `bool` | Allow HERMES DCA automation. Default: false. |
| `hermes_rebalance_enabled` | `bool` | Allow HERMES rebalancing. Default: false. |
| `hermes_daily_tx_limit` | `u8` | Daily HERMES transaction ceiling. Default: 5. |
| `hermes_tx_count_today` | `u8` | Rolling daily counter. Reset when `hermes_last_tx_date` is more than 86400s in the past. |
| `hermes_last_tx_date` | `i64` | Timestamp of last HERMES action or daily reset. |
| `created_at` | `i64` | Account creation timestamp. |
| `updated_at` | `i64` | Most recent update timestamp. |
| `bump` | `u8` | PDA canonical bump seed. |
| `_reserved` | `[u8; 64]` | Reserved. |

---

## Instructions

### `initialize_aeon`

**Signer:** `super_authority` (payer)
**One-time:** Yes (guarded by `is_initialized` flag and `init` constraint)

Initializes `AeonConfig`. All three authority keys must be distinct from each other (`AuthoritiesMustBeDistinct`). The `operational_agent_cap` must not exceed `HARD_AGENT_CAP` (100).

**Parameters (`InitializeAeonArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `keeper_authority` | `Pubkey` | Keeper signing key |
| `aeon_authority` | `Pubkey` | AEON signing key |
| `treasury_program` | `Pubkey` | noumen-treasury program address |
| `proof_program` | `Pubkey` | noumen-proof program address |
| `heartbeat_interval` | `i64` | Seconds between expected heartbeats |
| `operational_agent_cap` | `u32` | Soft agent cap (max 100) |

**Emits:** `AeonInitialized { super_authority, aeon_authority, keeper_authority, timestamp }`

---

### `update_system_actors`

**Signer:** `super_authority`
**Access control:** `has_one = super_authority`

Updates `aeon_authority` and/or `keeper_authority` immediately. Super authority rotation is two-step: calling this sets `pending_super_authority`; the new key must then call `accept_super_authority`.

**Parameters (`UpdateSystemActorsArgs`):** All fields are `Option<Pubkey>`. Pass `None` to leave a field unchanged.

**Emits:** `SystemActorsUpdated`

---

### `accept_super_authority`

**Signer:** `new_super_authority` (the pending key)

Completes the two-step super authority transfer. Requires `pending_super_authority != Pubkey::default()` and that the signer matches `pending_super_authority`.

**Emits:** `SuperAuthorityTransferred`

---

### `create_agent`

**Signer:** `aeon_authority` (payer)
**Access control:** `has_one = aeon_authority`

Creates an `AgentManifest` PDA. Enforces:
- `active_agent_count < operational_agent_cap` (soft cap)
- `active_agent_count < HARD_AGENT_CAP` (hard cap = 100, A0-9)
- Evaluator agents must have `execution_permission = Never` (A0-14)
- `ttl > clock.unix_timestamp`

**Parameters (`CreateAgentArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `agent_id` | `u16` | Unique ID (also the PDA seed) |
| `authority` | `Pubkey` | Agent's signing key |
| `agent_type` | `u8` | AgentType enum (0-3) |
| `execution_permission` | `u8` | ExecutionPermission enum (0-2) |
| `budget_lamports` | `u64` | Total lifetime budget |
| `budget_daily_cap_lamports` | `u64` | Daily spend ceiling |
| `ttl` | `i64` | Unix expiry timestamp |
| `creation_proof` | `[u8; 32]` | Hash of the creation decision document |

**Emits:** `AgentCreated`

---

### `update_agent`

**Signer:** `aeon_authority`
**Access control:** `has_one = aeon_authority`

Updates `authority`, `budget_daily_cap_lamports`, and/or `ttl` on an existing manifest. Cannot update a Killed agent.

**Parameters (`UpdateAgentArgs`):** All fields `Option<...>`.

---

### `pause_agent`

**Signer:** `aeon_authority`

Transitions agent from `Active` to `Paused`. Returns `AgentNotActive` if not Active.

**Emits:** `AgentStatusChanged`

---

### `kill_agent`

**Signer:** `aeon_authority`

Irreversibly transitions agent to `Killed` from Active or Paused. Decrements `active_agent_count`. Stores `kill_proof` in the `creation_proof` field for auditability.

**Parameters (`KillAgentArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `agent_id` | `u16` | Redundant; used off-chain for routing |
| `kill_proof` | `[u8; 32]` | Hash of the kill decision document |

**Emits:** `AgentStatusChanged`

---

### `propose_policy_change`

**Signer:** `aeon_authority` (payer)
**Access control:** `has_one = aeon_authority`

Creates a `PolicyProposal` PDA with mandatory delay. Layer 0 proposals are rejected. Layer 1 delay must be 72h–30d. Layer 2 delay must be >= 24h. Proposals expire 7 days after the delay_until timestamp.

**Parameters (`ProposePolicyChangeArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `proposal_id` | `u32` | Unique ID (PDA seed) |
| `policy_layer` | `u8` | 1 or 2 |
| `change_hash` | `[u8; 32]` | SHA-256 of change specification |
| `delay_seconds` | `i64` | Lockout duration |

**Emits:** `PolicyProposed`

---

### `execute_policy_change`

**Signer:** `aeon_authority`

Marks a pending proposal as Executed after `delay_until` has elapsed and before `expires_at`.

**Emits:** `PolicyExecuted`

---

### `trigger_circuit_breaker`

**Signer:** `aeon_authority` OR `keeper_authority`
**Access control:** Explicit `constraint` checks both keys

Escalates the circuit breaker mode. Can only increase `circuit_breaker_mode` (0→1, 1→2, 2→3). Cannot de-escalate.

**Parameters (`TriggerCircuitBreakerArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `new_mode` | `u8` | Target mode (0-3, must be >= current) |
| `trigger_reason_hash` | `[u8; 32]` | Hash of incident report |

**Emits:** `CircuitBreakerTriggered`

---

### `reset_circuit_breaker`

**Signer:** `super_authority`
**Access control:** `has_one = super_authority`

Resets `circuit_breaker_mode` to `Normal` (0) from any state. Only super authority can de-escalate.

**Parameters:** `reason_hash: [u8; 32]`

**Emits:** `CircuitBreakerReset`

---

### `record_heartbeat`

**Signer:** `keeper_authority`
**Access control:** `has_one = keeper_authority`

Updates `last_heartbeat` to `clock.unix_timestamp`. Off-chain monitors alert if `now - last_heartbeat > heartbeat_interval`.

**Emits:** `HeartbeatRecorded`

---

### `register_agent_subscription`

**Signer:** `user` (payer)

Creates an `AgentPermissionConfig` PDA for `(user, agent_id)`. All HERMES execution flags default to `false` (A0-31). Monitoring is enabled by default.

**Parameters (`RegisterAgentSubscriptionArgs`):** `agent_id: u16`

**Emits:** `AgentSubscriptionRegistered`

---

### `update_agent_permissions`

**Signer:** `user`
**Access control:** Constraint validates `user_wallet == user.key()`

Partial update of permission fields. All fields are `Option<...>`; pass `None` to leave unchanged.

**Emits:** `AgentPermissionsUpdated`

---

### `revoke_agent_permissions`

**Signer:** `user`
**Access control:** Constraint validates `user_wallet == user.key()`

Sets all autonomous execution flags to `false` atomically. Provides a single-call panic button.

**Emits:** `AgentPermissionsRevoked`

---

### `aeon_pause_hermes`

**Signer:** `aeon_authority`
**Access control:** `has_one = aeon_authority`

AEON emergency override: sets `hermes_enabled = false` for a specific user's config (A0-34). AEON can halt HERMES for any user if anomaly detected.

**Emits:** `HermesPausedByAeon`

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | `AlreadyInitialized` | Config PDA has already been initialized |
| 6001 | `AgentCapExceedsHardLimit` | `operational_agent_cap` > 100 at init |
| 6002 | `AgentCapReached` | Both soft and hard caps checked; cap is full |
| 6003 | `Unauthorized` | Signer does not match required authority |
| 6004 | `EvaluatorCannotExecute` | Evaluator agent assigned non-Never execution permission (A0-14) |
| 6005 | `InvalidTTL` | `ttl` is not in the future |
| 6006 | `AgentNotActive` | `pause_agent` called on non-Active agent |
| 6007 | `AgentAlreadyKilled` | `kill_agent` called on already-Killed agent |
| 6008 | `ImmutableLayerCannotChange` | Policy layer 0 cannot be modified |
| 6009 | `InvalidDelay` | Delay violates Layer 1 (72h–30d) or Layer 2 (24h) bounds |
| 6010 | `InvalidPolicyLayer` | Policy layer value is not 1 or 2 |
| 6011 | `ProposalNotPending` | `execute_policy_change` on non-Pending proposal |
| 6012 | `DelayNotElapsed` | `execute_policy_change` called before `delay_until` |
| 6013 | `ProposalExpired` | `execute_policy_change` called after `expires_at` |
| 6014 | `InvalidModeTransition` | Circuit breaker mode would de-escalate (or > 3) |
| 6015 | `MathOverflow` | Checked arithmetic returned `None` |
| 6016 | `AuthoritiesMustBeDistinct` | Two authority keys are identical at init |
| 6017 | `NoPendingSuperAuthority` | `accept_super_authority` with no pending transfer |

---

## Security Considerations

1. **Three-key separation:** `super`, `aeon`, and `keeper` must be distinct at init. Changing any key requires the current holder to sign.

2. **Two-step super authority rotation:** Prevents accidental lockout. The pending key must actively accept before the transfer completes.

3. **Evaluator firewall at creation time:** `create_agent` rejects any Evaluator with `execution_permission != Never`. This cannot be bypassed via `update_agent` because that instruction does not expose `execution_permission`.

4. **Irreversible kill:** `kill_agent` is permanent. The agent PDA remains on-chain for audit purposes but `status = Killed` and `active_agent_count` is decremented.

5. **Circuit breaker monotonicity:** Only `super_authority` can de-escalate via `reset_circuit_breaker`. This prevents a compromised `aeon` or `keeper` from masking incidents by resetting after triggering.

6. **Policy timelock:** Layer 0 changes are statically rejected. Layer 1 requires 72h–30d. The 7-day execution window prevents stale proposals accumulating.

7. **AgentPermissionConfig ownership:** The PDA seed includes the user's wallet. Users can only read/write their own config. AEON can set `hermes_enabled = false` for safety but cannot grant permissions on the user's behalf.

---

## Integration Examples

### Initialize the system (TypeScript)

```typescript
import * as anchor from "@coral-xyz/anchor";

const program = anchor.workspace.NoumenCore;

await program.methods
  .initializeAeon({
    keeperAuthority: keeperKeypair.publicKey,
    aeonAuthority: aeonKeypair.publicKey,
    treasuryProgram: TREASURY_PROGRAM_ID,
    proofProgram: PROOF_PROGRAM_ID,
    heartbeatInterval: new anchor.BN(3600),   // 1 hour
    operationalAgentCap: 100,
  })
  .accounts({
    aeonConfig: aeonConfigPda,
    superAuthority: superKeypair.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([superKeypair])
  .rpc();
```

### Create an agent

```typescript
const [agentManifestPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("agent"), Buffer.from(new Uint16Array([agentId]).buffer)],
  CORE_PROGRAM_ID
);

await program.methods
  .createAgent({
    agentId: agentId,
    authority: agentKeypair.publicKey,
    agentType: 1,              // Evaluator
    executionPermission: 0,    // Never (required for Evaluator)
    budgetLamports: new anchor.BN(1_000_000_000),
    budgetDailyCapLamports: new anchor.BN(100_000_000),
    ttl: new anchor.BN(Math.floor(Date.now() / 1000) + 86400 * 365),
    creationProof: Array.from(proofHash),
  })
  .accounts({
    aeonConfig: aeonConfigPda,
    agentManifest: agentManifestPda,
    aeonAuthority: aeonKeypair.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([aeonKeypair])
  .rpc();
```

### Derive AeonConfig PDA

```typescript
const [aeonConfigPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("aeon_config")],
  CORE_PROGRAM_ID
);
```

---

## Known Limitations

1. `AgentManifest` stores `kill_proof` in the `creation_proof` field. There is no separate field for the kill reason, so the original creation proof is overwritten on kill. This is documented behavior.

2. `update_agent` does not expose `budget_lamports` or `execution_permission`. Changing total budget requires killing and recreating the agent.

3. The `daily_spend_reset_at` and `budget_spent_lamports` fields in `AgentManifest` are not updated by this program directly; they are tracking fields intended for external systems.

4. `operational_agent_cap` can be set below the current `active_agent_count` (edge case: AEON sets cap to 5 with 6 active agents — existing agents are not affected, but no new agents can be created until count drops below cap).
