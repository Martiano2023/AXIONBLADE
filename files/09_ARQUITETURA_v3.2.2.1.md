# NOUMEN v3.2.2.1 — Micro-Patch

> CCS Corrigido (cap 15%, piso 4%), Cap Total, External Revenue, A0-28

---

## Delta v3.2.2 → v3.2.2.1

| # | Mudança |
|---|---|
| D12 | A0-2 preservado como histórico (DEPRECATED); A0-28 define CCS |
| D13 | Cap total de captura (split + stipend) ≤ 15% |
| D14 | Faixas recalibradas: teto 15%, piso 4% |
| D15 | Regra determinística de `external_revenue` |
| D16 | Donation PDA aceita apenas SystemProgram transfer |
| D17 | `decision_class` renomeado (INFO, LIMITED_RELIABILITY, RISK_WARNING, DANGER_SIGNAL) |

---

## A0-28 — Creator Compensation Structure

> Cap total 15%, piso base split 4%, cap stipend 5%. Imutáveis sem redeploy.

### Faixas

| Faixa receita/dia (média 7d) | Base Split | Stipend máx (cap 15%) | Total máx |
|---|---|---|---|
| 0 – 1 SOL | 12% | 3% | 15% |
| 1 – 10 SOL | 10% | 5% | 15% |
| 10 – 50 SOL | 7% | 5% | 12% |
| > 50 SOL | 4% | 5% | 9% |

### Cenários econômicos

| Cenário | Receita/dia | Total Creator | Treasury retém |
|---|---|---|---|
| Fase crítica | 0.5 SOL | 0.075 SOL | 0.425 SOL |
| Crescimento | 5 SOL | 0.75 SOL | 4.25 SOL |
| Escala | 30 SOL | 3.60 SOL | 26.40 SOL |
| Alta escala | 100 SOL | 9.00 SOL | 91.00 SOL |

---

## External Revenue — Regra Determinística

### System actors
```
creator_wallet, maintainer_wallet, treasury_pda, donation_pda,
agent_pdas, service_pdas
```

### Classificação

| Origem | Classificação | Conta p/ faixa? |
|---|---|---|
| Wallet fora de system_actors | external_revenue | Sim |
| Wallet em system_actors | internal_revenue | Não |
| Padrão circular (paga + recebe em 24h) | suspicious_circular | Não |
| Wallet > 25% da receita em 7d | concentrated_revenue | Não |

---

## Ajuste Futuro por IA

O que IA pode ajustar (Camada 1, delay 30d):
- Percentuais das faixas intermediárias
- Thresholds de receita

O que IA NUNCA pode ajustar:
- Piso 4%
- Cap total 15%
- Cap stipend 5%

---

## Safety Envelope v3.2.2.1

**A0-2:** DEPRECATED  
**A0-28:** CCS (cap 15%, piso 4%, stipend 5%)

**27 axiomas ativos** (A0-1 ativo, A0-2 deprecated, A0-3 a A0-28 ativos)
