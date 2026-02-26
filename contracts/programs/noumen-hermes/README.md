# noumen-hermes

**Program ID:** `Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj`
**Network:** Devnet / Localnet
**Anchor version:** 0.30.1
**Crate name:** `noumen_hermes` (on-chain identifier — do not rename)

---

## Purpose

`noumen-hermes` serves two distinct roles:

1. **Terminal intelligence publishing** — writes structured intelligence reports (`IntelligenceReport` PDAs) for external consumption. These are read-only outputs that never enter the execution chain (A0-29, A0-30).

2. **Agent action proof tracking** — records proof-before-action for HERMES autonomous executions. When a user grants HERMES execution permissions (via `noumen-core`'s `AgentPermissionConfig`), the HERMES backend must log an `AgentActionRecord` before executing and then confirm it after. This enforces A0-6 (proof before execution) and A0-31 through A0-35.

**HERMES does NOT make CPI calls to execution protocols (Jupiter, Raydium, etc.).** Those transactions happen off-chain via the Solana Agent Kit backend. `noumen-hermes` only validates permissions and records proofs.

Architecture note (v3.3.0): HERMES was expanded to support autonomous execution with user authorization. The five canonical HERMES services (Pool Comparison, Effective APR Calculator, Risk Decomposition Vector, Yield Trap Intelligence, Protocol Health Snapshot) map to `ReportType` values 0-4.

---

## Axioms Enforced On-Chain

| Axiom | Enforcement Point |
|-------|------------------|
| A0-6 | `AgentActionRecord` must be created (Pending) before `confirm_agent_action_executed` |
| A0-29 | Zero CPI to apollo program (verified in source) |
| A0-30 | `report_type <= 4` check blocks operational risk signal types |
| A0-31 | `hermes_enabled` must be true in `AgentPermissionConfig` |
| A0-31 | `hermes_tx_count_today < hermes_daily_tx_limit` enforced |
| A0-32 | Evidence families check (commented as trust-at-log-time; see Known Limitations) |
| A0-33 | `revoke_agent_permissions` in `noumen-core` takes effect immediately |
| A0-34 | `aeon_pause_hermes` in `noumen-core` sets `hermes_enabled = false` |
| A0-35 | `apollo_assessed_at` age check: must be < 3600 seconds old |

---

## ASCII Architecture

```
  Intelligence Reporting (terminal, read-only):
  -----------------------------------------------
  HERMES off-chain agent
         |
         | publish_report() or publish_pool_comparison()
         v
  IntelligenceReport PDA [b"report", report_nonce]
  (read by external consumers; never enters execution chain)


  Agent Action Proof (autonomous execution path):
  -----------------------------------------------
  HERMES backend
         |
         | Step 1: log_agent_action_proof()
         |   - Validates apollo_assessed_at age < 1 hour (A0-35)
         |   - Creates AgentActionRecord PDA [b"agent_action", user_wallet, action_nonce]
         |   - status = Pending
         v
  HERMES backend executes off-chain (Jupiter/Raydium/etc.)
         |
         | Step 2: confirm_agent_action_executed()
         |   - Reads AgentPermissionConfig PDA from noumen-core program
         |   - Validates hermes_enabled == true (A0-31)
         |   - Validates hermes_tx_count_today < hermes_daily_tx_limit (A0-31)
         |   - Updates AgentActionRecord: status = Executed, output_hash, tx_signature
         |   - Increments hermes_tx_count_today in AgentPermissionConfig
         v
  AgentActionRecord PDA (immutable execution proof)
```

---

## Accounts

### HermesConfig

**PDA seeds:** `[b"hermes_config"]`
**Space:** 146 bytes

| Field | Type | Description |
|-------|------|-------------|
| `authority` | `Pubkey` | HERMES agent authority. Signs all publish and action operations. |
| `aeon_authority` | `Pubkey` | AEON's key (set at initialization). |
| `report_count` | `u64` | Total intelligence reports published. |
| `is_initialized` | `bool` | Anti-re-init guard. |
| `created_at` | `i64` | Initialization timestamp. |
| `updated_at` | `i64` | Last update timestamp. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 48]` | Reserved. |

### IntelligenceReport

**PDA seeds:** `[b"report", report_nonce.to_le_bytes()]`
**Space:** 179 bytes
**Mutability:** Immutable after creation.

| Field | Type | Description |
|-------|------|-------------|
| `report_nonce` | `u64` | Monotonic report identifier. PDA seed. |
| `report_type` | `u8` | 0=EffectiveAPR, 1=RiskDecomposition, 2=YieldTrapIntelligence, 3=PoolComparison, 4=ProtocolHealth |
| `subject_pool` | `Pubkey` | Assessed pool (Pubkey::default for pool comparisons) |
| `content_hash` | `[u8; 32]` | SHA-256 of the off-chain report content |
| `confidence_score` | `u8` | 0-100 |
| `published_at` | `i64` | Publication timestamp |
| `expiry` | `i64` | Report validity end (must be future at creation) |
| `decision_log_ref` | `Pubkey` | Linked DecisionLog PDA in noumen-proof |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 48]` | Reserved. |

