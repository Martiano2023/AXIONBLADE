# NOUMEN — Consultoria Técnica Inicial

> **Conversa 1** — Consultor técnico e de produto  
> Contexto: Primeira análise do projeto NOUMEN, seus princípios, arquitetura e modelo econômico.

---

## 1. Resumo Executivo (para juiz técnico)

NOUMEN é uma infraestrutura em Solana que hospeda um operador econômico autônomo (NOUMEN::AEON). O sistema executa serviços on-chain e off-chain — análise de risco, alertas, execuções de proteção (swaps, saída de LP) e relatórios — cobrando em SOL por uso. Toda decisão é registrada on-chain com hash de intenção *antes* da execução e hash de resultado *depois* ("Proof-of-Agency"), criando uma trilha criptográfica auditável e determinística. O modelo é non-custodial: o agente opera com permissões limitadas e revogáveis, sem custodiar fundos. A receita é dividida automaticamente por contrato (85% treasury do agente / 15% creator), sem intervenção humana. O sistema mantém um registry de serviços com níveis de maturidade (Declared → Simulated → Active), onde o próprio agente decide promoções baseado em condições econômicas reais — não um roadmap humano. Guardrails hardcoded (circuit breakers, limites diários, slippage caps, allowlists) garantem segurança como feature de primeira classe. Nenhum componente de LLM toma decisões; toda lógica é heurística e determinística. Não há token no MVP — o modelo é pay-per-use puro.

---

## 2. Riscos Reais e Mitigações

### Técnicos

- **Dependência de RPC/Helius:** Se o provedor de dados on-chain falha ou entrega dados stale, o Watcher opera sobre lixo. *Mitigação:* fallback multi-provedor + "freshness check" no snapshot (rejeitar dados mais velhos que N slots). Registrar on-chain quando o agente *não agiu* por dados insuficientes — isso é tão importante quanto registrar quando agiu.
- **Canonicalização de hashes:** Se a função `canonicalize()` tiver divergência mínima entre módulos (ordenação de chaves, encoding de floats), as provas se tornam inverificáveis. *Mitigação:* test suite com vetores de teste fixos; usar JSON Canonicalization Scheme (RFC 8785) como referência.
- **Custo de compute on-chain:** Cada `log_decision` + `update_execution` são duas transações Solana por operação. Em alto volume, isso é custo significativo e potencial gargalo. *Mitigação:* avaliar batch logging (múltiplas decisões em uma tx via CPI), ou registrar hash raiz de um batch (merkle root) para serviços de micro-fee, com provas individuais verificáveis off-chain.
- **Circuit breaker "cego":** Pausar após N falhas consecutivas é simples mas pode ser explorado (um atacante causa N falhas propositais para desligar um serviço). *Mitigação:* janela deslizante (taxa de falha, não contagem absoluta) + distinção entre falha interna e falha de input externo.

### Econômicos

- **Cold start:** Sem volume, sem receita, sem dados, sem flywheel. O treasury começa vazio. *Mitigação:* O creator precisa capitalizar o treasury inicialmente (seed capital) e isso deve ser transparente e registrado. Definir explicitamente o "runway mínimo" para operar N serviços Level 2 por M dias.
- **Pricing estático vs. dinâmico:** Se os preços são fixos no registry, podem ficar descolados do custo real (gas Solana varia). *Mitigação:* O ServiceManager já tem lógica de ajuste — mas defina explicitamente a frequência e os limites de variação de preço (não oscilar +500% de uma hora para outra, ou usuários fogem).
- **Risco de treasury drain:** Se o agente decide gastar o treasury em "expansão" e erra, o sistema quebra. *Mitigação:* Policy gates — gastos do treasury acima de X% do saldo requerem proof com justificativa econômica registrada (ex: ROI projetado > custo). Limite absoluto de gasto diário do treasury.

### UX

- **Complexidade conceitual:** Explicar Proof-of-Agency, níveis de serviço, non-custodial + permissões revogáveis para um usuário médio de Solana é difícil. *Mitigação:* Camada de apresentação extremamente simples. O usuário vê: "Score de risco: ALTO. Quer que eu troque para SOL? [Sim/Não]". Os hashes e provas ficam em "detalhes avançados".
- **Confiança sem track record:** Um agente autônomo sem histórico pedindo permissão de swap é assustador. *Mitigação:* Começar com serviços read-only (Risk Snapshot, Pool Health) que não pedem permissão nenhuma. Construir confiança antes de pedir autorização de execução.

### Segurança

- **Runtime authority key compromised:** Se a chave do agente vazar, um atacante pode logar "decisões" e executar dentro dos guardrails. *Mitigação:* Rotação de chave com multi-sig ou timelock para troca de `runtime_authority`. Monitoramento de padrões anômalos de decisão (meta-circuit-breaker).
- **Oracle manipulation / data poisoning:** Se os dados de entrada (preço, liquidez) forem manipulados, o agente toma decisões "corretas" baseadas em dados falsos. *Mitigação:* Múltiplas fontes de preço com divergence check. Se fontes divergem acima de threshold, o agente *não age* e registra a discrepância.

