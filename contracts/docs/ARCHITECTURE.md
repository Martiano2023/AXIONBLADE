# AXIONBLADE Smart Contract Architecture

**Version:** v3.4.0
**Anchor:** 0.30.1
**Last updated:** 2026-02-26

---

## System Overview

AXIONBLADE is an autonomous risk assessment and execution infrastructure for Solana DeFi. Seven Anchor programs implement the on-chain components. Three off-chain agents (AEON, APOLLO, HERMES) interact with these programs; a fourth agent (KRONOS) handles economic operations.

### The Fundamental Design Principle

LLMs and off-chain agents are never the final decision-makers. All consequential decisions are:
1. Computed off-chain using deterministic, versioned logic
2. Logged on-chain via `noumen-proof` BEFORE execution
3. Constrained by on-chain axiom enforcement (caps, ratios, bitmaps, timelocks)
4. Retroactively auditable via immutable PDAs

---

## System Architecture Diagram

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                         AXIONBLADE ON-CHAIN SYSTEM                      │
  │                                                                         │
  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐   │
  │  │ noumen-core  │    │ noumen-proof │    │    noumen-treasury        │   │
  │  │              │    │              │    │                          │   │
  │  │ AeonConfig   │    │ ProofConfig  │    │ TreasuryConfig           │   │
  │  │ AgentManifest│    │ DecisionLog  │    │ TreasuryVault (SOL)      │   │
  │  │ PolicyProp.  │    │ ExecResult   │    │ DonationVault            │   │
  │  │ AgentPerm.   │    │ BatchProof   │    │ CCSConfig (4 bands)      │   │
  │  │              │    │              │    │ BudgetAllocation         │   │
  │  │ Root-of-trust│    │ Audit trail  │    │ DonationReceipt          │   │
  │  └──────────────┘    └──────────────┘    │ VolumeDiscTracker        │   │
  │         │                  │             └──────────────────────────┘   │
  │         │                  │                         │                  │
  │         └──────────────────┴─────────────────────────┘                 │
  │                            │                                            │
  │                    [Authority hierarchy:                                │
  │                     super > aeon > keeper]                              │
  │                                                                         │
  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐   │
  │  │noumen-apollo │    │noumen-hermes │    │    noumen-auditor         │   │
  │  │              │    │              │    │                          │   │
  │  │ ApolloConfig │    │ HermesConfig │    │ AuditorConfig            │   │
  │  │ AssessRecord │    │ IntelReport  │    │ TruthLabel               │   │
  │  │ PoolTaxonomy │    │ AgentAction  │    │ SecurityIncident         │   │
  │  │              │    │   Record     │    │ AccuracySnapshot         │   │
  │  │ ZERO CPI     │    │              │    │                          │   │
  │  │ Read-only out│    │ No CPI to    │    │ Audit/labeling only      │   │
  │  │ max 40% wgt  │    │ apollo/exec  │    │ No execution path        │   │
  │  └──────────────┘    └──────────────┘    └──────────────────────────┘   │
  │                                                                         │
  │  ┌──────────────────────────────────────────────────────────────────┐   │
  │  │                    noumen-service                                │   │
  │  │                                                                  │   │
  │  │  ServiceConfig   ServiceEntry (per service)                      │   │
  │  │  A0-8 margin     A0-26 disclosure flags                          │   │
  │  │  lifecycle: Declared -> Simulated -> Active                      │   │
  │  └──────────────────────────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## Firewall Chain

The execution firewall prevents unauthorized data from entering the execution path:

