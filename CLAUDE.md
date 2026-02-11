# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NOUMEN is an autonomous risk assessment infrastructure with verifiable proof, designed to operate in DeFi and Agent-to-Agent environments on Solana. This repository contains **architecture design documents only** (no source code). The current version is **v3.2.3**.

Core principle: NOUMEN never executes anything without prior proof of decision and never makes decisions that cannot be retroactively audited.

## Repository Structure

All documents live in `files/` and follow numbered ordering. `INDICE_MESTRE.md` is the master index. Documents are incremental — each version builds on previous ones via delta tables.

- **00**: Identity and non-negotiable principles
- **01**: Initial technical consultancy (risks, prioritization, demo)
- **02**: Multi-agent evolution (coordination, economy, security)
- **03**: APOLLO conceptual design
- **04–12**: Architecture versions v3.0 through v3.2.3 (incremental refinements)
- **13**: Complete axiom reference (29 active, 1 deprecated)

## Architecture — Three Agents

| Agent | Role | Executes? | Feeds Risk Engine? |
|-------|------|-----------|-------------------|
| **AEON** | Sovereign governor — delegates, coordinates, decides | Delegates only | N/A |
| **APOLLO** | DeFi risk evaluator — 3 modules (Pool Taxonomy, MLI, Effective APR) | NEVER | Yes (weight capped at 40%) |
| **HERMES** | DeFi intelligence — 5 services for external consumption | NEVER | NEVER |

**Firewall chain**: `APOLLO -> assessment_pda -> Risk Engine (<=40%) -> AEON -> Executor`. Executors never read APOLLO's PDAs directly. HERMES outputs are terminal (external consumption only, never enters execution chain).

## Axiom System (Safety Envelope)

29 immutable axioms (A0-1 through A0-30, with A0-2 deprecated) organized into categories: agent governance, separation of functions, proofs/auditability, security/execution, economy/treasury, and donations. Key constraints:

- Only AEON creates agents (depth = 1), hard cap 100 agents
- Evaluation and execution never in the same agent for the same domain
- `log_decision` mandatory before any execution
- Execution requires >= 2 independent evidence families (5 families: Price/Volume, Liquidity, Behavior, Incentive, Protocol) — otherwise ALERT-ONLY
- Auto-learning in production is prohibited
- Reserve ratio >= 25%, daily treasury spend <= 3% of free balance
- CCS: total creator capture capped at 15%, floor 4%, stipend cap 5%
- Donations confer no rights, priority, or influence

## Policy Layers

- **Layer 0** (Axioms): Immutable without contract redeploy
- **Layer 1** (Constitutional): 72h–30d delay, 7–30d cooldown — budgets, evidence families, CCS bands, protocol allowlists
- **Layer 2** (Operational): 24h delay/cooldown — prices, agent lifecycle, budget allocation
- **Layer 3** (Tactical): Agent-adjustable — monitored pools, update frequency, prioritization

## Economic Model

Revenue comes exclusively from real usage (paid services, APIs, A2A marketplace). Services are tiered: Entry, Premium, B2B/Agent-to-Agent. Every service must cover its cost or be discontinued after a defined subsidy period (max 90 days). Pricing floor: cost + 20% margin.

Donations go to a separate Donation PDA, swept daily to Treasury without passing through the CCS split. Anti-masquerade rule: conditional donations are rejected.

## Key Rules When Working With These Documents

- Each architecture version is a **delta** on the previous — read them in order to understand the full picture
- When proposing changes, verify against all 29 active axioms; any violation means the idea is rejected
- Innovation checklist (from `00_IDENTIDADE`): real demand? recurrence? attack surface? breaks axiom? requires custody? auditable? fails safely? can be disabled without killing the system?
- LLMs never make final decisions in NOUMEN — all final decisions are deterministic, versioned, and recordable
- The system scales only when there is measured demand, never preemptively
