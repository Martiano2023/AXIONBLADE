# noumen-apollo

**Program ID:** `92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee`
**Network:** Devnet / Localnet
**Anchor version:** 0.30.1
**Crate name:** `noumen_apollo` (on-chain identifier — do not rename)

---

## Purpose

`noumen-apollo` is the DeFi risk evaluation engine for AXIONBLADE. Its on-chain role is a read-only PDA store: it accepts structured risk assessment data from the off-chain APOLLO agent, writes it to immutable PDAs, and makes those PDAs readable by any consumer.

**Structural guarantee (documented in source):** This program contains **zero CPI calls**. It writes only to its own PDAs. Executors may not read APOLLO PDAs directly — they must go through the Risk Engine with APOLLO's weight capped at 40% (A0-14, A0-15, A0-16).

Responsibilities:

- Register and categorize liquidity pools (Pool Taxonomy)
- Publish risk assessments with evidence family validation (A0-17, A0-18, A0-23)
- Enforce APOLLO's maximum Risk Engine weight: hardcoded to `APOLLO_MAX_WEIGHT_BPS = 4000` (40%)
- Provide read-only PDAs for off-chain consumption and AEON's Risk Engine

APOLLO has three conceptual modules (off-chain):
1. **Pool Taxonomy** — classifies pools by type, protocol, risk profile
2. **Market Liquidity Index (MLI)** — ranks pools by TVL and composition
3. **Effective APR Calculator** — computes real yield after IL, fees, and decay

---

## ASCII Architecture

```
  Off-chain APOLLO agent
         |
         | (reads market data: prices, TVL, liquidity)
         | (computes: taxonomy, MLI, effective APR, risk assessment)
         v
  noumen-apollo program (zero CPI, no downstream effects)
         |
         |--[initialize_apollo]---> ApolloConfig PDA [b"apollo_config"]
         |                          max_weight_bps = 4000 (hardcoded)
         |
         |--[register_pool]-------> PoolTaxonomy PDA [b"pool_tax", pool_address]
         |
         |--[update_pool_taxonomy]-> PoolTaxonomy PDA (mutable)
         |
         `--[publish_assessment]--> AssessmentRecord PDA
                                    [b"assessment", pool_address, nonce]
                                    (immutable after creation)

  Off-chain Risk Engine reads AssessmentRecord PDAs
  (weight of APOLLO data capped at <= 40%)
         |
         v
  noumen-core: AEON receives Risk Engine output -> Executor
```

---

## Accounts

### ApolloConfig

**PDA seeds:** `[b"apollo_config"]`
**Space:** 176 bytes

| Field | Type | Description |
|-------|------|-------------|
| `authority` | `Pubkey` | APOLLO agent authority. Signs all assessment and pool operations. |
| `aeon_authority` | `Pubkey` | AEON's key (set at initialization). |
| `max_weight_bps` | `u16` | Hardcoded to `APOLLO_MAX_WEIGHT_BPS = 4000`. Never from user input (A0-16). |
| `max_mli_pools` | `u16` | Maximum number of pools tracked by the Market Liquidity Index. |
| `assessment_count` | `u64` | Cumulative assessments published. |
| `pool_count` | `u16` | Registered pool count. |
| `is_initialized` | `bool` | Anti-re-init guard. |
| `mli_tvl_minimum_lamports` | `u64` | Minimum TVL for MLI pool inclusion. |
| `created_at` | `i64` | Initialization timestamp. |
| `updated_at` | `i64` | Last update timestamp. |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 64]` | Reserved for future fields. |

### AssessmentRecord

**PDA seeds:** `[b"assessment", pool_address.as_ref(), assessment_nonce.to_le_bytes()]`
**Space:** 160 bytes
**Mutability:** Immutable after creation (no update instruction).

