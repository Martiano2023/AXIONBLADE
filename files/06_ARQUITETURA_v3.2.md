# NOUMEN v3.2 — Refinamento Arquitetônico

> **Conversa 6** — Dual-Label Outcomes, Security Incident Registry, Minimum Independent Evidence, APOLLO Solana Modules

---

## 1. DUAL-LABEL OUTCOMES (HTL + EOL)

### Hard Truth Label (HTL) — técnico
Mede se a avaliação estava tecnicamente correta.

### Economic Outcome Label (EOL) — impacto real
Mede se o sinal teve impacto econômico real para quem o consumiu.

| Sinal | HTL | EOL |
|---|---|---|
| YIELD_TRAP | APR pós-incentivo < 30% headline | Drawdown evitável |
| POOL_HEALTHY | Sem evento adverso | Retorno líquido ≥ 0 |
| IL_RISK_HIGH | IL realizado > projetado × 1.2 | Custo de inação vs. saída |
| CONCENTRATION_CRITICAL | Top LP retira > 50% | Impacto em slippage |

### Métricas publicadas on-chain
- HTL Accuracy > 88%
- EOL Positive Rate > 75%
- Average Drawdown Evitável (reportada)
- False Alarm Cost (reportada)
- Brier Score < 0.12

---

## 2. SECURITY INCIDENT REGISTRY

### Classificação: CONFIRMED / UNCONFIRMED

| Tipo | Critério CONFIRMED |
|---|---|
| EXPLOIT | Transação anormal + TVL > -30% em < 1h |
| RUG_PULL | Wallet controladora retira > 50% + inoperante |
| LIQUIDITY_DRAIN | TVL > -50% em < 24h + ≤ 5 wallets |
| ORACLE_MANIPULATION | Divergência > 30% por > 5min |
| INCENTIVE_COLLAPSE | APR > -70% em < 48h + TVL > -30% |

### Regras
- Somente Auditor registra
- UNCONFIRMED → CONFIRMED ou DISMISSED em 72h
- Incidentes CONFIRMED afetam HTL
- "Missed incidents" publicados separadamente

---

## 3. MINIMUM INDEPENDENT EVIDENCE

### Regra
> Execução exige ≥ 2 famílias de evidência independentes. Se apenas 1 família → ALERT-ONLY.

### 5 famílias
| Família | Fonte |
|---|---|
| A: Price/Volume | Preço e volume DEXs |
| B: Liquidity/Composition | TVL, concentração |
| C: Behavior/Pattern | Wallets, bots |
| D: Incentive/Economic | APR, rewards |
| E: Protocol/Governance | Governance, upgrades |

### Axiomas
- 2 sinais da mesma família = 1
- APOLLO sozinho nunca suficiente
- ALERT-ONLY = Executor proibido
- Auditor monitora cumprimento

---

## 4. APOLLO — MÓDULOS SOLANA

### Módulo 1: Pool Taxonomy Layer
Classifica pools por tipo, protocolo, par, perfil de risco, IL sensitivity.

### Módulo 2: Mercenary Liquidity Index (MLI)
Avalia qualidade da liquidez: % TVL short-term, serial farmers, tenure, flight risk.

### Módulo 3: Effective APR
Decompõe APR em: fees, nominal reward, effective reward, IL, net effective, sustainability.

### Integração
```
Taxonomy → classifica → quais heurísticas
    ↓
MLI → qualidade liquidez → flight risk
    ↓
Effective APR → retorno real → justifica risco?
    ↓
Score composto APOLLO → assessment_pda → Risk Engine (≤ 40%)
```

---

## 5. SAFETY ENVELOPE v3.2

### Novos axiomas Camada 0
- A0-17: Execução exige ≥ 2 famílias independentes
- A0-18: Classificação de famílias é estática
- A0-19: Security Incidents somente pelo Auditor
- A0-20: Truth Labels somente pelo Auditor
- A0-21: Métricas somente sobre outcomes resolvidos

**Total: 21 axiomas ativos**
