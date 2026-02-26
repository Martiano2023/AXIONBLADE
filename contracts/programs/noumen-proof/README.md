# noumen-proof

**Program ID:** `3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV`
**Network:** Devnet / Localnet
**Anchor version:** 0.30.1
**Crate name:** `noumen_proof` (on-chain identifier — do not rename)

---

## Purpose

`noumen-proof` is the immutable audit trail for all decisions made in the AXIONBLADE system. It enforces Axiom A0-6: every significant action must produce an on-chain proof before execution occurs. No execution can be retroactively manufactured — the proof PDA must exist before the execution happens.

Responsibilities:

- Write immutable `DecisionLog` PDAs before any execution-class action
- Enforce evidence family requirements: execution decisions require >= 2 of the 5 families (A0-17)
- Validate evidence family bitmap: only bits 0-4 are valid (A0-18)
- Allow exactly one immutable field mutation on `DecisionLog`: `execution_confirmed` (false → true)
- Create linked `ExecutionResult` PDAs to record outcomes
- Support Merkle-root `BatchProof` PDAs for gas-efficient bulk proof aggregation
- Allow keeper to close expired batch proofs to reclaim rent

**Structural guarantee:** `DecisionLog` PDAs have no update or delete instructions. `ExecutionResult` PDAs have no mutations after creation. Both are permanent on-chain records.

---

## ASCII Architecture

```
  [any signer == keeper_authority]
         |
         | log_decision()
         v
  +------------------+
  |   DecisionLog    |  PDA: [b"decision", agent_id, nonce]
  |  (immutable)     |   - input_hash
  |                  |   - decision_hash
  |                  |   - justification_hash
  |                  |   - evidence_families_bitmap
  |                  |   - decision_class
  |                  |   - execution_confirmed = false
  +------------------+
         |
         | confirm_execution()  (only mutation: execution_confirmed → true)
         v
  +------------------+
  |ExecutionResult   |  PDA: [b"execution", decision_log.key()]
  |  (immutable)     |   - result_hash
  |                  |   - status
  |                  |   - executor
  |                  |   - executed_at
  +------------------+

  [any signer == keeper_authority]
         |
         | submit_batch_proof()
         v
  +------------------+
  |   BatchProof     |  PDA: [b"batch", agent_id, batch_nonce]
  |  (closeable)     |   - merkle_root
  |                  |   - leaf_count
  |                  |   - time range
  +------------------+
         |
         | close_expired_batch()  (keeper only, after min_age_seconds)
         v
  [rent reclaimed to rent_destination]
```

---

## Accounts

### ProofConfig

**PDA seeds:** `[b"proof_config"]`
**Space:** 74 bytes

| Field | Type | Description |
|-------|------|-------------|
| `keeper_authority` | `Pubkey` | The only key authorized to call `log_decision`, `confirm_execution`, `submit_batch_proof`, and `close_expired_batch`. |
| `is_initialized` | `bool` | Anti-re-initialization guard. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 32]` | Reserved for future fields. |

### DecisionLog

**PDA seeds:** `[b"decision", agent_id.to_le_bytes(), nonce.to_le_bytes()]`
**Space:** 175 bytes
**Mutability:** `execution_confirmed` may be set true once. All other fields are immutable after creation.

| Field | Type | Description |
|-------|------|-------------|
| `agent_id` | `u16` | Which agent logged this decision. |
| `nonce` | `u64` | Monotonic counter per agent. Part of PDA seed. |
| `input_hash` | `[u8; 32]` | SHA-256 of all input data that drove the decision. |
| `decision_hash` | `[u8; 32]` | SHA-256 of the decision output. |
| `justification_hash` | `[u8; 32]` | SHA-256 of the human-readable justification document. |
| `evidence_families_bitmap` | `u8` | Bit flags for 5 evidence families: bit 0=PriceVolume, bit 1=LiquidityComposition, bit 2=BehaviorPattern, bit 3=IncentiveEconomic, bit 4=ProtocolGovernance. Bits 5-7 must be 0. |
| `decision_class` | `u8` | 0=Info, 1=LimitedReliability, 2=RiskWarning, 3=DangerSignal |
| `timestamp` | `i64` | Unix timestamp when `log_decision` was called. |
| `is_execution_class` | `bool` | If true, `>= 2` evidence families were required and verified at log time. |
| `execution_confirmed` | `bool` | Initially false. Set true by `confirm_execution`. Cannot be set back to false. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 48]` | Reserved. |

### ExecutionResult

**PDA seeds:** `[b"execution", decision_log.key()]`
**Space:** 158 bytes
**Mutability:** Immutable after creation.

