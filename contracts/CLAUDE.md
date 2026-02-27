# CLAUDE.md — Contracts Developer Guide

This file provides guidance to AI assistants (Claude Code and similar tools) working on the `contracts/` directory of AXIONBLADE.

---

## Critical Rules — Read First

1. **Do not rename any `noumen_*` program crate**. The names in `Cargo.toml`, `Cargo.lock`, `declare_id!`, and `Anchor.toml` are on-chain identifiers tied to deployed Program IDs. Renaming a crate changes the Anchor discriminator namespace and breaks all deployed PDAs.

2. **Do not change PDA seeds**. Seeds such as `b"core"`, `b"proof_config"`, `b"treasury_vault"`, `b"apollo_config"`, etc. are used to derive deterministic addresses that already exist on-chain. Changing a seed changes the derived address and orphans all existing accounts.

3. **Do not modify account struct field order or field sizes** in a deployed program without explicitly closing and re-initializing all affected PDAs. Anchor uses fixed offsets — inserting a field in the middle silently corrupts all deserialization.

4. **Do not edit `.so` binaries or keypair files** in `target/deploy/`. These are build artifacts; regenerate them with `anchor build --no-idl`.

5. **Do not commit files in `contracts/keys/`**. These are private authority keypairs. The directory is in `.gitignore`; if you accidentally stage them, run `git reset HEAD contracts/keys/` immediately.

6. **Verify against axioms before suggesting changes**. The AXIONBLADE axiom system (50 axioms, A0-1 through A0-50) is the safety envelope. Any change that violates an axiom is architecturally rejected, not just deferred. The canonical reference is `contracts/../files/13_AXIOMAS_REFERENCIA.md`.

---

## Repository Layout

```
contracts/
├── Anchor.toml              # Program IDs (localnet + devnet), cluster config
├── Cargo.toml               # Workspace — 7 programs + shared-types
├── Cargo.lock               # Locked dependency versions (commit this)
├── CLAUDE.md                # This file
├── SECURITY_REVIEW.md       # Automated static analysis results
├── docs/
│   ├── ARCHITECTURE.md      # System overview, PDA seeds, CPI tables, axiom enforcement
│   ├── SECURITY.md          # Threat model, access control matrix, audit checklist
│   └── DEPLOYMENT.md        # Deployment procedures, key management, upgrade procedure
├── programs/
│   ├── noumen-core/         # Governance: AeonConfig, AgentManifest, PolicyProposal
│   ├── noumen-proof/        # Proofs: DecisionLog, ExecutionResult, BatchProof
│   ├── noumen-treasury/     # Economy: TreasuryVault, DonationVault, BudgetAllocation
│   ├── noumen-apollo/       # Risk evaluation: AssessmentRecord, PoolTaxonomy
│   ├── noumen-hermes/       # Intelligence: IntelligenceReport, AgentActionRecord
│   ├── noumen-auditor/      # Audit: TruthLabel, SecurityIncident, AccuracySnapshot
│   ├── noumen-service/      # Service registry: ServiceEntry
│   └── axionblade-token-vault/  # KRONOS token vault (PRE-DEPLOYMENT, not in workspace)
├── crates/
│   └── shared-types/        # Shared enums, constants, count_set_bits()
├── keys/
│   ├── super_authority.json # Root key — hardware wallet on mainnet
│   ├── aeon_authority.json  # AEON governance key
│   └── keeper_authority.json # Hot wallet for automated operations
└── scripts/
    ├── deploy-devnet.sh          # Full devnet deploy + init
    ├── deploy-mainnet-fase1.sh   # Mainnet Phase 1: core, proof, apollo
    ├── deploy-mainnet-fase2.sh   # Mainnet Phase 2: treasury, service, auditor, hermes
    ├── init-mainnet-fase1.ts     # Initialize Phase 1 PDAs
    ├── init-mainnet-fase2.ts     # Initialize Phase 2 PDAs
    ├── create-agents-mainnet.ts  # Create initial agents after Phase 2
    ├── verify-agents-mainnet.ts  # Post-deploy agent verification
    └── security-tests.ts         # Access control smoke tests
```

---

## Program Summary

| Program | Crate | Program ID | Role |
|---------|-------|------------|------|
| noumen-core | `noumen_core` | `9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE` | Governance, agent lifecycle, circuit breaker |
| noumen-proof | `noumen_proof` | `3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV` | Decision logging, execution proof, batch proof |
| noumen-treasury | `noumen_treasury` | `EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu` | Revenue splits, vault management, budgets |
| noumen-apollo | `noumen_apollo` | `92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee` | Risk assessments (zero-CPI, write-only) |
| noumen-hermes | `noumen_hermes` | `Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj` | Intelligence reports + execution proof records |
| noumen-auditor | `noumen_auditor` | `CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe` | Truth labels, incidents, accuracy snapshots |
| noumen-service | `noumen_service` | `9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY` | Service registry, pricing, lifecycle |
| axionblade-token-vault | `axionblade_token_vault` | placeholder | KRONOS token launch + vesting (NOT DEPLOYED) |

