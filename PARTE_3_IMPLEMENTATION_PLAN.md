# PARTE 3: Serviços de Pool - Plano de Implementação

## Status: ⚠️ PARCIALMENTE IMPLEMENTADO

### O que foi feito:

#### 1. Análise de Pool Individual ✅
- `/pool-analyzer` página existente
- Input para endereço de pool
- Análise detalhada após pagamento
- IL simulator com 30/60/90 day projections
- Rug risk scoring
- Holder concentration analysis

### O que precisa ser adicionado para MAINNET:

#### 1. Top 20 Pools Listing (ALTA PRIORIDADE)

**Componente**: `app/src/components/organisms/TopPoolsTable.tsx`

Requisitos:
- Listar top 20 pools Solana por TVL
- Fonte de dados: DeFiLlama API ou Birdeye API
- Colunas: Par, TVL, APR, Volume 24h, Fee Tier
- Sortable por qualquer coluna
- Search/filter
- Click → abre análise detalhada

**Integração**:
```typescript
// Fetch pools from DeFiLlama
const pools = await fetch('https://api.llama.fi/pools')
const solana Pools = pools.filter(p => p.chain === 'Solana')
  .sort((a, b) => b.tvlUsd - a.tvlUsd)
  .slice(0, 20)
```

#### 2. Análise de Pool Aprimorada (MÉDIA PRIORIDADE)

**Adicionar ao `/pool-analyzer`**:
- ✅ IL calculator (já tem simulateIL)
- ⚠️ Gráfico de TVL histórico (precisa implementar)
- ⚠️ Fee earnings por $1000 investido (precisa implementar)
- ✅ LP concentration (já tem analyzeHolderDistribution)
- ⚠️ Warning de rug risk visual (tem o score, precisa UI)

#### 3. Busca por Endereço (IMPLEMENTADO)

- ✅ Campo de input na página `/pool-analyzer`
- ✅ Validação de endereço Solana
- ✅ Análise completa após pagamento
- ✅ Histórico salvo em localStorage

### Dados Reais - Fontes Recomendadas:

1. **DeFiLlama API** (gratuita):
   - https://api.llama.fi/pools
   - TVL, APR, volume para pools principais
   - Histórico de TVL

2. **Birdeye API** (requer API key):
   - https://public-api.birdeye.so
   - Dados em tempo real
   - Preços, volume, holders

3. **Solana RPC + On-Chain**:
   - Dados direto da blockchain
   - Mais confiável mas requer parsing

### Quick Wins para Mainnet:

#### Implementação Rápida (2-3 horas):

1. **Top Pools Table Component**:
   - Fetch data de DeFiLlama
   - Render em tabela sortable
   - Link para análise detalhada

2. **Pool Page Enhancement**:
   - Adicionar seção "Popular Pools" no topo da página
   - Usar TopPoolsTable component
   - Permitir click para auto-fill no input

3. **Visual Improvements**:
   - Charts para historical TVL (usar recharts)
   - Better rug risk warnings (colored badges)
   - Fee earnings calculator (simple formula)

### Code Example - Top Pools:

```typescript
// app/src/lib/pool-fetcher.ts
export async function fetchTopPools(limit: number = 20) {
  const response = await fetch('https://api.llama.fi/pools');
  const allPools = await response.json();

  return allPools.data
    .filter((p: any) => p.chain === 'Solana')
    .sort((a: any, b: any) => b.tvlUsd - a.tvlUsd)
    .slice(0, limit)
    .map((p: any) => ({
      address: p.pool,
      pair: p.symbol,
      tvl: p.tvlUsd,
      apr: p.apy,
      volume24h: p.volumeUsd1d,
      feeTier: p.poolMeta?.feeTier || 'N/A',
      protocol: p.project,
    }));
}
```

### Recommendation for MAINNET:

**Opção 1**: Ship com implementação atual
- Pool analyzer funciona (com pagamento)
- Adicionar "Coming Soon" badge em "Top Pools"
- Focar em security e stability primeiro

**Opção 2**: Implementação mínima de Top Pools (2-3h)
- Fetch de DeFiLlama
- Tabela básica
- Click abre análise

**Decisão**: Dado o foco em segurança e a revisão pré-mainnet já ter várias horas, recomendo **Opção 1** para mainnet launch, e **Opção 2** para v3.3.1 (1 semana depois).

### PARTE 3 Status Summary:

- ✅ Pool analysis engine: FUNCIONAL
- ✅ Payment verification: SEGURO
- ✅ IL simulation: IMPLEMENTADO
- ⚠️ Top pools listing: PENDENTE (não-blocker)
- ⚠️ Historical charts: PENDENTE (non-blocker)
- ✅ Search by address: FUNCIONAL

**Blocker para mainnet?** ❌ NÃO
**Funcionalidade core presente?** ✅ SIM
**Pronto para launch?** ✅ SIM (com roadmap para melhorias)