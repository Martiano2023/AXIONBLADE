# AXIONBLADE Mainnet Deployment Guide

> Protocol version: v3.2.3
> Programs: 7 Anchor programs on Solana mainnet-beta
> Frontend: Next.js 16 on Vercel

---

## Prerequisites

- Solana CLI installed (`$HOME/.local/share/solana/install/active_release/bin/solana`)
- Anchor CLI installed (`$HOME/.cargo/bin/anchor`)
- Node.js 18+
- Wallet with >= 20 SOL (recommended 30 SOL)
- GitHub account
- Vercel account

Verify installations:

```bash
solana --version
anchor --version
node --version
solana address
solana balance
```

---

## Step 1: Build & Test

Build the Anchor programs and run the test suite:

```bash
cd noumen
anchor build
anchor test
```

Verify all 7 `.so` binaries exist:

```bash
ls -la target/deploy/*.so
```

Build the frontend:

```bash
cd ../app
npm install
npm run build
```

---

## Step 2: Deploy Programs to Mainnet

Run the deployment script from the project root:

```bash
./scripts/deploy-mainnet.sh
```

For a preview of what will happen without actually deploying:

```bash
./scripts/deploy-mainnet.sh --dry-run
```

The script will:
1. Verify Solana and Anchor CLIs are available
2. Set the cluster to mainnet-beta
3. Check wallet balance (minimum 20 SOL)
4. Ask for confirmation before proceeding
5. Deploy all 7 programs in dependency order:
   - `noumen_core` (first, as all others depend on it)
   - `noumen_proof`
   - `noumen_treasury`
   - `noumen_apollo`
   - `noumen_hermes`
   - `noumen_auditor`
   - `noumen_service`
6. Verify each deployment with `solana program show`
7. Save program IDs to `scripts/mainnet-program-ids.json`
8. Add `[programs.mainnet]` section to `Anchor.toml`

If any deployment fails, the script stops immediately and reports which programs were deployed.

---

## Step 3: Initialize Accounts

After all programs are deployed, initialize the on-chain config accounts:

```bash
npx ts-node scripts/init-mainnet.ts
```

This initializes:

| Program | Instruction | PDAs Created |
|---------|------------|--------------|
| noumen_core | `initialize_aeon` | `aeon_config` |
| noumen_treasury | `initialize_treasury` | `treasury_config`, `treasury_vault`, `donation_vault`, `ccs_config` |
| noumen_proof | `initialize_proof` | `proof_config` |
| noumen_apollo | `initialize_apollo` | `apollo_config` |
| noumen_hermes | `initialize_hermes` | `hermes_config` |
| noumen_auditor | `initialize_auditor` | `auditor_config` |
| noumen_service | `initialize_service_config` | `service_config` |

The script is idempotent -- if an account already exists, it skips initialization for that program.

---

## Step 4: Verify Deployment

Run the verification script:

```bash
./scripts/verify-mainnet.sh
```

Expected output:

```
=================================================================
AXIONBLADE MAINNET VERIFICATION REPORT
=================================================================
Program: noumen_core ..........................  DEPLOYED
Program: noumen_proof .........................  DEPLOYED
Program: noumen_treasury ......................  DEPLOYED
Program: noumen_apollo ........................  DEPLOYED
Program: noumen_hermes ........................  DEPLOYED
Program: noumen_auditor .......................  DEPLOYED
Program: noumen_service .......................  DEPLOYED
-----------------------------------------------------------------
Treasury PDA ..............................  INITIALIZED
Donation PDA ..............................  INITIALIZED
CCS Config ................................  INITIALIZED
-----------------------------------------------------------------
Authority: <your_wallet_pubkey>
Cluster: mainnet-beta
Timestamp: 2026-02-15 00:00:00 UTC
=================================================================
```

---

## Step 5: Update Frontend Config

Copy the program IDs from `scripts/mainnet-program-ids.json` and update `app/.env.production`:

```bash
# Replace <DEPLOY_REQUIRED> placeholders with actual program IDs
NEXT_PUBLIC_PROGRAM_CORE=9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE
NEXT_PUBLIC_PROGRAM_PROOF=3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV
NEXT_PUBLIC_PROGRAM_TREASURY=EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu
NEXT_PUBLIC_PROGRAM_APOLLO=92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee
NEXT_PUBLIC_PROGRAM_HERMES=Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj
NEXT_PUBLIC_PROGRAM_AUDITOR=CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe
NEXT_PUBLIC_PROGRAM_SERVICE=9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY
```

