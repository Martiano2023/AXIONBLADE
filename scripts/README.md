# AXIONBLADE Deployment Scripts

This directory contains the root-level mainnet deployment and operational scripts for AXIONBLADE. Contract-level initialization scripts (devnet, localnet, individual program init) live in [`../contracts/scripts/`](../contracts/scripts/).

---

## Prerequisites

```bash
node    >= 18.0.0
rust    >= 1.75.0
anchor  >= 0.30.1
solana  >= 1.18.0
ts-node >= 10.x      # npm install -g ts-node
```

Your Solana CLI must be configured with the deployment authority keypair:

```bash
solana config set --url mainnet-beta
solana config set --keypair ~/.config/solana/id.json

# Verify sufficient balance before deploying (minimum 20 SOL recommended)
solana balance
```

---

## Root-Level Scripts (`scripts/`)

These scripts orchestrate full mainnet deployments and operations.

### `deploy-mainnet.sh`

Deploys all 7 `noumen_*` Anchor programs to Solana mainnet-beta in dependency order (`noumen_core` first).

**Usage:**
```bash
# Dry run — validate configuration without deploying
./scripts/deploy-mainnet.sh --dry-run

# Full deployment
./scripts/deploy-mainnet.sh
```

**What it does:**
1. Verifies Solana CLI, Anchor CLI, and deployer keypair are present
2. Checks deployer balance (minimum 20 SOL; warns below 30 SOL)
3. Builds all programs via `anchor build`
4. Deploys programs in dependency order
5. Writes deployed program IDs to `scripts/mainnet-program-ids.json`
6. Calls `verify-mainnet.sh` automatically on completion

**Notes:**
- Requires `contracts/` to be fully built (`anchor build`) before running
- The deployment keypair must be the upgrade authority for all program IDs in `Anchor.toml`
- Program IDs are fixed (tied to keypairs in `contracts/keys/`) — do not generate new ones

---

### `verify-mainnet.sh`

Verifies all 7 programs and critical PDA accounts are live and correctly configured on mainnet-beta.

**Usage:**
```bash
./scripts/verify-mainnet.sh
```

**What it checks:**
- All 7 program accounts exist and are executable
- Program data sizes are within expected ranges
- Critical PDAs (AEON config, Treasury, Proof registry) are initialized
- Authority accounts match expected keypairs

**Exit code:** `0` = all checks passed, `1` = one or more checks failed.

Run this after every deployment and after any upgrade authority change.

---

### `init-mainnet.ts`

Initializes all on-chain state after a fresh program deployment. Runs once per deployment.

**Usage:**
```bash
ts-node scripts/init-mainnet.ts
```

**What it initializes:**
- AEON governance config PDA (`noumen_core`)
- Proof registry PDA (`noumen_proof`)
- Treasury config and initial reserve (`noumen_treasury`)
- Service registry with initial service catalog (`noumen_service`)
- Auditor state (`noumen_auditor`)

**Order matters.** `noumen_core` must be initialized before any other program that reads the authority hierarchy.

---

### `kronos-crank.ts`

KRONOS agent crank runner. Executes scheduled on-chain state transitions: pricing epoch rollovers, buyback burn triggers, revenue distribution snapshots.

**Usage:**
```bash
# Run once manually
ts-node scripts/kronos-crank.ts

# Run on a schedule (every 10 minutes via cron)
*/10 * * * * /usr/bin/ts-node /path/to/scripts/kronos-crank.ts >> /var/log/kronos-crank.log 2>&1
```

**Axiom constraints:**
- KRONOS only executes crank operations — it never reads APOLLO PDAs directly (A0-15)
- Every crank operation calls `log_decision()` before state mutation (A0-5)
- KRONOS operates within the budget defined at Layer 2 (Operational)

---

### `deploy-token-vault.sh`

Deploys the `axionblade-token-vault` program to mainnet-beta.

**Usage:**
```bash
./scripts/deploy-token-vault.sh
```

This is a separate deployment from the core 7 `noumen_*` programs. The token vault handles the protocol's own token — AXIONBLADE never operates custodial vaults for user funds (A0-12).

---

### `init-token-vault.ts`

Initializes the token vault program state after deployment.

**Usage:**
```bash
ts-node scripts/init-token-vault.ts
```

---

### `run-execute-policy.sh`

Wrapper script that runs `contracts/scripts/execute-policy-mainnet.ts` with the correct environment.

**Usage:**
```bash
./scripts/run-execute-policy.sh
```

Policy execution goes through the full firewall chain: Risk Engine output → AEON review → `log_decision()` → execution. This script does not bypass any step.

---

### `close-all-programs.sh`

Emergency script to close all program accounts and recover rent. **For use only in decommissioning scenarios.** This action is irreversible.