```
  Off-chain APOLLO agent
         │
         │ Computes risk assessment (Pool Taxonomy, MLI, Effective APR)
         │
         ▼
  noumen-proof: log_decision()
         │
         │ [A0-6: proof logged before assessment published]
         │
         ▼
  noumen-apollo: publish_assessment()
         │
         │ AssessmentRecord PDA (read-only, immutable)
         │ max_weight_bps = 4000 (40% cap, A0-16, hardcoded)
         │ ZERO CPI calls (A0-14, A0-15)
         │
         ▼
  Off-chain Risk Engine
         │
         │ Reads AssessmentRecord PDA
         │ Applies weight cap: APOLLO contribution <= 40%
         │ Combines with other evidence (price feeds, on-chain state)
         │
         ▼
  Off-chain AEON agent
         │
         │ Receives Risk Engine output
         │ Makes final decision (deterministic, versioned logic)
         │
         ▼
  noumen-proof: log_decision()  [A0-6: proof before execution]
         │
         ▼
  Executor (off-chain, via Jupiter/Raydium/etc.)
         │
         ▼
  noumen-proof: confirm_execution()
         │
         │ [execution_confirmed = true on DecisionLog]
         │ [ExecutionResult PDA created]
         ▼
  (audit complete)

  NOTE: Executors NEVER read AssessmentRecord PDAs directly.
  NOTE: HERMES intelligence reports (IntelligenceReport PDAs) are terminal
        outputs — they never enter this chain.
```

---

## PDA Seed Derivation

All PDAs use their owning program's ID as the implicit program scope. Cross-program collisions are impossible.

### noumen-core (`9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE`)

| Account | Seeds |
|---------|-------|
| `AeonConfig` | `[b"aeon_config"]` |
| `AgentManifest` | `[b"agent", agent_id: u16 LE]` |
| `PolicyProposal` | `[b"proposal", proposal_id: u32 LE]` |
| `AgentPermissionConfig` | `[b"agent_permission", user_wallet: Pubkey, agent_id: u16 LE]` |

### noumen-proof (`3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV`)

| Account | Seeds |
|---------|-------|
| `ProofConfig` | `[b"proof_config"]` |
| `DecisionLog` | `[b"decision", agent_id: u16 LE, nonce: u64 LE]` |
| `ExecutionResult` | `[b"execution", decision_log: Pubkey]` |
| `BatchProof` | `[b"batch", agent_id: u16 LE, batch_nonce: u64 LE]` |

### noumen-treasury (`EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu`)

| Account | Seeds |
|---------|-------|
| `TreasuryConfig` | `[b"treasury_config"]` |
| `TreasuryVault` | `[b"treasury_vault"]` |
| `DonationVault` | `[b"donation_vault"]` |
| `CCSConfig` | `[b"ccs_config"]` |
| `BudgetAllocation` | `[b"budget", agent_id: u16 LE]` |
| `DonationReceipt` | `[b"donation_receipt", nonce: u64 LE]` |
| `VolumeDiscountTracker` | `[b"volume_tracker", wallet: Pubkey]` |

### noumen-apollo (`92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee`)

| Account | Seeds |
|---------|-------|
| `ApolloConfig` | `[b"apollo_config"]` |
| `AssessmentRecord` | `[b"assessment", pool_address: Pubkey, assessment_nonce: u64 LE]` |
| `PoolTaxonomy` | `[b"pool_tax", pool_address: Pubkey]` |

### noumen-hermes (`Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj`)

| Account | Seeds |
|---------|-------|
| `HermesConfig` | `[b"hermes_config"]` |
| `IntelligenceReport` | `[b"report", report_nonce: u64 LE]` |
| `AgentActionRecord` | `[b"agent_action", user_wallet: Pubkey, action_nonce: u64 LE]` |

### noumen-auditor (`CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe`)

| Account | Seeds |
|---------|-------|
| `AuditorConfig` | `[b"auditor_config"]` |
| `TruthLabel` | `[b"truth_label", signal_nonce: u64 LE]` |
| `SecurityIncident` | `[b"incident", incident_nonce: u64 LE]` |
| `AccuracySnapshot` | `[b"accuracy", snapshot_nonce: u64 LE]` |

### noumen-service (`9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY`)

| Account | Seeds |
|---------|-------|
| `ServiceConfig` | `[b"service_config"]` |
| `ServiceEntry` | `[b"service", service_id: u16 LE]` |

---

## Cross-Program Invocations (CPI)

Only two programs make CPI calls. All others are zero-CPI by design.

### noumen-treasury CPIs

