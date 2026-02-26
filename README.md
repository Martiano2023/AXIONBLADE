<div align="center">

```
 █████╗ ██╗  ██╗██╗ ██████╗ ███╗   ██╗██████╗ ██╗      █████╗ ██████╗ ███████╗
██╔══██╗╚██╗██╔╝██║██╔═══██╗████╗  ██║██╔══██╗██║     ██╔══██╗██╔══██╗██╔════╝
███████║ ╚███╔╝ ██║██║   ██║██╔██╗ ██║██████╔╝██║     ███████║██║  ██║█████╗
██╔══██║ ██╔██╗ ██║██║   ██║██║╚██╗██║██╔══██╗██║     ██╔══██║██║  ██║██╔══╝
██║  ██║██╔╝ ██╗██║╚██████╔╝██║ ╚████║██████╔╝███████╗██║  ██║██████╔╝███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝
```

**Autonomous risk assessment infrastructure with verifiable proof for Solana DeFi**

---

[![Version](https://img.shields.io/badge/version-v3.4.0-0ea5e9?style=for-the-badge&logo=github)](https://github.com/Martiano2023/AXIONBLADE)
[![Solana](https://img.shields.io/badge/Solana-Mainnet--beta-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-f59e0b?style=for-the-badge)](https://anchor-lang.com)
[![Programs](https://img.shields.io/badge/Programs-7%20on--chain-a855f7?style=for-the-badge)](contracts/)
[![Axioms](https://img.shields.io/badge/Axioms-49%20active%20%2F%2050%20total-00D4FF?style=for-the-badge)](files/13_AXIOMAS_REFERENCIA.md)
[![Build](https://img.shields.io/github/actions/workflow/status/Martiano2023/AXIONBLADE/ci.yml?style=for-the-badge&label=CI)](https://github.com/Martiano2023/AXIONBLADE/actions)

</div>

---

> **No execution happens without a prior, immutable, retroactively auditable proof of decision.**

AXIONBLADE is an **autonomous risk assessment infrastructure** built on Solana. Every agent decision produces a cryptographic proof on-chain via `noumen_proof::log_decision()` before any action is ever taken. Every output is verifiable. Every decision is permanently on the record.

This is not a dashboard. This is not a signals aggregator. This is risk infrastructure — a verifiable proof layer for autonomous DeFi operations.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Agent Roster](#agent-roster)
- [Firewall Chain](#firewall-chain)
- [On-Chain Programs](#on-chain-programs)
- [Axiom System](#axiom-system)
- [Policy Layers](#policy-layers)
- [Evidence Families](#evidence-families)
- [Economic Model](#economic-model)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Repository Structure](#repository-structure)
- [Security](#security)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AXIONBLADE v3.4.0                        │
│                 Solana Mainnet-beta / 7 Programs                │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  KRONOS (Amber) — Economic Operator                          │
  │  Pricing epochs · Buyback burns · Revenue distribution       │
  │  Drives on-chain heartbeat via crank operations (A0-44→50)   │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────┐     assessment_pda      ┌──────────────────┐
  │ APOLLO       │ ──────────────────────> │  Risk Engine     │
  │ (Cyan)       │  Pool Taxonomy          │                  │
  │ DeFi Risk    │  MLI Index              │  APOLLO ≤ 40%    │
  │ Evaluator    │  Effective APR          │  Evidence ≥ 2    │
  │              │                         │  families (A0-17)│
  │ NEVER        │  read-only boundary     │                  │
  │ EXECUTES     │  executors cannot read  └────────┬─────────┘
  └──────────────┘  PDAs directly (A0-15)           │
                                                     ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  AEON (Rose) — Sovereign Governor                            │
  │  Creates agents · Delegates authority · Reviews Risk Engine  │
  │  Depth = 1 · Hard cap: 100 agents (A0-1)                     │
  └────────────────────────────────┬─────────────────────────────┘
                                   │
                                   ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  Executor                                                    │
  │                                                              │
  │  noumen_proof::log_decision() ──> Immutable on-chain hash    │
  │  MANDATORY before any action (A0-5)                          │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  HERMES (Purple) — DeFi Intelligence                         │
  │  5 terminal services · External consumption ONLY             │
  │  NEVER enters execution chain · NEVER feeds Risk Engine      │
  │  (A0-29)                                                     │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  Next.js 16 Frontend (app/)                                  │
  │  React 19 · Tailwind CSS v4 · Framer Motion                  │
  │  Wallet adapters · HMAC-SHA256 API authentication            │
  └──────────────────────────────────────────────────────────────┘
```

---

## Agent Roster

Roles are strictly separated. Evaluation and execution **never occur in the same agent for the same domain** (Axiom A0-4).

| Agent | Brand | Role | Executes? | Feeds Risk Engine? | Key Axioms |
|-------|-------|------|-----------|-------------------|------------|
| **KRONOS** | Amber `#F59E0B` | Economic Operator — pricing epochs, buyback burns, revenue distribution, on-chain cranks | Cranks only | No | A0-44 through A0-50 |
| **AEON** | Rose `#F43F5E` | Sovereign Governor — creates agents, delegates authority, reviews policy | Delegates only | N/A | A0-1, A0-9, A0-28, A0-39, A0-43 |
| **APOLLO** | Cyan `#00D4FF` | DeFi Risk Evaluator — Pool Taxonomy, MLI (Mercenary Liquidity Index), Effective APR | **Never** | Yes, hard-capped at ≤40% | A0-4, A0-15, A0-16, A0-30 |
| **HERMES** | Purple `#A855F7` | DeFi Intelligence — 5 terminal services for external consumption | **Never** | **Never** | A0-22, A0-29, A0-35 |

**Hard architectural rules:**

- Only AEON creates agents. Creation depth is fixed at 1. Hard cap: **100 agents** (A0-1).
- APOLLO is the sole risk-scoring agent. It never executes. Its weight in the Risk Engine is hard-capped at **40%** (A0-16).
- HERMES outputs are **terminal** — consumed externally by wallets, protocols, and dashboards. They never enter the execution chain (A0-29).
- LLMs are advisory only. All final decisions are deterministic, versioned, and recordable.

### APOLLO — 3 Assessment Modules

| Module | Function |
|--------|----------|
| Pool Taxonomy | Classifies pool by type, liquidity structure, and risk profile |
| MLI (Mercenary Liquidity Index) | Detects unsustainable incentive-driven liquidity across monitored pools |
| Effective APR | Calculates real yield accounting for impermanent loss, reward decay, and gas costs |

### HERMES — 5 Canonical Services

| Service | Description |
|---------|-------------|
| Pool Comparison | Side-by-side risk/APR analysis across pools |
| Effective APR Calculator | Real yield after IL, fee decay, reward depreciation, and gas |
| Risk Decomposition Vector | Score broken into per-family components |
| Yield Trap Intelligence | Detects headline APR vs. effective APR divergence |
| Protocol Health Snapshot | Audit history, governance posture, TVL ranking |

---

## Firewall Chain

```
APOLLO (DeFi Risk Evaluator)
  |
  | Pool Taxonomy + MLI + Effective APR
  | Writes output to:
  v
assessment_pda  <-- read-only boundary; executors cannot read directly (A0-15)
  |
  | Fed into Risk Engine with hard constraints:
  v
Risk Engine
  |  APOLLO weight:   <= 40%                                    (A0-16)
  |  Evidence quorum: >= 2 independent families required        (A0-17)
  |  Single-family signal: ALERT-ONLY; execution blocked
  v
AEON (Sovereign Governor)
  |
  | Delegates to authorized executor
  v
Executor
  |
  | MANDATORY before any action:
  v
noumen_proof::log_decision()  -->  Immutable on-chain proof hash  (A0-5)
  |
  v
Action executed

───────────────────────────────────────────────────────────────────

HERMES (DeFi Intelligence)  -->  External consumers only
                                  (wallets, protocols, dashboards)
                                  Never enters execution chain    (A0-29)
```

---

## On-Chain Programs

Seven Anchor programs form the AXIONBLADE on-chain layer. Crate names are prefixed `noumen_*` — these are on-chain identifiers tied to deployed Program IDs and **must not be renamed**.

| Program | Description | Program ID |
|---------|-------------|------------|
| `noumen_core` | Agent governance, authority hierarchy, permission model | `9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE` |
| `noumen_proof` | Cryptographic decision logs, immutable proof PDAs | `3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV` |
| `noumen_treasury` | Revenue routing, CCS split, pricing epochs, volume discounts | `EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu` |
| `noumen_apollo` | DeFi risk assessment — Pool Taxonomy, MLI, Effective APR | `92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee` |
| `noumen_hermes` | Intelligence services — 5 terminal outputs for external consumption | `Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj` |
| `noumen_auditor` | Security incident registry, Truth Labels (HTL/EOL), precision metrics | `CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe` |
| `noumen_service` | Service registry, pricing enforcement, usage metrics | `9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY` |

All programs are written in Rust with Anchor 0.30.1. `overflow-checks = true` across all crates. An eighth program, `axionblade-token-vault`, handles token custody — AXIONBLADE never operates custodial vaults (A0-12).

Verify any program on-chain:
```bash
solana program show 9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE --url mainnet-beta
```

---

## Axiom System

AXIONBLADE's safety envelope is defined by **50 axioms** (49 active + A0-2 deprecated). Enforced at Layer 0 — not configurable at runtime, not changeable without a full program redeploy and governance process.

| Category | Axiom Count | Scope |
|----------|-------------|-------|
| Agent Governance | 8 | Agent creation, delegation, depth, hard caps |
| Separation of Functions | 6 | Evaluation vs. execution, firewall, HERMES isolation |
| Proofs and Auditability | 9 | `log_decision`, immutability, Truth Labels, output metadata |
| Security and Execution | 9 | Evidence quorum, auto-learning ban, external agent limits |
| Economy and Treasury | 13 | Reserve ratio, spend limits, pricing floor, CCS bands, sustainability |
| Donations | 4 | Donation isolation, anti-masquerade, no rights conferred |
| **Total active** | **49** | |
| Deprecated | 1 | A0-2 (obsolete, superseded by A0-9) |

### Non-Negotiable Constraints

```
Agent Creation     Only AEON creates agents. Depth = 1. Hard cap: 100.           A0-1
Separation         Evaluation and execution never in same agent, same domain.    A0-4
Decision Logging   log_decision() mandatory before any execution. No exceptions. A0-5
Immutable History  Proof PDAs are never deleted or modified.                     A0-6
External Agents    Read-only access to NOUMEN PDAs. No write permissions.        A0-7
Pricing Floor      Every service: cost + 20% minimum margin.                     A0-8
No Custodial Vaults AXIONBLADE never holds user funds custodially.              A0-12
No Auto-Learning   System cannot modify its own models in production.           A0-13
Firewall           Executors cannot read APOLLO PDAs directly.                  A0-15
Risk Engine Cap    APOLLO weight hard-capped at 40%.                            A0-16
Evidence Quorum    >= 2 independent evidence families for execution.            A0-17
                   Single-family signals: ALERT-ONLY. Executor blocked.
HERMES Isolation   HERMES never feeds the Risk Engine.                         A0-29
Reserve Ratio      Treasury reserve >= 25% at all times.                        A0-3
Daily Spend Limit  Treasury daily spend <= 3% of free balance.                  A0-3
Donations          Confer no rights, priority, or influence.                   A0-22
CCS Cap            Creator capture: max 15%, floor 4%, stipend cap 5%.         A0-28
```

Full axiom reference: [`files/13_AXIOMAS_REFERENCIA.md`](files/13_AXIOMAS_REFERENCIA.md)

---

## Policy Layers

Not all parameters are axioms. Below Layer 0 sit three governed policy layers:

| Layer | Name | Change Delay | Cooldown | Controls |
|-------|------|-------------|----------|----------|
| **0** | Axioms | Immutable (requires full redeploy) | — | All hard constraints listed above |
| **1** | Constitutional | 72h – 30d | 7 – 30d | Budgets, CCS bands, evidence families, protocol allowlists |
| **2** | Operational | 24h | 24h | Service prices, agent lifecycle, budget allocation |
| **3** | Tactical | Agent-adjustable | — | Monitored pools, update frequency, prioritization |

---

## Evidence Families

Execution requires signals from **at least 2 independent families**. Two signals from the same family count as one.

| Family | Domain | Example Signals |
|--------|--------|----------------|
| **A — Price / Volume** | DEX on-chain price and volume | Price drop >X%, abnormal volume, spread widening, oracle deviation |
| **B — Liquidity** | TVL, pool composition, concentration | TVL drain, critical concentration (Herfindahl index), pool imbalance |
| **C — Behavior** | Wallet behavior patterns | Whale movement, mercenary liquidity detection, bot clustering |
| **D — Incentive** | Incentive programs, APR, reward tokens | Incentive expiry, APR collapse, emission unsustainability |
| **E — Protocol** | Governance, upgrades, parameters | Adverse proposals, oracle updates, parameter changes, audit gaps |

If fewer than 2 independent families produce signals, the system enters **ALERT-ONLY** mode. The Executor is prohibited from acting until quorum is restored.

---

## Economic Model

Revenue comes exclusively from real usage — paid services, APIs, and A2A marketplace. No token emissions. No speculative mechanisms. No revenue from donations.

### Service Tiers

| Tier | Target | Pricing |
|------|--------|---------|
| Entry | Individual wallets | 0.005 – 0.05 SOL per service |
| Premium | Power users | Volume discounts: 10% at 10 scans, 20% at 50, 30% at 100 |
| B2B / A2A | Protocols and agents | Enterprise pricing — must clear cost + 20% floor |

### Revenue Routing — CCS (Creator Capture System)

Enforced on-chain by `noumen_treasury` on every paid transaction:

```
Operations   40%   RPC nodes, compute, storage, infrastructure
Treasury     30%   Reserve buffer, runway (minimum 25% reserve ratio enforced)
Dev Fund     15%   Continuous development and protocol improvements
Creator      15%   Capped at 15%, floor 4%, stipend cap 5% (A0-28)
```

### Sustainability Rules

| Rule | Constraint |
|------|-----------|
| Subsidy window | Maximum 90 days before a service must reach positive unit economics |
| Pricing floor | Cost + 20% minimum margin — enforced by A0-8, non-negotiable |
| Auto-discontinue | Services that do not achieve unit economics are discontinued |
| Scale rule | System scales only when there is measured demand — never preemptively |

### Donations

Donations go to a separate **Donation PDA**. They are swept daily to Treasury and do not pass through the CCS split. Conditional donations are rejected outright (anti-masquerade rule, A0-25). Donations confer no rights, no priority, and no influence (A0-22).

---

## Tech Stack

### Smart Contracts

| Component | Detail |
|-----------|--------|
| Language | Rust (`overflow-checks = true` across all crates) |
| Framework | Anchor 0.30.1 |
| Network | Solana mainnet-beta |
| Programs | 7 Anchor programs + 1 shared-types crate |
| State | All state held in Program Derived Addresses (PDAs) |
| Security | Anti-replay, authority constraints, checked arithmetic throughout |

### Frontend

| Component | Detail |
|-----------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Wallet | @solana/wallet-adapter (8 adapters) |
| State | Zustand v5 |
| Data Fetching | TanStack Query v5 |
| Charts | Recharts v3 |
| Hosting | Vercel |

### Infrastructure

| Component | Detail |
|-----------|--------|
| RPC | Helius (primary), public endpoints (fallback) |
| Payment | On-chain verification via Solana RPC — no mock, no custodial layer |
| API Auth | HMAC-SHA256 per-request signatures |
| Rate Limiting | 10 req/min per wallet |
| Security Headers | CSP, HSTS, X-Frame-Options, Permissions-Policy |

### Supported Wallets

Phantom · Solflare · Coinbase Wallet · Ledger · Trust Wallet · WalletConnect · Solana Mobile · TipLink

---

## Quick Start

### Prerequisites

```bash
node    >= 18.0.0
rust    >= 1.75.0
anchor  >= 0.30.1    # cargo install --git https://github.com/coral-xyz/anchor anchor-cli
solana  >= 1.18.0    # https://docs.solanalabs.com/cli/install
```

### Clone and Install

```bash
git clone https://github.com/Martiano2023/AXIONBLADE.git
cd AXIONBLADE
```

### Frontend Development

```bash
cd app
cp .env.local.example .env.local   # fill in RPC endpoint and API keys
npm install
npm run dev
# --> http://localhost:3000
```

### Frontend Build

```bash
npm run build
npm run start
```

### Smart Contracts

```bash
cd contracts

# Build all 7 programs
anchor build

# Run the full test suite
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

For mainnet deployment, see [`scripts/README.md`](scripts/README.md) and the deployment scripts in [`scripts/`](scripts/).

---

## Repository Structure

```
AXIONBLADE/
├── app/                          # Next.js 16 frontend
│   ├── src/
│   │   ├── app/                  # App Router pages and API routes
│   │   │   ├── (app)/            # Dashboard route group (26 pages)
│   │   │   │   ├── agents/       # Agent management UI
│   │   │   │   ├── apollo/       # Risk evaluator interface
│   │   │   │   ├── hermes/       # Intelligence services interface
│   │   │   │   ├── analytics/    # Analytics and metrics
│   │   │   │   ├── treasury/     # Treasury monitoring
│   │   │   │   └── ...           # 20+ additional feature pages
│   │   │   ├── api/              # Next.js API routes (13 endpoints)
│   │   │   │   ├── _shared/      # Shared middleware and auth
│   │   │   │   ├── proof/        # Proof verification endpoint
│   │   │   │   ├── risk-score/   # Risk score API
│   │   │   │   └── ...           # Pool, wallet, yield endpoints
│   │   │   ├── layout.tsx        # Root layout
│   │   │   └── page.tsx          # Landing page
│   │   ├── components/
│   │   │   ├── atoms/            # 16 base components (GlassCard, Badge, Button...)
│   │   │   ├── molecules/        # 10 compound components
│   │   │   ├── organisms/        # 8 complex UI organisms
│   │   │   │   ├── NavigationSidebar.tsx
│   │   │   │   ├── TopBar.tsx    # Live ticker (Treasury, Proofs, Agents, Axioms)
│   │   │   │   └── AgentCard.tsx
│   │   │   ├── effects/          # Canvas animations (ParticlesBackground)
│   │   │   ├── illustrations/    # SVG agent illustrations
│   │   │   └── ui/               # shadcn/ui primitives
│   │   ├── hooks/                # 18 custom React hooks
│   │   ├── lib/                  # Business logic
│   │   │   ├── risk-engine.ts    # Core risk evaluation
│   │   │   ├── proof-generator.ts # On-chain proof creation
│   │   │   ├── payment-verifier.ts # Solana payment verification
│   │   │   ├── pricing-engine.ts # Service pricing enforcement
│   │   │   ├── agent-orchestrator.ts # Agent coordination
│   │   │   └── ...               # 20+ utility modules
│   │   ├── providers/            # React context providers
│   │   │   ├── WalletProvider.tsx
│   │   │   ├── QueryProvider.tsx
│   │   │   └── RealtimeProvider.tsx
│   │   └── stores/               # Zustand global state stores
│   ├── public/                   # Static assets
│   ├── next.config.ts            # CSP, HSTS, security headers
│   ├── package.json
│   └── tsconfig.json
│
├── contracts/                    # Anchor workspace
│   ├── programs/                 # 7 on-chain Anchor programs
│   │   ├── noumen-core/          # Agent governance, authority hierarchy
│   │   ├── noumen-proof/         # Cryptographic decision logs
│   │   ├── noumen-treasury/      # Revenue routing, CCS split
│   │   ├── noumen-apollo/        # DeFi risk assessment
│   │   ├── noumen-hermes/        # Intelligence services
│   │   ├── noumen-auditor/       # Security registry, Truth Labels
│   │   ├── noumen-service/       # Service registry, pricing
│   │   └── axionblade-token-vault/ # Token custody program
│   ├── crates/
│   │   └── shared-types/         # Shared type definitions across programs
│   ├── scripts/                  # Contract-level deployment and init scripts
│   │   ├── deploy-devnet.sh
│   │   ├── deploy-mainnet-fase1.sh / fase2.sh
│   │   ├── init-mainnet-fase1.ts / fase2.ts
│   │   ├── create-agents-mainnet.ts
│   │   ├── execute-policy-mainnet.ts
│   │   └── security-tests.ts
│   ├── tests/                    # Anchor integration tests
│   │   ├── axionblade.ts         # Main test suite
│   │   └── security-tests.ts     # Security-specific tests
│   ├── keys/                     # Authority keypairs (gitignored)
│   ├── Anchor.toml               # Anchor workspace config
│   ├── Cargo.toml                # Rust workspace manifest
│   └── SECURITY_REVIEW.md        # Static security audit
│
├── scripts/                      # Root-level mainnet deployment scripts
│   ├── deploy-mainnet.sh         # Full mainnet deployment orchestration
│   ├── verify-mainnet.sh         # Post-deployment verification
│   ├── init-mainnet.ts           # Mainnet initialization
│   ├── kronos-crank.ts           # KRONOS crank runner
│   ├── deploy-token-vault.sh     # Token vault deployment
│   └── run-execute-policy.sh     # Policy execution runner
│
├── files/                        # Architecture documents (numbered deltas)
│   ├── 00_IDENTIDADE_AXIONBLADE.md       # Identity and non-negotiable principles
│   ├── 01_CONSULTORIA_TECNICA_INICIAL.md # Technical consultancy
│   ├── 02_EVOLUCAO_SISTEMICA_MULTI_AGENTE.md
│   ├── 03_AGENTE_DEFI_APOLLO_CONCEITUAL.md
│   ├── 04_ARQUITETURA_v3.0.md    # Architecture v3.0
│   ├── 05_ARQUITETURA_v3.1.md    # v3.1 delta
│   ├── 06_ARQUITETURA_v3.2.md    # v3.2 delta
│   ├── 07 – 11                   # Incremental refinements v3.2.1 → v3.2.2.3
│   ├── 12_ARQUITETURA_v3.2.3_HERMES.md  # HERMES introduction
│   ├── 13_AXIOMAS_REFERENCIA.md  # Canonical axiom reference (50 axioms)
│   └── INDICE_MESTRE.md          # Master index
│
├── docs/                         # Additional documentation
│   ├── USER_GUIDE.md
│   └── frontend-feature-flags.md
│
├── .github/                      # GitHub configuration
│   ├── workflows/ci.yml          # CI pipeline
│   ├── CONTRIBUTING.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── CLAUDE.md                     # AI agent instructions for this codebase
├── CHANGELOG.md                  # Versioned changelog
├── README.md                     # This file
├── vercel.json                   # Vercel deployment config
└── .gitignore
```

---

## Security

### Architectural Guarantees

| Guarantee | Mechanism | Axiom |
|-----------|-----------|-------|
| Proof before action | `log_decision()` mandatory before any execution | A0-5 |
| Evaluation does not equal execution | APOLLO architecturally prohibited from executing | A0-4, A0-14 |
| Firewall isolation | Executors cannot read APOLLO PDAs directly | A0-15 |
| Risk Engine cap | APOLLO weight hard-capped at 40% | A0-16 |
| Evidence quorum | >= 2 independent families required; single-family: ALERT-ONLY | A0-17 |
| No auto-learning | System cannot modify its own models during live operation | A0-13 |
| No custodial vaults | AXIONBLADE never holds user funds in custodial structures | A0-12 |
| External agents read-only | Third parties can read NOUMEN PDAs but cannot write | A0-7 |
| Immutable history | Proof PDAs are never deleted or modified | A0-6 |

### Meta-Circuit-Breaker

When triggered, all execution pauses. Read-only access and the Auditor remain active. Recovery is gradual: ALERT-ONLY → ultra-conservative → normal.

| Trigger Condition | Threshold |
|-------------------|-----------|
| Treasury health score | Below 15 for 12 consecutive hours |
| Agents failing simultaneously | 3 or more |
| Revenue / cost ratio | Below 0.5x for 5 consecutive days |
| Individual circuit breakers fired | 2 or more in the same day |
| External agent disconnection | >= 50% simultaneously |
| Intent verification rejection rate | > 60% in 24 hours |
| Published accuracy (HTL) | Below 70% |

| Mode | State | Execution |
|------|-------|-----------|
| `NORMAL` | All systems nominal | Unrestricted |
| `DEGRADED` | Risk signals elevated | Reduced budget, higher evidence thresholds, AEON approval required |
| `HALTED` | Anomaly confirmed | All execution suspended, ALERT-ONLY, manual governance to resume |

### Security Documents

- [`contracts/SECURITY_REVIEW.md`](contracts/SECURITY_REVIEW.md) — Static analysis of all 7 programs
- [`SECURITY_AUDIT_REPORT.md`](SECURITY_AUDIT_REPORT.md) — Full security audit report
- [`SECURITY_TEST_REPORT.md`](SECURITY_TEST_REPORT.md) — Security test results
- [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) — Responsible disclosure process

---

## Contributing

Please read [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) before opening any issue or pull request.

### Before Proposing Anything

Every change must pass the innovation checklist from `files/00_IDENTIDADE_AXIONBLADE.md`:

```
[ ] Is there real, demonstrated demand for this?
[ ] Is that demand recurrent — not a one-time need?
[ ] What attack surface does it introduce?
[ ] Does it violate any of the 50 axioms? If yes: rejected.
[ ] Does it require custody of user funds?
[ ] Is every step of the decision auditable?
[ ] Does it fail safely if something goes wrong?
[ ] Can it be disabled without taking down the rest of the system?
```

### What Cannot Change

- `noumen_*` crate names, Cargo.toml entries, PDA seeds, or IDL filenames — these are on-chain identifiers tied to deployed Program IDs
- Any Layer 0 axiom without a full program redeploy and governance process
- The firewall chain — APOLLO never executes, HERMES never feeds the Risk Engine

### Branch Naming

```
feature/<short-description>    New capability
fix/<issue-or-description>     Bug fix
docs/<topic>                   Documentation only
refactor/<scope>               Code restructuring, no behavior change
test/<scope>                   Test coverage additions
```

---

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md) for a full versioned history.

| Version | Date | Summary |
|---------|------|---------|
| v3.4.0 | 2026-02-24 | Complete site overhaul, 10-agent build, KRONOS economic axioms A0-44→50 |
| v3.3.0 | 2026-02-13 | KRONOS agent, token vault, mainnet deployment, security hardening |
| v3.2.3 | 2026-02-12 | HERMES introduction, 5 canonical services, terminal-output isolation |
| v3.2.0 | 2026-02-10 | Multi-agent architecture, Anchor workspace, 7 programs deployed |
| v3.0.0 | 2026-02-10 | Initial AXIONBLADE architecture, AEON + APOLLO, axiom system |

---

## License

```
MIT License

Copyright (c) 2024 AXIONBLADE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

<div align="center">

**AXIONBLADE — Because every decision deserves proof.**

Built on Solana · Governed by axioms · Auditable forever

[Architecture Docs](files/) · [Axiom Reference](files/13_AXIOMAS_REFERENCIA.md) · [Smart Contracts](contracts/) · [Frontend](app/)

</div>
