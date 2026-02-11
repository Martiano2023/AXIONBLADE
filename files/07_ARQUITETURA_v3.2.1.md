# NOUMEN v3.2.1 — Atualização

> APOLLO formalizado como DeFiStation, novos serviços (Yield Brief / Effective APR Report), modelo de doações, Safety Envelope update

---

## Delta v3.2 → v3.2.1

| # | Área | Mudança |
|---|---|---|
| D1 | APOLLO | Formalização como DeFiStation com manifest atualizado e 3 módulos |
| D2 | Serviços | DeFi Yield Brief (entry) + Effective APR Report (premium) |
| D3 | Treasury | Donation Intake Model com anti-captura |
| D4 | Safety | A0-22 (doações), A0-23 (headline+effective), A0-24 (doações fora do split) |

---

## APOLLO Manifest v3.2.1

```
agent_id: APOLLO
type: EVALUATOR
execution_permission: NEVER
scope: 12 capacidades
prohibited_actions: incluindo ACCEPT_DONATION, ALTER_PRICING
budget: ≤ 15% saldo livre
ttl: 180 dias
```

---

## Novos Serviços

### DeFi Yield Brief (Entry)
- Resumo rápido de rendimento efetivo
- Headline APR, Fee APR, Reward APR Effective, Net Effective, Sustainability, Signal
- Free: 5/dia. Starter+: incluído no volume
- Proof: batch

### Effective APR Report (Premium)
- Relatório completo com decomposição, MLI, taxonomy, rewards, IL, comparativo
- Pro: incluído (1/semana). Starter: 0.01 SOL
- Proof: individual

---

## Doações e Treasury

### Fluxo
Doador → Donation PDA → Sweep diário → Treasury PDA (SEM split 85/15)

### Anti-captura (A0-22)
- Sem governance-by-donation
- Sem prioridade de acesso
- Sem listing preferencial
- Sem visibilidade privilegiada
- Sem airdrop ponderado
- Sem naming rights
- Sem refund

### Transparência
- Receipts públicos on-chain
- Dashboard separa receita vs. doações
- Métricas de sustentabilidade EXCLUEM doações

---

## Safety Envelope

### Novos axiomas
- A0-22: Doações não conferem direito/influência
- A0-23: Headline + net effective APR sempre juntos
- A0-24: Doações não passam pelo split

**Total: 24 axiomas (A0-1 a A0-24)**