| Instruction | CPI | From → To | Signed by |
|-------------|-----|-----------|-----------|
| `process_service_payment` | SOL transfer | payer → creator_wallet | payer (external signer) |
| `process_service_payment` | SOL transfer | payer → treasury_vault | payer (external signer) |
| `sweep_donations` | SOL transfer | donation_vault → treasury_vault | donation_vault PDA (seeds: `[b"donation_vault", bump]`) |
| `withdraw_creator_split` | SOL transfer | treasury_vault → creator_wallet | treasury_vault PDA (seeds: `[b"treasury_vault", bump]`) |

### noumen-hermes CPIs (via SPL Token)

`noumen-hermes` itself makes no CPI calls in the published instruction set. The actual token operations for agent actions happen off-chain. The program only records proofs.

### Zero-CPI Programs (structurally verified)

| Program | Guarantee |
|---------|-----------|
| `noumen-core` | No CPI (system_program used only for `init` rent) |
| `noumen-proof` | No CPI (system_program for `init` rent only) |
| `noumen-apollo` | No CPI — source comment: "STRUCTURAL GUARANTEE: This program contains ZERO CPI calls." |
| `noumen-hermes` (intelligence) | No CPI to apollo or execution programs |
| `noumen-auditor` | No CPI |
| `noumen-service` | No CPI |

---

## Authority Hierarchy

```
  super_authority
  ├── Can call: initialize_aeon, update_system_actors, accept_super_authority (pending),
  │            reset_circuit_breaker, initialize_treasury
  ├── Two-step rotation: update sets pending; accept_super_authority by new key completes
  └── Must be distinct from aeon_authority and keeper_authority

  aeon_authority
  ├── Can call: create_agent, update_agent, pause_agent, kill_agent,
  │            propose_policy_change, execute_policy_change,
  │            initialize_apollo, initialize_hermes, aeon_pause_hermes,
  │            allocate_agent_budget, update_agent_budget,
  │            register_service, update_service_price, update_service_level
  ├── Can trigger (but not reset) circuit breaker
  └── CANNOT update the super_authority key directly

  keeper_authority
  ├── Can call: record_heartbeat, trigger_circuit_breaker,
  │            log_decision (in noumen-proof), confirm_execution,
  │            submit_batch_proof, close_expired_batch,
  │            sweep_donations, record_donation_receipt,
  │            update_revenue_averages, track_volume_usage,
  │            update_service_metrics
  └── Automated ops key — should be a hot wallet managed by infrastructure

  agent authority (per-agent)
  └── Stored in AgentManifest.authority; used for agent-specific operations
      (referenced by noumen-proof for decision log attribution)

  user wallet
  └── Can call: register_agent_subscription, update_agent_permissions,
               revoke_agent_permissions, initialize_volume_tracker,
               process_service_payment (as payer)
```

---

## Shared-Types Library

The `shared-types` crate (`contracts/crates/shared-types/`) provides enums, constants, and helper functions shared across all programs.

### Enums

| Enum | Values |
|------|--------|
| `AgentType` | Collector(0), Evaluator(1), Executor(2), Auditor(3) |
| `AgentStatus` | Pending(0), Active(1), Paused(2), Killed(3) |
| `ExecutionPermission` | Never(0), Limited(1), Full(2) |
| `ServiceLevel` | Declared(0), Simulated(1), Active(2) |
| `RiskLevel` | Low(0), Medium(1), High(2), Critical(3) |
| `EvidenceFamily` | PriceVolume(0), LiquidityComposition(1), BehaviorPattern(2), IncentiveEconomic(3), ProtocolGovernance(4) |
| `CircuitBreakerMode` | Normal(0), Cautious(1), Restricted(2), Halted(3) |
| `DecisionClass` | Info(0), LimitedReliability(1), RiskWarning(2), DangerSignal(3) |
| `ReportType` | EffectiveAPR(0), RiskDecomposition(1), YieldTrapIntelligence(2), PoolComparison(3), ProtocolHealth(4) |
| `IncidentType` | Exploit(0), RugPull(1), LiquidityDrain(2), OracleManipulation(3), IncentiveCollapse(4) |
| `IncidentStatus` | Unconfirmed(0), Confirmed(1), Dismissed(2) |
| `TruthLabelResult` | Correct(0), Incorrect(1), Inconclusive(2) |
| `DisclosureMode` | Pseudonymous(0), Disclosed(1) |

