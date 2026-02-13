# Frontend Feature Flags — Deploy Faseado Mainnet

Este guia explica como preparar o frontend do AXIONBLADE para funcionar com deploy faseado na mainnet.

## 📋 Visão Geral

O sistema de feature flags permite que o app funcione tanto com deploy parcial (Fase 1) quanto completo (Fase 2), sem breaking changes.

**Princípio:** Se um Program ID não está configurado no `.env.production`, a feature correspondente fica desabilitada automaticamente.

---

## 🔧 Implementação

### **1. Configuração de Programas (`config/programs.ts` ou similar)**

Crie um arquivo central para gerenciar os Program IDs:

```typescript
// config/programs.ts
import { PublicKey } from "@solana/web3.js";

export interface ProgramConfig {
  core: PublicKey;
  proof: PublicKey;
  apollo: PublicKey;
  treasury: PublicKey | null;
  service: PublicKey | null;
  auditor: PublicKey | null;
  hermes: PublicKey | null;
}

/**
 * Load program IDs from environment variables.
 * Returns null for optional programs if not configured.
 */
export function loadPrograms(): ProgramConfig {
  // Fase 1 - OBRIGATÓRIOS
  const core = process.env.NEXT_PUBLIC_PROGRAM_CORE;
  const proof = process.env.NEXT_PUBLIC_PROGRAM_PROOF;
  const apollo = process.env.NEXT_PUBLIC_PROGRAM_APOLLO;

  if (!core || !proof || !apollo) {
    throw new Error(
      "Missing required program IDs. Please configure .env.production with Fase 1 programs."
    );
  }

  // Fase 2 - OPCIONAIS
  const treasury = process.env.NEXT_PUBLIC_PROGRAM_TREASURY || null;
  const service = process.env.NEXT_PUBLIC_PROGRAM_SERVICE || null;
  const auditor = process.env.NEXT_PUBLIC_PROGRAM_AUDITOR || null;
  const hermes = process.env.NEXT_PUBLIC_PROGRAM_HERMES || null;

  return {
    core: new PublicKey(core),
    proof: new PublicKey(proof),
    apollo: new PublicKey(apollo),
    treasury: treasury ? new PublicKey(treasury) : null,
    service: service ? new PublicKey(service) : null,
    auditor: auditor ? new PublicKey(auditor) : null,
    hermes: hermes ? new PublicKey(hermes) : null,
  };
}

export const PROGRAMS = loadPrograms();
```

---

### **2. Feature Flags (`config/features.ts`)**

Defina quais features estão disponíveis baseado nos programas deployados:

```typescript
// config/features.ts
import { PROGRAMS } from "./programs";

export interface FeatureFlags {
  phase1: {
    riskAssessment: boolean;
    governanceBasic: boolean;
    proofSystem: boolean;
  };
  phase2: {
    paidServices: boolean;
    hermesIntel: boolean;
    treasuryDashboard: boolean;
    auditBadges: boolean;
    a2aMarketplace: boolean;
  };
}

export const FEATURES: FeatureFlags = {
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
    a2aMarketplace: PROGRAMS.service !== null, // depende de service
  },
};

/**
 * Check if we're in Phase 1 (partial) or Phase 2 (complete) mode
 */
export function getDeployPhase(): 1 | 2 {
  return FEATURES.phase2.paidServices &&
    FEATURES.phase2.hermesIntel &&
    FEATURES.phase2.treasuryDashboard &&
    FEATURES.phase2.auditBadges
    ? 2
    : 1;
}
```

---

### **3. Uso nos Componentes React**

#### **Esconder features não disponíveis:**

```tsx
// components/Sidebar.tsx
import { FEATURES } from "@/config/features";

export function Sidebar() {
  return (
    <nav>
      {/* Fase 1 - sempre disponível */}
      <NavItem href="/dashboard" icon={<DashboardIcon />}>
        Risk Assessment
      </NavItem>

      <NavItem href="/governance" icon={<GovernanceIcon />}>
        Governance
      </NavItem>

      {/* Fase 2 - condicional */}
      {FEATURES.phase2.paidServices && (
        <NavItem href="/services" icon={<ServicesIcon />}>
          Services & API
        </NavItem>
      )}

      {FEATURES.phase2.treasuryDashboard && (
        <NavItem href="/treasury" icon={<TreasuryIcon />}>
          Treasury
        </NavItem>
      )}

      {FEATURES.phase2.hermesIntel && (
        <NavItem href="/hermes" icon={<HermesIcon />}>
          Hermes Intel
        </NavItem>
      )}
    </nav>
  );
}
```

#### **Mostrar "Coming Soon" para features indisponíveis:**

```tsx
// components/FeatureCard.tsx
import { FEATURES } from "@/config/features";

export function TreasuryCard() {
  if (!FEATURES.phase2.treasuryDashboard) {
    return (
      <div className="card opacity-50">
        <div className="badge">Coming Soon</div>
        <h3>Treasury Dashboard</h3>
        <p>Gestão automatizada de treasury será disponibilizada na Fase 2.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Treasury Dashboard</h3>
      {/* Conteúdo real */}
    </div>
  );
}
```

---

### **4. Hooks Customizados**

Crie hooks para facilitar o uso das feature flags:

