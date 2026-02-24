<div align="center">

```
 █████╗ ██╗  ██╗██╗ ██████╗ ███╗   ██╗██████╗ ██╗      █████╗ ██████╗ ███████╗
██╔══██╗╚██╗██╔╝██║██╔═══██╗████╗  ██║██╔══██╗██║     ██╔══██╗██╔══██╗██╔════╝
███████║ ╚███╔╝ ██║██║   ██║██╔██╗ ██║██████╔╝██║     ███████║██║  ██║█████╗
██╔══██║ ██╔██╗ ██║██║   ██║██║╚██╗██║██╔══██╗██║     ██╔══██║██║  ██║██╔══╝
██║  ██║██╔╝ ██╗██║╚██████╔╝██║ ╚████║██████╔╝███████╗██║  ██║██████╔╝███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝
```

### Proof Before Action

**Autonomous risk assessment infrastructure with verifiable proof for DeFi and Agent-to-Agent environments on Solana.**

---

[![Version](https://img.shields.io/badge/version-v3.4.0-0ea5e9?style=for-the-badge&logo=github)](https://github.com/Martiano2023/AXIONBLADE)
[![Solana](https://img.shields.io/badge/Solana-Devnet%20Beta-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Axioms](https://img.shields.io/badge/Axioms-49%20active%20%2F%2050%20total-f59e0b?style=for-the-badge)](files/13_AXIOMAS_REFERENCIA.md)
[![Programs](https://img.shields.io/badge/Programs-7%20Anchor-a855f7?style=for-the-badge)](contracts/)

</div>

---

## What is AXIONBLADE?

AXIONBLADE is an **autonomous risk assessment infrastructure** built on Solana. It generates cryptographic proofs on-chain for every decision made — before any action is ever taken.

> _No execution happens without a prior, immutable, retroactively auditable proof of decision._

Every agent is specialized. Every output is verifiable. Every decision is permanently on the record.

---

## Table of Contents

- [Overview](#-overview)
- [Architecture — Four Agents](#-architecture--four-agents)
- [Firewall Chain](#-firewall-chain)
- [On-Chain Programs](#-on-chain-programs)
- [Axiom System](#%EF%B8%8F-axiom-system)
- [Policy Layers](#-policy-layers)
- [Evidence Families](#-evidence-families)
- [Economic Model](#-economic-model)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Getting Started](#-getting-started)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

DeFi operates in a trust-minimized environment, yet most automated systems make decisions in the dark. They provide data — but no proof that any analysis preceded any action.

**The consequences are measurable:**
- Yield farms advertising 300% APR collapse in 48 hours. Users entered without verifiable risk analysis.
- Honeypot pools with fabricated liquidity trap traders who cannot exit.
- Whale-driven price manipulation wipes out retail participants before any alert fires.
- Protocol audits cost $50,000–$200,000, putting verifiable security out of reach for most.

**AXIONBLADE solves this with one architectural principle:**

Every decision generates a cryptographic hash before execution. That hash is logged on-chain via `noumen_proof::log_decision()` and is immutable. Always.

This is not a dashboard. This is not a signals aggregator. This is **risk infrastructure** — a verifiable proof layer for autonomous DeFi operations.

**What this enables:**
- On-chain risk proofs at 0.005–0.05 SOL per analysis (93–99.99% cheaper than alternatives)
- Retroactive auditing of every agent decision across the system's full history
- Agent-to-Agent (A2A) commerce where buyers can verify the provenance of every risk output
- A safety envelope of **50 immutable axioms** enforced at the contract level — not by convention

---

## 🤖 Architecture — Four Agents

Roles are strictly separated. **Evaluation and execution never occur in the same agent for the same domain** (Axiom A0-4).

| Agent | Color | Role | Executes? | Risk Engine? | Key Axioms |
|-------|-------|------|-----------|--------------|------------|
| **KRONOS** | 🟡 Amber | Economic Operator — manages pricing epochs, token launch, revenue distribution, buyback burns | On-chain cranks only | No | A0-44 → A0-50 |
| **AEON** | 🔴 Rose | Sovereign Governor — creates agents, delegates authority, decides policy | Delegates only | N/A | A0-1, A0-9, A0-28, A0-39, A0-43 |
| **APOLLO** | 🔵 Cyan | DeFi Risk Evaluator — 3 modules: Pool Taxonomy, MLI (Mercenary Liquidity Index), Effective APR | **Never** | Yes, capped at ≤40% | A0-4, A0-15, A0-16, A0-30 |
| **HERMES** | 🟣 Purple | DeFi Intelligence — 5 terminal services for external consumption | **Never** | **Never** | A0-22, A0-29, A0-35 |

**Hard architectural rules:**

- APOLLO is the only risk-scoring agent. It **never executes**. Its weight in the Risk Engine is hard-capped at **40%** (A0-16) — no single agent can dominate a decision.
- HERMES outputs are **terminal** — consumed externally by wallets, protocols, and dashboards, never entering the execution chain (A0-29).
- Only AEON creates agents. Creation depth is fixed at 1. Hard cap: **100 agents** (A0-1).
- LLMs are advisory only. All final decisions are deterministic, versioned, and recordable.

**HERMES — 5 canonical services:**

| Service | Description |
|---------|-------------|
| Pool Comparison | Side-by-side risk/APR analysis across pools |
| Effective APR Calculator | Real yield after IL, fee decay, reward depreciation, gas |
| Risk Decomposition Vector | Score broken into per-family components |
| Yield Trap Intelligence | Detects headline APR vs effective APR divergence |
| Protocol Health Snapshot | Audit history, governance posture, TVL rank |

**APOLLO — 3 assessment modules:**

| Module | Function |
|--------|----------|
| Pool Taxonomy | Classifies pool by type, liquidity structure, and risk profile |
| MLI (Mercenary Liquidity Index) | Detects unsustainable incentive-driven liquidity across monitored pools |
| Effective APR | Calculates real yield accounting for impermanent loss, reward decay, and gas |

---

## ⚡ Firewall Chain

The execution chain enforces strict separation between evaluation and action. Executors cannot read APOLLO's PDAs directly.

```
KRONOS (Economic Operator)
  │
  │  Drives on-chain heartbeat, triggers scheduled state transitions,
  │  manages pricing epochs and buyback burns (A0-44 → A0-50)
  │
  ▼
────────────────────────────────────────────────────────────────

APOLLO (DeFi Risk Evaluator)
  │
  │  Pool Taxonomy + MLI + Effective APR
  │  Writes output to:
  ▼
assessment_pda   ←── read-only to executors, immutable record
  │
  │  Fed into Risk Engine with hard cap:
  ▼
Risk Engine ─────────────────────────────────────────────────────
  │          APOLLO weight:  ≤ 40% (A0-16)                      │
  │          Evidence quorum: ≥ 2 independent families (A0-17)  │
  │          Single-family signal → ALERT-ONLY, execution blocked│
  ▼                                                             ─┘
AEON (Sovereign Governor)
  │
  │  Reviews Risk Engine output, delegates to authorized executor
  ▼
Executor
  │
  │  Mandatory before any action:
  ▼
noumen_proof::log_decision()  ──→  Immutable on-chain proof hash
  │
  ▼
Action taken

────────────────────────────────────────────────────────────────

HERMES (DeFi Intelligence)  ──→  External consumers only
                                  (wallets, protocols, dashboards)
                                  Never enters execution chain (A0-29)
```

---

## 🔗 On-Chain Programs

Seven Anchor programs form the AXIONBLADE on-chain layer. Crate names are prefixed `noumen_*` — these are on-chain identifiers tied to deployed Program IDs. **Do not rename them.**

| Program | Description | Program ID |
|---------|-------------|------------|
| `noumen_core` | Agent governance, authority hierarchy, permissions | `9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE` |
| `noumen_proof` | Cryptographic decision logs, immutable proof PDAs | `3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV` |
| `noumen_treasury` | Revenue routing, CCS split, pricing epochs, volume discounts | `EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu` |
| `noumen_apollo` | DeFi risk assessment — Pool Taxonomy, MLI, Effective APR | `92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee` |
| `noumen_hermes` | Intelligence services — 5 terminal outputs for external consumption | `Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj` |
| `noumen_auditor` | Security incident registry, Truth Labels (HTL/EOL), precision metrics | `CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe` |
| `noumen_service` | Service registry, pricing enforcement, usage metrics | `9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY` |

All programs are written in Rust with Anchor 0.30.1. Overflow checks enabled across all crates. An eighth program, `axionblade-token-vault`, handles token custody — AXIONBLADE never operates custodial vaults (A0-12).

---

## 🛡️ Axiom System

AXIONBLADE's safety envelope is defined by **50 axioms** (49 active + A0-2 deprecated). Enforced at Layer 0 — not configurable at runtime, not changeable without a full program redeploy.

### Axioms by Category

| Category | Count | Scope |
|----------|-------|-------|
| Agent Governance | 8 | Agent creation, delegation, depth, hard caps |
| Separation of Functions | 6 | Evaluation vs. execution, firewall, HERMES isolation |
| Proofs & Auditability | 9 | log_decision, immutability, Truth Labels, output metadata |
| Security & Execution | 9 | Evidence quorum, auto-learning ban, external agent limits |
| Economy & Treasury | 13 | Reserve ratio, spend limits, pricing floor, CCS bands, sustainability |
| Donations | 4 | Donation isolation, anti-masquerade, no rights conferred |
| **Total active** | **49** | |
| Deprecated | 1 | A0-2 (obsolete, replaced by A0-9) |

### Non-Negotiable Constraints

```
Agent Creation        Only AEON creates agents. Depth = 1. Hard cap: 100.          (A0-1)
Separation            Evaluation and execution never in same agent, same domain.    (A0-4)
Decision Logging      log_decision() mandatory before any execution. No exceptions. (A0-5)
Evidence Quorum       ≥ 2 independent evidence families required for execution.
                      Single-family signals → ALERT-ONLY. Executor blocked.         (A0-17)
Risk Engine Cap       APOLLO weight in Risk Engine hard-capped at 40%.             (A0-16)
HERMES Isolation      HERMES never feeds the Risk Engine directly.                 (A0-29)
Auto-Learning         Prohibited in production. No ML feedback loops during live   (A0-13)
                      operation. Model updates require Layer 1 governance.
Reserve Ratio         Treasury reserve ≥ 25% at all times.                        (A0-3)
Daily Spend Limit     Treasury daily spend ≤ 3% of free balance.                  (A0-3)
Pricing Floor         Every service: cost + 20% minimum margin.                    (A0-8)
Custodial Vaults      AXIONBLADE never operates them.                             (A0-12)
External Agents       Read-only access to NOUMEN PDAs. No write permissions.       (A0-7)
Backtests             External agent backtests in-memory only. Never persisted.    (A0-10)
Historical Proofs     Immutable. Never deleted. Never modified.                    (A0-6)
Donations             Confer no rights, priority, or influence whatsoever.         (A0-22)
CCS Cap               Total creator capture: max 15%, floor 4%, stipend cap 5%.   (A0-28)
```

Full axiom reference: [`files/13_AXIOMAS_REFERENCIA.md`](files/13_AXIOMAS_REFERENCIA.md)

---

## 📋 Policy Layers

Not all parameters are axioms. Below Layer 0 sit three policy layers with governed change delays:

| Layer | Name | Change Delay | Cooldown | Controls |
|-------|------|-------------|----------|----------|
| **0** | Axioms | Immutable (redeploy) | — | All hard constraints above |
| **1** | Constitutional | 72h – 30d | 7 – 30d | Budgets, CCS bands, evidence families, protocol allowlists |
| **2** | Operational | 24h | 24h | Service prices, agent lifecycle, budget allocation |
| **3** | Tactical | Agent-adjustable | — | Monitored pools, update frequency, prioritization |

---

## 🔬 Evidence Families

Execution requires signals from **at least 2 independent families**. Two signals from the same family count as one.

| Family | Domain | Example Signals |
|--------|--------|----------------|
| **A — Price / Volume** | DEX on-chain price and volume | Price drop >X%, abnormal volume, spread widening, oracle deviation |
| **B — Liquidity** | TVL, pool composition, concentration | TVL drain, critical concentration (Herfindahl index), pool imbalance |
| **C — Behavior** | Wallet behavior patterns | Whale movement, mercenary liquidity detection, bot clustering |
| **D — Incentive** | Incentive programs, APR, reward tokens | Incentive expiry, APR collapse, emission unsustainability |
| **E — Protocol** | Governance, upgrades, parameters | Adverse proposals, oracle updates, parameter changes, audit gaps |

If fewer than 2 independent families produce signals → **ALERT-ONLY** mode. The Executor is prohibited from acting.

---

## 💰 Economic Model

Revenue comes exclusively from real usage — paid services, APIs, and A2A marketplace. No token emissions, no speculative mechanisms, no revenue from donations.

### Service Tiers

| Tier | Target | Pricing |
|------|--------|---------|
| Entry | Individual wallets | 0.005 – 0.05 SOL per service |
| Premium | Power users | Volume discounts: 10% at 10 scans · 20% at 50 · 30% at 100 |
| B2B / A2A | Protocols, agents | Enterprise pricing — must clear cost + 20% floor |

### Revenue Routing — CCS (Creator Capture System)

Enforced on-chain by `noumen_treasury` on every paid transaction:

```
Operations    40%   → RPC nodes, compute, storage, infrastructure
Treasury      30%   → Reserve buffer, runway (minimum 25% reserve ratio enforced)
Dev Fund      15%   → Continuous development and protocol improvements
Creator       15%   → Capped at 15%, floor 4%, stipend cap 5% (A0-28)
```

### Sustainability Rules

| Rule | Detail |
|------|--------|
| Subsidy window | Maximum 90 days before a service must reach positive unit economics |
| Pricing floor | Cost + 20% minimum margin — enforced by A0-8, non-negotiable |
| Auto-discontinue | Services that do not achieve unit economics are automatically discontinued |
| Scale rule | The system scales only when there is measured demand — never preemptively |

### Donations

Donations go to a separate **Donation PDA**. They are swept daily to Treasury and do **not** pass through the CCS split — they are not service revenue. Conditional donations are rejected outright (anti-masquerade rule, A0-25). Donations confer no rights, no priority, and no influence (A0-22).

---

## 🖥️ Tech Stack

### Smart Contracts

```
Language:       Rust (overflow-checks = true across all crates)
Framework:      Anchor 0.30.1
Network:        Solana (Devnet → Mainnet-beta)
Programs:       7 Anchor programs
PDAs:           All state held in Program Derived Addresses
Security:       Anti-replay, authority permissions, checked arithmetic throughout
```

### Frontend

```
Framework:      Next.js 16 (App Router)
Language:       TypeScript
UI Library:     React 19
Styling:        Tailwind CSS v4
Animation:      Framer Motion
Wallet:         @solana/web3.js, @solana/wallet-adapter
Hosting:        Vercel
```

### Infrastructure

```
RPC:            Helius (primary), public endpoints (fallback)
Payment:        On-chain verification via Solana RPC — no mock, no custodial layer
Rate Limit:     10 req/min per wallet
Agents:         Template-based, deterministic — no ML black-box in the decision path
```

### Wallet Support

Phantom · Solflare · Coinbase Wallet · Ledger · Trust Wallet · WalletConnect · Solana Mobile · TipLink

---

## 🚀 Getting Started

### Prerequisites

```bash
node >= 18
rust >= 1.75
anchor-cli >= 0.30.1
solana-cli >= 1.18
```

### Clone & Install

```bash
git clone https://github.com/Martiano2023/AXIONBLADE.git
cd AXIONBLADE/app
npm install
```

### Development

```bash
# Run frontend dev server
npm run dev
# → http://localhost:3000

# Production build
npm run build && npm run start
```

### Smart Contracts

```bash
cd contracts

# Build all 7 programs
anchor build

# Run test suite (38 test cases across 7 programs)
anchor test

# Deploy to Devnet
anchor deploy --provider.cluster devnet
```

For mainnet deployment, see [`scripts/`](scripts/) and the deployment guide in [`files/`](files/).

---

## 🔒 Security

### Architectural Guarantees

| Guarantee | Mechanism | Axiom |
|-----------|-----------|-------|
| Proof before action | `log_decision()` mandatory before any execution | A0-5 |
| Evaluation ≠ Execution | APOLLO architecturally prohibited from executing | A0-4, A0-14 |
| Firewall isolation | Executors cannot read APOLLO PDAs directly | A0-15 |
| Risk Engine cap | APOLLO weight hard-capped at 40% | A0-16 |
| Evidence quorum | ≥ 2 independent families required; single-family → ALERT-ONLY | A0-17 |
| No auto-learning | System cannot modify its own models during live operation | A0-13 |
| No custodial vaults | AXIONBLADE never holds user funds in custodial structures | A0-12 |
| External agents read-only | Third parties can read NOUMEN PDAs but cannot write | A0-7 |
| Immutable history | Proof PDAs are never deleted or modified | A0-6 |

### Meta-Circuit-Breaker

When triggered, execution pauses. Read-only access and the Auditor remain active. Recovery is gradual: ALERT-ONLY → ultra-conservative → normal.

| Trigger Condition | Threshold |
|-------------------|-----------|
| Treasury health score | Below 15 for 12 consecutive hours |
| Agents failing simultaneously | 3 or more |
| Revenue / cost ratio | Below 0.5× for 5 consecutive days |
| Individual circuit breakers fired | 2 or more in the same day |
| External agent disconnection | ≥ 50% simultaneously |
| Intent verification rejection rate | > 60% in 24 hours |
| Published accuracy (HTL) | Below 70% |

### Circuit Breaker Modes

| Mode | State | Execution |
|------|-------|-----------|
| `NORMAL` | All systems nominal | Unrestricted |
| `DEGRADED` | Risk signals elevated | Reduced budget · Higher evidence thresholds · AEON approval for high-value actions |
| `HALTED` | Anomaly confirmed | All execution suspended · ALERT-ONLY · Manual governance required to resume |

### Audit Principles

- Security incidents registered exclusively by `noumen_auditor` (A0-19)
- Truth Labels (HTL / EOL) calculated exclusively by the Auditor (A0-20)
- Precision metrics computed only over outcomes with a resolved observation window (A0-21)
- All paid outputs include `not_investment_advice`, `uncertainty_flags`, and `decision_class` in the canonical proof hash (A0-26)

---

## 🤝 Contributing

### Before You Propose Anything

Every change must pass the innovation checklist from `files/00_IDENTIDADE`:

```
[ ] Is there real, demonstrated demand for this?
[ ] Is that demand recurrent — not a one-time need?
[ ] What attack surface does it introduce?
[ ] Does it violate any of the 50 axioms? → If yes: rejected.
[ ] Does it require custody of user funds?
[ ] Is every step of the decision auditable?
[ ] Does it fail safely if something goes wrong?
[ ] Can it be disabled without taking down the rest of the system?
```

If any answer is wrong, the proposal is rejected. This is not a negotiation.

### Axiom Compliance

Every pull request touching contracts or agent logic must include a statement confirming that all 50 axioms have been verified against the change. Any axiom violation means the PR is closed.

### What You Can Contribute

- Bug fixes with reproduction steps and proof that the fix does not alter axiom behavior
- Frontend improvements (UI, performance, new service integrations)
- Documentation corrections and clarifications
- Test coverage for existing contract instructions
- New service proposals that pass the innovation checklist and clear the 90-day sustainability requirement

### What You Cannot Change

- `noumen_*` crate names, Cargo.toml entries, PDA seeds, or IDL filenames — on-chain identifiers
- Any Layer 0 axiom without a full program redeploy and governance process
- The firewall chain architecture — APOLLO never executes, HERMES never feeds the Risk Engine

### Development Workflow

```bash
# Read architecture documents in order before touching anything
# files/00 → files/13 — each is a delta on the previous

git checkout -b feature/your-change

# Make changes
# Verify all 50 axioms
# Run anchor test (all 38 must pass)

git push origin feature/your-change
# Open PR with axiom compliance statement
```

---

## 📄 License

MIT License — Copyright (c) 2024 AXIONBLADE

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

---

<div align="center">

**AXIONBLADE — Because every decision deserves proof.**

Built on Solana · Governed by axioms · Auditable forever

[Architecture Docs](files/) · [Axiom Reference](files/13_AXIOMAS_REFERENCIA.md) · [Smart Contracts](contracts/)

</div>
