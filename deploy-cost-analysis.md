# AXIONBLADE Mainnet Deploy Cost Analysis

## 📊 Tamanhos dos Binários e Custos Estimados

| Programa | Tamanho Atual | Max-len 2.0x (padrão) | Max-len 1.5x (econômico) | Economia |
|----------|---------------|----------------------|-------------------------|----------|
| **noumen_core** | 315,624 bytes (308 KB) | 631,248 bytes (~**2.19 SOL**) | 473,436 bytes (~**1.64 SOL**) | **~0.55 SOL** |
| **noumen_proof** | 277,200 bytes (271 KB) | 554,400 bytes (~**1.92 SOL**) | 415,800 bytes (~**1.44 SOL**) | **~0.48 SOL** |
| **noumen_apollo** | 259,160 bytes (253 KB) | 518,320 bytes (~**1.80 SOL**) | 388,740 bytes (~**1.35 SOL**) | **~0.45 SOL** |
| **noumen_treasury** | 350,080 bytes (342 KB) | 700,160 bytes (~**2.43 SOL**) | 525,120 bytes (~**1.82 SOL**) | **~0.61 SOL** |
| **noumen_service** | 242,136 bytes (236 KB) | 484,272 bytes (~**1.68 SOL**) | 363,204 bytes (~**1.26 SOL**) | **~0.42 SOL** |
| **noumen_auditor** | 270,792 bytes (264 KB) | 541,584 bytes (~**1.88 SOL**) | 406,188 bytes (~**1.41 SOL**) | **~0.47 SOL** |
| **noumen_hermes** | 237,920 bytes (232 KB) | 475,840 bytes (~**1.65 SOL**) | 356,880 bytes (~**1.24 SOL**) | **~0.41 SOL** |

**Nota**: Custos calculados com rent-exempt mínimo (~3.47 lamports/byte) + overhead de programa Solana.

---

## 🎯 PLANO DE DEPLOY FASEADO

### **FASE 1: Core Essencial (MVP Funcional)**
Deploy dos programas mínimos necessários para o protocolo AXIONBLADE operar com funcionalidade básica:

| Programa | Razão | Custo (1.5x) |
|----------|-------|--------------|
| **noumen_core** | AEON (governador soberano) - coordenação, delegação, decisões | **1.64 SOL** |
| **noumen_proof** | Sistema de proof obrigatório (Axioma A0-10) - sem proof, sem execução | **1.44 SOL** |
| **noumen_apollo** | APOLLO (avaliador de risco DeFi) - core do produto | **1.35 SOL** |

**💰 Total Fase 1: ~4.43 SOL**

**Funcionalidades disponíveis:**
- ✅ Governança básica via AEON
- ✅ Sistema de proof de decisões (log_decision obrigatório)
- ✅ Avaliação de risco DeFi (Pool Taxonomy, MLI, Effective APR)
- ✅ Firewall chain: APOLLO → assessment_pda → Risk Engine → AEON → Executor
- ✅ Consultas read-only de risco

**Funcionalidades INDISPONÍVEIS até Fase 2:**
- ❌ Inteligência DeFi pública (HERMES)
- ❌ Serviços pagos / API marketplace
- ❌ Gestão automatizada de treasury
- ❌ Auditoria automatizada / CCS

---

### **FASE 2: Economia e Serviços Completos**
Deploy dos programas para monetização e gestão econômica:

| Programa | Razão | Custo (1.5x) |
|----------|-------|--------------|
| **noumen_treasury** | Gestão de treasury, reserve ratio, CCS splits | **1.82 SOL** |
| **noumen_service** | Serviços pagos (Entry/Premium/B2B), A2A marketplace | **1.26 SOL** |
| **noumen_auditor** | Auditoria de decisões, verificação de conformidade axiomática | **1.41 SOL** |
| **noumen_hermes** | HERMES (inteligência DeFi pública) - 5 serviços externos | **1.24 SOL** |

**💰 Total Fase 2: ~5.73 SOL**

**Funcionalidades adicionais desbloqueadas:**
- ✅ Receita via serviços pagos
- ✅ Agent-to-Agent marketplace
- ✅ Gestão automatizada de treasury (reserve ratio 25%, daily spend cap 3%)
- ✅ Sistema CCS (Creator Capture Split)
- ✅ Inteligência DeFi pública via HERMES
- ✅ Auditoria retroativa completa

---

## 💵 RESUMO DE CUSTOS

| Categoria | Custo 1.5x | Custo 2.0x (padrão) | Economia Total |
|-----------|------------|---------------------|----------------|
| **Fase 1 (Core MVP)** | **4.43 SOL** | **5.91 SOL** | **1.48 SOL** |
| **Fase 2 (Economia)** | **5.73 SOL** | **7.64 SOL** | **1.91 SOL** |
| **TOTAL COMPLETO** | **10.16 SOL** | **13.55 SOL** | **3.39 SOL (25%)** |

---

## 🔧 IMPACTO NO FRONTEND/APP

### **Durante Fase 1 (só core+proof+apollo):**

#### ✅ O que FUNCIONA:
- Dashboard de avaliação de risco
- Consultas de pool taxonomy
- MLI (Market Liquidity Index)
- Effective APR calculations
- Visualização de proofs de decisão
- Governança básica (via AEON)

