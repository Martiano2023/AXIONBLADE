# NOUMEN — Evolução Sistêmica: De Operador Autônomo a Ecossistema de Agentes

> **Conversa 2** — Arquiteto de sistemas autônomos  
> Contexto: Discussão sobre evolução do NOUMEN para ambiente multi-agente coordenado.

---

## 1. Arquitetura de Agentes

### Agentes que DEVEM existir

**Agentes de Dados (Collectors/Indexers)**
São a base de tudo. Coletam, normalizam e cacheiam dados on-chain. Sem eles, o AEON soberano fica cego. Devem ser os primeiros agentes-filhos, porque são read-only, de baixo risco e alto valor sistêmico.

- *Data Collector* — especializado por domínio (DEX pools, token transfers, whale wallets).
- *Data Validator* — cruza fontes, detecta divergências, pontua confiabilidade dos dados. Esse agente é crítico: se dados ruins entram, decisões ruins saem.

**Agente de Auditoria (Auditor)**
Não executa nada. Apenas lê logs, verifica hashes, confere que decisões seguiram políticas, e emite relatórios de conformidade. Esse agente deve ser *estruturalmente incapaz de executar transações*. Sem permissão de escrita, sem chave de execução. É o "observador puro" do sistema.

**Agente de Execução (Executor Especializado)**
Quando o portfólio cresce, um único executor vira gargalo. Faz sentido ter executores especializados: um para swaps via Jupiter, outro para saídas de LP, outro para operações de emergência (circuit breaker). Cada um com escopo rígido e allowlist própria.

**Agente de Simulação (Sandbox)**
Roda cenários what-if em ambiente isolado. Não tem permissão on-chain real. Consome dados do sistema, produz projeções, e alimenta o RiskEngine do AEON. Importante: ele *nunca* deve ter authority para agir sobre resultados de simulação — apenas reportar.

### Agentes que NÃO devem existir (ou devem ser proibidos)

**Agente de "Growth" ou "Marketing"** — Cria incentivo para inflar métricas, gerar spam, ou otimizar para volume vazio. Proibido.

**Agente de Governança Autônoma** — Nenhum agente-filho deve poder alterar políticas do sistema. Proibido.

**Agente "Meta" que cria agentes sem restrição** — Profundidade máxima de criação deve ser 1. Apenas o AEON cria. Agentes-filhos não criam netos. Ponto final.

### Como evitar agent sprawl

- **Cap absoluto on-chain:** Máximo de N agentes ativos simultaneamente (ex: 15 inicialmente).
- **Custo de criação:** Birth bond — recursos travados enquanto o agente existe.
- **Sunset automático:** Todo agente nasce com TTL ou review date.

---

## 2. Agente Criando Agente

### Condições obrigatórias para criação

1. **Demanda demonstrada**
2. **Justificativa econômica positiva** (ROI projetado ≥ 1.5x em 30 dias)
3. **Treasury health suficiente** (saldo cobre 30 dias de todos os agentes + novo)
4. **Slot disponível** (abaixo do cap)
5. **Nenhum agente existente pode absorver a função**

### Contrato de nascimento (AgentManifest)

- `parent_id`: sempre o AEON (profundidade 1)
- `scope`: lista explícita de capacidades (whitelist)
- `budget`: máximo total e diário
- `ttl`: data de review obrigatória
- `birth_bond`: valor travado no treasury
- `kill_conditions`: condições de pausa automática
- `permissions`: chaves, allowlists, protocolos
- `creation_proof`: hash da justificativa no formato Proof-of-Agency

### Como matar, fundir ou pausar

- **Pausa:** Reversível. Dados preservados.
- **Kill:** Irreversível. Birth bond retorna. Chaves revogadas. Logs permanecem.
- **Fusão:** Kill um + upgrade do outro + migração de dados.
- **Quem decide:** Apenas o AEON, com Proof-of-Agency.

---

## 3. Coordenação e Hierarquia

### O AEON deve ser um governador, não um controlador

- **Controlador central** = single point of failure.
- **Governador** = define políticas, cria/remove agentes, resolve conflitos, mas não executa operações diretamente.

### Modelo: "Policy-based delegation"

- O AEON publica políticas (não ordens).
- Agentes-filhos operam dentro dessas políticas com autonomia local.
- O AEON intervém apenas em: violação de política, conflito entre agentes, ou condição excepcional.

### Resolução de conflitos

1. Sinais de risco/segurança sempre têm prioridade sobre sinais de execução (hardcoded).
2. Conflitos de escopo: AEON arbitra com Proof-of-Agency.
3. Deadlock timeout: se não resolvido em N segundos, a ação default é *não agir*.