---

## 3. Priorização de Implementação (Level 2)

**Fase 1 — Confiança e dados (semanas 1–4):**
1. **Risk Snapshot** (Entry): baixo risco, read-only, gera volume e dados, prova o Proof-of-Agency end-to-end com custo mínimo. É o "hello world" do sistema.
2. **Pool Health Check** (Entry): mesmo raciocínio, complementa o snapshot, enriquece o dataset.

*Justificativa:* Esses dois provam o ciclo completo (log→exec→update) sem pedir permissões perigosas. Geram dados para o flywheel e dão ao sistema um track record público.

**Fase 2 — Primeiro serviço de valor (semanas 5–8):**
3. **Risk Alert Trigger**: primeiro serviço "pago por evento". Prova que o agente monitora e cobra quando entrega valor. Relativamente simples (o Watcher + RiskEngine já existem).
4. **Auto-Guard Swap to SOL**: primeiro serviço de execução. É o "momento de verdade" — o agente efetivamente protege capital. Deve ser implantado com limites ultra-conservadores (max amount pequeno, slippage apertado, cooldown longo).

**Fase 3 — Premium e diferenciação (semanas 9–12):**
5. **Risk Report Premium**: primeiro serviço cognitivo. Mostra a profundidade analítica. Diferencia de bots genéricos.
6. **Proof-of-Agency API (B2B)**: se houver interesse de outros builders, abrir isso cedo cria efeito de rede e posiciona o NOUMEN como infra, não como app.

**Princípio geral:** Sempre promover para Level 2 na ordem: read-only → alertas → execução mínima → execução complexa → B2B. Nunca pular para execução sem ter track record em read-only.

---

## 4. Crítica do Modelo 85/15

### Vantagens
- **Simplicidade e transparência:** Fácil de auditar, fácil de explicar, enforced por contrato.
- **Alinhamento de incentivos:** O creator ganha mais quando o agente gera mais receita, sem poder interferir. É um modelo "passivo por design".
- **Narrativa forte:** "O criador não controla o agente; ele recebe 15% como recompensa pela criação, automaticamente."

### Riscos
- **15% pode ser muito em fase de crescimento:** Se o treasury precisa de capital para subsidiar free-tier e expandir, 15% saindo imediatamente reduz o runway. Em receita baixa, cada lamport conta.
- **15% pode ser pouco em fase de maturidade:** Se o sistema gera milhões, 15% é generoso mas o creator pode querer governance. Ou inversamente, a comunidade pode questionar "por que 15% eterno para alguém que não faz nada?"
- **Imutabilidade é arma de dois gumes:** Se o split é imutável e o modelo se prova subótimo, não há como corrigir sem redeployar o contrato.

### Alternativas (sem perder a narrativa)
- **Split dinâmico com bounds:** Começa em 95/5, e conforme o treasury atinge thresholds de saldo, o percentual do creator sobe gradualmente até um cap (ex: 15%). Isso prioriza crescimento no início e recompensa o creator quando o sistema prova valor. A lógica fica no contrato, é determinística e auditável.
- **Creator fee com vesting temporal:** Os 15% do creator vão para um PDA com unlock linear (ex: 6 meses). Isso demonstra alinhamento de longo prazo.
- **Sugestão pragmática:** Manter 85/15 fixo no MVP pela simplicidade, mas documentar explicitamente que um contrato V2 *pode* introduzir split dinâmico se a governança (futura) aprovar. Não prometa, apenas deixe a porta aberta.

---

## 5. Melhorias "Cabulosas" mas Realistas

1. **Policy Gating por treasury balance:** O agente só pode ativar serviços Level 2 se o treasury tiver saldo mínimo para cobrir N dias de custo operacional daquele serviço. Isso é enforced on-chain — o contrato verifica saldo antes de permitir a ativação. Impede o agente de "expandir além da capacidade".

2. **Proof-of-Management Decisions:** Toda decisão de gestão de portfólio (ajuste de preço, pausa de serviço, promoção de nível) deve seguir o mesmo ciclo Proof-of-Agency que decisões operacionais. Ou seja: `management_decision_hash` → execução → `management_result_hash`. Isso torna a gestão do portfólio tão auditável quanto uma execução de swap.

3. **Auto-upgrade com "proposal + delay":** Quando o agente decide promover um serviço de Level 1 para Level 2, a promoção não é instantânea — ela é registrada como "proposal" on-chain com um delay (ex: 24h). Durante o delay, qualquer observador pode verificar a justificativa. Isso adiciona uma camada de "governança passiva" sem centralizar.

