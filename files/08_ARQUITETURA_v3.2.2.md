# NOUMEN v3.2.2 — Patch de Refinamento

> Donation Privacy, Anti-Masquerade, Schema Canônico, Economia do Creator (CCS)

---

## Delta v3.2.1 → v3.2.2

| # | Mudança |
|---|---|
| D7 | Donation receipts: `source_wallet_hash` por default (pseudônimo) |
| D8 | Anti-masquerade: definição formal doação vs. pagamento |
| D9 | Schema: `not_investment_advice`, `uncertainty_flags`, `decision_class` |
| D10 | CCS — Creator Compensation Structure (split variável + stipend + milestones) |
| D11 | A0-25 (anti-masquerade), A0-26 (schema obrigatório), A0-27 (pseudônimo default) |

---

## Donation Privacy

### Default: pseudônimo
- `source_wallet_hash` (SHA-256, não wallet em claro)
- Opt-in disclosure se doador quiser

---

## Anti-Masquerade (A0-25)

| Condição | Classificação |
|---|---|
| Transfer puro para Donation PDA | Doação |
| Via `pay_for_service` | Pagamento (com split) |
| Donation PDA COM memo de serviço | Rejeitado |
| Direto para Treasury (bypass) | Rejeitado |

---

## Schema Canônico — Campos de Proteção

```json
"legal_classification": {
  "not_investment_advice": true,
  "decision_class": "INFO | LIMITED_RELIABILITY | RISK_WARNING | DANGER_SIGNAL",
  "uncertainty_flags": [
    "LOW_DATA_QUALITY", "LOW_CONFIDENCE", "UNKNOWN_CLAIMABILITY",
    "ILLIQUID_REWARD", "HIGH_MERCENARY_LIQUIDITY", "INCENTIVE_EXPIRING_SOON",
    "NEW_POOL", "SINGLE_SOURCE", "IL_PROJECTION_UNCERTAIN"
  ]
}
```

---

## Creator Compensation Structure (CCS)

### Estrutura de 3 componentes

#### 1. Base Split (variável por faixa)

| Faixa receita/dia | Creator % | Treasury % |
|---|---|---|
| 0 – 1 SOL | 20% | 80% |
| 1 – 10 SOL | 15% | 85% |
| 10 – 50 SOL | 12% | 88% |
| > 50 SOL | 10% | 90% |

#### 2. Maintenance Stipend
- ≤ 5% receita média 30d
- Condicionado a manutenção ativa comprovável
- Revogável pelo AEON

#### 3. Milestone Bonus
- Sustentabilidade (ratio > 1.0 por 90d): 2% treasury
- Escala (≥ 5k consultas/dia): 1%
- B2B (≥ 5 agentes 60d): 1%
- Resiliência (sobreviveu circuit breaker): 1%

### A0-2 atualizado para CCS com piso 10% e teto 20%

---

## Safety Envelope v3.2.2

**A0-25:** Anti-masquerade  
**A0-26:** Schema obrigatório (not_advice + flags + class)  
**A0-27:** Donation pseudônimo por default
