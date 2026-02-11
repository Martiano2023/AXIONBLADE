# NOUMEN v3.2.2.2 — Micro-Patch Final

> Treasury Accounting, Anchor Client, Donation Sweep, Creator Framing

---

## Delta v3.2.2.1 → v3.2.2.2

| # | Mudança |
|---|---|
| D18 | Treasury accounting: pre-stipend vs post-stipend |
| D19 | Concentrated revenue com ramp-up 30 dias (anchor client) |
| D20 | Donation PDA: todo SOL entra, só transfer puro gera receipt válido |
| D21 | Framing piso 4%: neutro, defensável |

---

## Treasury Accounting

| Faixa | Base Split | Treasury pre-stipend | Stipend máx | Treasury post-stipend |
|---|---|---|---|---|
| 0–1 SOL | 12% | 88% | 3% | 85% |
| 1–10 SOL | 10% | 90% | 5% | 85% |
| 10–50 SOL | 7% | 93% | 5% | 88% |
| >50 SOL | 4% | 96% | 5% | 91% |

---

## Anchor Client Ramp-up

| Duração (wallet >25%) | Classificação | Peso na faixa |
|---|---|---|
| Dias 1–7 | concentrated_new | 0% |
| Dias 8–30 | concentrated_probation | 50% |
| Dia 31+ | anchor_client | 100% |

---

## Donation Sweep Simplificado

| Tipo tx recebida | SOL → Treasury? | Receipt? | Status |
|---|---|---|---|
| SystemProgram::Transfer puro | Sim | Sim | VALID_DONATION |
| Outro formato | Sim | Sim (com flag) | UNRECOGNIZED_FORMAT |

---

## Framing do Piso 4%

O piso existe para:
1. Alinhamento de longo prazo
2. Compensação pela criação original
3. Proporcionalidade (zero se receita zero)

O que NÃO é: salário, renda garantida, irrevogável (redeploy possível).
