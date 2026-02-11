# NOUMEN v3.2.3 — Introdução do Agente HERMES

> DeFi Intelligence Agent — Especificação, Integração e Impacto Sistêmico

---

## Delta v3.2.2.3 → v3.2.3

| # | Mudança |
|---|---|
| D25 | Agente HERMES como segundo agente-filho do AEON |
| D26 | Diferenciação APOLLO vs HERMES |
| D27 | 5 serviços HERMES com I/O canônico |
| D28 | Integração econômica |
| D29 | A0-29, A0-30 + políticas Camada 1 |
| D30 | Impacto em escala e riscos |

---

## APOLLO vs HERMES

| Dimensão | APOLLO | HERMES |
|---|---|---|
| Pergunta | "Isso é perigoso?" | "Como funciona a economia?" |
| Output | Sinais de risco | Relatórios de inteligência |
| Consumidor | Risk Engine (interno) | Humanos e agentes (externo) |
| Influência em execução | Sim (via Risk Engine ≤ 40%) | Nunca |
| Monetização | Indireta + Yield Brief | Direta (5 serviços) |

---

## HERMES Manifest

```
agent_id: HERMES
parent_id: AEON
type: EVALUATOR
execution_permission: NEVER

scope: [
  EFFECTIVE_APR_REPORTING,
  RISK_DECOMPOSITION_VECTOR,
  YIELD_TRAP_INTELLIGENCE,
  POOL_COMPARISON_ANALYSIS,
  PROTOCOL_HEALTH_SNAPSHOT
]

prohibited_actions: [
  ...todos do APOLLO +
  EMIT_RISK_SIGNALS (exclusivo APOLLO),
  FEED_RISK_ENGINE_DIRECTLY,
  WRITE_TO_APOLLO_PDA
]

budget: ≤ 15% saldo livre
ttl: 180 dias
```

---

## 5 Serviços HERMES

### H1. Effective APR Report
- Migrado de APOLLO para HERMES
- Relatório completo com decomposição, MLI, taxonomy, rewards, IL
- Tier: Pro+ ou 0.01 SOL. Proof individual.

### H2. Risk Decomposition Vector
- 7 dimensões de risco com confidence individual
- Para agentes via A2A marketplace
- Tier: Agency/Enterprise. Proof batch.

### H3. Yield Trap Intelligence
- Relatório explicativo sobre traps detectadas pelo APOLLO
- Requer sinal APOLLO prévio (não detecta independentemente)
- Tier: Pro. Event-driven. Proof individual.

### H4. Pool Comparison
- Comparação 2–5 pools do mesmo pair_class
- Ranking por score composto (fórmula publicada no schema)
- Tier: Pro. ~0.008 SOL. Proof individual.

### H5. Protocol Health Snapshot
- Avaliação de protocolo inteiro (Orca, Raydium, Meteora, etc.)
- TVL, pools, APR médio, concentração, incidentes
- Tier: Premium. ~0.02 SOL. Semanal ou sob demanda.

---

## Coordenação APOLLO + HERMES

```
Data Collector → APOLLO → assessment_pda (risk signals)
Data Collector → HERMES → report_pda (intelligence reports)
                    ↑
            HERMES lê apollo_assessment_pda (read-only)
```

- HERMES nunca entra na cadeia de execução
- Divergência > 20 pontos por > 7 dias em > 5 pools → Auditor investiga

---

## Novos Axiomas

**A0-29:** HERMES nunca alimenta Risk Engine diretamente. Terminal: consumo externo apenas.

**A0-30:** HERMES não emite sinais de risco operacionais. Escopo exclusivo do APOLLO.

### Budget combinado
`total_evaluator_budget (APOLLO + HERMES) ≤ 25% saldo_livre`

---

## Condições de Ativação

| Etapa | Condição |
|---|---|
| HERMES Level 0 | APOLLO L2 ≥ 30d + ≥ 3 serviços APOLLO ROI ≥ 1.0x |
| HERMES Level 1 | L0 ≥ 14d + treasury > 60 + birth bond + ≥ 10 req/dia waitlist |
| HERMES Level 2 | L1 ≥ 30d + ≥ 1 relatório vendido + custo no budget |
| Yield Trap Intel | APOLLO trap detection L2 ≥ 60d + acerto ≥ 80% |
| Protocol Snapshot | ≥ 3 protocolos com ≥ 5 pools avaliados |

---

## Contagem Final

| Total enumerados | 30 |
|---|---|
| **Total ativos** | **29** |
| **Deprecated** | **1** (A0-2) |