Also update the RPC URL if you are using a dedicated provider (recommended for production):

```
NEXT_PUBLIC_RPC_URL=https://your-rpc-provider.com
```

---

## Step 6: Deploy Frontend

Deploy to Vercel:

```bash
cd app
npx vercel --prod
```

Or connect the GitHub repository to Vercel for automatic deployments.

The `vercel.json` in the app directory configures:
- Next.js framework detection
- Security headers (X-Content-Type-Options, X-Frame-Options, XSS Protection, Referrer-Policy, Permissions-Policy)

---

## Step 7: Post-Deploy Verification

1. **Connect wallet** on the production site
2. **Run a test assessment** with a small amount
3. **Verify proof minting** -- check the decision log PDA was created on-chain
4. **Check treasury** received the payment with correct split (40/30/15/15)
5. **Monitor for 24h** -- watch for transaction failures, unexpected errors
6. **Register launch services:**
   - APOLLO Basic: 0.02 SOL
   - APOLLO Pro: 0.15 SOL
   - APOLLO Institutional: 2.0 SOL
   - HERMES Pro: 0.5 SOL/mo
   - HERMES Protocol: 10 SOL/mo

---

## Cost Estimate

| Item | Estimated Cost |
|------|---------------|
| Program deploy (per program) | ~2-3 SOL |
| 7 programs total | ~14-21 SOL |
| Config account initialization | ~0.5-1 SOL |
| Transaction buffer | ~2-3 SOL |
| **Total recommended** | **~20-25 SOL** |

---

## Rollback Plan

### Program Rollback
Programs can be upgraded via Anchor:

```bash
anchor upgrade --program-id <PROGRAM_ID> target/deploy/<program_name>.so --provider.cluster mainnet
```

### Frontend Rollback
The frontend can be rolled back instantly in the Vercel dashboard by selecting a previous deployment and promoting it to production.

### Config Account Recovery
Config accounts can be re-initialized by the super authority. If an account is in a bad state, the super authority can call the initialization instruction again (the programs check for `is_initialized` and will reject re-initialization -- in that case, use the upgrade authority to deploy a patched program that allows reset).

### Emergency Procedures

1. **Circuit Breaker**: Trigger via `trigger_circuit_breaker` instruction on `noumen_core`
   - Mode 1: Degraded (read-only assessments)
   - Mode 2: Emergency (all operations suspended)

2. **Freeze Programs**: In extreme cases, revoke the upgrade authority:
   ```bash
   solana program set-upgrade-authority <PROGRAM_ID> --final
   ```
   **WARNING**: This is irreversible. The program can never be upgraded again.

---

## Important Notes

- **Upgrade authority**: Keep the program upgrade authority for the first 90 days. Plan to transfer it to a multisig after stabilization.
- **Keypair security**: Never share your wallet keypair. Keep backups of all program keypairs in `target/deploy/`.
- **RPC provider**: The public Solana RPC (`api.mainnet-beta.solana.com`) has rate limits. For production, use a dedicated provider (Helius, QuickNode, Triton, etc.).
- **Axiom compliance**: All 29 active axioms (A0-1 through A0-30, excluding deprecated A0-2) are enforced on-chain. Any operation that violates an axiom will be rejected by the program.
- **Revenue model**: All revenue comes from real usage. Every service must cover its cost or be discontinued after 90 days of subsidy (A0-8).
- **Donations**: Donations go to the separate Donation PDA and are swept daily to Treasury. They bypass the CCS split entirely. Conditional donations are rejected (anti-masquerade rule).

---

## Program Architecture Reference

```
APOLLO -> assessment_pda -> Risk Engine (<=40%) -> AEON -> Executor
                                                      |
HERMES -> intelligence_report (terminal, external only)
                                                      |
noumen_proof -> decision_log -> execution_result
                                                      |
noumen_treasury -> treasury_vault, donation_vault, ccs_config
                                                      |
noumen_service -> service_entry (pricing, tiers)
                                                      |
noumen_auditor -> truth_label, security_incident, accuracy_snapshot
```

Firewall chain: Executors never read APOLLO's PDAs directly. HERMES outputs are terminal (external consumption only, never enters execution chain).