---

## Architecture Invariants

These must remain true. Violating any of them breaks the axiom system.

### Firewall Chain

```
APOLLO → assessment_pda → Risk Engine (≤40%) → AEON → Executor
```

- `noumen-apollo` makes zero CPI calls. It is a write-only oracle. No instruction in apollo calls `invoke` or `invoke_signed`.
- `noumen-hermes` intelligence path (IntelligenceReport, PoolComparison) also makes zero CPI calls.
- The new `AgentActionRecord` path in noumen-hermes uses CPI to verify `AgentPermissionConfig` from noumen-core. This CPI is read-only account verification, not state mutation.
- Executors never read APOLLO PDAs directly. They consume AEON decisions, not assessments.

### Authority Hierarchy

```
super_authority (AeonConfig.super_authority)
    └── aeon_authority (AeonConfig.aeon_authority)
            └── keeper_authority (AeonConfig.keeper_authority)
                        └── agent authorities (AgentManifest.agent_authority)
```

- `super_authority` initializes programs, rotates AEON, resets circuit breaker.
- `aeon_authority` creates and manages agents, proposes policies, manages treasury budget allocation, registers services.
- `keeper_authority` writes proofs, records heartbeats, sweeps donations, updates metrics.
- Agent authorities operate within budget and proof constraints set by AEON.

### Cross-Program Dependency

noumen-hermes reads `AgentPermissionConfig` owned by noumen-core. The struct is redeclared in noumen-hermes for deserialization. If the `AgentPermissionConfig` struct in noumen-core changes, the corresponding redeclaration in noumen-hermes must also be updated, or the deserialization will silently read garbage.

### Evidence Family Bitmap

The 5-bit evidence family bitmap (bits 0-4) is used in:
- `noumen-proof`: `log_decision` requires >= 2 set bits for execution-class decisions (A0-17)
- `noumen-apollo`: `publish_assessment` validates bits 5-7 == 0

Bit positions (defined in `shared-types`):
- Bit 0: Price/Volume
- Bit 1: Liquidity
- Bit 2: Behavior
- Bit 3: Incentive
- Bit 4: Protocol

### Circuit Breaker

The circuit breaker state in `AeonConfig.circuit_breaker_state` is an enum:
- 0: Normal
- 1: Cautious
- 2: Restricted
- 3: Halted

It escalates monotonically (only `trigger_circuit_breaker`, called by aeon or keeper). Only `super_authority` can reset it via `reset_circuit_breaker`. Off-chain agents must check this state before executing any operation.

---

## Shared Types

All programs reference `crates/shared-types/src/lib.rs` for:

```rust
// Constants
HARD_AGENT_CAP: u8 = 100          // Maximum agents ever
APOLLO_MAX_WEIGHT_BPS: u16 = 4000  // 40% max weight in Risk Engine
PRICE_MARGIN_MULTIPLIER_BPS: u16 = 12000  // 120% minimum price floor (cost * 1.20)
MAX_POLICY_DELAY_SECONDS: i64 = 2_592_000  // 30 days
CCS_TOTAL_CAP_BPS: u16 = 1500     // 15% creator cap
CCS_FLOOR_BPS: u16 = 400          // 4% creator floor
CCS_STIPEND_CAP_BPS: u16 = 500    // 5% stipend cap

// Enums
AgentStatus, AgentCapabilities, CircuitBreakerState,
EvidenceFamily, PolicyType, IncidentType,
TruthLabelResult, ServiceTier, ServiceLevel,
LaunchStatus, VestingState

// Helper
fn count_set_bits(bitmap: u8) -> u8  // Used in proof and apollo validation
```

When adding a new constant or enum, add it to `shared-types` first, then reference it from the program. Do not duplicate constants across programs.

---

## Checked Arithmetic Pattern

All arithmetic on user-influenced or state-derived values must use the checked pattern:

```rust
// Correct:
let new_val = old_val.checked_add(delta).ok_or(ErrorCode::MathOverflow)?;

// Wrong (will panic on overflow despite overflow-checks=true in release):
let new_val = old_val + delta;

// Wrong (panic on overflow — must be replaced):
let new_val = old_val.checked_add(delta).unwrap();
```

