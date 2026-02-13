# AXIONBLADE v3.4.0 — Deployment Guide

**Economic System Rebuild with C1-C4 Critical Corrections**

---

## Overview

This guide covers deploying the complete AXIONBLADE v3.4.0 economic system including:

- ✅ **C1**: Cost Oracle System (multisig-signed cost tracking)
- ✅ **C2**: Monthly Credits System (stake-based credits)
- ✅ **C3**: Deterministic Airdrop (on-chain usage only)
- ✅ **C4**: Burn Budget System (reserve-protected burns)
- ✅ **New Program**: `axionblade-token-vault` (conditional token launch)
- ✅ **KRONOS**: Autonomous economic agent (axioms 44-50)

---

## Prerequisites

### Software Requirements
```bash
# Solana CLI
solana --version  # Should be ≥1.17.0

# Anchor CLI
anchor --version  # Should be ≥0.30.1

# Node.js
node --version    # Should be ≥18.0.0
```

### Keypairs Required
```
contracts/keys/
├── super.json          # Super authority (program upgrades)
├── keeper.json         # KRONOS crank runner (permissionless)
├── token-vault-devnet.json   # Token vault program (devnet)
└── token-vault-mainnet.json  # Token vault program (mainnet)
```

Generate missing keypairs:
```bash
solana-keygen new --no-passphrase -o contracts/keys/super.json
solana-keygen new --no-passphrase -o contracts/keys/keeper.json
```

### Funding Requirements

**Devnet:**
```bash
# Super authority needs ~5 SOL for deployment
solana airdrop 5 $(solana address -k contracts/keys/super.json) --url devnet

# Keeper needs ~1 SOL for crank operations
solana airdrop 1 $(solana address -k contracts/keys/keeper.json) --url devnet
```

**Mainnet:**
- Super authority: ~10 SOL (program deployment + rent)
- Keeper: ~2 SOL (crank operations, topped up as needed)

---

## Deployment Steps

### Phase 1: Deploy Token Vault Program

#### Devnet
```bash
# Make deployment script executable
chmod +x scripts/deploy-token-vault.sh

# Deploy to devnet
./scripts/deploy-token-vault.sh devnet

# Note the Program ID from output
# Example: FyG8...xW2
```

#### Mainnet
```bash
# Deploy to mainnet (after devnet testing)
./scripts/deploy-token-vault.sh mainnet

# Update production configs with Program ID
```

**After deployment:**
1. Update `TOKEN_VAULT_PROGRAM_ID` in `scripts/kronos-crank.ts`
2. Update `TOKEN_VAULT_PROGRAM_ID` in `app/src/hooks/useTokenLaunch.ts`
3. Commit changes to Git

---

### Phase 2: Initialize Token Vault

```bash
# Make init script executable
chmod +x scripts/init-token-vault.ts

# Initialize on devnet
ts-node scripts/init-token-vault.ts --network devnet

# Creates:
# - TokenVaultConfig PDA (launch conditions tracker)
# - 5 VestingSchedule PDAs (Team, Treasury, Community, Liquidity, Reserve)
```

**Verify initialization:**
```bash
# Check TokenVaultConfig PDA
solana account <TokenVaultConfig_PDA> --url devnet
```

---

### Phase 3: Initialize Cost Oracle

The Cost Oracle must be initialized with multisig authority before KRONOS can adjust prices.

**TODO**: Create `scripts/init-cost-oracle.ts` with:
```typescript
// Initialize CostOracle PDA with 2-of-3 multisig
// Set initial cost_index_sol_per_1k_queries
// Set initial RPC/AI/storage costs
```

---

### Phase 4: Deploy KRONOS Crank

#### Manual Crank (Testing)
```bash
# Dry run (no transactions)
ts-node scripts/kronos-crank.ts --dry-run --network devnet

# Live run
ts-node scripts/kronos-crank.ts --network devnet
```

#### Automated Crank (Production)

**Option 1: Cron Job**
```bash
# Run every 12 hours
0 */12 * * * cd /path/to/AXIONBLADE && ts-node scripts/kronos-crank.ts --network mainnet >> logs/kronos.log 2>&1
```

**Option 2: Clockwork (Recommended)**
- Use Clockwork Network for automated on-chain scheduling
- More reliable than cron
- Decentralized execution

**TODO**: Integrate Clockwork scheduler

---

### Phase 5: Frontend Integration

#### Update Environment Variables
```bash
# app/.env.local
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_TOKEN_VAULT_PROGRAM_ID=<from_deployment>
NEXT_PUBLIC_TREASURY_PROGRAM_ID=EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu
```

#### Build and Deploy
```bash
cd app

# Install dependencies
npm install

# Build
npm run build

# Deploy to Vercel (or your hosting)
vercel deploy --prod
```

---

## Verification Checklist