#### ❌ O que NÃO FUNCIONA:
- Paywall / assinaturas (sem noumen_service)
- API pública HERMES (sem noumen_hermes)
- Estatísticas de treasury (sem noumen_treasury)
- Badges de auditoria (sem noumen_auditor)
- Agent-to-Agent marketplace

#### 🛠️ Mudanças necessárias no código:

**1. Frontend (`app/` ou similar):**
```typescript
// config/programs.ts (ou onde ficam os program IDs)
export const PROGRAMS = {
  // Fase 1 - ATIVO
  core: new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_CORE!),
  proof: new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_PROOF!),
  apollo: new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_APOLLO!),

  // Fase 2 - DESABILITADO temporariamente
  treasury: process.env.NEXT_PUBLIC_PROGRAM_TREASURY
    ? new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_TREASURY)
    : null,
  service: process.env.NEXT_PUBLIC_PROGRAM_SERVICE
    ? new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_SERVICE)
    : null,
  auditor: process.env.NEXT_PUBLIC_PROGRAM_AUDITOR
    ? new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_AUDITOR)
    : null,
  hermes: process.env.NEXT_PUBLIC_PROGRAM_HERMES
    ? new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_HERMES)
    : null,
};

// Feature flags
export const FEATURES = {
  phase1: {
    riskAssessment: true,
    governanceBasic: true,
    proofSystem: true,
  },
  phase2: {
    paidServices: PROGRAMS.service !== null,
    hermesIntel: PROGRAMS.hermes !== null,
    treasuryDashboard: PROGRAMS.treasury !== null,
    auditBadges: PROGRAMS.auditor !== null,
  },
};
```

**2. UI Components:**
```typescript
// Esconder features de Fase 2
{FEATURES.phase2.paidServices && (
  <SubscriptionButton />
)}

{FEATURES.phase2.hermesIntel && (
  <HermesIntelPanel />
)}

// Mostrar "Coming Soon" para features não disponíveis
{!FEATURES.phase2.treasuryDashboard && (
  <div className="coming-soon">
    Treasury Dashboard - Coming Soon
  </div>
)}
```

**3. API Routes / Server:**
```typescript
// api/risk/assess.ts (FUNCIONA em Fase 1)
if (!PROGRAMS.apollo) {
  return res.status(503).json({ error: "Risk assessment temporarily unavailable" });
}

// api/services/subscribe.ts (NÃO FUNCIONA em Fase 1)
if (!PROGRAMS.service) {
  return res.status(503).json({
    error: "Paid services not yet deployed",
    phase: 1,
    availableIn: "Phase 2"
  });
}
```

---

### **Após Fase 2 (todos os programas):**

#### 🔄 Mudanças necessárias:

**1. Atualizar `.env.production`:**
```bash
# Adicionar program IDs da Fase 2
NEXT_PUBLIC_PROGRAM_TREASURY=<deployed_id>
NEXT_PUBLIC_PROGRAM_SERVICE=<deployed_id>
NEXT_PUBLIC_PROGRAM_AUDITOR=<deployed_id>
NEXT_PUBLIC_PROGRAM_HERMES=<deployed_id>
```

**2. Rebuild do frontend:**
```bash
npm run build
# ou
yarn build
```

**3. Habilitar features:**
- Remover feature flags condicionais
- Ativar componentes de Fase 2
- Testar integrações completas

**4. Inicializar PDAs da Fase 2:**
```bash
# Rodar init-mainnet-fase2.ts
ts-node scripts/init-mainnet-fase2.ts
```

---

## 🛡️ ESTRATÉGIA DE MITIGAÇÃO DE RISCO

### **Se o deploy falhar ou SOL acabar:**

1. **Fase 1 é totalmente funcional** - protocolo opera com funcionalidades core
2. **Sem breaking changes** - app detecta automaticamente programas disponíveis via feature flags
3. **Rollback simples** - manter ambos os ambientes (.env.staging vs .env.production)
4. **Upgrade incremental** - adicionar programas da Fase 2 um por um se necessário

### **Ordem recomendada na Fase 2 (se fizer individual):**
1. `noumen_service` (habilita receita)
2. `noumen_treasury` (gestão econômica)
3. `noumen_hermes` (inteligência pública)
4. `noumen_auditor` (auditoria - menos crítico)

---

## ✅ CHECKLIST ANTES DO DEPLOY

- [ ] Confirmar saldo suficiente: **mínimo 4.5 SOL para Fase 1** (com margem)
- [ ] Criar keypair de upgrade authority (se não existir)
- [ ] Backup das chaves privadas em local seguro
- [ ] Configurar `.env.production` com RPC mainnet
- [ ] Testar scripts em devnet primeiro
- [ ] Preparar frontend com feature flags
- [ ] Documentar program IDs após deploy
- [ ] Testar smoke test após cada programa (read-only calls)

---

## 📋 PRÓXIMOS PASSOS

Aguardando sua aprovação para:
1. ✅ Criar `scripts/deploy-mainnet-fase1.sh`
2. ✅ Criar `scripts/deploy-mainnet-fase2.sh`
3. ✅ Criar `scripts/init-mainnet-fase1.ts`
4. ✅ Criar `scripts/init-mainnet-fase2.ts`
5. ✅ Criar template `.env.production.example`
6. ✅ Criar guia de feature flags para frontend

**IMPORTANTE**: Todos os scripts terão confirmações manuais antes de cada deploy e mostrarão custos estimados.