The `Cargo.toml` workspace profile sets `overflow-checks = true` for release builds (defense-in-depth), but the explicit `.ok_or()` pattern is still required because panics are not recoverable errors.

Issue A-1 (`noumen-auditor` counter increments) was fixed on 2026-02-26 — all programs now use the checked pattern consistently.

---

## Adding a New Instruction

Checklist:

1. Add the instruction handler function to the program's `lib.rs`.
2. Add the `#[derive(Accounts)]` struct with all constraints.
3. Every instruction must have at least one `Signer<'info>` account.
4. Use `has_one = X @ ErrorCode::Unauthorized` for authority checks (preferred), or explicit `constraint =` for multi-key cases.
5. Validate all arithmetic with `checked_*().ok_or(Error::MathOverflow)?`.
6. If the instruction involves SOL transfers from a PDA via CPI, take mutable borrows of affected accounts AFTER all CPI calls (Anchor lifetime requirement).
7. Add the new error variant to the program's `#[error_code]` enum if a new error is needed.
8. Update the `README.md` in the program directory.
9. Update `docs/ARCHITECTURE.md` if the new instruction affects the CPI table or authority hierarchy.
10. Update `docs/SECURITY.md` access control matrix row for the new instruction.
11. Verify against the audit checklist in `docs/SECURITY.md`.

---

## Adding a New Account

Checklist:

1. Define the struct with `#[account]` derive.
2. Decide PDA seeds. Seeds must be unique within the program. Document them in the program README.
3. Calculate space: 8 (discriminator) + sum of all field sizes. Include a `_reserved: [u8; N]` field for future growth.
4. Add `is_initialized: bool` guard if the account is a singleton (prevents re-initialization via init).
5. Use `init` (not `init_if_needed`) for accounts that should only be created once.
6. Update the program README with the new account's field table, PDA seeds, and space calculation.
7. Update `docs/ARCHITECTURE.md` PDA seeds table.

---

## Test Structure

```
contracts/tests/
├── noumen-core.ts
├── noumen-proof.ts
├── noumen-treasury.ts
├── noumen-apollo.ts
├── noumen-hermes.ts
├── noumen-auditor.ts
└── noumen-service.ts
```

Run tests:

```bash
cd contracts/
anchor test                  # Starts local validator, deploys, runs all tests
anchor test --skip-build     # Skip build (use existing artifacts)
```

Each test file should verify:
- Successful instruction execution (happy path)
- Unauthorized signer rejection
- Invalid argument rejection
- PDA already-initialized rejection (for singleton init instructions)

---

## Known Open Issues

These are documented and tracked. Do not mark them as fixed unless the source code actually changes.

| Issue | Severity | Location | Description | Status |
|-------|----------|----------|-------------|--------|
| A-1 | Medium | `noumen-auditor/src/lib.rs` lines 91-94, 140-144 | `.unwrap()` on counter increments — **FIXED**: now uses `.checked_add(1).ok_or(AuditorError::ArithmeticOverflow)?` | Fixed (2026-02-26) |
| D-1 | Medium | `noumen-proof` and `noumen-auditor` init instructions | First-caller initialization gate (no super_authority requirement) | Architectural (mitigate via deployment procedure) |
| TK-1 | High | `axionblade-token-vault` | `create_vesting_schedule` has no authority gate — any signer can create schedules | Pre-deployment, must fix before mainnet |
| TK-2 | Medium | `axionblade-token-vault` | Vesting arithmetic uses `.unwrap()` instead of `ok_or(Error)?` | Pre-deployment, must fix before mainnet |
| TK-3 | Medium | `axionblade-token-vault` | Launch condition inputs are from KRONOS args, not on-chain oracles — Pyth integration required | Pre-deployment, must fix before mainnet |

Issues D-4 (circuit breaker de-escalation), D-5 (kill_proof not stored), and D-6 (init_if_needed on BudgetAllocation) were fixed in the current code. Do not reintroduce these patterns.

---

## Build Configuration Notes

The workspace `Cargo.toml` release profile uses:

```toml
[profile.release]
overflow-checks = true   # Panic on unchecked overflow in release builds
lto = "fat"              # Link-time optimization across all crates
codegen-units = 1        # Single codegen unit for maximum optimization
opt-level = "z"          # Optimize for size (critical for Solana program limits)
```

Build artifacts land in `target/deploy/`. Each program produces:
- `{crate_name}.so` — the deployable binary
- `{crate_name}-keypair.json` — the program keypair (Program ID = pubkey of this keypair)

The `anchor build --no-idl` flag skips IDL generation. This workspace does not use Anchor IDLs for program interaction; all client code constructs instructions manually via discriminators and Borsh serialization.