```typescript
// hooks/useFeatures.ts
import { FEATURES, getDeployPhase } from "@/config/features";

export function useFeatures() {
  return {
    features: FEATURES,
    phase: getDeployPhase(),
    isPhase1: getDeployPhase() === 1,
    isPhase2: getDeployPhase() === 2,
  };
}

// Exemplo de uso:
// const { features, isPhase1 } = useFeatures();
// if (features.phase2.paidServices) { ... }
```

---

### **5. API Routes / Server-Side**

Proteja API routes que dependem de programas da Fase 2:

```typescript
// pages/api/services/subscribe.ts
import { PROGRAMS } from "@/config/programs";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar se noumen_service está deployado
  if (!PROGRAMS.service) {
    return res.status(503).json({
      error: "Paid services not yet deployed",
      phase: 1,
      availableIn: "Phase 2",
      message: "This feature will be available after Phase 2 deployment.",
    });
  }

  // Lógica real da API
  // ...
}
```

---

### **6. Indicador de Fase (UI)**

Mostrar ao usuário em qual fase o protocolo está:

```tsx
// components/PhaseIndicator.tsx
import { getDeployPhase } from "@/config/features";

export function PhaseIndicator() {
  const phase = getDeployPhase();

  if (phase === 2) {
    return (
      <div className="badge badge-success">
        🚀 Phase 2 — Full Deployment
      </div>
    );
  }

  return (
    <div className="badge badge-warning">
      ⚡ Phase 1 — Core MVP
      <span className="text-xs ml-2">
        (Phase 2 features coming soon)
      </span>
    </div>
  );
}
```

---

## 📦 Checklist de Implementação

### **Para Fase 1 (antes do deploy):**

- [ ] Criar `config/programs.ts` com loader condicional
- [ ] Criar `config/features.ts` com feature flags
- [ ] Atualizar componentes de navegação (sidebar, header)
- [ ] Adicionar estados "Coming Soon" para features da Fase 2
- [ ] Proteger API routes com verificação de PROGRAMS
- [ ] Adicionar `PhaseIndicator` no layout
- [ ] Testar localmente com apenas env vars da Fase 1

### **Para Fase 2 (após deploy):**

- [ ] Atualizar `.env.production` com Program IDs da Fase 2
- [ ] Rebuild do frontend (`npm run build`)
- [ ] Verificar que feature flags detectam novos programas
- [ ] Testar todas as features da Fase 2
- [ ] Remover badges "Coming Soon" (acontece automaticamente)

---

## 🎯 Exemplo Completo: Página de Serviços

```tsx
// pages/services.tsx
import { FEATURES } from "@/config/features";
import { useFeatures } from "@/hooks/useFeatures";

export default function ServicesPage() {
  const { features, isPhase1 } = useFeatures();

  if (!features.phase2.paidServices) {
    return (
      <div className="container">
        <h1>Services & API Marketplace</h1>
        <div className="alert alert-info">
          <h3>🚧 Coming Soon in Phase 2</h3>
          <p>
            Paid services and Agent-to-Agent marketplace will be available
            after Phase 2 deployment.
          </p>
          <p className="text-sm">
            Currently available: Risk assessment and basic governance.
          </p>
        </div>
      </div>
    );
  }

  // UI completo quando service está deployado
  return (
    <div className="container">
      <h1>Services & API Marketplace</h1>
      {/* Conteúdo completo */}
    </div>
  );
}
```

---

## 🔄 Transição de Fase 1 para Fase 2

### **1. Deploy dos programas:**
```bash
./scripts/deploy-mainnet-fase2.sh
```

### **2. Inicializar PDAs:**
```bash
RPC_URL="https://api.mainnet-beta.solana.com" \
  npx ts-node scripts/init-mainnet-fase2.ts
```

### **3. Atualizar frontend:**
```bash
# Descomentar env vars da Fase 2 em .env.production
vim .env.production

# Rebuild
npm run build

# Ou se usar Vercel/similar, fazer redeploy
vercel --prod
```

### **4. Verificar:**
- [ ] `getDeployPhase()` retorna `2`
- [ ] Features da Fase 2 aparecem na UI
- [ ] API routes da Fase 2 funcionam
- [ ] Badges "Coming Soon" desaparecem

---

## ⚠️ Importante

1. **Sem Breaking Changes:** O app DEVE funcionar em ambas as fases
2. **Graceful Degradation:** Features indisponíveis devem ter UX clara
3. **No Build-Time Checks:** Use runtime checks (`PROGRAMS.x !== null`) para permitir mesmo build funcionar em ambas as fases
4. **Test Both Phases:** Teste localmente com `.env.local` simulando Fase 1 e Fase 2

---

## 🛠️ Troubleshooting

### **App não detecta programas da Fase 2:**
- Verificar se `.env.production` está atualizado
- Rebuild do frontend
- Limpar cache do Next.js (`rm -rf .next`)

### **Features aparecem mas API falha:**
- Verificar se `init-mainnet-fase2.ts` foi executado
- Checar logs de transação na Solana Explorer
- Confirmar que Program IDs estão corretos

### **Build falha com "Missing program IDs":**
- Isso só deve acontecer se programas da **Fase 1** não estiverem configurados
- Fase 2 é opcional e não deve causar build failure