### Constants

| Constant | Value | Meaning |
|----------|-------|---------|
| `HARD_AGENT_CAP` | 100 | Maximum agents ever (A0-9) |
| `RESERVE_RATIO_BPS` | 2500 | 25% minimum reserve (A0-3) |
| `DAILY_SPEND_CAP_BPS` | 300 | 3% daily treasury spend cap |
| `AGENT_BUDGET_CAP_BPS` | 1500 | 15% per-agent budget cap |
| `EVALUATOR_BUDGET_CAP_BPS` | 2500 | 25% evaluator budget cap |
| `CCS_CAP_TOTAL_BPS` | 1500 | 15% max creator split |
| `CCS_FLOOR_BASE_SPLIT_BPS` | 400 | 4% min creator split floor |
| `CCS_CAP_STIPEND_BPS` | 500 | 5% stipend cap |
| `APOLLO_MAX_WEIGHT_BPS` | 4000 | 40% max APOLLO weight in Risk Engine (A0-16) |
| `MIN_EVIDENCE_FAMILIES` | 2 | Minimum evidence families for execution-class decisions (A0-17) |
| `PRICE_MARGIN_MULTIPLIER_BPS` | 12000 | 120% price floor multiplier (A0-8) |
| `EVIDENCE_FAMILY_COUNT` | 5 | Total defined evidence families |
| `LAMPORTS_PER_SOL` | 1,000,000,000 | Standard lamports conversion |

### Helper Functions

```rust
pub fn count_set_bits(bitmap: u8) -> u8 {
    bitmap.count_ones() as u8
}
```

Used by `noumen-proof` to count evidence families in the bitmap.

---

## Axiom Enforcement Points (On-Chain)

| Axiom | Description | Enforcement Location |
|-------|-------------|---------------------|
| A0-3 | Reserve ratio >= 25% | `noumen-treasury::withdraw_creator_split` |
| A0-6 | Proof before execution | `noumen-proof::log_decision` (DecisionLog PDA must exist before execution) |
| A0-8 | Price >= cost + 20% | `noumen-service::register_service`, `update_service_price` |
| A0-9 | Hard cap 100 agents | `noumen-core::create_agent` (dual check: soft cap + HARD_AGENT_CAP) |
| A0-14 | Evaluators cannot execute | `noumen-core::create_agent` (Evaluator + non-Never permission rejected) |
| A0-16 | APOLLO weight <= 40% | `noumen-apollo::initialize_apollo` (hardcoded, not from args) |
| A0-17 | >= 2 evidence families for execution | `noumen-proof::log_decision` (bitmap popcount check) |
| A0-18 | Only 5 evidence families valid | `noumen-proof::log_decision`, `noumen-apollo::publish_assessment` (bits 5-7 must be 0) |
| A0-21 | Resolved outcomes only for labeling | `noumen-auditor::record_truth_label` (window_end <= now) |
| A0-23 | APR pair reported together | `noumen-apollo::publish_assessment` (both > 0 required) |
| A0-26 | Disclosure flags required | `noumen-service::register_service` (hardcoded true) |
| A0-29 | HERMES zero CPI to APOLLO | `noumen-hermes` source (structurally verified, no CpiContext) |
| A0-30 | HERMES report types terminal only | `noumen-hermes::publish_report` (report_type <= 4) |
| A0-31 | HERMES requires user authorization | `noumen-hermes::confirm_agent_action_executed` (hermes_enabled check) |
| A0-31 | HERMES daily limit | `noumen-hermes::confirm_agent_action_executed` (tx count check) |
| A0-33 | User can revoke instantly | `noumen-core::revoke_agent_permissions` (atomic, immediate) |
| A0-34 | AEON can pause HERMES | `noumen-core::aeon_pause_hermes` |
| A0-35 | APOLLO assessment age < 1h | `noumen-hermes::log_agent_action_proof` (3600s check) |

---

## Policy Layer System