4. **Anomaly self-detection:** O agente monitora seus próprios padrões de decisão. Se a taxa de decisões HIGH/CRITICAL subir abruptamente (possível data poisoning ou bug), ele entra em modo conservador automaticamente e registra o evento. Meta-circuit-breaker.

5. **Treasury health score público:** Um score simples (0–100) derivado de: saldo, burn rate, receita dos últimos N dias, número de serviços ativos. Publicado on-chain. Qualquer um pode ver "a saúde financeira do agente" em tempo real. Isso é confiança radical.

6. **Dead man's switch:** Se o agente não registra nenhuma decisão por N horas (crash, bug, infra down), um evento automático on-chain sinaliza "agente inativo" e pausa serviços de execução. Protege usuários de um agente silenciosamente morto.

---

## 6. Roteiro de Demo — 6 Minutos

**[0:00–1:00] Contexto (1 min)**
"NOUMEN é um operador autônomo em Solana que prova cada decisão on-chain. Não é um bot que narra depois — ele registra a intenção *antes* de agir." Mostrar a tela do ServiceRegistry: 10 serviços listados, 2 ativos (Level 2), 3 simulados, 5 declarados. "O agente decide o que ativar, não eu."

**[1:00–2:30] Ciclo Completo: Log → Exec → Update (1.5 min)**
Trigger: um token monitorado cai 12% em 3 minutos.
1. Mostrar o Watcher capturando o snapshot (canonical JSON, hash visível).
2. Mostrar o RiskEngine produzindo score = 78 (HIGH), ação = "swap to SOL".
3. Mostrar a transação on-chain de `log_decision` com `input_hash` + `decision_hash` **antes** da execução.
4. Mostrar a execução via Jupiter (swap real ou simulado em devnet).
5. Mostrar `update_execution` com `result_hash` e status = SUCCESS.
6. Abrir o DecisionLog no explorer: "Qualquer pessoa pode verificar que a intenção foi registrada 4 segundos antes da execução."

**[2:30–3:30] Split Econômico (1 min)**
Mostrar um `pay_for_service` sendo chamado. Mostrar na transação: 85% para o treasury PDA, 15% para o creator. "Isso é enforced por contrato — eu não controlo o treasury." Mostrar o saldo do treasury crescendo.

**[3:30–4:30] Gestão de Portfólio (1 min)**
Mostrar o ServiceManager avaliando: "Risk Snapshot tem ROI 3.2x, Pool Health tem ROI 0.8x." Mostrar a decisão de ajuste de preço do Pool Health (com proof on-chain). Mostrar um serviço Level 1 sendo avaliado para promoção: "Treasury tem saldo para 14 dias de operação deste serviço — threshold é 7 dias — condição atendida."

**[4:30–5:30] Segurança (1 min)**
Simular 3 falhas consecutivas no Auto-Guard. Mostrar o circuit breaker ativando e pausando o serviço automaticamente. Mostrar o evento registrado on-chain. "O agente se protege sozinho."

**[5:30–6:00] Fechamento (30 seg)**
Mostrar o dashboard consolidado: serviços ativos, treasury health, decisões recentes, status do circuit breaker. "Cada número aqui é verificável on-chain. O agente não narra — ele prova."

---

## 7. Como Explicar "Capabilities Declaradas vs. Implementações Ativas"

**O problema:** Listar 25 serviços quando só 2 funcionam soa como vaporware.

**A solução — reframe como "capability registry", não roadmap:**

- **Analogia funcional:** "É como uma fábrica com 25 linhas de montagem instaladas, mas só 2 ligadas. As outras não são promessas — são infraestrutura real já registrada on-chain, com parâmetros econômicos definidos. O agente decide quando ligar cada uma, baseado no caixa e na demanda, não numa promessa minha."

- **Prova, não promessa:** Mostrar que os serviços Level 0 *existem on-chain* com `service_id`, preço base, e `activation_threshold_lamports`. "Você pode verificar agora que o serviço X precisa de 50 SOL no treasury para ser ativado. Quando o treasury atingir, o agente ativa. Isso não é roadmap — é uma condição verificável."

- **Linguagem precisa:** Nunca dizer "vamos lançar X". Dizer "X está registrado com condições de ativação Y. O agente promove quando as condições são atendidas." A diferença é: a primeira depende de promessa humana; a segunda depende de um contrato determinístico.

- **Transparência sobre o que *não* funciona:** No dashboard, cada serviço mostra claramente: "Level 0 — Declared | Conditions: treasury ≥ 50 SOL, min 7d operational data". Se a condição não é atendida, está visível. Isso transforma "promessa vazia" em "condição pública e verificável".

- **Para o juiz técnico:** "O registry é um commit de capacidades com gates econômicos on-chain. Não é uma lista de desejos — é um contrato com condições de ativação determinísticas. A diferença entre nós e um roadmap é que nosso roadmap é um programa Solana."
