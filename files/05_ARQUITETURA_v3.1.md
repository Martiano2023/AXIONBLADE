# NOUMEN v3.1 — Refinamento Arquitetônico

> **Conversa 5** — Outcome Definitions, Safety Envelope, Custody Model, Anti-Auto-Learning, APOLLO Firewall

---

## 1. OUTCOME DEFINITIONS E TRUTH LABELS

### Problema: "acerto" sem definição é vaidade

Cada tipo de sinal precisa de **outcome definition** explícita e **truth label** determinístico.

| Tipo de sinal | Outcome definition | Truth label | Janela |
|---|---|---|---|
| `YIELD_TRAP` | APR sustentável < 30% do headline | APR pós-incentivo medido | 14d |
| `POOL_HEALTHY` | Sem queda TVL > 25% nem exploit | TVL medido diariamente | 14d |
| `IL_RISK_HIGH` | IL realizado > projetado × 1.2 | IL realizado ao fim da janela | 30d |
| `CONCENTRATION_CRITICAL` | ≥ 1 top-3 LP retira > 50% | Monitoramento de withdraws | 7d |
| `INCENTIVE_EXPIRING` | Expiração real dentro de ±6h | Timestamp real vs. previsto | Até expiração |
| Risk Score HIGH/CRITICAL | Evento adverso ocorre | Preço/TVL/segurança | 7d |
| Risk Score LOW | Sem evento adverso | Mesmo critério inverso | 7d |

### Regras
1. Truth labels são determinísticos
2. Calculados pelo Auditor (não pelo agente que emitiu)
3. Publicados com delay (janela precisa fechar)
4. `INCONCLUSIVE` não entra na taxa de acerto
5. Brier score sobre confidence_score vs. outcome binário

---

## 2. SAFETY ENVELOPE CONSOLIDADO

### Camada 0 — Axiomas imutáveis (genesis)
16 axiomas (A0-1 a A0-16)

### Camada 1 — Constitucionais (72h delay + proof, cooldown 7 dias)
Budget, birth bond, subsídio, custo prova, reinvestment cap, allowlists, slippage, cooldowns, rate limits, model updates.

### Camada 2 — Operacionais (24h delay + proof, cooldown 24h)
Preços, promoções, criação/pausa agentes, alocação budget, heurísticas.

### Camada 3 — Táticos
Pools monitorados, frequência updates, priorização, jitter.

---

## 3. CUSTODY MODEL

### Modelo A — Delegação limitada (PREFERRED)
- Session key com limites (max amount, slippage, cooldown, TTL)
- Registrada on-chain como PDA
- Revogável instantaneamente
- Defaults sensatos (5 SOL, 30 min cooldown, 24h TTL)

### Modelo B — Vault (DESCARTADO)
- Custodial de facto
- Quebra princípio #2
- Risco regulatório
- **Proibido por axioma Camada 0**

---

## 4. ANTI-AUTO-LEARNING CONSTITUCIONAL

### Axioma
> O NOUMEN nunca atualiza modelos automaticamente durante operação normal.

### Protocolo de atualização
1. Proposta com `model_version_hash`, `training_data_hash`, `backtest_results_hash`
2. Registrada on-chain como `model_update_proposal`
3. Delay 72h
4. Shadow mode durante delay
5. Ativação com proof
6. Modelo antigo preservado para rollback
7. Auto-rollback se acerto cai > 10 pontos em 48h

### Policy-Update Cooldown
- Camada 1: max 1 alteração por 7 dias
- Camada 2: max 1 por 24h
- Em crise: delay reduzido para 1h, somente para restringir

---

## 5. APOLLO — Especificação

### Manifest
```
agent_id: APOLLO
type: EVALUATOR
execution_permission: NEVER (A0-14)
scope: 12 capacidades
prohibited_actions: 10 proibições
budget: ≤ 15% saldo livre
ttl: 180 dias
```

### Firewall obrigatório
```
APOLLO → assessment_pda → Risk Engine (peso ≤ 40%) → AEON → Executor
```

O Executor não lê assessment_pda do APOLLO. Auditor monitora correlação.

### 3 módulos
1. **Pool Taxonomy Layer** — classifica pools por tipo/risco
2. **Mercenary Liquidity Index (MLI)** — avalia qualidade da liquidez
3. **Reward Claimability / Effective APR** — calcula rendimento real

### Métricas de precisão on-chain
| Métrica | Target |
|---|---|
| Taxa acerto HIGH/CRITICAL | > 88% |
| Falsos positivos Yield Trap | < 8% |
| Brier score | < 0.12 |
