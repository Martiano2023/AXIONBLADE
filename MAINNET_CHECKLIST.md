# AXIONBLADE Mainnet Deployment Checklist

> Protocol version: v3.2.3
> Target date: 2026-02-15

---

## PRE-DEPLOY

### Build & Test
- [ ] `anchor build` completes without errors
- [ ] `anchor test` — all tests pass on localnet
- [ ] All 7 program `.so` binaries exist in `contracts/target/deploy/`
- [ ] All 7 IDL files generated and saved in `contracts/target/idl/`
- [ ] Frontend `npm run build` completes without errors
- [ ] Frontend tested locally against devnet

### Configuration
- [ ] Anchor.toml has `[programs.mainnet]` section with all 7 program IDs
- [ ] `app/.env.production` created with placeholder program IDs
- [ ] Wallet keypair backed up securely
- [ ] Wallet funded with >= 20 SOL (recommended 30 SOL)
- [ ] Solana CLI configured for mainnet-beta
- [ ] Anchor CLI version verified and compatible

### Code Review
- [ ] All 29 active axioms verified against on-chain logic
- [ ] Revenue split hardcoded: 40% Ops / 30% Treasury / 15% Dev / 15% Creator
- [ ] CCS bands: cap 15%, floor 4%, stipend cap 5%
- [ ] Reserve ratio >= 25% enforced in treasury program
- [ ] Daily treasury spend <= 3% of free balance enforced
- [ ] Evidence families >= 2 for execution-class decisions enforced
- [ ] APOLLO weight capped at 40% (4000 bps)
- [ ] HERMES outputs are terminal (never enter execution chain)
- [ ] Auto-learning in production is prohibited
- [ ] `log_decision` mandatory before any execution

### Security
- [ ] No private keys in source code or environment files
- [ ] Program upgrade authority is the deployer wallet
- [ ] No `unsafe` blocks in Rust code (unless audited and justified)
- [ ] All PDA seeds match between programs and frontend
- [ ] Authority checks present on every privileged instruction

---

## DEPLOY

### Programs (in order)
- [ ] Deploy `noumen_core` (AEON — dependency for all others)
- [ ] Verify `noumen_core` with `solana program show`
- [ ] Deploy `noumen_proof`
- [ ] Verify `noumen_proof` with `solana program show`
- [ ] Deploy `noumen_treasury`
- [ ] Verify `noumen_treasury` with `solana program show`
- [ ] Deploy `noumen_apollo`
- [ ] Verify `noumen_apollo` with `solana program show`
- [ ] Deploy `noumen_hermes`
- [ ] Verify `noumen_hermes` with `solana program show`
- [ ] Deploy `noumen_auditor`
- [ ] Verify `noumen_auditor` with `solana program show`
- [ ] Deploy `noumen_service`
- [ ] Verify `noumen_service` with `solana program show`
- [ ] All 7 program IDs saved to `scripts/mainnet-program-ids.json`

### Account Initialization
- [ ] `initialize_aeon` called — `aeon_config` PDA created
- [ ] `initialize_treasury` called — `treasury_config`, `treasury_vault`, `donation_vault`, `ccs_config` PDAs created
- [ ] `initialize_proof` called — `proof_config` PDA created
- [ ] `initialize_apollo` called — `apollo_config` PDA created
- [ ] `initialize_hermes` called — `hermes_config` PDA created
- [ ] `initialize_auditor` called — `auditor_config` PDA created
- [ ] `initialize_service_config` called — `service_config` PDA created

### Verification
- [ ] `./scripts/verify-mainnet.sh` passes all checks
- [ ] All 7 programs show as deployed
- [ ] Treasury PDA confirmed on-chain
- [ ] Donation PDA confirmed on-chain
- [ ] CCS Config confirmed on-chain

---

## POST-DEPLOY

### Frontend
- [ ] `app/.env.production` updated with actual program IDs from deploy
- [ ] Frontend `.env.production` configured with:
  - [ ] `NEXT_PUBLIC_CLUSTER=mainnet-beta`
  - [ ] `NEXT_PUBLIC_RPC_URL` set (production RPC, not public endpoint)
  - [ ] All 7 `NEXT_PUBLIC_PROGRAM_*` values set
  - [ ] `NEXT_PUBLIC_PROTOCOL_VERSION=3.2.3`
- [ ] Vercel project created
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] `npx vercel --prod` deployment succeeds
- [ ] Frontend loads correctly on production URL
- [ ] Wallet connection works on production

### Monitoring & Observability
- [ ] Error monitoring (Sentry) configured
- [ ] Analytics (Plausible/PostHog) configured
- [ ] Program logs accessible via Solana Explorer
- [ ] Treasury balance monitoring set up
- [ ] Alerting for failed transactions configured

### Functional Verification
- [ ] Connect wallet on production site
- [ ] Run a test assessment (small amount)
- [ ] Verify proof was minted on-chain
- [ ] Verify treasury received payment (check split: 40/30/15/15)
- [ ] Verify CCS creator accumulated balance updated
- [ ] Test donation flow (verify anti-masquerade rejection for conditional donations)
- [ ] Verify HERMES report publication
- [ ] Monitor system for 24h without incidents

### Service Registration
- [ ] Register APOLLO Basic service (0.02 SOL)
- [ ] Register APOLLO Pro service (0.15 SOL)
- [ ] Register APOLLO Institutional service (2.0 SOL)
- [ ] Register HERMES Pro subscription (0.5 SOL/mo)
- [ ] Register HERMES Protocol subscription (10 SOL/mo)
- [ ] Verify all service prices meet cost + 20% margin floor (A0-8)

---

## SECURITY

### Immediate (Day 0)
- [ ] Program upgrade authority retained by deployer
- [ ] All keypairs backed up in secure offline storage
- [ ] Rate limiting enabled on RPC endpoints
- [ ] CORS configured correctly on frontend

### Short-term (Week 1)
- [ ] Circuit breaker tested (trigger and recovery)
- [ ] Heartbeat monitoring active
- [ ] Agent creation tested and verified
- [ ] Policy change proposal flow tested (delay + cooldown)

### Medium-term (Days 30-90)
- [ ] Plan transfer of upgrade authority to multisig
- [ ] Security audit scheduled or completed
- [ ] Bug bounty program launched
- [ ] Operational runbook documented

### Authority Transfer (Day 90+)
- [ ] Upgrade authority transferred to multisig
- [ ] AEON authority updated from deployer wallet to dedicated key
- [ ] Keeper authority separated from deployer
- [ ] Creator wallet verified and finalized

---

## ROLLBACK PLAN

1. Programs can be upgraded via `anchor upgrade --program-id <ID> --provider.cluster mainnet`
2. Frontend can be rolled back instantly via Vercel dashboard
3. Config accounts can be re-initialized by the super authority
4. In emergency: trigger circuit breaker via `trigger_circuit_breaker` instruction
5. Nuclear option: freeze programs by revoking upgrade authority (irreversible)
