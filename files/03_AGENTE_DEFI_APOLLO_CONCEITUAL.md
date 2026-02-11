# NOUMEN — Agente DeFi Especialista (APOLLO) — Análise Conceitual

> **Conversa 3** — Discussão conceitual do agente DeFi  
> Contexto: Introdução e análise do agente DeFi especializado em Solana.

---

## 1. Papel Sistêmico: Por que ele deve existir

### O problema real

O AEON soberano é generalista. DeFi em Solana tem complexidade própria: centenas de pools, APRs que mudam a cada epoch, incentivos temporários, IL invisível. O AEON não deveria ser especialista nisso porque:

- Polui o escopo do soberano
- Outros agentes não cobrem o gap
- O gap é entre dados brutos e inteligência de domínio

### O que ele é

**Avaliador e sinalizador de domínio.** Não é coletor, não é estrategista, não é executor.

Produz: sinais classificados, rankings ajustados por risco, alertas de domínio, relatórios estruturados.

Não produz: recomendações de ação, sinais de trading, previsões de preço.

### Justificativa

Sem ele, o Risk Engine opera cego em DeFi e os serviços premium são rasos.

---

## 2. Escopo Permitido e Proibido

### Pode fazer
- Indexar e classificar pools
- Calcular APR/APY ajustado (decomposição)
- Avaliar IL projetado
- Detectar padrões de risco (concentração, liquidez fantasma, mercenary liquidity)
- Emitir sinais classificados
- Ranquear pools por score composto
- Declarar "dados inconclusivos"

### Nunca pode fazer
- Executar qualquer transação
- Emitir recomendações acionáveis diretas
- Definir ou alterar políticas
- Acessar wallets sem permissão
- Produzir previsões de preço

### Privilege escalation via análise

Mitigação estrutural: sinais do agente DeFi nunca são input direto de execução.

```
Agente DeFi → sinal → Risk Engine → avaliação integrada → AEON → decisão → Executor
```

---

## 3. Integração com o AEON

### Dois níveis de prova
- Prova individual para outputs que influenciam decisões
- Batch proof (merkle root) para avaliações de rotina

### Sinais com metadados de confiança
- `confidence_score` (0–100)
- `data_sources`
- `expiry`

### Como o AEON desconfia dele por design
- Thresholds mínimos de confidence_score
- Auditor verifica taxa de acerto retroativa
- Trust degradation se acerto cai

---

## 4. Economia e Receita

### Receita direta
- Pool Risk Report Premium
- Yield Trap Detection Alert
- DeFi Landscape Ranking
- Historical APR vs. Realized Return

### Receita indireta
- Enriquece Risk Reports, alertas, datasets

### Regras
- Justifica budget se gera receita ≥ custo em 60 dias OU aumenta receita de outros serviços
- Máximo 90 dias de prejuízo subsidiado

---

## 5. Demanda Autônoma

### Loops saudáveis
```
Data Collector → dados brutos
    ↓
Agente DeFi → avaliação + classificação
    ↓
Risk Engine → score composto
    ↓
Alertas / Relatórios → receita
```

### Loops proibidos
- Agente gerando alertas que geram mais alertas (ciclo amplificador)
- Inflando contagem de pools para justificar budget

---

## 6. Segurança e Riscos DeFi

### Riscos únicos
- Manipulação de APR/APY
- Pools incentivados artificialmente
- Liquidez fantasma
- Dados incompletos

### Quando declarar "dados inconclusivos"
- Fontes divergem acima de threshold
- Protocolo novo demais (< 7 dias)
- Liquidez irrelevante estatisticamente
- Padrões não reconhecidos

---

## 7. Nível de Autonomia

### Trajetória
- **Level 0 (meses 0–2):** Registry, testes históricos
- **Level 1 (meses 2–5):** Shadow mode, calibração
- **Level 2 (mês 5+):** Sinais no pipeline real

### Execução direta — NUNCA
- Conflito de interesse (avalia + executa = perigoso)
- Separação de funções como segurança
- `execution_permission: NEVER` como axioma

---

## 8. Impacto na Escala

### Multiplicador de valor se operado com disciplina

Métrica: receita incremental por outros serviços atribuível ao agente DeFi vs. custo operacional. Se ratio < 1.5x por 90 dias, reavaliar.

### Timing correto
Não agora (MVP), mas como primeiro ou segundo agente-filho quando viabilidade econômica for provada.
