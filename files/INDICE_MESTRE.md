# NOUMEN — Índice Mestre

> Versão atual: v3.2.3  
> Total de axiomas ativos: 29 (A0-2 deprecated)  
> Agentes: AEON (soberano), APOLLO (risco DeFi), HERMES (inteligência DeFi)

---

## Documentos

| # | Arquivo | Conteúdo | Versão |
|---|---|---|---|
| 00 | `00_IDENTIDADE_NOUMEN.md` | Identidade, princípios, limites | Core |
| 01 | `01_CONSULTORIA_TECNICA_INICIAL.md` | Resumo executivo, riscos, priorização, demo, capabilities | v1.0 |
| 02 | `02_EVOLUCAO_SISTEMICA_MULTI_AGENTE.md` | Multi-agente, coordenação, economia, segurança, escala | v2.0 |
| 03 | `03_AGENTE_DEFI_APOLLO_CONCEITUAL.md` | APOLLO conceitual: papel, escopo, firewall, autonomia | v2.1 |
| 04 | `04_ARQUITETURA_v3.0.md` | Arquitetura completa: 10 seções + Red Team | v3.0 |
| 05 | `05_ARQUITETURA_v3.1.md` | Outcomes, Safety Envelope, Custody, Anti-Learning, APOLLO spec | v3.1 |
| 06 | `06_ARQUITETURA_v3.2.md` | Dual-Label, Security Incidents, Min. Evidence, Solana Modules | v3.2 |
| 07 | `07_ARQUITETURA_v3.2.1.md` | APOLLO formalizado, Yield Brief, Effective APR, Doações | v3.2.1 |
| 08 | `08_ARQUITETURA_v3.2.2.md` | Privacy, Anti-Masquerade, Schema, CCS Creator Economy | v3.2.2 |
| 09 | `09_ARQUITETURA_v3.2.2.1.md` | CCS corrigido (cap 15%, piso 4%), External Revenue, A0-28 | v3.2.2.1 |
| 10 | `10_ARQUITETURA_v3.2.2.2.md` | Treasury accounting, Anchor Client, Donation sweep | v3.2.2.2 |
| 11 | `11_ARQUITETURA_v3.2.2.3.md` | Correlation fields, Ramp-up suavizado, Contagem corrigida | v3.2.2.3 |
| 12 | `12_ARQUITETURA_v3.2.3_HERMES.md` | Agente HERMES: 5 serviços, manifest, coordenação, axiomas | v3.2.3 |
| 13 | `13_AXIOMAS_REFERENCIA.md` | Lista completa dos 29 axiomas ativos | v3.2.3 |

---

## Evolução do Projeto

```
v1.0  Consultoria técnica inicial
  ↓
v2.0  Evolução multi-agente
  ↓
v2.1  APOLLO conceitual
  ↓
v3.0  Arquitetura completa (10 seções)
  ↓
v3.1  Outcomes, Safety Envelope, Custody, Anti-Learning
  ↓
v3.2  Dual-Label, Security Incidents, Min. Evidence, Modules
  ↓
v3.2.1  APOLLO formalizado, novos serviços, doações
  ↓
v3.2.2  CCS, privacy, anti-masquerade, schema
  ↓
v3.2.2.1  CCS 15%/4%, external revenue, A0-28
  ↓
v3.2.2.2  Treasury accounting, anchor client
  ↓
v3.2.2.3  Correlation, ramp-up, contagem
  ↓
v3.2.3  HERMES (A0-29, A0-30) ← VERSÃO ATUAL
```

---

## Agentes

| Agente | Tipo | Execução | Alimenta Risk Engine |
|---|---|---|---|
| AEON | Soberano | Delega | N/A |
| APOLLO | Avaliador de risco | NUNCA | Sim (≤ 40%) |
| HERMES | Inteligência DeFi | NUNCA | NUNCA |

---

## Serviços Ativos (portfólio completo)

### Entry
- Risk Snapshot, Pool Health Check, "Is This Sketchy?", Wallet Exposure Scan
- Daily Portfolio Risk Pulse, Incentive Expiry Radar, Wallet Health Score
- DeFi Yield Brief (APOLLO)

### Premium
- Pool Risk Report, Post-Mortem, Yield Trap Detection + Alert
- Cross-Position IL Tracker
- Effective APR Report (HERMES)
- Yield Trap Intelligence (HERMES)
- Pool Comparison (HERMES)
- Protocol Health Snapshot (HERMES)
- Risk Decomposition Vector (HERMES)

### B2B / Agent-to-Agent
- Proof-of-Agency API, Risk Scoring API, Risk Dataset Subscription
- Real-time Risk Scoring Feed, Yield Trap Oracle
- Decision Log Subscription, Auto-Calibration API
- Intent Verification Service

---

## Economia

| Parâmetro | Valor |
|---|---|
| CCS cap total | 15% |
| CCS piso base split | 4% |
| CCS cap stipend | 5% |
| Reserve ratio | ≥ 25% |
| Gasto diário max | 3% saldo livre |
| Budget por agente | ≤ 15% saldo livre |
| Budget avaliadores combinado | ≤ 25% saldo livre |
| Custo prova max | 10% receita diária |
| Preço mínimo serviço | custo + 20% margem |
| Subsídio máximo | 90 dias |