### AgentActionRecord

**PDA seeds:** `[b"agent_action", user_wallet.as_ref(), action_nonce.to_le_bytes()]`
**Space:** 301 bytes
**Mutability:** `status`, `output_hash`, `tx_signature`, and `executed_at` are set once by `confirm_agent_action_executed`. All other fields are immutable.

| Field | Type | Description |
|-------|------|-------------|
| `action_nonce` | `u64` | Monotonic identifier. PDA seed. |
| `agent_id` | `u16` | Which HERMES agent executed this action. |
| `user_wallet` | `Pubkey` | User on whose behalf the action was executed. PDA seed. |
| `action_type` | `u8` | 0=Swap, 1=AddLP, 2=RemoveLP, 3=Stake, 4=Unstake, 5=RevokeApproval |
| `input_hash` | `[u8; 32]` | Hash of action parameters (slippage, amount, etc.) |
| `output_hash` | `[u8; 32]` | Hash of execution outcome (filled by `confirm_agent_action_executed`) |
| `apollo_assessment_ref` | `Pubkey` | AssessmentRecord PDA that justified this action (A0-35) |
| `decision_log_ref` | `Pubkey` | DecisionLog PDA proof (A0-6) |
| `status` | `u8` | 0=Pending, 1=Executed, 2=Failed, 3=Reverted |
| `executed_at` | `i64` | Execution timestamp (set by confirm instruction) |
| `tx_signature` | `[u8; 64]` | Serialized transaction signature of the off-chain execution |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 48]` | Reserved. |

### AgentPermissionConfig (cross-program read)

`noumen-hermes` reads `AgentPermissionConfig` PDAs that are owned by `noumen-core`. The struct is redeclared in `noumen-hermes/src/lib.rs` for deserialization purposes. The PDA is owned by `noumen-core` but read from the `noumen-hermes` program via Anchor's account deserialization.

Fields relevant to HERMES enforcement: `hermes_enabled`, `hermes_daily_tx_limit`, `hermes_tx_count_today`, `hermes_last_tx_date`.

---

## Instructions

### `initialize_hermes`

**Signer:** `aeon_authority` (payer)
**One-time:** Yes (`is_initialized` guard + `init` constraint)

**Parameters (`InitializeHermesArgs`):** `hermes_authority: Pubkey`

**Emits:** `HermesInitialized { deployer, authority, aeon_authority, timestamp }`

---

### `publish_report`

**Signer:** `authority`
**Access control:** `has_one = authority`

Creates an immutable `IntelligenceReport` PDA. Validates:
- `report_type <= 4` (A0-30: types 0-4 are intelligence outputs, not operational risk signals)
- `confidence_score <= 100`
- `expiry > clock.unix_timestamp`

**Parameters (`PublishReportArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `report_nonce` | `u64` | Unique report ID (PDA seed) |
| `report_type` | `u8` | 0-4 (see ReportType enum) |
| `subject_pool` | `Pubkey` | Assessed pool |
| `content_hash` | `[u8; 32]` | SHA-256 of report content |
| `confidence_score` | `u8` | 0-100 |
| `expiry` | `i64` | Future expiry timestamp |
| `decision_log_ref` | `Pubkey` | Linked DecisionLog PDA |

**Emits:** `ReportPublished`

---

### `publish_pool_comparison`

**Signer:** `authority`
**Access control:** `has_one = authority`

Specialized variant of `publish_report` for pool comparison (report_type = 3 hardcoded). Validates:
- `pool_count >= 2 && pool_count <= 5` (pool comparison requires 2-5 pools)
- `confidence_score <= 100`
- Sets `subject_pool = Pubkey::default()` (no single subject pool)

