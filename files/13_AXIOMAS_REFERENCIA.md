# NOUMEN — Referência Completa de Axiomas (v3.2.3)

> 30 enumerados | 29 ativos | 1 deprecated

---

## Camada 0 — Axiomas Imutáveis (sem redeploy)

| # | Axioma | Status | Versão |
|---|---|---|---|
| A0-1 | Profundidade de criação de agentes = 1 (somente AEON cria) | ✅ Ativo | v3.1 |
| A0-2 | Split 85/15 imutável | ⛔ DEPRECATED (substituído por A0-28) | v3.0 → dep. v3.2.2.1 |
| A0-3 | Reserve ratio mínimo ≥ 25% | ✅ Ativo | v3.1 |
| A0-4 | Avaliação e execução nunca no mesmo agente para mesmo domínio | ✅ Ativo | v3.1 |
| A0-5 | log_decision obrigatório antes de qualquer execução | ✅ Ativo | v3.1 |
| A0-6 | Provas históricas imutáveis (nunca deletadas/alteradas) | ✅ Ativo | v3.1 |
| A0-7 | Agentes externos: somente read-only em PDAs do NOUMEN | ✅ Ativo | v3.1 |
| A0-8 | Preço de serviço ≥ custo + 20% margem | ✅ Ativo | v3.1 |
| A0-9 | Cap absoluto de agentes ≤ 100 (hard cap) | ✅ Ativo | v3.1 |
| A0-10 | Backtests de agentes externos nunca persistidos (in-memory only) | ✅ Ativo | v3.1 |
| A0-11 | Gasto diário do treasury ≤ 3% do saldo livre | ✅ Ativo | v3.1 |
| A0-12 | NOUMEN nunca opera vaults custodiais | ✅ Ativo | v3.1 |
| A0-13 | Auto-learning proibido durante operação normal | ✅ Ativo | v3.1 |
| A0-14 | APOLLO nunca tem execution_permission | ✅ Ativo | v3.1 |
| A0-15 | Outputs APOLLO nunca consumidos diretamente por executores | ✅ Ativo | v3.1 |
| A0-16 | Peso APOLLO no Risk Engine ≤ 40% | ✅ Ativo | v3.1 |
| A0-17 | Execução exige ≥ 2 famílias de evidência independentes; caso contrário ALERT-ONLY | ✅ Ativo | v3.2 |
| A0-18 | Classificação de famílias de evidência é estática (reclassificação = Camada 1, 72h) | ✅ Ativo | v3.2 |
| A0-19 | Security Incidents registrados exclusivamente pelo Auditor | ✅ Ativo | v3.2 |
| A0-20 | Truth Labels (HTL e EOL) calculados exclusivamente pelo Auditor | ✅ Ativo | v3.2 |
| A0-21 | Métricas de precisão somente sobre outcomes com janela resolvida | ✅ Ativo | v3.2 |
| A0-22 | Doações não conferem direito, prioridade, influência ou acesso diferenciado | ✅ Ativo | v3.2.1 |
| A0-23 | Headline APR + net effective APR sempre reportados juntos | ✅ Ativo | v3.2.1 |
| A0-24 | Doações não passam pelo CCS (não são receita de serviço) | ✅ Ativo | v3.2.1 |
| A0-25 | Doação condicionada a serviço é rejeitada (anti-masquerade) | ✅ Ativo | v3.2.2 |
| A0-26 | Outputs pagos incluem `not_investment_advice`, `uncertainty_flags`, `decision_class` no hash canônico | ✅ Ativo | v3.2.2 |
| A0-27 | Donation receipts pseudônimos por default (`source_wallet_hash`, não wallet) | ✅ Ativo | v3.2.2 |
| A0-28 | CCS: cap total 15%, piso base split 4%, cap stipend 5%. Faixas = Camada 1 (30d delay). Piso/cap/stipend = Camada 0 | ✅ Ativo | v3.2.2.1 |
| A0-29 | HERMES nunca alimenta Risk Engine diretamente. Terminal: consumo externo exclusivamente | ✅ Ativo | v3.2.3 |
| A0-30 | HERMES não emite sinais de risco operacionais. Escopo exclusivo do APOLLO | ✅ Ativo | v3.2.3 |

---

## Resumo por Categoria

### Criação e Governança de Agentes
- A0-1: Profundidade = 1
- A0-9: Cap ≤ 100

### Separação de Funções
- A0-4: Avaliação ≠ execução no mesmo domínio
- A0-14: APOLLO nunca executa
- A0-15: Outputs APOLLO nunca direto para executores
- A0-16: Peso APOLLO ≤ 40%
- A0-29: HERMES nunca alimenta Risk Engine
- A0-30: HERMES não emite sinais de risco operacionais

### Provas e Auditabilidade
- A0-5: log_decision obrigatório pré-execução
- A0-6: Provas históricas imutáveis
- A0-19: Security Incidents só pelo Auditor
- A0-20: Truth Labels só pelo Auditor
- A0-21: Métricas só sobre outcomes resolvidos
- A0-26: Schema de proteção obrigatório no hash

