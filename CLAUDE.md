# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AXIONBLADE is an autonomous risk assessment infrastructure with verifiable proof, designed to operate in DeFi and Agent-to-Agent environments on Solana. The current version is **v3.4.0**.

Core principle: AXIONBLADE never executes anything without prior proof of decision and never makes decisions that cannot be retroactively audited.

## Repository Structure

- **app/** — Next.js 16 frontend (React, Tailwind CSS v4, Framer Motion)
- **contracts/** — Anchor workspace with 7 Solana programs (crate names: `noumen_*` — on-chain identifiers, do not rename)
- **contracts/scripts/** — Deployment and initialization scripts
- **contracts/keys/** — Authority keypairs (super, aeon, keeper)
- **files/** — Architecture design documents (numbered, incremental deltas)
- **scripts/** — Root-level mainnet deployment scripts

All architecture documents live in `files/` and follow numbered ordering. `INDICE_MESTRE.md` is the master index.

- **00**: Identity and non-negotiable principles
- **01**: Initial technical consultancy (risks, prioritization, demo)
- **02**: Multi-agent evolution (coordination, economy, security)
- **03**: APOLLO conceptual design
- **04–12**: Architecture versions v3.0 through v3.2.3 (incremental refinements)
- **13**: Complete axiom reference (49 active, 1 deprecated — A0-2)

## Architecture — Four Agents

| Agent | Role | Executes? | Feeds Risk Engine? |
|-------|------|-----------|-------------------|
| **AEON** | Sovereign governor — delegates, coordinates, decides | Delegates only | N/A |
| **APOLLO** | DeFi risk evaluator — 3 modules (Pool Taxonomy, MLI, Effective APR) | NEVER | Yes (weight capped at 40%) |
| **HERMES** | DeFi intelligence — 5 services for external consumption | NEVER | NEVER |
| **KRONOS** | Economic operator — permissionless cranks with proof emission | Cranks only | NEVER |

**Firewall chain**: `APOLLO -> assessment_pda -> Risk Engine (<=40%) -> AEON -> Executor`. Executors never read APOLLO's PDAs directly. HERMES outputs are terminal (external consumption only, never enters execution chain).

## On-Chain Programs (contracts/)

The 7 Anchor programs use `noumen_*` crate names — these are on-chain identifiers tied to deployed Program IDs and **must not be renamed**:

| Program | Program ID |
|---------|-----------|
| noumen_core | `9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE` |
| noumen_proof | `3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV` |
| noumen_treasury | `EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu` |
| noumen_apollo | `92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee` |
| noumen_hermes | `Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj` |
| noumen_auditor | `CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe` |
| noumen_service | `9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY` |

## Axiom System (Safety Envelope)

50 axioms (A0-1 through A0-50, with A0-2 deprecated — 49 active) organized into categories: agent governance, separation of functions, proofs/auditability, security/execution, economy/treasury, donations, and KRONOS token launch. Key constraints:

- Only AEON creates agents (depth = 1), hard cap 100 agents
- Evaluation and execution never in the same agent for the same domain
- `log_decision` mandatory before any execution
- Execution requires >= 2 independent evidence families (5 families: Price/Volume, Liquidity, Behavior, Incentive, Protocol) — otherwise ALERT-ONLY
- Auto-learning in production is prohibited
- Reserve ratio >= 25%, daily treasury spend <= 3% of free balance
- CCS: total creator capture capped at 15%, floor 4%, stipend cap 5%
- Donations confer no rights, priority, or influence
- KRONOS runs only permissionless cranks with proof emission (A0-44)
- Token launch requires KRONOS proof + 72h delay (A0-46)
- Burn budget never reduces emergency reserve below min ratio (A0-45)

## Policy Layers

- **Layer 0** (Axioms): Immutable without contract redeploy
- **Layer 1** (Constitutional): 72h–30d delay, 7–30d cooldown — budgets, evidence families, CCS bands, protocol allowlists
- **Layer 2** (Operational): 24h delay/cooldown — prices, agent lifecycle, budget allocation
- **Layer 3** (Tactical): Agent-adjustable — monitored pools, update frequency, prioritization

## Economic Model

Revenue comes exclusively from real usage (paid services, APIs, A2A marketplace). Services are tiered: Entry, Premium, B2B/Agent-to-Agent. Every service must cover its cost or be discontinued after a defined subsidy period (max 90 days). Price target: cost × 3.0 (+200% margin). Price floor: cost × 2.0 (+100% margin). Revenue split on NET: 40% Operations / 45% Treasury Reserve / 15% Creator.

Donations go to a separate Donation PDA, swept daily to Treasury without passing through the CCS split. Anti-masquerade rule: conditional donations are rejected.

## Key Rules When Working With This Codebase

- Each architecture version is a **delta** on the previous — read them in order to understand the full picture
- When proposing changes, verify against all 49 active axioms; any violation means the idea is rejected
- Innovation checklist (from `00_IDENTIDADE`): real demand? recurrence? attack surface? breaks axiom? requires custody? auditable? fails safely? can be disabled without killing the system?
- LLMs never make final decisions in AXIONBLADE — all final decisions are deterministic, versioned, and recordable
- The system scales only when there is measured demand, never preemptively
- **Do not rename** `noumen_*` program crate names, Cargo.toml entries, PDA seeds, or IDL filenames — these are on-chain identifiers
