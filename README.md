```
 █████╗ ██╗  ██╗██╗ ██████╗ ███╗   ██╗██████╗ ██╗      █████╗ ██████╗ ███████╗
██╔══██╗╚██╗██╔╝██║██╔═══██╗████╗  ██║██╔══██╗██║     ██╔══██╗██╔══██╗██╔════╝
███████║ ╚███╔╝ ██║██║   ██║██╔██╗ ██║██████╔╝██║     ███████║██║  ██║█████╗
██╔══██║ ██╔██╗ ██║██║   ██║██║╚██╗██║██╔══██╗██║     ██╔══██║██║  ██║██╔══╝
██║  ██║██╔╝ ██╗██║╚██████╔╝██║ ╚████║██████╔╝███████╗██║  ██║██████╔╝███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝
```

<div align="center">

### Proof Before Action

**Autonomous risk assessment infrastructure with verifiable proof for DeFi and Agent-to-Agent environments on Solana.**

---

[![Version](https://img.shields.io/badge/version-v3.4.0-blue?style=for-the-badge)](https://github.com/Martiano2023/AXIONBLADE)
[![Solana](https://img.shields.io/badge/Solana-Mainnet%20Ready-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)](https://github.com/Martiano2023/AXIONBLADE)
[![Axioms](https://img.shields.io/badge/axioms-50%2F50%20compliant-gold?style=for-the-badge)](files/13_AXIOMAS_REFERENCIA.md)

</div>

---

## What is AXIONBLADE?

AXIONBLADE is an **autonomous risk assessment infrastructure** built on Solana. It generates cryptographic proofs on-chain for every decision made — before any action is ever taken. No execution happens without a prior, immutable, retroactively auditable proof of decision. Every agent is specialized, every output is verifiable, and every decision is on the record.

> AXIONBLADE never executes without proof. It never decides in a way that cannot be audited.

---

## Table of Contents

- [Overview](#-overview)
- [Architecture — Four Agents](#-architecture--four-agents)
- [Firewall Chain](#-firewall-chain)
- [On-Chain Programs](#-on-chain-programs)
- [Axiom System](#-axiom-system)
- [Policy Layers](#-policy-layers)
- [Evidence Families](#-evidence-families)
- [Economic Model](#-economic-model)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

DeFi operates in a trust-minimized environment, yet most automated systems — bots, dashboards, yield aggregators — make decisions in the dark. They provide data, but no proof that any analysis preceded any action.

**The consequences are measurable:**
- Yield farms advertising 300% APR collapse in 48 hours. Users entered without verifiable risk analysis.
- Honeypot pools with fabricated liquidity trap traders who cannot exit.
- Whale-driven price manipulation wipes out retail participants before any alert fires.
- Protocol audits cost $50,000–$200,000, putting verifiable security out of reach for most.

**AXIONBLADE solves this with a single architectural principle:**

_Every decision generates a cryptographic hash before execution. That hash is logged on-chain via `noumen_proof::log_decision()` and is immutable. Always._

This is not a dashboard. This is not a signals aggregator. This is risk infrastructure — a verifiable proof layer for autonomous DeFi operations.

**What this enables:**
- On-chain risk proofs accessible at 0.005–0.05 SOL per analysis (93–99.99% cheaper than alternatives)
- Retroactive auditing of every agent decision in the system's history
- Agent-to-Agent (A2A) commerce where buyers can verify the provenance of every risk output
- A safety envelope of 50 immutable axioms enforced at the contract level — not by convention

---

## 🤖 Architecture — Four Agents

AXIONBLADE operates with four specialized agents. Roles are strictly separated: **evaluation and execution never occur in the same agent for the same domain** (Axiom A0-4).

| Agent | Role | Executes? | Feeds Risk Engine? | Key Axioms |
|-------|------|-----------|---------------------|------------|
| **KRONOS** | Time-keeper and crank operator — drives on-chain heartbeat, triggers scheduled state transitions | On-chain cranks only | No | A0-5, A0-6 |
| **AEON** | Sovereign governor — creates agents, delegates authority, coordinates system-wide decisions | Delegates only | N/A | A0-1, A0-9 |
| **APOLLO** | DeFi risk evaluator — 3 modules: Pool Taxonomy, MLI (Market Liquidity Intelligence), Effective APR | Never | Yes, weight capped at 40% | A0-14, A0-15, A0-16 |
| **HERMES** | DeFi intelligence — 5 services for external consumption (terminal outputs) | Never | Never | A0-29, A0-30 |

**Critical separations:**
- APOLLO is the only risk-scoring agent. It never executes.
- APOLLO's output weight in the Risk Engine is hard-capped at 40% (A0-16). No single agent can dominate a decision.
- HERMES outputs are terminal — they exist for external consumption only and never enter the execution chain.
- Only AEON creates agents. Creation depth is fixed at 1. Hard cap: 100 agents (A0-1, A0-9).
- LLMs never make final decisions. All final decisions in AXIONBLADE are deterministic, versioned, and recordable.

---

## ⚡ Firewall Chain

The execution chain enforces strict separation between evaluation and action. Executors cannot read APOLLO's PDAs directly.

```
APOLLO
  │
  │  Writes risk assessment to:
  ▼
assessment_pda  (on-chain, read-only to executors)
  │
  │  Fed into:
  ▼
Risk Engine  ──────────────────────────────────────
  │          APOLLO weight hard-capped at ≤ 40%   │
  │          Minimum 2 independent evidence        │
  │          families required for execution       │
  │          Otherwise: ALERT-ONLY mode            │
  ▼                                               ─┘
AEON  (decision authority)
  │
  │  Delegates to authorized executor:
  ▼
Executor
  │
  │  Mandatory before any action:
  ▼
noumen_proof::log_decision()  ──→  Immutable on-chain proof
  │
  ▼
Action taken
```

**HERMES is not in this chain.** HERMES outputs are consumed externally (wallets, protocols, dashboards) and have no path into the execution pipeline. This is enforced by A0-29 and A0-30.

---

## 🔗 On-Chain Programs

Seven Anchor programs form the AXIONBLADE on-chain layer. Crate names are prefixed `noumen_*` — these are on-chain identifiers tied to deployed Program IDs. **Do not rename them.**

| Program | Description | Program ID |
|---------|-------------|------------|
| `noumen_core` | Agent governance, permissions, authority hierarchy | `9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE` |
| `noumen_proof` | Cryptographic decision logs, immutable proof PDAs | `3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV` |
| `noumen_treasury` | Revenue routing, CCS split, volume discounts | `EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu` |
| `noumen_apollo` | DeFi risk assessment — Pool Taxonomy, MLI, Effective APR | `92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee` |
| `noumen_hermes` | Intelligence services — terminal outputs for external consumption | `Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj` |
| `noumen_auditor` | Security incident registry, Truth Labels (HTL/EOL), precision metrics | `CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe` |
| `noumen_service` | Service registry, pricing enforcement, usage metrics | `9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY` |

An eighth program, `axionblade-token-vault`, handles token custody boundaries — AXIONBLADE never operates custodial vaults (A0-12).

All programs are written in Rust with Anchor 0.30.1. Overflow checks are enabled across all crates.

---

## 🛡️ Axiom System

AXIONBLADE's safety envelope is defined by **50 immutable axioms** (49 active + A0-2 deprecated). These axioms are enforced at Layer 0 — they cannot be modified without a full program redeploy. They are not configurable at runtime.

### Axioms by Category

| Category | Axioms | Count |
|----------|--------|-------|
| Agent Governance | A0-1, A0-9 | 2 |
| Separation of Functions | A0-4, A0-14, A0-15, A0-16, A0-29, A0-30 | 6 |
| Proofs and Auditability | A0-5, A0-6, A0-19, A0-20, A0-21, A0-26 | 6 |
| Security and Execution | A0-7, A0-10, A0-12, A0-13, A0-17, A0-18 | 6 |
| Economy and Treasury | A0-3, A0-8, A0-11, A0-28 | 4 |
| Donations | A0-22, A0-23, A0-24, A0-25, A0-27 | 5 |
| Deprecated | A0-2 | 1 |

### Key Constraints (Non-Negotiable)

```
Agent Creation        Only AEON creates agents. Depth = 1. Hard cap: 100.
Evaluation/Execution  Never in the same agent for the same domain.
Decision Logging      log_decision() is mandatory before any execution, without exception.
Evidence Threshold    Execution requires >= 2 independent evidence families.
                      Single-family signals → ALERT-ONLY. Executor is blocked.
Risk Engine Cap       APOLLO's weight in the Risk Engine is hard-capped at 40%.
Auto-Learning         Prohibited in production. No ML feedback loops during live operation.
Reserve Ratio         Treasury reserve must remain >= 25% at all times.
Daily Spend Limit     Treasury daily spend <= 3% of free balance.
Pricing Floor         Every service priced at cost + 20% minimum margin.
Custodial Vaults      AXIONBLADE never operates them. Period.
External Agents       Read-only access to NOUMEN PDAs. No write permissions.
Backtests             External agent backtests are in-memory only. Never persisted.
Historical Proofs     Immutable. Never deleted. Never modified.
```

The full axiom reference is in [`files/13_AXIOMAS_REFERENCIA.md`](files/13_AXIOMAS_REFERENCIA.md).

---

## 📋 Policy Layers

Not all parameters are axioms. Below axioms sit three policy layers with different governance delays:

| Layer | Name | Delay | Controls |
|-------|------|-------|----------|
| **Layer 0** | Axioms | Immutable (redeploy required) | All constraints listed above |
| **Layer 1** | Constitutional | 72h–30d delay, 7–30d cooldown | Budgets, CCS bands, evidence families, protocol allowlists |
| **Layer 2** | Operational | 24h delay/cooldown | Service prices, agent lifecycle, budget allocation |
| **Layer 3** | Tactical | Agent-adjustable | Monitored pools, update frequency, prioritization |

---

## 🔬 Evidence Families

Execution requires signals from at least 2 independent families. Two signals from the same family count as one.

| Family | Domain | Example Signals |
|--------|--------|----------------|
| **A — Price/Volume** | DEX on-chain price and volume | Price drop >X%, abnormal volume, spread widening |
| **B — Liquidity/Composition** | TVL, pool composition, concentration | TVL drain, critical concentration, pool imbalance |
| **C — Behavior/Pattern** | Wallet behavior patterns | Whale movement, mercenary liquidity, bot activity |
| **D — Incentive/Economic** | Incentive programs, APR, rewards | Incentive expiry, APR collapse, reward unsustainability |
| **E — Protocol/Governance** | Governance, upgrades, parameters | Adverse governance proposals, oracle updates, parameter changes |

If fewer than 2 independent families produce signals, the system switches to **ALERT-ONLY** mode. The Executor is prohibited from acting.

---

## 💰 Economic Model

Revenue comes exclusively from real usage — paid services, APIs, and A2A marketplace. There are no token emissions, no speculative mechanisms, and no revenue from donations.

### Revenue Tiers

| Tier | Target | Pricing |
|------|--------|---------|
| Entry | Individual wallets | 0.005–0.05 SOL per service |
| Premium | Power users | Volume discounts: 10% at 10 scans / 20% at 50 / 30% at 100 |
| B2B / A2A | Protocols, agents | Enterprise pricing (must still clear cost + 20% floor) |

### Revenue Routing (CCS — Creator Capture System)

Revenue is routed across four buckets, enforced on-chain by `noumen_treasury`:

```
Operations    40%   (RPC, compute, storage)
Treasury      30%   (reserve buffer, runway)
Dev Fund      15%   (continuous development)
Creator       15%   (cap: 15%, floor: 4%, stipend cap: 5%)
```

**CCS constraints (A0-28):**
- Total creator capture: maximum 15%, minimum 4%
- Stipend cap: 5% of 30-day average revenue
- CCS bands are Layer 1 (30-day delay to change)
- Floor, cap, and stipend cap are Layer 0 (immutable)

### Sustainability Rules

- Every service must cover its costs or be discontinued after a maximum **90-day** subsidy period
- Pricing floor: cost + 20% margin — enforced by A0-8, non-negotiable
- Services that do not achieve positive unit economics are auto-discontinued
- The system scales only when there is measured demand — never preemptively

### Donations

Donations go to a separate Donation PDA. They are swept daily to Treasury and do **not** pass through the CCS split — they are not service revenue. Conditional donations are rejected (anti-masquerade rule, A0-25). Donations confer no rights, no priority, and no influence whatsoever (A0-22).

---

## 🖥️ Tech Stack

### Smart Contracts

```
Language:     Rust (overflow-checks = true across all crates)
Framework:    Anchor 0.30.1
Network:      Solana (Devnet → Mainnet-beta)
Programs:     7 Anchor programs (~8,000 lines Rust)
PDAs:         All state held in Program Derived Addresses
Security:     Anti-replay, authority permissions, checked arithmetic
```

### Frontend

```
Framework:    Next.js 16 (App Router)
Language:     TypeScript
UI Library:   React 19
Styling:      Tailwind CSS v4
Animation:    Framer Motion
Wallet:       @solana/web3.js, @solana/wallet-adapter
Hosting:      Vercel
```

### Infrastructure

```
RPC:          Helius (primary), public endpoints (fallback)
Payment:      On-chain verification via Solana RPC (no mock)
Rate Limit:   10 req/min per wallet
Agents:       Template-based deterministic (no ML black-box)
```

### Wallet Support

Phantom, Solflare, Coinbase Wallet, Ledger, Trust Wallet, WalletConnect, Solana Mobile, TipLink (covers ~95% of Solana users).

---

## 🚀 Getting Started

### Prerequisites

```bash
node >= 18
rust >= 1.75
anchor-cli >= 0.30.1
solana-cli >= 1.18
```

### Clone

```bash
git clone https://github.com/Martiano2023/AXIONBLADE.git
cd AXIONBLADE
```

### Install Frontend Dependencies

```bash
cd app
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm run start
```

### Build Smart Contracts

```bash
cd contracts
anchor build
```

### Run Contract Tests

```bash
cd contracts
anchor test
```

### Deploy to Devnet

```bash
cd contracts
anchor deploy --provider.cluster devnet
```

For mainnet deployment, refer to [`scripts/`](scripts/) and the deployment guide in [`files/`](files/).

---

## 🔒 Security

### Architectural Guarantees

- **Proof before action**: No execution can occur without a prior `log_decision()` call logged immutably on-chain.
- **Separation of concerns**: The agent that evaluates risk (APOLLO) is architecturally prohibited from executing (A0-14). This is not a convention — it is an on-chain permission boundary.
- **Firewall isolation**: Executors cannot read APOLLO PDAs directly (A0-15). The Risk Engine is the only bridge, and it caps APOLLO's weight at 40%.
- **Evidence quorum**: A single signal source is never sufficient for execution. At least 2 independent evidence families must be active (A0-17).
- **No auto-learning**: The system cannot modify its own models or heuristics during live operation (A0-13). Model updates require a Layer 1 governance proposal with 72-hour delay.
- **No custodial vaults**: AXIONBLADE never holds user funds in custodial structures (A0-12).
- **External agents read-only**: Third-party agents can read NOUMEN PDAs but cannot write to any system state (A0-7).
- **Immutable history**: Proof PDAs are never deleted or modified. The full decision history is always available on-chain (A0-6).

### Meta-Circuit-Breaker

The system has a system-wide circuit breaker that triggers on the following conditions:

| Trigger | Threshold |
|---------|-----------|
| Treasury health score | Below 15 for 12 consecutive hours |
| Agents failing simultaneously | 3 or more |
| Revenue/cost ratio | Below 0.5x for 5 consecutive days |
| Individual circuit breakers fired | 2 or more in same day |
| External agent disconnection | 50% or more simultaneously |
| Intent verification rejection rate | Above 60% in 24 hours |
| Published accuracy | Below 70% |

**When triggered:** Execution is paused. Read-only access and the Auditor remain active. Diagnosis proceeds. Recovery is gradual: reduced operations → ultra-conservative mode → normal operations.

### Audit Principles

- Security incidents are registered exclusively by `noumen_auditor` (A0-19).
- Truth Labels (HTL and EOL) are calculated exclusively by the Auditor (A0-20).
- Precision metrics are computed only over outcomes with a resolved observation window (A0-21).
- All paid outputs include `not_investment_advice`, `uncertainty_flags`, and `decision_class` in the canonical hash (A0-26).

---

## 🤝 Contributing

### Before You Propose Anything

Every proposed change must pass the innovation checklist from `files/00_IDENTIDADE`:

```
[ ] Is there real, demonstrated demand for this?
[ ] Is that demand recurrent — not a one-time need?
[ ] What is the attack surface introduced?
[ ] Does it violate any of the 50 axioms? (If yes: rejected.)
[ ] Does it require custody of user funds?
[ ] Is every step of the decision auditable?
[ ] Does it fail safely if something goes wrong?
[ ] Can it be disabled without taking down the rest of the system?
```

If any answer is wrong, the proposal is rejected. This is not a negotiation.

### Axiom Compliance Check

Every pull request that touches contracts or agent logic must include a statement confirming that all 50 axioms have been verified against the change. Any axiom violation means the PR is closed.

### What You Can Contribute

- Bug fixes with reproduction steps and proof that the fix does not alter any axiom behavior
- Frontend improvements (UI, performance, new service integrations)
- Documentation corrections and clarifications
- Test coverage for existing contract instructions
- New service proposals that pass the innovation checklist and clear the 90-day sustainability requirement

### What You Cannot Change

- `noumen_*` crate names, Cargo.toml entries, PDA seeds, or IDL filenames — these are on-chain identifiers
- Any Layer 0 axiom without a full program redeploy and governance process
- The firewall chain architecture — APOLLO never executes, HERMES never feeds the Risk Engine

### Development Workflow

```bash
# Always verify axiom compliance before opening a PR
# Read architecture documents in files/ in order (00 → 13)
# Each document is a delta on the previous — read all of them

git checkout -b feature/your-change
# make changes
# verify axioms
# run tests
git push origin feature/your-change
# open PR with axiom compliance statement
```

---

## 📄 License

MIT License

Copyright (c) 2024 AXIONBLADE

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

<div align="center">

**AXIONBLADE — Because every decision deserves proof.**

Built on Solana. Governed by axioms. Auditable forever.

[GitHub](https://github.com/Martiano2023/AXIONBLADE) · [Architecture Docs](files/) · [Axiom Reference](files/13_AXIOMAS_REFERENCIA.md)

</div>