| Layer | Name | Delay | Cooldown | Who Changes |
|-------|------|-------|----------|-------------|
| 0 | Immutable (Axioms) | N/A | N/A | Requires contract redeploy |
| 1 | Constitutional | 72h – 30d | Intended future enforcement | aeon_authority |
| 2 | Operational | 24h minimum | Intended future enforcement | aeon_authority |
| 3 | Tactical | Agent-adjustable | N/A | Individual agents off-chain |

Layer 0 proposals are statically rejected by `propose_policy_change`. Policy proposals expire 7 days after the delay_until timestamp to prevent stale proposal accumulation.

---

## Circuit Breaker

```
Mode transitions (escalation only):
  Normal (0) -> Cautious (1) -> Restricted (2) -> Halted (3)

Who can escalate:
  aeon_authority OR keeper_authority (either can trigger, for fast response)

Who can de-escalate:
  super_authority ONLY (via reset_circuit_breaker)

On-chain behavior:
  circuit_breaker_mode is read off-chain by agents to determine behavior.
  The on-chain programs do not gate instructions based on circuit_breaker_mode
  (enforcement is in off-chain agent logic).
```

---

## Upgrade Authority

All programs in the Anchor.toml workspace use the deployer's keypair as upgrade authority. For mainnet:

1. The upgrade authority should be transferred to a multisig (Squads Protocol recommended)
2. Program upgrades require the upgrade authority to sign an `UpgradeableLoader` transaction
3. Upgrading resets the program's executable bytecode while preserving account state (PDAs remain)
4. The `noumen_*` crate names and declared Program IDs must not change between upgrades

### Key Rotation

- **super_authority rotation:** Two-step process. Call `update_system_actors` with `new_super_authority`, then the new key calls `accept_super_authority`.
- **aeon_authority rotation:** Immediate, single-step via `update_system_actors`.
- **keeper_authority rotation:** Immediate, single-step via `update_system_actors`.
- **APOLLO authority rotation:** No on-chain instruction exists. Requires redeploying `noumen-apollo` or adding an update instruction.

---

## Emergency Procedures

### Circuit Breaker Activation

**Trigger (any order of severity):**
```typescript
// Triggered by aeon or keeper
await coreProgram.methods
  .triggerCircuitBreaker({
    newMode: 3,  // Halted
    triggerReasonHash: Array.from(sha256(incidentReport)),
  })
  .accounts({ aeonConfig, authority: keeperKeypair.publicKey })
  .signers([keeperKeypair])
  .rpc();
```

**Recovery (super_authority only):**
```typescript
await coreProgram.methods
  .resetCircuitBreaker(Array.from(sha256(recoveryPlan)))
  .accounts({ aeonConfig, superAuthority: superKeypair.publicKey })
  .signers([superKeypair])
  .rpc();
```

### Pause User's HERMES

If a user's autonomous HERMES activity shows anomalies:
```typescript
await coreProgram.methods
  .aeonPauseHermes()
  .accounts({
    aeonConfig,
    aeonAuthority: aeonKeypair.publicKey,
    agentPermissionConfig: userPermissionPda,
  })
  .signers([aeonKeypair])
  .rpc();
```

### Kill an Agent

```typescript
await coreProgram.methods
  .killAgent({
    agentId: agentId,
    killProof: Array.from(sha256(killDecisionDocument)),
  })
  .accounts({
    aeonConfig,
    agentManifest: agentManifestPda,
    aeonAuthority: aeonKeypair.publicKey,
  })
  .signers([aeonKeypair])
  .rpc();
```

---

## Program Deployment Order

Programs must be deployed and initialized in this sequence (dependency order):

1. `noumen-core` — initialize, establishes authority hierarchy
2. `noumen-proof` — initialize with keeper from step 1
3. `noumen-treasury` — initialize (step 1), initialize_donations (step 2)
4. `noumen-apollo` — initialize (requires aeon_authority)
5. `noumen-hermes` — initialize (requires aeon_authority)
6. `noumen-auditor` — initialize
7. `noumen-service` — initialize

`axionblade-token-vault` is deployed later, gated by KRONOS launch conditions.