### Segurança e Execução
- A0-7: Agentes externos read-only
- A0-10: Backtests externos in-memory only
- A0-12: Nunca vaults custodiais
- A0-13: Auto-learning proibido
- A0-17: ≥ 2 famílias para execução
- A0-18: Famílias de evidência estáticas

### Economia e Treasury
- A0-3: Reserve ratio ≥ 25%
- A0-8: Preço ≥ custo + 20%
- A0-11: Gasto diário ≤ 3%
- A0-28: CCS (cap 15%, piso 4%, stipend 5%)

### Doações
- A0-22: Doações não conferem direito/influência
- A0-23: Headline + effective APR sempre juntos
- A0-24: Doações fora do CCS
- A0-25: Anti-masquerade (doação condicionada = rejeitada)
- A0-27: Receipts pseudônimos por default

### Deprecated
- A0-2: Split 85/15 (substituído por A0-28)

---

## Camadas de Política

### Camada 1 — Constitucionais (delay 72h–30d, cooldown 7–30d)

| Política | Default | Cooldown |
|---|---|---|
| Budget por agente | ≤ 15% saldo livre | 30d |
| Birth bond | 5% saldo livre | 30d |
| Max subsídio | 90 dias | 30d |
| Max custo prova | ≤ 10% receita diária | 30d |
| Revenue reinvestment cap | Definido no genesis | 30d |
| Agent cap operacional | 15 (inicial) | 30d |
| Allowlists de protocolos | Definidas por serviço | 72h |
| Slippage caps | Por serviço | 72h |
| Cooldowns de execução | Por serviço | 72h |
| Rate limits | Por serviço/wallet | 72h |
| Model/heuristic updates | Via proposal + shadow | 72h |
| Faixas CCS receita | 0–1/1–10/10–50/>50 SOL/dia | 30d |
| Percentuais CCS por faixa | 12/10/7/4% | 30d |
| Cap stipend | 5% receita média 30d | 30d |
| Milestones e bonus | Conforme genesis | 30d |
| Famílias de evidência | 5 famílias (A–E) | 72h |
| Budget combinado avaliadores | ≤ 25% saldo livre | 30d |
| Max pools MLI | 50 | 72h |
| TVL mínimo MLI | $10k | 72h |
| EOL positive rate threshold | 60% | 72h |
| UNCONFIRMED timeout | 72h | 72h |
| Definição doação vs. pagamento | Anti-masquerade | 72h |
| Large donation threshold | >10% treasury | 72h |
| Sweep frequency | 1x/dia | 72h |
| Disclosure mode | PSEUDONYMOUS | 72h |
| Concentrated revenue threshold | >25% wallet/7d | 30d |
| Suspicious circular window | <24h | 30d |
| System actors list | No AeonConfig | 72h |
| Pool Comparison max pools | 5 | 72h |
| Protocol Snapshot frequency | 1x/semana | 72h |
| HERMES Yield Trap requer APOLLO | Obrigatório | 72h |
| Correlation window doação | 24h | 72h |

### Camada 2 — Operacionais (delay 24h, cooldown 24h)
- Preços de serviços
- Promoção de nível (Level 0→1→2)
- Criação/pausa/kill de agentes
- Alocação de budget por agente
- Ajuste de heurísticas (dentro de limites Camada 1)

### Camada 3 — Táticos (ajustáveis pelo agente responsável)
- Pools monitorados
- Frequência de updates
- Priorização de análise
- Anti-spoofing jitter timing
- Priorização MLI por pool

---

## 5 Famílias de Evidência Independentes

| Família | Fonte de dados | Exemplos de sinais |
|---|---|---|
| A: Price/Volume | Preço e volume DEXs on-chain | Queda de preço > X%, volume anormal, spread widening |
| B: Liquidity/Composition | TVL, composição de pools, concentração | TVL drain, concentração critical, pool imbalance |
| C: Behavior/Pattern | Comportamento de wallets | Whale movement, mercenary liquidity, bot activity |
| D: Incentive/Economic | Programas de incentivo, APR, rewards | Incentive expiry, APR collapse, reward unsustainability |
| E: Protocol/Governance | Governance, upgrades, parâmetros | Governance proposal adversa, parameter change, oracle update |

**Regra:** Execução exige ≥ 2 famílias independentes. 2 sinais da mesma família = 1. APOLLO sozinho nunca suficiente. Se < 2 famílias → ALERT-ONLY (Executor proibido).

---

## Meta-Circuit-Breaker — Triggers

| Trigger | Threshold |
|---|---|
| Treasury health | < 15 por 12h |
| Agentes em falha simultânea | ≥ 3 |
| Ratio receita/custo | < 0.5x por 5 dias |
| Circuit breakers individuais | ≥ 2 no mesmo dia |
| Correlação comportamental anômala | > threshold |
| Agentes externos desconectados | ≥ 50% simultâneo |
| Intent Verification rejeição | > 60% em 24h |
| Accuracy publicada | < 70% |

**Ações:** Pausar execução → manter read-only → manter Auditor → diagnóstico → proof on-chain → saída gradual (reduzido → ultra-conservador → normal).