| Field | Type | Description |
|-------|------|-------------|
| `decision_log` | `Pubkey` | The linked `DecisionLog` PDA address. |
| `result_hash` | `[u8; 32]` | SHA-256 of the execution outcome document. |
| `status` | `u8` | Execution status code (application-defined; 0=Success recommended). |
| `executed_at` | `i64` | Unix timestamp of `confirm_execution` call. |
| `executor` | `Pubkey` | The key that called `confirm_execution`. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 44]` | Reserved. |

### BatchProof

**PDA seeds:** `[b"batch", agent_id.to_le_bytes(), batch_nonce.to_le_bytes()]`
**Space:** 113 bytes
**Mutability:** Immutable except closeable by keeper after `min_age_seconds`.

| Field | Type | Description |
|-------|------|-------------|
| `agent_id` | `u16` | Agent that submitted this batch. |
| `batch_nonce` | `u64` | Monotonic batch counter per agent. PDA seed. |
| `merkle_root` | `[u8; 32]` | Merkle root of all `DecisionLog` hashes in the batch. |
| `leaf_count` | `u32` | Number of decision logs covered by this Merkle tree. |
| `start_timestamp` | `i64` | Earliest decision timestamp in the batch. |
| `end_timestamp` | `i64` | Latest decision timestamp in the batch. Must be > `start_timestamp`. |
| `submitted_at` | `i64` | When this batch proof was submitted. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 34]` | Reserved. |

---

## Instructions

### `initialize_proof`

**Signer:** `authority` (any signer, first caller wins)
**One-time:** Yes (`is_initialized` guard)

**Security note:** Any wallet can call this and become the `keeper_authority`. Deploy and initialize in the same transaction or atomically within the same block to prevent front-running.

