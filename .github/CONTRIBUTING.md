# Contributing to AXIONBLADE

Thank you for your interest in contributing. AXIONBLADE is a precision-engineered system with strict architectural constraints. Please read this document in full before opening any issue or pull request.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Before You Start](#before-you-start)
- [Innovation Checklist](#innovation-checklist)
- [What You Can Contribute](#what-you-can-contribute)
- [What You Cannot Change](#what-you-cannot-change)
- [Development Setup](#development-setup)
- [Branch Naming](#branch-naming)
- [Commit Style](#commit-style)
- [Pull Request Process](#pull-request-process)
- [Axiom Compliance Statement](#axiom-compliance-statement)
- [Responsible Disclosure](#responsible-disclosure)

---

## Code of Conduct

This project is technical infrastructure. Contributions are evaluated on correctness, security, and architectural compliance — not seniority, reputation, or relationship. Be direct, be precise, be respectful.

---

## Before You Start

Read the architecture documents in order before touching any code. Each file in `files/` is a delta on the previous — skipping ahead means missing context that is non-negotiable.

```
files/00_IDENTIDADE_AXIONBLADE.md         Identity and principles
files/01_CONSULTORIA_TECNICA_INICIAL.md   Technical baseline
files/02 → 12                             Architecture v3.0 through v3.2.3
files/13_AXIOMAS_REFERENCIA.md            Canonical axiom reference (50 axioms)
files/INDICE_MESTRE.md                    Master index
```

If your proposal conflicts with any of these documents, it will be rejected without further discussion.

---

## Innovation Checklist

Every change — whether a new feature, a refactor, or a new service — must pass this checklist before any PR is opened:

```
[ ] Is there real, demonstrated demand for this? (Not hypothetical)
[ ] Is that demand recurrent — not a one-time or edge-case need?
[ ] What attack surface does this introduce or expand?
[ ] Does it violate any of the 50 axioms?
      If yes: the idea is rejected. This is not negotiable.
[ ] Does it require custody of user funds?
      If yes: the idea is rejected (A0-12).
[ ] Is every step of the decision auditable retroactively?
[ ] Does it fail safely if something goes wrong?
[ ] Can it be disabled without taking down the rest of the system?
```

Any "wrong" answer to the above means the proposal is rejected. Document your answers in the PR description.

---

## What You Can Contribute

- **Bug fixes** — with a reproduction case and confirmation that the fix does not alter axiom-governed behavior
- **Frontend improvements** — UI, performance, new service integrations, accessibility
- **Documentation corrections** — fixing inaccuracies, improving clarity
- **Test coverage** — additional test cases for existing contract instructions
- **New service proposals** — that pass the innovation checklist, clear the 90-day sustainability requirement, and are approved via the Layer 1 governance process
- **Tooling** — improvements to build, CI, or developer experience

---

## What You Cannot Change

The following are hard constraints. PRs that modify these items will be closed without review:

- **`noumen_*` crate names** — on-chain identifiers tied to deployed Program IDs. Renaming them breaks the deployed system.
- **Cargo.toml crate names, PDA seeds, or IDL filenames** — for the same reason.
- **Any Layer 0 axiom** — axioms are immutable without a full program redeploy and a formal governance process.
- **The firewall chain architecture** — APOLLO never executes. HERMES never feeds the Risk Engine. These are A0-4, A0-15, and A0-29.
- **`log_decision()` requirement** — this call is mandatory before every execution. Removing or bypassing it violates A0-5.
- **The Risk Engine cap** — APOLLO's weight is hard-capped at 40% (A0-16). This is not a tunable parameter.

---

## Development Setup

### Prerequisites

```bash
node    >= 18.0.0
rust    >= 1.75.0
anchor  >= 0.30.1
solana  >= 1.18.0
```

### Frontend

```bash
cd app
npm install
cp .env.local.example .env.local
# Fill in: NEXT_PUBLIC_RPC_ENDPOINT, NEXT_PUBLIC_NETWORK
npm run dev
```

### Contracts

```bash
cd contracts
anchor build
anchor test   # All tests must pass before opening a PR
```

### Linting

```bash
# Frontend
cd app && npm run lint

# Contracts (Clippy)
cd contracts && cargo clippy -- -D warnings
```

---

## Branch Naming

```
feature/<short-description>     New capability
fix/<issue-number-or-topic>     Bug fix
docs/<topic>                    Documentation changes only
refactor/<scope>                Code restructuring, no behavior change
test/<scope>                    Test coverage additions
ci/<topic>                      CI/CD changes
```

Examples:
- `feature/hermes-pool-comparison-ui`
- `fix/treasury-reserve-calculation`
- `docs/axiom-reference-update`

---

## Commit Style

Use conventional commits. Keep the subject line under 72 characters.

```
<type>(<scope>): <subject>

<body — optional, wraps at 72 chars>

<footer — issue refs, breaking change notes>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `chore`

Examples:
```
feat(hermes): add pool comparison endpoint with risk decomposition
fix(treasury): correct reserve ratio check in daily spend guard
docs(axioms): clarify A0-17 evidence quorum requirement
test(noumen-proof): add replay attack prevention coverage
```

---

## Pull Request Process

1. **Open an issue first** for any non-trivial change. Describe what you are changing and why. Wait for a maintainer to confirm the direction before writing significant code.

2. **Branch from `main`**. Do not branch from other feature branches.

3. **Keep PRs focused**. One logical change per PR. Mixed concerns will be asked to split.

4. **Include in your PR description:**
   - What this changes and why
   - Innovation checklist answers (all 8)
   - Axiom compliance statement (see below)
   - Test evidence (screenshots, logs, or test output)
   - For contract changes: which instructions are affected and how

5. **All CI checks must pass** before a PR will be reviewed.

6. **Contract changes require extra review time** — plan for at least 5 business days.

7. **Do not merge your own PRs**. At least one maintainer approval is required.

---

## Axiom Compliance Statement

Every PR touching contracts, agent logic, pricing, treasury, or the Risk Engine must include the following statement in the PR description, filled out honestly:

```
## Axiom Compliance

I have read all 50 axioms in files/13_AXIOMAS_REFERENCIA.md and verified
that this change does not violate any active axiom.

Axioms most relevant to this change:
- A0-X: [name] — [how this change relates or why it is unaffected]
- A0-Y: [name] — [how this change relates or why it is unaffected]

No axiom is violated by this change.
```

A PR with a missing or incomplete axiom compliance statement will not be reviewed.

---

## Responsible Disclosure

If you discover a security vulnerability in the contracts or the frontend, **do not open a public issue**.

1. Email the maintainers at the address listed in the repository's security contacts.
2. Include a description of the vulnerability, reproduction steps, and your assessment of impact.
3. Allow up to 72 hours for an initial response.
4. Do not disclose publicly until a fix has been deployed and you have received confirmation.

Vulnerabilities that affect on-chain funds or the axiom enforcement layer are treated with the highest priority.
