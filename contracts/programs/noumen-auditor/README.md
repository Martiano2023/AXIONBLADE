# noumen-auditor

**Program ID:** `CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe`
**Network:** Devnet / Localnet
**Anchor version:** 0.30.1
**Crate name:** `noumen_auditor` (on-chain identifier — do not rename)

---

## Purpose

`noumen-auditor` provides on-chain retroactive auditability for all AXIONBLADE assessments and security events. It records the observed real-world outcomes of signals and assessments (truth labeling), tracks security incidents affecting monitored protocols, and publishes periodic accuracy snapshots of APOLLO's prediction performance.

Responsibilities:

- Record truth labels for resolved assessment signals (A0-20: only resolved outcomes)
- Enforce temporal ordering: `window_end <= clock.unix_timestamp` before labeling (A0-21)
- Track security incidents: Exploit, RugPull, LiquidityDrain, OracleManipulation, IncentiveCollapse
- Publish statistical accuracy snapshots (HTL accuracy, EOL positive rate, Brier score)
- Provide immutable on-chain evidence for APOLLO accuracy claims

This program has no connection to the execution chain. All output is read-only historical record.

---

## ASCII Architecture

```
  [auditor authority]
         |
         | initialize_auditor() => AuditorConfig PDA [b"auditor_config"]
         |
         | After observation window closes (window_end <= now):
         | record_truth_label()  => TruthLabel PDA [b"truth_label", signal_nonce]
         |   - htl_result: was the Hard Trigger Label correct?
         |   - eol_result: was the Early Out Label correct?
         |
         | register_security_incident() => SecurityIncident PDA [b"incident", nonce]
         |   - status = Unconfirmed
         |
         | resolve_incident()           => SecurityIncident PDA (status update)
         |   - status = Confirmed or Dismissed
         |
         | publish_accuracy_snapshot()  => AccuracySnapshot PDA [b"accuracy", nonce]
         |   - htl_accuracy_bps
         |   - eol_positive_rate_bps
         |   - brier_score_bps
         |   - sample_count
```

---

## Accounts

### AuditorConfig

**PDA seeds:** `[b"auditor_config"]`
**Space:** 154 bytes

| Field | Type | Description |
|-------|------|-------------|
| `authority` | `Pubkey` | Auditor signing key. Set to first caller of `initialize_auditor`. |
| `aeon_authority` | `Pubkey` | AEON's key (passed as argument at initialization, advisory). |
| `total_truth_labels` | `u64` | Cumulative truth labels recorded. |
| `total_incidents` | `u64` | Cumulative security incidents registered. |
| `is_initialized` | `bool` | Anti-re-init guard. |
| `created_at` | `i64` | Initialization timestamp. |
| `updated_at` | `i64` | Last state mutation timestamp. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 48]` | Reserved. |

### TruthLabel

**PDA seeds:** `[b"truth_label", signal_nonce.to_le_bytes()]`
**Space:** 141 bytes
**Mutability:** Immutable after creation.

| Field | Type | Description |
|-------|------|-------------|
| `signal_nonce` | `u64` | Monotonic signal identifier. PDA seed. |
| `signal_id` | `[u8; 32]` | Hash identifying the original signal/assessment being labeled. |
| `htl_result` | `u8` | Hard Trigger Label result: 0=Correct, 1=Incorrect, 2=Inconclusive |
| `eol_result` | `u8` | Early Out Label result: 0=Correct, 1=Incorrect, 2=Inconclusive |
| `signal_type` | `u8` | Classification of the original signal type |
| `is_resolved` | `bool` | Always true (set at creation; A0-21 requires resolved outcomes only) |
| `window_start` | `i64` | Start of the observation window |
| `window_end` | `i64` | End of the observation window (must be <= `clock.unix_timestamp`) |
| `resolved_at` | `i64` | When `record_truth_label` was called |
| `evidence_hash` | `[u8; 32]` | Hash of the resolution evidence document |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 32]` | Reserved. |

### SecurityIncident

**PDA seeds:** `[b"incident", incident_nonce.to_le_bytes()]`
**Space:** 179 bytes
**Mutability:** `status`, `resolved_at`, and `resolution_evidence_hash` are mutable by `resolve_incident`. Other fields immutable.