**Parameters (`InitializeProofArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `keeper_authority` | `Pubkey` | The key that will have exclusive access to all proof operations |

**Emits:** `ProofInitialized { authority, keeper_authority, timestamp }`

---

### `log_decision`

**Signer:** `agent_authority` — must match `proof_config.keeper_authority`
**Access control:** Constraint: `agent_authority.key() == proof_config.keeper_authority`

Creates an immutable `DecisionLog` PDA. Validates:
- `evidence_families_bitmap & 0b11100000 == 0` (A0-18: only bits 0-4 valid)
- If `is_execution_class == true`: `count_set_bits(evidence_families_bitmap) >= 2` (A0-17)
- `decision_class <= 3`

The PDA is initialized with `execution_confirmed = false`. There is no instruction to delete or update any field except `execution_confirmed`.

**Parameters (`LogDecisionArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `agent_id` | `u16` | Agent making this decision |
| `nonce` | `u64` | Monotonic counter (caller manages uniqueness) |
| `input_hash` | `[u8; 32]` | Hash of input data |
| `decision_hash` | `[u8; 32]` | Hash of decision output |
| `justification_hash` | `[u8; 32]` | Hash of justification document |
| `evidence_families_bitmap` | `u8` | Bitmap of 5 evidence families |
| `decision_class` | `u8` | 0-3 |
| `is_execution_class` | `bool` | Whether >= 2 evidence families required |

**Emits:** `DecisionLogged`

---

### `confirm_execution`

**Signer:** `executor` — must match `proof_config.keeper_authority`
**Access control:** Constraint: `executor.key() == proof_config.keeper_authority`

The only instruction that mutates a `DecisionLog`. Sets `execution_confirmed = true`. Guards against double-confirmation with `!decision_log.execution_confirmed`. Creates a linked `ExecutionResult` PDA.

**Parameters (`ConfirmExecutionArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `result_hash` | `[u8; 32]` | Hash of execution outcome |
| `status` | `u8` | Application-defined status code |

**Emits:** `ExecutionConfirmed`

---

### `submit_batch_proof`

**Signer:** `agent_authority` — must match `proof_config.keeper_authority`
**Access control:** Constraint: `agent_authority.key() == proof_config.keeper_authority`

Creates a `BatchProof` PDA containing a Merkle root over a set of decision logs. Useful for gas-efficient verification: verifiers can check individual logs against the Merkle root without loading every PDA.

Validates:
- `leaf_count > 0`
- `start_timestamp < end_timestamp`

**Parameters (`SubmitBatchProofArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `agent_id` | `u16` | Agent submitting |
| `batch_nonce` | `u64` | Unique batch identifier |
| `merkle_root` | `[u8; 32]` | Merkle root of the batch |
| `leaf_count` | `u32` | Number of leaves |
| `start_timestamp` | `i64` | Earliest decision timestamp |
| `end_timestamp` | `i64` | Latest decision timestamp |

**Emits:** `BatchProofSubmitted`

---

### `close_expired_batch`

**Signer:** `keeper_authority`
**Access control:** `has_one = keeper_authority`

Closes a `BatchProof` PDA using Anchor's `close` constraint. Rent goes to `rent_destination`. Validates that `clock.unix_timestamp - batch.submitted_at >= args.min_age_seconds`.

`DecisionLog` and `ExecutionResult` PDAs are **never** closed by this or any instruction.

**Parameters (`CloseExpiredBatchArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `min_age_seconds` | `i64` | Minimum age required before close |

---

## Evidence Family Bitmap

| Bit | Family | Enum |
|-----|--------|------|
| 0 | Price/Volume data | `EvidenceFamily::PriceVolume` |
| 1 | Liquidity composition | `EvidenceFamily::LiquidityComposition` |
| 2 | Behavioral patterns | `EvidenceFamily::BehaviorPattern` |
| 3 | Incentive/economic | `EvidenceFamily::IncentiveEconomic` |
| 4 | Protocol governance | `EvidenceFamily::ProtocolGovernance` |
| 5-7 | RESERVED | Must be 0 |

Example: `0b00011` = PriceVolume + LiquidityComposition (2 families, sufficient for execution-class).

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | `AlreadyInitialized` | ProofConfig already initialized |
| 6001 | `NotInitialized` | ProofConfig not yet initialized |
| 6002 | `InvalidEvidenceBitmap` | Bits 5-7 are set (A0-18 violation) |
| 6003 | `InsufficientEvidenceFamilies` | Execution-class decision with < 2 families (A0-17) |
| 6004 | `InvalidDecisionClass` | `decision_class > 3` |
| 6005 | `ExecutionAlreadyConfirmed` | `confirm_execution` called on already-confirmed log |
| 6006 | `InvalidBatchNonce` | `leaf_count == 0` |
| 6007 | `InvalidTimestampRange` | `start_timestamp >= end_timestamp` |
| 6008 | `BatchNotExpired` | Batch too recent to close |
| 6009 | `Unauthorized` | Signer does not match `keeper_authority` |
| 6010 | `MathOverflow` | Checked subtraction returned `None` in `close_expired_batch` |

---

## Security Considerations

1. **Immutability guarantee:** No instruction updates or closes `DecisionLog` or `ExecutionResult` PDAs. The only mutation is setting `execution_confirmed` from false to true, which cannot be reversed.

2. **Access control consolidation:** All write operations require the signer to match `proof_config.keeper_authority`. This means the keeper key is the single writer for proof records. If keeper is compromised, the attacker can write spurious proofs but cannot modify existing ones.

3. **Nonce management:** The caller must manage `nonce` uniqueness per `agent_id`. Duplicate `(agent_id, nonce)` pairs will fail with `AccountAlreadyInitialized` from Anchor.

4. **Batch proofs are supplemental:** Closing a `BatchProof` does not affect the underlying `DecisionLog` records. Batch proofs are efficiency tools only.

5. **Front-running window on initialize:** Deploy and call `initialize_proof` in the same block or transaction bundle. Any delay between deployment and initialization creates a window where an attacker can claim keeper authority.

---

## Integration Examples

### Log a decision

```typescript
const [proofConfigPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("proof_config")],
  PROOF_PROGRAM_ID
);

const agentId = 1;
const nonce = BigInt(42);
const nonceBuf = Buffer.alloc(8);
nonceBuf.writeBigUInt64LE(nonce);

const [decisionLogPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("decision"),
    Buffer.from(new Uint16Array([agentId]).buffer),
    nonceBuf,
  ],
  PROOF_PROGRAM_ID
);

await proofProgram.methods
  .logDecision({
    agentId: agentId,
    nonce: new anchor.BN(nonce.toString()),
    inputHash: Array.from(inputHash),
    decisionHash: Array.from(decisionHash),
    justificationHash: Array.from(justificationHash),
    evidenceFamiliesBitmap: 0b00011,  // PriceVolume + Liquidity
    decisionClass: 2,                  // RiskWarning
    isExecutionClass: true,
  })
  .accounts({
    proofConfig: proofConfigPda,
    decisionLog: decisionLogPda,
    agentAuthority: keeperKeypair.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([keeperKeypair])
  .rpc();
```

### Confirm execution

```typescript
const [executionResultPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("execution"), decisionLogPda.toBuffer()],
  PROOF_PROGRAM_ID
);

await proofProgram.methods
  .confirmExecution({
    resultHash: Array.from(resultHash),
    status: 0,  // Success
  })
  .accounts({
    proofConfig: proofConfigPda,
    decisionLog: decisionLogPda,
    executionResult: executionResultPda,
    executor: keeperKeypair.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([keeperKeypair])
  .rpc();
```

---

## Known Limitations

1. `initialize_proof` does not validate the `keeper_authority` against `noumen-core`'s `AeonConfig`. Any wallet can initialize and set itself as keeper. Mitigate by initializing immediately after deployment.

2. There is no cross-program validation that `agent_id` corresponds to a registered `AgentManifest` in `noumen-core`. Any agent_id value can be used in a `DecisionLog`.

3. `nonce` uniqueness is the caller's responsibility. There is no on-chain monotonic counter per agent; the combination `(agent_id, nonce)` is simply a PDA seed — collision means the transaction fails with `AccountAlreadyInitialized`.