### Smart Contracts
- [ ] `axionblade-token-vault` deployed to devnet
- [ ] TokenVaultConfig PDA initialized
- [ ] 5 VestingSchedule PDAs created
- [ ] CostOracle PDA initialized with multisig
- [ ] Initial PriceEpoch created

### KRONOS Crank
- [ ] Dry run passes without errors
- [ ] Live crank successfully adjusts prices
- [ ] Revenue distribution works (4-way split)
- [ ] Burn respects reserve ratio (≥25%)
- [ ] All actions emit proof before execution (A0-50)

### Frontend
- [ ] `/economics` page displays live pricing
- [ ] `/token` page shows launch conditions
- [ ] `/airdrop` page shows user points (if connected)
- [ ] `/agents` page shows KRONOS section
- [ ] Cost transparency label: "On-chain fees + Signed CostIndex" (C1)
- [ ] Airdrop label: "Off-chain heuristics are advisory only" (C3)

### Axiom Compliance
- [ ] A0-44: KRONOS runs permissionless cranks with proof ✓
- [ ] A0-45: Burn never reduces reserve below 25% ✓
- [ ] A0-46: Token launch requires proof + 72h delay ✓
- [ ] A0-47: Vesting release permissionless after cliff ✓
- [ ] A0-48: Pricing requires cost oracle signature ✓
- [ ] A0-49: Revenue distribution requires epoch proof ✓
- [ ] A0-50: Proof emitted BEFORE execution ✓

---

## Monitoring

### On-Chain Events
```bash
# Watch for KRONOS crank events
solana logs <TREASURY_PROGRAM_ID> --url devnet | grep "CostIndexUpdated\|PriceAdjusted\|BurnExecuted"
```

### Dashboard Metrics
- `/economics` — Check margin stability (should stay ≥150%)
- `/token` — Monitor launch conditions progress
- `/airdrop` — Verify points accumulation from ServicePayment events

### Alerts
Set up alerts for:
- Margin below 150% (trigger manual cost oracle update)
- Reserve ratio below 30% (pause burns)
- KRONOS crank failures (check logs)

---

## Mainnet Launch Checklist

Before deploying to mainnet:

1. **Security Audit**
   - [ ] Token vault program audited
   - [ ] Economic engine audited
   - [ ] KRONOS crank script reviewed

2. **Testing Complete**
   - [ ] All devnet tests passed (30+ days)
   - [ ] KRONOS crank ran successfully 60+ times
   - [ ] Token launch conditions tested end-to-end
   - [ ] Vesting release tested
   - [ ] Burn tested with reserve protection

3. **Economic Verification**
   - [ ] Cost oracle formula validated
   - [ ] Pricing margins verified (≥150%)
   - [ ] Revenue split tested (40/30/15/15)
   - [ ] Volume discounts tested (0-25%)

4. **Documentation**
   - [ ] All axioms documented (A0-44 to A0-50)
   - [ ] User guides published
   - [ ] API docs updated

5. **Governance**
   - [ ] Multisig set up for cost oracle (2-of-3)
   - [ ] Super authority secured (hardware wallet)
   - [ ] Emergency pause procedures documented

---

## Troubleshooting

### "Cost Oracle not initialized"
```bash
# Run cost oracle initialization script
ts-node scripts/init-cost-oracle.ts --network devnet
```

### "Insufficient margin" error
- Cost index may have increased
- Update cost oracle with new signed data
- KRONOS will auto-adjust prices on next crank

### "Reserve ratio violation" during burn
- Expected behavior (Axiom A0-45)
- Burn will be skipped until reserve recovers
- Check treasury balance growth

### KRONOS crank fails
```bash
# Check keeper balance
solana balance $(solana address -k contracts/keys/keeper.json) --url devnet

# If low, airdrop more SOL
solana airdrop 1 $(solana address -k contracts/keys/keeper.json) --url devnet
```

---

## Next Steps After Deployment

1. **Monitor Phase** (30 days)
   - Watch KRONOS crank operations
   - Verify pricing stability
   - Track revenue growth

2. **Token Launch Preparation**
   - Wait for conditions to be met:
     - Treasury ≥ $100k
     - 3 consecutive growth weeks
     - Market stability confirmed
     - No anomalies detected
   - KRONOS will automatically trigger approval
   - 72h delay for community verification
   - Execute launch permissionlessly

3. **Post-Launch**
   - Monitor token price stability
   - Track burn operations
   - Verify vesting releases
   - Analyze airdrop claim patterns

---

## Support

For deployment issues:
- GitHub Issues: https://github.com/anthropics/axionblade/issues
- Documentation: `/files/INDICE_MESTRE.md`
- Axioms Reference: `AXIONBLADE_ECONOMY_AXIOMS.md`

---

**Last Updated**: 2026-02-12
**Version**: v3.4.0
**Status**: Ready for devnet deployment