| Field | Type | Description |
|-------|------|-------------|
| `incident_nonce` | `u64` | Monotonic incident identifier. PDA seed. |
| `affected_pool` | `Pubkey` | Pool address where the incident occurred. |
| `incident_type` | `u8` | 0=Exploit, 1=RugPull, 2=LiquidityDrain, 3=OracleManipulation, 4=IncentiveCollapse |
| `status` | `u8` | 0=Unconfirmed, 1=Confirmed, 2=Dismissed |
| `detected_at` | `i64` | When the incident was registered on-chain. |
| `resolved_at` | `i64` | Set by `resolve_incident` (0 until resolved). |
| `detection_evidence_hash` | `[u8; 32]` | Hash of detection evidence document. |
| `resolution_evidence_hash` | `[u8; 32]` | Hash of resolution evidence (set by `resolve_incident`). |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 48]` | Reserved. |

### AccuracySnapshot

**PDA seeds:** `[b"accuracy", snapshot_nonce.to_le_bytes()]`
**Space:** 107 bytes
**Mutability:** Immutable after creation.

Statistical summary of APOLLO prediction accuracy over a measurement period.

| Field | Type | Description |
|-------|------|-------------|
| `snapshot_nonce` | `u64` | Monotonic snapshot ID. PDA seed. |
| `htl_accuracy_bps` | `u16` | Hard Trigger Label accuracy in basis points (10000 = 100%) |
| `eol_positive_rate_bps` | `u16` | Early Out Label positive rate in basis points |
| `brier_score_bps` | `u16` | Brier score scaled to basis points (lower = better calibration) |
| `sample_count` | `u32` | Number of samples in this snapshot (must be > 0) |
| `period_start` | `i64` | Start of measurement period |
| `period_end` | `i64` | End of measurement period |
| `snapshot_hash` | `[u8; 32]` | Hash of the full accuracy computation document |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 32]` | Reserved. |

---

## Instructions

### `initialize_auditor`

**Signer:** `authority` (any signer, first caller wins — see Security Considerations)
**One-time:** Yes (`is_initialized` guard + `init` constraint)

The signer becomes `authority`. `aeon_authority` is stored from the argument for reference.

**Parameters (`InitializeAuditorArgs`):** `aeon_authority: Pubkey`

**Emits:** `AuditorInitialized { deployer, authority, aeon_authority, timestamp }`

---

### `record_truth_label`

**Signer:** `authority`
**Access control:** `has_one = authority`

Creates an immutable `TruthLabel` PDA. Validates:
- `htl_result <= 2` and `eol_result <= 2` (valid TruthLabelResult range)
- `window_end <= clock.unix_timestamp` (A0-21: observation window must be fully elapsed)