**Usage:**
```bash
# This will prompt for explicit confirmation before proceeding
./scripts/close-all-programs.sh
```

This script does **not** bypass the governance process. Any decommissioning of live programs requires a prior governance decision logged on-chain via `noumen_proof`.

---

## Contract-Level Scripts (`contracts/scripts/`)

These scripts handle devnet, localnet, and per-program initialization. They are lower-level than the root scripts above.

### Deployment

| Script | Description |
|--------|-------------|
| `deploy-devnet.sh` | Deploys all 7 programs to devnet |
| `deploy-mainnet-fase1.sh` | Phase 1 mainnet deployment: `noumen_core`, `noumen_proof`, `noumen_treasury` |
| `deploy-mainnet-fase2.sh` | Phase 2 mainnet deployment: `noumen_apollo`, `noumen_hermes`, `noumen_auditor`, `noumen_service` |

### Initialization

| Script | Network | Description |
|--------|---------|-------------|
| `init-localnet.ts` | Localnet | Full initialization for local validator |
| `init-devnet.ts` | Devnet | Full initialization for devnet |
| `init-mainnet-fase1.ts` | Mainnet | Initializes core programs (Phase 1) |
| `init-mainnet-fase2.ts` | Mainnet | Initializes evaluation/service programs (Phase 2) |
| `init-with-anchor.ts` | Localnet | Alternative init using Anchor workspace client |
| `init-aeon-mainnet.ts` | Mainnet | AEON governance config initialization |
| `init-proof-mainnet.ts` | Mainnet | Proof registry initialization |
| `init-treasury-mainnet.ts` | Mainnet | Treasury and CCS config initialization |

### Agent Management

| Script | Description |
|--------|-------------|
| `create-agents-mainnet.ts` | Creates AEON, APOLLO, HERMES, and KRONOS agents on mainnet |
| `update-agent-mainnet.ts` | Updates an existing agent's configuration |
| `verify-agents-mainnet.ts` | Verifies all 4 agents are correctly registered on-chain |

### Operations

| Script | Description |
|--------|-------------|
| `propose-policy-mainnet.ts` | Submits a Layer 1 or Layer 2 policy proposal |
| `execute-policy-mainnet.ts` | Executes an approved policy after its delay period |
| `record-heartbeat-mainnet.ts` | Records an on-chain heartbeat for agent health monitoring |

### Security and Testing

| Script | Description |
|--------|-------------|
| `simple-init.ts` | Minimal initialization for testing |
| `security-tests.ts` | Comprehensive security test battery (73KB) — runs against localnet or devnet |

---

## Deployment Order

For a fresh mainnet deployment:

```
1. anchor build                              # Build all programs
2. ./scripts/deploy-mainnet.sh --dry-run     # Validate configuration
3. ./scripts/deploy-mainnet.sh               # Deploy programs
4. ts-node scripts/init-mainnet.ts           # Initialize on-chain state
5. ts-node contracts/scripts/create-agents-mainnet.ts   # Create 4 agents
6. ./scripts/verify-mainnet.sh               # Verify deployment
7. ts-node contracts/scripts/verify-agents-mainnet.ts   # Verify agents
```

For devnet testing:

```
1. anchor build
2. ./contracts/scripts/deploy-devnet.sh
3. ts-node contracts/scripts/init-devnet.ts
4. ts-node contracts/scripts/create-agents-mainnet.ts  # (against devnet RPC)
```

---

## Keypair Management

Authority keypairs are stored in `contracts/keys/` (gitignored). Three authority levels:

| Keypair | Authority Level | Use |
|---------|----------------|-----|
| `super.json` | Super authority | Program upgrade authority, emergency override |
| `aeon.json` | AEON authority | Agent creation, governance, policy approval |
| `keeper.json` | Keeper authority | Operational: cranks, heartbeats, routine state updates |

**Security rules:**
- Super and AEON keypairs should be stored in hardware wallets in production
- Never put authority keypairs in environment variables or CI secrets
- Rotate keeper keypairs on a schedule; rotation requires an AEON-signed on-chain transaction
- `contracts/keys/` must remain gitignored — verify with `git check-ignore -v contracts/keys/`

---

## Troubleshooting

**"Insufficient funds for deployment"**
```bash
solana balance  # Check current balance
# Minimum 20 SOL for full deployment; top up if needed
```

**"Program ID mismatch"**
The program IDs in `Anchor.toml` are fixed. If you see a mismatch, your build keypairs do not match the expected program IDs. Do not generate new keypairs for existing programs — recover the original keypairs from `contracts/keys/`.

**"Deployment authority mismatch"**
The deploying keypair must be the upgrade authority for each program. Verify:
```bash
solana program show <program-id> --url mainnet-beta
```

**"anchor build fails"**
```bash
# Ensure correct Rust and Anchor versions
rustup update stable
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```
