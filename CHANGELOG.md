# Changelog

All notable changes to AXIONBLADE are documented in this file.

This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions. Version numbering follows [Semantic Versioning](https://semver.org/). Each version entry records only verified, shipped changes — not aspirational roadmap items.

Architecture deltas are referenced by their document in `files/` (e.g., `files/04_ARQUITETURA_v3.0.md`).

---

## [Unreleased]

### Planned
- HERMES Level 1 activation (conditional on APOLLO L2 >= 30 days + >= 3 services ROI >= 1.0x)
- Pool Comparison and Protocol Health Snapshot full activation
- Layer 1 governance tooling for Constitutional-level parameter changes

---

## [3.4.0] — 2026-02-24

Complete frontend overhaul and KRONOS economic axiom finalization.

### Added
- Complete site overhaul with 10 parallel agent build system
- KRONOS agent UI with amber brand color (`#F59E0B`) integrated into all navigation and status displays
- `TopBar` live ticker: Treasury balance, on-chain proof count, uptime, agent count (N/100), active services, axiom compliance (50/50)
- `NavigationSidebar` with 4 sections: Agents, Analytics, Tools, System — 26 dashboard routes
- `AgentIllustrations` SVG component with correct brand colors per agent
- `ParticlesBackground` canvas animation for landing page
- `GlassCard` glassmorphism atom with gradient, glow, and hover variants
- 26 dashboard pages under `app/src/app/(app)/` route group
- 13 API route endpoints under `app/src/app/api/`
- 18 custom React hooks covering payments, balances, pool data, agent activity, pricing
- Zustand v5 stores: `useProtocolStore`, `useSettingsStore`, `useTierStore`
- TanStack Query v5 integration for server state management
- Recharts v3 for analytics visualizations
- HMAC-SHA256 per-request API authentication
- Security headers in `next.config.ts`: CSP, HSTS (1-year preload), X-Frame-Options DENY, Permissions-Policy
- `unsafe-eval` removed from CSP in production builds
- KRONOS axioms A0-44 through A0-50 formally canonicalized (7 axioms)
- Total axiom count: 50 (49 active + A0-2 deprecated)

### Changed
- Landing page `page.tsx` rewritten — removed 54KB legacy file (`page.tsx.old` preserved)
- `README.md` rewritten with complete architecture, agent roster, program table, axiom system, and economic model
- UI color consistency audit — all agent brand colors verified across all components

### Fixed
- Remaining auditor findings resolved: axiom references, program IDs, agent role descriptions corrected throughout frontend
- CSP `unsafe-eval` correctly scoped to development only

---

## [3.3.0] — 2026-02-13

KRONOS agent introduction, token vault deployment, mainnet launch.

### Added
- **KRONOS agent** — Economic Operator responsible for pricing epochs, buyback burns, revenue distribution, and on-chain crank operations
- `axionblade-token-vault` program for token custody (AXIONBLADE never operates custodial vaults — A0-12; this program handles the protocol's own token only)
- `scripts/kronos-crank.ts` — KRONOS crank runner for scheduled on-chain state transitions
- `scripts/deploy-token-vault.sh` and `scripts/init-token-vault.ts`
- `contracts/scripts/create-agents-mainnet.ts` — creates AEON, APOLLO, HERMES, KRONOS on mainnet
- `contracts/scripts/execute-policy-mainnet.ts` — policy execution via AEON delegation
- `contracts/scripts/propose-policy-mainnet.ts` — Constitutional-layer policy proposals
- `contracts/scripts/init-aeon-mainnet.ts`, `init-proof-mainnet.ts`, `init-treasury-mainnet.ts`
- `contracts/scripts/record-heartbeat-mainnet.ts` — on-chain heartbeat recording
- `contracts/scripts/verify-agents-mainnet.ts` — post-deployment agent state verification
- `DEPLOYMENT_GUIDE.md` with step-by-step mainnet procedures
- `DEPLOYMENT_COMPLETE.md` — deployment verification report
- `EXECUTION_REPORT.md` — mainnet execution audit

### Changed
- Agent roster expanded from 3 (AEON, APOLLO, HERMES) to 4 (+ KRONOS)
- Memory updated to reflect 4-agent architecture and 50-axiom system
- `vercel.json` updated for production deployment configuration

### Security
- `SECURITY_TEST_REPORT.md` — results of pre-mainnet security test suite
- `FINAL_PRE_MAINNET_REPORT.md` — consolidated pre-mainnet checklist completion
- `scripts/verify-mainnet.sh` — automated post-deployment verification

---

## [3.2.3] — 2026-02-12

HERMES agent introduction. Architecture document `files/12_ARQUITETURA_v3.2.3_HERMES.md`.

### Added
- **HERMES agent** — DeFi Intelligence, second evaluator child of AEON
- HERMES manifest: `execution_permission: NEVER`, `FEED_RISK_ENGINE_DIRECTLY` explicitly prohibited
- 5 canonical HERMES services with I/O schema:
  1. Effective APR Report (H1) — migrated from APOLLO scope
  2. Risk Decomposition Vector (H2) — 7 risk dimensions with per-dimension confidence
  3. Yield Trap Intelligence (H3) — requires prior APOLLO signal; explanatory only
  4. Pool Comparison (H4) — 2–5 pools within the same `pair_class`
  5. Protocol Health Snapshot (H5) — full protocol evaluation (Orca, Raydium, Meteora)
- Axiom **A0-29**: HERMES never feeds the Risk Engine directly. Terminal output only.
- Axiom **A0-30**: HERMES does not emit operational risk signals. That scope belongs exclusively to APOLLO.
- Budget constraint: `total_evaluator_budget (APOLLO + HERMES) <= 25% free_balance`
- Divergence monitoring: Auditor investigates if APOLLO/HERMES scores diverge >20 points for >7 days across >5 pools
- Tiered activation conditions for HERMES Level 0, 1, 2 and service-specific prerequisites
- `noumen_hermes` program deployed: `Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj`
- `SECURITY_AUDIT_REPORT.md` and `INTEGRATION_TEST_REPORT.md` added

### Changed
- APOLLO scope narrowed — Effective APR reporting moved to HERMES H1
- Architecture delta count: D25–D30 applied on top of v3.2.2.3
- Total axioms: 30 enumerated (29 active + A0-2 deprecated) — basis for future expansion

### Fixed
- `DEPLOYMENT_STATUS.md` corrected post-deployment program state records

---

## [3.2.2] — 2026-02-11

Incremental refinements v3.2.2.1 through v3.2.2.3. Architecture documents `files/08` through `files/11`.

### Added
- Shared-types crate (`contracts/crates/shared-types/`) for cross-program type definitions
- Anti-replay protection in all contract instructions
- `SECURITY_REVIEW.md` in `contracts/` — static analysis of all 7 programs (signer constraints, PDA derivation, overflow checks, CPI guards)
- `MAINNET_CHECKLIST.md` pre-deployment verification checklist
- `INTEGRATION_TEST_REPORT.md` — cross-program integration test results
- Anchor integration test suite: `contracts/tests/axionblade.ts` and `contracts/tests/security-tests.ts`
- `contracts/scripts/security-tests.ts` — 73KB dedicated security test battery

### Changed
- `Cargo.toml` workspace: `overflow-checks = true`, LTO `fat`, `opt-level = "z"` for release builds
- All programs: checked arithmetic throughout (no unchecked integer operations)

---

## [3.2.0] — 2026-02-10

Multi-agent architecture. Anchor workspace. 7 on-chain programs. Architecture document `files/06_ARQUITETURA_v3.2.md`.

### Added
- Full Anchor workspace at `contracts/`
- 7 deployed Anchor programs:
  - `noumen_core` — Agent governance, authority hierarchy
  - `noumen_proof` — Cryptographic decision logs, `log_decision()` instruction
  - `noumen_treasury` — Revenue routing, CCS split enforcement
  - `noumen_apollo` — DeFi risk assessment: Pool Taxonomy, MLI, Effective APR
  - `noumen_hermes` — Intelligence services (defined; HERMES agent added in v3.2.3)
  - `noumen_auditor` — Security incident registry, Truth Labels (HTL/EOL)
  - `noumen_service` — Service registry, pricing enforcement, usage metering
- `Anchor.toml` with program IDs configured for localnet, devnet, and mainnet
- `contracts/scripts/deploy-devnet.sh`, `deploy-mainnet-fase1.sh`, `deploy-mainnet-fase2.sh`
- `contracts/scripts/init-devnet.ts`, `init-mainnet-fase1.ts`, `init-mainnet-fase2.ts`
- `contracts/scripts/init-localnet.ts` and `init-with-anchor.ts`
- Policy layer model: Layer 0 (Axioms), Layer 1 (Constitutional), Layer 2 (Operational), Layer 3 (Tactical)
- Evidence family model: 5 families (Price/Volume, Liquidity, Behavior, Incentive, Protocol)
- Meta-circuit-breaker with 7 triggers and 3 modes (NORMAL / DEGRADED / HALTED)
- `AXIONBLADE_BUILD_PLAN.md` — comprehensive 215KB build plan document
- `AXIONBLADE_ECONOMY_AXIOMS.md` — economy and axiom reference draft
- `DEPLOY_GUIDE.md` and `deploy-cost-analysis.md`
- Next.js 16 frontend initialized at `app/` with App Router
- Wallet adapter integration (8 wallet providers)
- `vercel.json` for Vercel deployment

### Changed
- Project name finalized as **AXIONBLADE** (previously referred to as NOUMEN internally)
- Architecture documents in `files/` established as canonical source of truth

---

## [3.1.0] — 2026-02-10

Agent separation and economic model refinement. Architecture document `files/05_ARQUITETURA_v3.1.md`.

### Added
- Formalization of APOLLO as the sole DeFi risk-scoring agent with ≤40% Risk Engine weight cap
- AEON governance authority hierarchy defined: super keypair → aeon keypair → keeper keypair
- CCS (Creator Capture System) defined: 40% Ops / 30% Treasury / 15% Dev Fund / 15% Creator
- Pricing floor axiom: cost + 20% minimum margin
- Reserve ratio axiom: ≥25% at all times
- Daily spend limit: ≤3% of free balance
- Donation PDA isolation — donations never pass through CCS split
- Anti-masquerade rule for conditional donations
- `contracts/keys/` directory structure for authority keypairs (gitignored)

---

## [3.0.0] — 2026-02-10

Initial AXIONBLADE architecture. Architecture document `files/04_ARQUITETURA_v3.0.md`.

### Added
- Core architectural principle: **proof before action** — every decision generates a cryptographic hash on-chain before any execution
- Two-agent model: AEON (Sovereign Governor) + APOLLO (DeFi Risk Evaluator)
- Firewall chain: `APOLLO -> assessment_pda -> Risk Engine (<=40%) -> AEON -> Executor`
- Axiom system established — 8 initial axioms covering agent governance, separation, and execution safety
- Service portfolio: Entry (E1–E4), Premium (P1–P3), B2B/Infra (B1–B3)
- Economic sustainability model: 90-day subsidy maximum, pricing floor, scale-on-demand-only rule
- Meta-circuit-breaker design: triggers, pause mechanism, gradual recovery
- Architecture documents initialized in `files/` (documents 00–04)
- `files/00_IDENTIDADE_AXIONBLADE.md` — identity and non-negotiable principles
- `files/01_CONSULTORIA_TECNICA_INICIAL.md` — technical baseline and risk assessment
- `files/13_AXIOMAS_REFERENCIA.md` bootstrapped (expanded incrementally through v3.4.0)

---

[Unreleased]: https://github.com/Martiano2023/AXIONBLADE/compare/v3.4.0...HEAD
[3.4.0]: https://github.com/Martiano2023/AXIONBLADE/compare/v3.3.0...v3.4.0
[3.3.0]: https://github.com/Martiano2023/AXIONBLADE/compare/v3.2.3...v3.3.0
[3.2.3]: https://github.com/Martiano2023/AXIONBLADE/compare/v3.2.2...v3.2.3
[3.2.2]: https://github.com/Martiano2023/AXIONBLADE/compare/v3.2.0...v3.2.2
[3.2.0]: https://github.com/Martiano2023/AXIONBLADE/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/Martiano2023/AXIONBLADE/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/Martiano2023/AXIONBLADE/releases/tag/v3.0.0
