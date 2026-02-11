# NOUMEN v3.0 — Documento de Arquitetura

> **Conversa 4** — Red team econômico/segurança  
> 10 seções: Posicionamento, Portfólio, DeFiStation, Demanda, Escala, Política Monetária, Segurança, Descentralização, Critérios de Sucesso, Roadmap Condicional

---

## 1. POSICIONAMENTO

### Proposta de valor

**(a) LPs individuais:** "O NOUMEN te mostra o que realmente está acontecendo num pool antes que você perca dinheiro — e prova on-chain que a análise foi feita antes do evento, não depois."

**(b) Tesourarias/DAOs:** "Infraestrutura de risco auditável que sua DAO pode apontar como due diligence verificável."

**(c) Builders/Agentes B2B:** "API de prova de decisão e scoring de risco que seus agentes consomem para registrar auditabilidade sem construir infra própria."

### Núcleo

**Infra de prova com inteligência de risco acoplada.** O diferencial é provar que analisou antes de agir.

---

## 2. PORTFÓLIO DE SERVIÇOS

### Entry
- E1. Risk Snapshot (token/pool)
- E2. Pool Health Check
- E3. "Is This Sketchy?" Quick Check
- E4. Wallet Exposure Scan

### Premium
- P1. Pool Risk Report (Decomposição APR + IL + concentração)
- P2. Post-Mortem Report
- P3. Yield Trap Detection + Alert

### Infra/B2B
- B1. Proof-of-Agency API
- B2. Risk Scoring API
- B3. Risk Dataset Subscription

---

## 3. AGENTE DeFiStation (APOLLO)

### 5 outputs monetizáveis
1. Ranking de pools por risco-retorno ajustado
2. Decomposição de APR
3. Yield Trap Detection
4. IL projetado por pool
5. Historical APR vs. Realized Return

### 3 outputs perigosos
1. "Recomendação" de pool
2. Sinal de "saída iminente"
3. Comparativo entre protocolos

---

## 4. DEMANDA AUTOGERADA

### Flywheel 1: Free-tier → Dataset → Premium
### Flywheel 2: Incidentes → Post-Mortems → Credibilidade
### Flywheel 3: B2B API → Dados → Melhoria

---

## 5. ESCALA HARD

### Hierarquia de prova
- **Individual on-chain:** execuções, relatórios pagos, gestão, circuit breaker, treasury
- **Batch (merkle root):** snapshots rotina, rankings, alertas LOW/MED
- **Off-chain com hash âncora:** logs internos, métricas, calibração

### Custo máximo de prova: ≤ 10% receita diária

---

## 6. POLÍTICA MONETÁRIA

| Parâmetro | Valor |
|---|---|
| Reserve ratio mínimo | 25% |
| Gasto diário máximo | 3% saldo livre |
| Budget por agente | ≤ 15% saldo livre |
| Birth bond por agente | 5% saldo livre |
| Subsídio máximo | 90 dias |

---

## 7. SEGURANÇA EXTREMA

### 10 riscos
1. Runtime key compromised
2. Data poisoning
3. Privilege escalation via APOLLO
4. Colisão entre agentes
5. Slow poisoning
6. Agent impersonation
7. Circuit breaker exploitation
8. Treasury drain via micro-decisions
9. Stale data execution
10. Oracle manipulation em cascata

### Meta-Circuit-Breaker
Triggers → Pausar execução → Manter auditoria → Diagnóstico → Proof → Saída gradual

### Decisões impossíveis (axiomas)
1–8 definidos

---

## 8. DESCENTRALIZAÇÃO REALISTA

### On-chain: Proof-of-Agency, split, registry, manifests, circuit breakers, treasury
### Off-chain com prova: Risk Engine, dados brutos, relatórios, métricas
### Inevitavelmente centralizado: RPC/Helius, compute, upgrades

**Posição honesta:** Âncora de confiança on-chain + execução off-chain. Auditabilidade, não distribuição de compute.

---

## 9. CRITÉRIOS DE SUCESSO

### 30 dias: ≥ 50 wallets, ≥ 100 snapshots, custo prova < 8%, zero incidentes
### 90 dias: receita ≥ 70% custo, ≥ 5 relatórios premium, runway ≥ 60 dias
### 1 ano: 90+ dias sem intervenção, treasury cresceu, ≥ 3 serviços L2, ≥ 3 B2B

---

## 10. ROADMAP POR CONDIÇÃO

15 itens condicionais: Risk Snapshot → Pool Health → Quick Check → Alert → Auto-Guard → Data Collector → DeFi Agent → Reports → API B2B → Dataset → Cap increase → Split dinâmico

### Observação Final de Red Team

O maior risco não é técnico. É **tempo de validação vs. runway**. Se o seed capital for insuficiente para 6+ meses pré-receita, o projeto morre antes de provar qualquer coisa.