| Field | Type | Description |
|-------|------|-------------|
| `pool_address` | `Pubkey` | The pool being assessed. Part of PDA seed. |
| `assessment_nonce` | `u64` | Monotonic counter per pool. Part of PDA seed. |
| `timestamp` | `i64` | Assessment creation time. |
| `risk_level` | `u8` | 0=Low, 1=Medium, 2=High, 3=Critical |
| `confidence_score` | `u8` | 0-100 (checked: must be <= 100) |
| `evidence_families_bitmap` | `u8` | Bits 0-4 only (A0-18). Must have >= 2 set for execution-class. |
| `composite_score` | `u16` | Overall risk score in basis points (0-10000) |
| `mli_score` | `u16` | Market Liquidity Index score |
| `effective_apr_bps` | `u16` | Real yield after IL, fees, decay. Must be > 0 (A0-23). |
| `headline_apr_bps` | `u16` | Advertised/nominal APR. Must be > 0 (A0-23). |
| `il_projected_bps` | `u16` | Projected impermanent loss in basis points |
| `sustainability_score` | `u16` | Yield sustainability metric |
| `expiry` | `i64` | Assessment validity end (must be in the future at creation) |
| `decision_log_ref` | `Pubkey` | Address of the `DecisionLog` PDA in `noumen-proof` for this assessment |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 48]` | Reserved. |

### PoolTaxonomy

**PDA seeds:** `[b"pool_tax", pool_address.as_ref()]`
**Space:** 102 bytes
**Mutability:** Updatable via `update_pool_taxonomy`.

| Field | Type | Description |
|-------|------|-------------|
| `pool_address` | `Pubkey` | Pool's on-chain address. PDA seed. |
| `pool_type` | `u8` | 0=CLAMM, 1=ConstantProduct, 2=Stable, 3=Weighted |
| `protocol` | `u8` | 0=Orca, 1=Raydium, 2=Meteora |
| `risk_profile` | `u8` | Application-defined risk classification |
| `il_sensitivity` | `u8` | Impermanent loss sensitivity classification |
| `pair_class` | `u8` | Token pair category classification |
| `tvl_lamports` | `u64` | Total Value Locked (updated periodically) |
| `last_updated` | `i64` | Last taxonomy update timestamp |
| `created_at` | `i64` | Registration timestamp |
| `bump` | `u8` | PDA canonical bump. |
| `_reserved` | `[u8; 32]` | Reserved. |

---

## Instructions

### `initialize_apollo`

**Signer:** `aeon_authority` (payer)
**One-time:** Yes (`is_initialized` guard + `init` constraint)

Initializes `ApolloConfig`. `max_weight_bps` is hardcoded to `APOLLO_MAX_WEIGHT_BPS = 4000` regardless of any argument (A0-16). The deployer key is emitted in the event for auditability.

**Parameters (`InitializeApolloArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `authority` | `Pubkey` | APOLLO agent signing key |
| `max_mli_pools` | `u16` | MLI pool cap |
| `mli_tvl_minimum_lamports` | `u64` | Minimum TVL for MLI inclusion |

**Emits:** `ApolloInitialized { deployer, authority, aeon_authority, max_weight_bps, max_mli_pools, mli_tvl_minimum_lamports, timestamp }`

---

### `publish_assessment`

**Signer:** `authority`
**Access control:** `has_one = authority`

Creates an immutable `AssessmentRecord` PDA. Validates:
- `headline_apr_bps > 0 && effective_apr_bps > 0` (A0-23: both must be reported together)
- `evidence_families_bitmap & 0b11100000 == 0` (A0-18: only bits 0-4 valid)
- `confidence_score <= 100`
- `risk_level <= 3`
- `expiry > clock.unix_timestamp` (assessment must not already be expired)
- Requires `decision_log_ref` linking back to a `noumen-proof` DecisionLog PDA