**Parameters (`RecordTruthLabelArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `signal_nonce` | `u64` | Unique signal identifier (PDA seed) |
| `signal_id` | `[u8; 32]` | Hash of original signal being labeled |
| `htl_result` | `u8` | Hard Trigger Label outcome (0-2) |
| `eol_result` | `u8` | Early Out Label outcome (0-2) |
| `signal_type` | `u8` | Signal type classification |
| `window_start` | `i64` | Observation window start |
| `window_end` | `i64` | Observation window end (must be <= now) |
| `evidence_hash` | `[u8; 32]` | Evidence document hash |

**Emits:** `TruthLabelRecorded`

---

### `register_security_incident`

**Signer:** `authority`
**Access control:** `has_one = authority`

Creates a `SecurityIncident` PDA with `status = Unconfirmed`. Validates `incident_type <= 4`.

**Parameters (`RegisterSecurityIncidentArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `incident_nonce` | `u64` | Unique incident ID (PDA seed) |
| `affected_pool` | `Pubkey` | Pool address |
| `incident_type` | `u8` | Incident category (0-4) |
| `detection_evidence_hash` | `[u8; 32]` | Detection evidence hash |

**Emits:** `SecurityIncidentRegistered`

---

### `resolve_incident`

**Signer:** `authority`
**Access control:** `has_one = authority`

Transitions a `SecurityIncident` from `Unconfirmed` to `Confirmed` (1) or `Dismissed` (2). Any other `new_status` returns `InvalidIncidentType`.

**Parameters (`ResolveIncidentArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `incident_nonce` | `u64` | Routes to the correct PDA (via instruction args seed lookup) |
| `new_status` | `u8` | 1=Confirmed or 2=Dismissed only |
| `resolution_evidence_hash` | `[u8; 32]` | Resolution evidence hash |

**Emits:** `IncidentResolved`

---

### `publish_accuracy_snapshot`

**Signer:** `authority`
**Access control:** `has_one = authority`

Creates an immutable `AccuracySnapshot` PDA. Validates `sample_count > 0`.

**Parameters (`PublishAccuracySnapshotArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `snapshot_nonce` | `u64` | Unique snapshot ID (PDA seed) |
| `htl_accuracy_bps` | `u16` | HTL accuracy in bps |
| `eol_positive_rate_bps` | `u16` | EOL positive rate in bps |
| `brier_score_bps` | `u16` | Brier score in bps |
| `sample_count` | `u32` | Sample count (must be > 0) |
| `period_start` | `i64` | Measurement period start |
| `period_end` | `i64` | Measurement period end |
| `snapshot_hash` | `[u8; 32]` | Computation document hash |

**Emits:** `AccuracySnapshotPublished`

---

## Incident Type Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | `Exploit` | Smart contract exploit or hack |
| 1 | `RugPull` | Liquidity removal by malicious actors |
| 2 | `LiquidityDrain` | Abnormal liquidity exodus |
| 3 | `OracleManipulation` | Price oracle attack |
| 4 | `IncentiveCollapse` | Incentive program failure or rug |

## Truth Label Result Enum

| Value | Name | Description |
|-------|------|-------------|
| 0 | `Correct` | Signal outcome matched prediction |
| 1 | `Incorrect` | Signal outcome did not match |
| 2 | `Inconclusive` | Outcome ambiguous or unresolvable |

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | `Unauthorized` | Signer does not match `authority` |
| 6001 | `AlreadyInitialized` | AuditorConfig already initialized |
| 6002 | `WindowNotResolved` | `window_end > clock.unix_timestamp` (A0-21) |
| 6003 | `InvalidLabelValue` | `htl_result > 2` or `eol_result > 2` |
| 6004 | `InvalidIncidentType` | `incident_type > 4` or `new_status` not Confirmed/Dismissed |
| 6005 | `InvalidSampleSize` | `sample_count == 0` |
| 6006 | `IncidentNotFound` | Referenced incident PDA does not exist |
| 6007 | `NotInitialized` | AuditorConfig not yet initialized |
| 6008 | `ArithmeticOverflow` | `checked_add(1)` returned `None` (counter overflow) |

---

## Security Considerations

1. **Initialize immediately after deployment:** `initialize_auditor` accepts any signer. There is no requirement that the initializer be `super_authority` or `aeon_authority`. Deploy and initialize atomically to prevent front-running the authority claim.

2. **Temporal ordering enforced:** `record_truth_label` strictly requires `window_end <= clock.unix_timestamp`. This prevents premature labeling of unresolved signals — a fundamental integrity requirement for any retrospective audit.

3. **TruthLabel PDAs are immutable:** There is no update or delete instruction for `TruthLabel` or `AccuracySnapshot`. Once recorded, historical labels are permanent.

4. **Arithmetic overflow pattern:** `total_truth_labels` and `total_incidents` counters use `checked_add(1).ok_or(AuditorError::ArithmeticOverflow)?`. At `u64::MAX` operations, the program returns a clean error rather than panicking. This is correct and consistent.

5. **`resolve_incident` has no status guard:** The instruction does not check if the incident is already `Confirmed` or `Dismissed` before overwriting. A `Confirmed` incident could be re-resolved as `Dismissed` (and vice versa). This may be intentional (authority can correct mistakes) but should be documented policy.

---

## Integration Examples

### Record a truth label

```typescript
const [truthLabelPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("truth_label"), signalNonceBuf],
  AUDITOR_PROGRAM_ID
);

await auditorProgram.methods
  .recordTruthLabel({
    signalNonce: new anchor.BN(signalNonce),
    signalId: Array.from(signalIdHash),
    htlResult: 0,    // Correct
    eolResult: 2,    // Inconclusive
    signalType: 1,
    windowStart: new anchor.BN(windowStart),
    windowEnd: new anchor.BN(windowEnd),   // Must be in the past
    evidenceHash: Array.from(evidenceHash),
  })
  .accounts({
    auditorConfig: auditorConfigPda,
    truthLabel: truthLabelPda,
    authority: auditorAuthorityKeypair.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([auditorAuthorityKeypair])
  .rpc();
```

### Read all accuracy snapshots

```typescript
const snapshots = await auditorProgram.account.accuracySnapshot.all();
snapshots.sort((a, b) => b.account.snapshotNonce.cmp(a.account.snapshotNonce));
const latest = snapshots[0];
console.log("HTL accuracy:", latest.account.htlAccuracyBps / 100, "%");
console.log("Brier score:", latest.account.brierScoreBps / 100, "%");
```

---

## Known Limitations

1. `initialize_auditor` has no `super_authority` gate. Any wallet can claim the auditor role during the window between deployment and initialization.

2. `resolve_incident` does not validate that the incident is currently `Unconfirmed` (status 0). An already-resolved incident can be re-resolved with a different outcome. Whether this is intended policy should be documented explicitly.

3. The `aeon_authority` field in `AuditorConfig` is stored but not validated against the actual AEON key in `noumen-core`. The argument passed at initialization is taken at face value.
