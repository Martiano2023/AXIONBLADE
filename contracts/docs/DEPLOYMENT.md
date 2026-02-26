# AXIONBLADE Deployment Guide

**Version:** v3.4.0
**Last updated:** 2026-02-10
**Scope:** 7 Anchor programs (noumen_* workspace) + axionblade-token-vault (pre-deployment, excluded)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Key Management](#key-management)
4. [Localnet Deployment](#localnet-deployment)
5. [Devnet Deployment](#devnet-deployment)
6. [Mainnet Deployment (Phase 1)](#mainnet-deployment-phase-1)
7. [Mainnet Deployment (Phase 2)](#mainnet-deployment-phase-2)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Program Upgrade Procedure](#program-upgrade-procedure)
10. [Emergency Procedures](#emergency-procedures)
11. [Mainnet Safety Checklist](#mainnet-safety-checklist)

---

## Prerequisites

### Required Tool Versions

| Tool | Minimum Version | Recommended | Notes |
|------|----------------|-------------|-------|
| Rust | 1.75.0 | stable | `rustup update stable` |
| Solana CLI | 1.18.x | 1.18.26 | `sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"` |
| Anchor CLI | 0.30.1 | 0.30.1 | Must match workspace `anchor-lang` version |
| Node.js | 20.x | 20.x LTS | For init scripts and frontend |
| TypeScript | 5.x | 5.x | `npm i -g typescript ts-node` |

Verify your environment:

```bash
rustc --version          # rustc 1.75.0 or higher
solana --version         # solana-cli 1.18.x
anchor --version         # anchor-cli 0.30.1
node --version           # v20.x
ts-node --version        # v10.x
```

### Workspace npm Dependencies

```bash
cd contracts/
npm install
```

The `contracts/package.json` installs TypeScript tooling needed for initialization scripts.

---

## Environment Setup

### 1. Configure Solana CLI

```bash
# For localnet (default for development):
solana config set --url localhost

# For devnet:
solana config set --url https://api.devnet.solana.com

# For mainnet (use a private RPC for reliability):
solana config set --url https://api.mainnet-beta.solana.com
# or with custom RPC:
export RPC_URL="https://your-rpc-endpoint.com"
solana config set --url "$RPC_URL"
```

### 2. Configure Wallet

```bash
# Use existing keypair:
solana config set --keypair ~/.config/solana/id.json

# Or generate a new one (development only):
solana-keygen new --outfile ~/.config/solana/id.json

# Verify:
solana address
solana balance
```

### 3. Verify Anchor.toml

The workspace `Anchor.toml` declares the 7 program IDs for localnet and devnet. These IDs correspond to the keypairs in `target/deploy/*-keypair.json`. Do not change these IDs without also changing the `declare_id!` values in each program's `lib.rs`.

```toml
[programs.localnet]
noumen_core    = "9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"
noumen_proof   = "3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV"
noumen_treasury = "EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu"
noumen_apollo  = "92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee"
noumen_hermes  = "Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj"
noumen_auditor = "CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe"
noumen_service = "9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY"
```

---

## Key Management

AXIONBLADE uses three authority roles. Secure management of these keys is critical.

### Authority Keypairs

| Role | File | Capabilities | Security Level |
|------|------|-------------|----------------|
| `super_authority` | `contracts/keys/super_authority.json` | Initialize programs, rotate AEON, reset circuit breaker | Hardware wallet (mainnet) |
| `aeon_authority` | `contracts/keys/aeon_authority.json` | Create/manage agents, allocate budgets, manage services | Hardware wallet (mainnet) |
| `keeper_authority` | `contracts/keys/keeper_authority.json` | Record heartbeats, sweep donations, write proofs/metrics | Hot wallet (automated) |

**Critical Rules:**

- `super_authority` should be a hardware wallet (Ledger) on mainnet. Never load its private key into an automated script.
- `aeon_authority` controls agent lifecycle and treasury budget — treat as high-value hot wallet.
- `keeper_authority` is a hot wallet. Compromise is limited: it cannot withdraw SOL, only write operational data.
- Back up all keypairs before any deployment. Store backups in cold storage, never in the repository.
- The `contracts/keys/` directory is in `.gitignore`. Verify this before committing.

### Key Rotation

**Rotating `aeon_authority`** (A0-1 prerequisite):

```bash
# Generate new AEON keypair:
solana-keygen new --outfile /tmp/new_aeon.json

# Call update_system_actors via init-aeon-mainnet.ts (super_authority signs)
# This updates noumen-core, noumen-treasury, noumen-service, noumen-proof,
# noumen-apollo, noumen-hermes in a single coordinated update.
```

**Rotating `super_authority`** (two-step, A0-security requirement):

```bash
# Step 1: propose_super_rotation (current super signs, stores pending key)
# Step 2: accept_super_authority (new super signs to claim authority)
# The two-step process prevents accidental lockout.
```

### Upgrade Authority

Each deployed program's upgrade authority is the keypair at `~/.config/solana/id.json` by default. To lock a program (make it immutable):

```bash
solana program set-upgrade-authority <PROGRAM_ID> --final
```

Only lock programs on mainnet after thorough testing. Locked programs cannot be upgraded.

---

## Localnet Deployment

For development and testing against a local validator.

### Step 1: Start Local Validator

```bash
solana-test-validator --reset
```

Leave this running in a separate terminal.

### Step 2: Build

```bash
cd contracts/
anchor build --no-idl
```

The `--no-idl` flag skips IDL generation, which requires `idl-build` features. All programs in this workspace use raw Anchor without IDL exports.

### Step 3: Deploy and Initialize

```bash
cd contracts/
# Deploy all 7 programs and initialize their singleton PDAs:
anchor test --skip-local-validator
# Or manually:
anchor deploy
npx ts-node scripts/init-localnet.ts
```

### Step 4: Verify

```bash
solana program show 9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE  # noumen_core
# Expected: Program Id, Owner, Executable: true, ...
```

---

## Devnet Deployment

### Step 1: Fund Wallet

```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 10    # Up to rate limits; use https://faucet.solana.com if needed
solana balance       # Confirm >= 10 SOL
```

Estimated deployment costs (devnet):

| Program | SOL |
|---------|-----|
| noumen_core | ~1.64 |
| noumen_proof | ~1.44 |
| noumen_treasury | ~1.82 |
| noumen_apollo | ~1.35 |
| noumen_hermes | ~1.24 |
| noumen_auditor | ~1.41 |
| noumen_service | ~1.26 |
| **Total (all 7)** | **~10.16** |

### Step 2: Build

```bash
cd contracts/
anchor build --no-idl
```

### Step 3: Run Deployment Script

```bash
cd contracts/
./scripts/deploy-devnet.sh
```

The script:
1. Configures Solana CLI to devnet
2. Builds all programs
3. Verifies `.so` and keypair files
4. Deploys (or upgrades) each of the 7 programs
5. Calls `init-devnet.ts` to initialize all singleton PDAs
6. Updates `../app/.env.local`

### Step 4: Manual Initialization (if init-devnet.ts fails)

```bash
RPC_URL=https://api.devnet.solana.com npx ts-node scripts/init-devnet.ts
```

The initialization order matters:

1. `noumen_core` — `initialize_aeon` (creates AeonConfig with super, aeon, keeper keys)
2. `noumen_proof` — `initialize_proof` (creates ProofConfig, gated by keeper)
3. `noumen_treasury` — `initialize_treasury` + `initialize_donations` (creates vaults)
4. `noumen_apollo` — `initialize_apollo` (creates ApolloConfig with aeon authority)
5. `noumen_hermes` — `initialize_hermes` (creates HermesConfig with aeon authority)
6. `noumen_auditor` — `initialize_auditor` (first caller wins — run atomically)
7. `noumen_service` — `initialize_service_config` (gated by super)

**Critical:** `noumen_proof` and `noumen_auditor` have initialization gates based on first caller. Initialize these immediately after deployment in the same script invocation.

---

## Mainnet Deployment (Phase 1)

Phase 1 deploys the core MVP: `noumen_core`, `noumen_proof`, `noumen_apollo`.

Estimated cost: ~4.43 SOL. Recommended wallet balance: >= 5 SOL.

### Pre-flight Checklist

- [ ] `super_authority` keypair is available (hardware wallet preferred)
- [ ] `aeon_authority` keypair is available
- [ ] `keeper_authority` keypair is available
- [ ] All three keypairs backed up in cold storage
- [ ] Wallet balance >= 5 SOL
- [ ] Source has been audited / reviewed
- [ ] `anchor build --no-idl` succeeds cleanly
- [ ] Localnet tests pass
- [ ] RPC endpoint is private and reliable (not public mainnet for deployment)

### Step 1: Build

```bash
cd contracts/
anchor build --no-idl
ls -la target/deploy/noumen_core.so
```

### Step 2: Run Phase 1 Deployment Script

```bash
cd contracts/
RPC_URL="https://your-mainnet-rpc.com" ./scripts/deploy-mainnet-fase1.sh
```

The script confirms interactively before each program deploy. Output includes the deployed Program IDs.

### Step 3: Update Program IDs in Init Script

Before running initialization, update the `PROGRAM_IDS` map in `scripts/init-mainnet-fase1.ts` with the actual deployed IDs (if they differ from the keypair-derived IDs):

```typescript
const PROGRAM_IDS = {
  core: new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"),
  proof: new PublicKey("3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV"),
  apollo: new PublicKey("92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee"),
};
```

### Step 4: Initialize Phase 1 PDAs

```bash
RPC_URL="https://your-mainnet-rpc.com" npx ts-node scripts/init-mainnet-fase1.ts
```

This initializes:
- `AeonConfig` PDA at `[b"core"]` in noumen_core
- `ProofConfig` PDA at `[b"proof_config"]` in noumen_proof
- `ApolloConfig` PDA at `[b"apollo_config"]` in noumen_apollo

### Step 5: Verify Phase 1

```bash
# Confirm PDAs exist:
solana account <CORE_PDA_ADDRESS> --url https://your-mainnet-rpc.com
solana account <PROOF_CONFIG_PDA> --url https://your-mainnet-rpc.com
solana account <APOLLO_CONFIG_PDA> --url https://your-mainnet-rpc.com
```

---

## Mainnet Deployment (Phase 2)

Phase 2 deploys the economic layer: `noumen_treasury`, `noumen_service`, `noumen_auditor`, `noumen_hermes`.

Estimated cost: ~5.73 SOL. Recommended wallet balance: >= 6 SOL.

**Prerequisite:** Phase 1 must be fully deployed and initialized.

### Pre-flight Checklist

- [ ] Phase 1 verification passed
- [ ] Creator wallet address confirmed (`CREATOR_WALLET` in init-mainnet-fase2.ts)
- [ ] Wallet balance >= 6 SOL
- [ ] Phase 2 program IDs confirmed from deployment keypairs

### Step 1: Run Phase 2 Deployment Script

```bash
cd contracts/
RPC_URL="https://your-mainnet-rpc.com" ./scripts/deploy-mainnet-fase2.sh
```

### Step 2: Update Program IDs in Init Script

Update `scripts/init-mainnet-fase2.ts` with all program IDs (Phase 1 + Phase 2):

```typescript
const PROGRAM_IDS = {
  core:     new PublicKey("9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"),
  treasury: new PublicKey("EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu"),
  service:  new PublicKey("9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY"),
  auditor:  new PublicKey("CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe"),
  hermes:   new PublicKey("Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj"),
};
```

Also verify `CREATOR_WALLET` is set to the correct address:

```typescript
const CREATOR_WALLET = new PublicKey("HgThD22yumQsiv7ymLNNWnfzEsfrhKd5sG1X3ffYxNbk");
```

### Step 3: Initialize Phase 2 PDAs

```bash
RPC_URL="https://your-mainnet-rpc.com" npx ts-node scripts/init-mainnet-fase2.ts
```

Initialization order is enforced by the script:

1. `TreasuryConfig` + `TreasuryVault` + `DonationVault` + `CCSConfig` at `[b"treasury_config"]` etc.
2. `ServiceConfig` at `[b"service_config"]`
3. `AuditorConfig` at `[b"auditor_config"]` — run atomically (first-caller gate)
4. `HermesConfig` at `[b"hermes_config"]`

### Step 4: Create Initial Agents

After Phase 2, AEON can create the first agents (APOLLO, HERMES operational instances):

```bash
RPC_URL="https://your-mainnet-rpc.com" npx ts-node scripts/create-agents-mainnet.ts
```

This calls `create_agent` in noumen_core for each agent with the correct domain, capabilities, and `execution_permission = Never` for evaluator-class agents (A0-4).

### Step 5: Register Services

After agents exist, register the 5 HERMES services:

```bash
RPC_URL="https://your-mainnet-rpc.com" npx ts-node scripts/init-aeon-mainnet.ts
```

---

## Post-Deployment Verification

Run after any deployment (devnet or mainnet) to confirm all PDAs are correctly initialized.

### Verify Program Deployments

```bash
PROGRAMS=(
  "9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"
  "3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV"
  "EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu"
  "92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee"
  "Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj"
  "CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe"
  "9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY"
)

for ID in "${PROGRAMS[@]}"; do
  echo "Verifying $ID..."
  solana program show "$ID"
done
```

Expected output for each program includes: `Executable: true`, correct `Owner`, and non-zero `Data Length`.

### Verify Singleton PDAs

| PDA | Seeds | Program |
|-----|-------|---------|
| AeonConfig | `[b"core"]` | noumen_core |
| ProofConfig | `[b"proof_config"]` | noumen_proof |
| TreasuryConfig | `[b"treasury_config"]` | noumen_treasury |
| TreasuryVault | `[b"treasury_vault"]` | noumen_treasury |
| DonationVault | `[b"donation_vault"]` | noumen_treasury |
| CCSConfig | `[b"ccs_config"]` | noumen_treasury |
| ApolloConfig | `[b"apollo_config"]` | noumen_apollo |
| HermesConfig | `[b"hermes_config"]` | noumen_hermes |
| AuditorConfig | `[b"auditor_config"]` | noumen_auditor |
| ServiceConfig | `[b"service_config"]` | noumen_service |

Use `solana account <PDA_ADDRESS>` to confirm each exists and has non-zero data. An 8-byte discriminator followed by initialized fields is expected.

### Verify Authority Chain

1. Read `AeonConfig` — confirm `super_authority`, `aeon_authority`, `keeper_authority` are the correct keys.
2. Read `TreasuryConfig` — confirm `aeon_authority` and `keeper_authority` match AeonConfig values.
3. Read `ServiceConfig` — confirm `aeon_authority` and `keeper_authority` match.
4. Confirm `AeonConfig.is_initialized == true`.
5. Confirm `AeonConfig.circuit_breaker_state == 0` (Normal).
6. Confirm `TreasuryConfig.is_initialized == true`.

### Run Security Tests

```bash
cd contracts/
npx ts-node scripts/security-tests.ts
```

This script attempts invalid operations to confirm access controls are enforced.

### Verify Agents (post-creation)

```bash
RPC_URL="https://your-mainnet-rpc.com" npx ts-node scripts/verify-agents-mainnet.ts
```

---

## Program Upgrade Procedure

Upgrades replace the `.so` binary at an existing Program ID. The upgrade authority must sign.

### Step 1: Build New Version

```bash
cd contracts/
anchor build --no-idl
```

### Step 2: Check Buffer Space

If the new binary is larger than the current buffer (allocated at `--max-len` during original deploy), you may need to extend it:

```bash
PROGRAM_ID="9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE"
NEW_SO="target/deploy/noumen_core.so"
NEW_SIZE=$(wc -c < "$NEW_SO")
MAX_LEN=$(echo "$NEW_SIZE * 1.5 / 1" | bc)

solana program extend "$PROGRAM_ID" "$((MAX_LEN - CURRENT_LEN))" --url "$RPC_URL"
```

### Step 3: Deploy Upgrade

```bash
solana program deploy target/deploy/noumen_core.so \
  --program-id target/deploy/noumen_core-keypair.json \
  --url "$RPC_URL" \
  --max-len "$MAX_LEN" \
  --with-compute-unit-price 2000
```

### Step 4: Verify Upgrade

```bash
solana program show 9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE
```

The `Last Deployed In Slot` should reflect the new deployment slot.

### Account Compatibility

Upgrades that change account layouts (add fields, remove fields) are not backward compatible. All singleton PDAs (`AeonConfig`, `ProofConfig`, etc.) must be closed and re-initialized if their on-chain layout changes.

**Safe upgrade types:** Logic-only changes with no account struct modifications.

**Requires re-initialization:** Any change to a `#[account]` struct's field list or order.

**Cannot be undone:** Once a program is set `--final` (immutable), no upgrades are possible.

---

## Emergency Procedures

### Trigger Circuit Breaker

If an anomaly is detected, AEON or keeper can escalate the circuit breaker:

```bash
# Escalate one level (Normal -> Cautious -> Restricted -> Halted):
# Call trigger_circuit_breaker via aeon or keeper authority
npx ts-node scripts/execute-policy-mainnet.ts trigger-circuit-breaker
```

Circuit breaker state is monotonic: it can only escalate. To de-escalate, only `super_authority` can call `reset_circuit_breaker`. This is by design (A0 security requirement).

### Emergency Halt

1. Trigger circuit breaker to `Halted` state (state 3).
2. Off-chain agents stop processing when `circuit_breaker_state >= Restricted`.
3. Keeper stops automated operations.
4. Contact `super_authority` key holder to reset after root cause is identified.

### Pause HERMES

AEON can pause HERMES independently without affecting other programs:

```bash
# Call aeon_pause_hermes in noumen_core
# Sets hermes_enabled = false in AeonConfig
```

When `hermes_enabled == false`, `noumen-hermes` rejects `publish_report`, `publish_pool_comparison`, `log_agent_action_proof`, and `confirm_agent_action_executed`.

### Rollback Procedure

There is no on-chain rollback of state (Solana programs are append-only in their data). If a buggy upgrade introduces bad state:

1. Deploy the previous `.so` binary (downgrade).
2. Assess which PDAs were mutated by the buggy version.
3. If singleton PDAs have corrupted state, close and re-initialize (requires super authority and will reset all state in that program).

---

## Mainnet Safety Checklist

Complete this checklist before every mainnet deployment or upgrade.

### Pre-Deployment

- [ ] All code changes reviewed by at least one additional engineer
- [ ] Security review completed (see `SECURITY_REVIEW.md`)
- [ ] All known open issues assessed (see `SECURITY.md` Known Vulnerabilities section)
- [ ] `anchor build --no-idl` produces clean output (no warnings)
- [ ] Localnet tests pass: `anchor test`
- [ ] Devnet deploy tested and verified
- [ ] Binary sizes noted (use `wc -c target/deploy/*.so`)
- [ ] `--max-len` calculated at 1.5x binary size for upgrade headroom
- [ ] Wallet balance confirmed sufficient for deployment + initialization
- [ ] Keypair backups verified accessible from cold storage

### Initialization Sequence

- [ ] `noumen_core` initialized first (provides authority configuration for all other programs)
- [ ] `noumen_proof` initialized immediately after deployment (first-caller gate)
- [ ] `noumen_auditor` initialized immediately after deployment (first-caller gate)
- [ ] `noumen_treasury` initialized with correct creator wallet address
- [ ] Authority addresses in init scripts match intended keys (not default `~/.config/solana/id.json`)
- [ ] `CCSConfig` bands verified (total cap = 15%, floor = 4%, stipend cap = 5%)

### Post-Deployment

- [ ] All 7 programs show `Executable: true` in `solana program show`
- [ ] All singleton PDAs exist and have correct sizes
- [ ] `AeonConfig.is_initialized == true`
- [ ] `AeonConfig.circuit_breaker_state == 0` (Normal)
- [ ] `AeonConfig.super_authority` matches intended super key
- [ ] `AeonConfig.aeon_authority` matches intended aeon key
- [ ] `AeonConfig.keeper_authority` matches intended keeper key
- [ ] `TreasuryConfig.creator_wallet` matches intended creator address
- [ ] `ApolloConfig.max_weight_bps == 4000` (40% cap, A0-23 compliant)
- [ ] Security tests pass
- [ ] Heartbeat recorded (first keeper operation)
- [ ] Frontend `.env` updated with mainnet RPC and program IDs
- [ ] Frontend builds and connects to mainnet programs

### axionblade-token-vault (KRONOS — Deferred)

This program is NOT in the Anchor.toml workspace and has a placeholder Program ID. It MUST NOT be deployed until:

- [ ] KRONOS launch conditions defined (A0-46)
- [ ] Pyth oracle integration implemented for treasury USD value
- [ ] `create_vesting_schedule` authority gate added
- [ ] Vesting `.unwrap()` replaced with `ok_or(Error)?`
- [ ] Program ID placeholder replaced with actual keypair-derived address
- [ ] Program added to `Anchor.toml` workspace
- [ ] Full audit completed for token vault logic