**Parameters (`PublishAssessmentArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `pool_address` | `Pubkey` | Pool being assessed |
| `assessment_nonce` | `u64` | Monotonic counter (caller manages uniqueness) |
| `risk_level` | `u8` | RiskLevel 0-3 |
| `confidence_score` | `u8` | 0-100 |
| `evidence_families_bitmap` | `u8` | Bitmap of 5 evidence families |
| `composite_score` | `u16` | Overall risk score in bps |
| `mli_score` | `u16` | MLI score |
| `effective_apr_bps` | `u16` | Real APR > 0 (A0-23) |
| `headline_apr_bps` | `u16` | Nominal APR > 0 (A0-23) |
| `il_projected_bps` | `u16` | Projected IL in bps |
| `sustainability_score` | `u16` | Sustainability metric |
| `expiry` | `i64` | Unix expiry (must be future) |
| `decision_log_ref` | `Pubkey` | Linked DecisionLog PDA address |

**Emits:** `AssessmentPublished`

---

### `register_pool`

**Signer:** `authority`
**Access control:** `has_one = authority`

Creates a `PoolTaxonomy` PDA. Validates `pool_type <= 3` and `protocol <= 2`.

**Parameters (`RegisterPoolArgs`):**

| Param | Type | Description |
|-------|------|-------------|
| `pool_address` | `Pubkey` | Pool address |
| `pool_type` | `u8` | 0-3 |
| `protocol` | `u8` | 0-2 |
| `risk_profile` | `u8` | Risk classification |
| `il_sensitivity` | `u8` | IL sensitivity |
| `pair_class` | `u8` | Token pair class |
| `tvl_lamports` | `u64` | Initial TVL |

**Emits:** `PoolRegistered`

---

### `update_pool_taxonomy`

**Signer:** `authority`
**Access control:** `has_one = authority`

Partial update of an existing `PoolTaxonomy`. All fields `Option<...>`. Validates enum ranges for `pool_type` and `protocol` if provided.

**Parameters (`UpdatePoolTaxonomyArgs`):** All fields are `Option<u8>` or `Option<u64>`.

**Emits:** `TaxonomyUpdated`

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | `Unauthorized` | Signer does not match `authority` |
| 6001 | `WeightExceedsMaximum` | Reserved for future direct weight validation (currently hardcoded) |
| 6002 | `InvalidConfidenceScore` | `confidence_score > 100` |
| 6003 | `MissingAPRPair` | Either `headline_apr_bps` or `effective_apr_bps` is 0 (A0-23) |
| 6004 | `AlreadyInitialized` | `ApolloConfig` already initialized |
| 6005 | `InvalidEnumValue` | `pool_type > 3` or `protocol > 2` or `risk_level > 3` |
| 6006 | `PoolNotFound` | Pool PDA does not exist (returned by Anchor on lookup) |
| 6007 | `MLIPoolCapReached` | Reserved for future MLI cap enforcement |
| 6008 | `MathOverflow` | Checked arithmetic returned `None` |
| 6009 | `InvalidBitmap` | Evidence families bitmap has bits 5-7 set (A0-18) |
| 6010 | `ExpiredAssessment` | `expiry <= clock.unix_timestamp` at publish time |

---

## Security Considerations

1. **Zero CPI guarantee:** The source file begins with `// STRUCTURAL GUARANTEE: This program contains ZERO CPI calls.` This is verified: there is no `CpiContext`, `invoke`, or `invoke_signed` call anywhere in the program, and `system_program` is only used for Anchor's `init` rent allocation.

2. **Hardcoded weight cap:** `max_weight_bps` is set to the constant `APOLLO_MAX_WEIGHT_BPS = 4000` during initialization and there is no instruction to update it. No user can supply a higher value. This enforces A0-16 at the program level.

3. **Assessment immutability:** There is no `update_assessment` or `close_assessment` instruction. Once published, an `AssessmentRecord` PDA persists indefinitely. Stale assessments are identified by `expiry` timestamp; the off-chain Risk Engine must check this field.

4. **Decision log linkage:** Every assessment must reference a `decision_log_ref`. This creates a traceable link from assessment → proof → decision. The link is not validated on-chain (the address is stored but not verified as a valid `DecisionLog` PDA). Off-chain verifiers must confirm the linkage.

5. **Evidence bitmap validation:** The bitmap check (`& 0b11100000 == 0`) prevents upper bits from being set, enforcing that only the 5 defined families can be claimed.

---

## Integration Examples

### Read an assessment

```typescript
const [assessmentPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("assessment"),
    poolAddress.toBuffer(),
    nonceBuf,  // u64 LE
  ],
  APOLLO_PROGRAM_ID
);

const assessment = await apolloProgram.account.assessmentRecord.fetch(assessmentPda);

console.log("Risk level:", assessment.riskLevel);
console.log("Effective APR bps:", assessment.effectiveAprBps);
console.log("Confidence:", assessment.confidenceScore, "/100");
console.log("Expired:", assessment.expiry < Date.now() / 1000);
```

### Publish an assessment

```typescript
await apolloProgram.methods
  .publishAssessment({
    poolAddress: poolAddress,
    assessmentNonce: new anchor.BN(nonce),
    riskLevel: 1,               // Medium
    confidenceScore: 82,
    evidenceFamiliesBitmap: 0b00111,  // 3 families
    compositeScore: 3200,
    mliScore: 7500,
    effectiveAprBps: 1450,       // 14.5%
    headlineAprBps: 2200,        // 22.0%
    ilProjectedBps: 350,
    sustainabilityScore: 6800,
    expiry: new anchor.BN(Math.floor(Date.now() / 1000) + 3600),  // 1 hour
    decisionLogRef: decisionLogPda,
  })
  .accounts({
    apolloConfig: apolloConfigPda,
    assessmentRecord: assessmentRecordPda,
    authority: apolloAuthorityKeypair.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([apolloAuthorityKeypair])
  .rpc();
```

---

## Known Limitations

1. `AssessmentRecord` PDAs never expire on-chain. The `expiry` field is advisory; off-chain consumers must check it. Consider this when designing the Risk Engine.

2. `decision_log_ref` in `AssessmentRecord` is stored but not validated on-chain. A malformed or invalid PDA address can be stored without error.

3. `pool_count` in `ApolloConfig` increments on `register_pool` but there is no corresponding `deregister_pool` instruction. Pool taxonomy records accumulate indefinitely.

4. `assessment_nonce` uniqueness is the caller's responsibility. The combination `(pool_address, assessment_nonce)` must be unique per pool — duplicates fail with `AccountAlreadyInitialized`.