**Parameters (`PublishPoolComparisonArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `report_nonce` | `u64` | Unique ID |
| `content_hash` | `[u8; 32]` | Hash of comparison content |
| `pool_count` | `u8` | Number of pools compared (2-5) |
| `pair_class` | `u8` | Token pair class for all compared pools |
| `subject_hash` | `[u8; 32]` | Hash identifying the comparison set |
| `confidence_score` | `u8` | 0-100 |
| `expiry` | `i64` | Future expiry timestamp |
| `decision_log_ref` | `Pubkey` | Linked DecisionLog PDA |

**Emits:** `ReportPublished` (with `report_type = 3`)

---

### `log_agent_action_proof`

**Signer:** `authority` (HERMES backend key)

Creates an `AgentActionRecord` with `status = 0 (Pending)`. Validates:
- `apollo_assessed_at` age: `clock.unix_timestamp - apollo_assessed_at <= 3600` (A0-35: max 1-hour APOLLO assessment age)

Must be called **before** the off-chain execution. The resulting PDA serves as proof that execution was authorized.

**Parameters (`LogAgentActionProofArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `action_nonce` | `u64` | Unique action ID (PDA seed) |
| `agent_id` | `u16` | HERMES agent identifier |
| `action_type` | `u8` | Action category (0-5) |
| `input_hash` | `[u8; 32]` | Hash of action input parameters |
| `apollo_assessment_ref` | `Pubkey` | AssessmentRecord PDA reference |
| `apollo_assessed_at` | `i64` | Timestamp of referenced APOLLO assessment |
| `decision_log_ref` | `Pubkey` | DecisionLog PDA reference |

**Emits:** `AgentActionProofLogged`

---

### `confirm_agent_action_executed`

**Signer:** `authority` (HERMES backend key)

Called after off-chain execution completes. Validates:
- `agent_permission_config.hermes_enabled == true` (A0-31)
- `hermes_tx_count_today < hermes_daily_tx_limit` (A0-31)
- `agent_action_record.status == 0` (prevents double-confirm)

Updates the `AgentActionRecord` with `status = 1`, `output_hash`, `tx_signature`, and `executed_at`. Increments `hermes_tx_count_today` in `AgentPermissionConfig`. Auto-resets the daily counter if `> 86400s` have elapsed since `hermes_last_tx_date`.

**Parameters (`ConfirmAgentActionExecutedArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `output_hash` | `[u8; 32]` | Hash of execution result |
| `tx_signature` | `[u8; 64]` | Transaction signature bytes |

**Emits:** `AgentActionExecuted`

---

## Report Type Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | `EffectiveAPR` | Real yield calculation report |
| 1 | `RiskDecomposition` | Risk factor breakdown |
| 2 | `YieldTrapIntelligence` | Unsustainable yield detection |
| 3 | `PoolComparison` | Multi-pool comparison |
| 4 | `ProtocolHealth` | Protocol-level health snapshot |

Values 5+ are blocked by `require!(args.report_type <= 4)` (A0-30).

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | `Unauthorized` | Signer does not match `authority` |
| 6001 | `InvalidReportType` | `report_type > 4` |
| 6002 | `RiskSignalProhibited` | Reserved for explicit risk signal blocking (A0-30) |
| 6003 | `AlreadyInitialized` | HermesConfig already initialized |
| 6004 | `InvalidConfidenceScore` | `confidence_score > 100` |
| 6005 | `InvalidPoolCount` | `pool_count < 2 || pool_count > 5` |
| 6006 | `MathOverflow` | Checked arithmetic returned `None` |
| 6007 | `ExpiredReport` | `expiry <= clock.unix_timestamp` |
| 6008 | `HermesNotAuthorized` | `hermes_enabled == false` for this user (A0-31) |
| 6009 | `StaleApolloAssessment` | APOLLO assessment age > 3600s (A0-35) |
| 6010 | `InsufficientEvidence` | Less than 2 evidence families (A0-32, currently not fully enforced — see Known Limitations) |
| 6011 | `DailyLimitExceeded` | `hermes_tx_count_today >= hermes_daily_tx_limit` (A0-31) |
| 6012 | `ActionAlreadyProcessed` | `confirm_agent_action_executed` on non-Pending record |

---

## Security Considerations

1. **Zero CPI to APOLLO:** Source comment: `// STRUCTURAL GUARANTEE: Zero CPI calls to noumen_apollo or risk engine. HERMES outputs are terminal. (A0-29, A0-30)`. Verified: no `CpiContext`, `invoke`, or `invoke_signed` other than Anchor's internal `init` system_program call.

2. **User permission sovereignty:** `AgentPermissionConfig` is owned by `noumen-core` and can only be mutated by the user or AEON (for emergency pause). HERMES cannot grant or elevate permissions. The program only reads this PDA to validate what the user has explicitly authorized.

3. **APOLLO assessment freshness:** `log_agent_action_proof` enforces that the referenced APOLLO assessment is < 1 hour old. This prevents stale risk data from authorizing actions in volatile market conditions.

4. **Daily limit enforcement:** The daily transaction counter is in `AgentPermissionConfig` (owned by `noumen-core`). `confirm_agent_action_executed` increments it. Users can lower their `hermes_daily_tx_limit` at any time via `update_agent_permissions`.

5. **Off-chain execution model:** Actual protocol interactions (swaps, LP additions) happen off-chain. The on-chain record only proves that authorization existed and records the transaction signature. An auditor can verify `tx_signature` on-chain independently.

6. **Cross-program account deserialization:** `AgentPermissionConfig` is a PDA owned by `noumen-core` but deserialized by `noumen-hermes`. The account discriminator (SHA-256 of `"account:AgentPermissionConfig"`) must match between both programs. The struct layout is identical in both. Any drift between program versions would cause deserialization failure.

---

## Integration Examples

### Publish a report

```typescript
const reportNonce = BigInt(1);
const nonceBuf = Buffer.alloc(8);
nonceBuf.writeBigUInt64LE(reportNonce);

const [reportPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("report"), nonceBuf],
  HERMES_PROGRAM_ID
);

await hermesProgram.methods
  .publishReport({
    reportNonce: new anchor.BN(reportNonce.toString()),
    reportType: 0,  // EffectiveAPR
    subjectPool: poolAddress,
    contentHash: Array.from(contentHash),
    confidenceScore: 78,
    expiry: new anchor.BN(Math.floor(Date.now() / 1000) + 3600),
    decisionLogRef: decisionLogPda,
  })
  .accounts({
    hermesConfig: hermesConfigPda,
    intelligenceReport: reportPda,
    authority: hermesAuthorityKeypair.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([hermesAuthorityKeypair])
  .rpc();
```

### Two-step agent action proof

```typescript
// Step 1: Log proof before execution
await hermesProgram.methods
  .logAgentActionProof({
    actionNonce: new anchor.BN(actionNonce),
    agentId: 3,
    actionType: 0,  // Swap
    inputHash: Array.from(inputHash),
    apolloAssessmentRef: assessmentRecordPda,
    apolloAssessedAt: new anchor.BN(Math.floor(Date.now() / 1000) - 100), // 100s ago
    decisionLogRef: decisionLogPda,
  })
  .accounts({
    authority: hermesAuthorityKeypair.publicKey,
    userWallet: userWallet,
    agentActionRecord: agentActionRecordPda,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([hermesAuthorityKeypair])
  .rpc();

// --- Execute off-chain (Jupiter swap etc.) ---
const txSignature = await executeSwapOffChain(...);

// Step 2: Confirm execution
await hermesProgram.methods
  .confirmAgentActionExecuted({
    outputHash: Array.from(outputHash),
    txSignature: Array.from(Buffer.from(txSignature, 'base58')),
  })
  .accounts({
    authority: hermesAuthorityKeypair.publicKey,
    agentActionRecord: agentActionRecordPda,
    agentPermissionConfig: agentPermissionConfigPda,
  })
  .signers([hermesAuthorityKeypair])
  .rpc();
```

---

## Known Limitations

1. **A0-32 evidence check is trust-at-log-time:** `confirm_agent_action_executed` has a comment: "we trust that the decision_log_ref has already been validated during proof logging." The instruction does not actually read the `DecisionLog` PDA and count evidence families. This means the on-chain check for >= 2 evidence families (A0-32) is not fully enforced in execution path — it relies on the off-chain HERMES backend having verified this before calling `log_agent_action_proof`.

2. **`authority` in `log_agent_action_proof` is not validated against `HermesConfig.authority`:** The `LogAgentActionProof` account context has `authority: Signer<'info>` without a `has_one` constraint against `hermes_config`. Any signer can create an `AgentActionRecord` for any user. The `user_wallet` field is also a bare `AccountInfo` (unchecked). Mitigation: the record's only effect is to log an intent; the `confirm_agent_action_executed` step validates permissions.

3. `report_nonce` uniqueness is the caller's responsibility.