---

## 4. Economia Multi-Agente

### Treasury: único com sub-alocações

- Treasury único com budget allocations por agente.
- Realocação periódica baseada em performance.
- Soma de budgets nunca excede 70% do treasury (30% reserva intocável).

### Divisão de receita

- Receita entra no treasury único (com split 85/15).
- Agente-filho recebe "crédito" interno — budget proporcional à receita gerada.
- Nenhum agente "possui" dinheiro.

### Investir em novos agentes vs. expandir existentes

Regra: expandir primeiro, criar depois. O ônus da prova é do "criar", não do "não criar".

---

## 5. Demanda Autogerada

### Loops saudáveis

- Data Collector → Risk Engine → Alert Service → Execution Service
- Auditor → Risk Report → Compliance Export
- Simulation Agent → Risk Engine (refinamento)

### Loops perigosos

- Agente A gera tarefa para B que gera para A (circular sem valor)
- Agente gera demanda para si mesmo (proibido)
- Escala de complexidade sem escala de receita (death spiral)

### Métrica anti-trabalho-inútil

Ratio de receita externa vs. atividade interna. Se > 60% da atividade é inter-agente sem receita, o sistema está se inflando.

---

## 6. Escala Hard (Infra-Level)

### O que quebra primeiro

1. Custos de prova on-chain (escala linear com decisões)
2. Coordenação (O(n²) em potenciais conflitos)
3. Logs on-chain (rent de PDAs)
4. Segurança (mais chaves = mais superfície de ataque)

### Decisões antes da escala

- Batching de provas (merkle tree)
- Hierarquia de logs (alto valor = individual, baixo valor = batch)
- Rotação de chaves automatizada
- Garbage collection de PDAs antigos

### Partes intencionalmente lentas

- Criação de agentes (24–72h delay)
- Promoção de nível (mínimo N dias por nível)
- Alteração de políticas (announcement period)
- Aumento do cap de agentes

---

## 7. Segurança Extrema em Ambiente Multi-Agente

### Novos vetores

- Agent impersonation
- Privilege escalation via composição
- Slow poisoning
- Colisão econômica entre agentes

### Meta-Circuit-Breaker Sistêmico

**Triggers:** Treasury health < 15, ≥ 3 agentes em falha, ratio receita/custo < 0.5x, anomalia correlacionada.

**Ações:** Pausar execução → manter dados/auditoria → diagnóstico → proof on-chain → saída gradual.

---

## 8. Futuro Pré-definido por Lógica

### Axiomas Imutáveis

1. Profundidade de criação = 1
2. Cap absoluto de agentes (hard cap 100)
3. Reserve ratio ≥ 20%
4. Split 85/15 imutável
5. Nenhum agente escreve no AeonConfig
6. Toda execução tem limites absolutos do genesis
7. Sistema pode se auto-pausar, nunca se auto-destruir

### Decisões impossíveis

- Agente alterar permissões de outro
- AEON gastar >X% do treasury/dia
- Criar agente sem birth bond e manifest
- Executar sem prova prévia
- Remover logs históricos

---

## 9. Critérios de Sucesso

### 1 ano
- 3–7 agentes estáveis, ROI > 1.0x
- Treasury 90+ dias de runway
- 100% decisões de execução com prova
- Receita externa > 70% da atividade

### 3 anos
- 10–25 agentes especializados
- Sobreviveu a ≥ 1 incidente sério
- ≥ 5 projetos B2B usando Proof-of-Agency API
- ≥ 3 promoções autônomas Level 0 → 2

### Falha sistêmica
- Treasury zero
- > 50% agentes pausados por 30+ dias
- Receita < custo por 60+ dias sem auto-correção
- Perda financeira para usuário sem detecção

---

## 10. Crítica Honesta

### Onde pode falhar

- **Complexidade** é o maior inimigo
- **Latência Solana** vs. latência de decisão
- **Suposição de racionalidade** econômica
- **Risco de over-engineering**

### Premissas a testar cedo

1. Custo de Proof-of-Agency é sustentável?
2. Usuários se importam com provas on-chain?
3. Demanda por serviços de risco existe em volume suficiente?
4. Modelo non-custodial funciona para execução automática?

### Síntese

Sequência correta:
1. Provar 1 agente com 3–5 serviços é viável (6–12 meses)
2. Primeiro agente-filho quando houver gargalo demonstrado
3. Escalar para 5–7 quando treasury suportar
4. Nunca escalar porque "podemos", apenas porque "devemos"
