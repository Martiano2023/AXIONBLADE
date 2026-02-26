# AXIONBLADE Frontend

Next.js 16 frontend for the AXIONBLADE protocol. Provides the dashboard, service interfaces, wallet connection, payment flows, and real-time protocol monitoring.

---

## Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| [Next.js](https://nextjs.org) | 16.1.6 | App Router, SSR, API routes |
| [React](https://react.dev) | 19.2.3 | UI rendering |
| [TypeScript](https://typescriptlang.org) | 5.x | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | v4 | Utility-first styling |
| [Framer Motion](https://framer.com/motion) | 12.x | Animations and transitions |
| [@solana/web3.js](https://solana-labs.github.io/solana-web3.js) | 1.98.x | Solana RPC client |
| [@solana/wallet-adapter](https://github.com/solana-labs/wallet-adapter) | 0.15.x | 8 wallet adapters |
| [@coral-xyz/anchor](https://anchor-lang.com) | 0.32.x | Program client generation |
| [Zustand](https://github.com/pmndrs/zustand) | 5.x | Global state management |
| [TanStack Query](https://tanstack.com/query) | 5.x | Server state and caching |
| [Recharts](https://recharts.org) | 3.x | Analytics charts |
| [Radix UI](https://radix-ui.com) | 1.x | Accessible UI primitives |
| [Sonner](https://sonner.emilkowal.ski) | 2.x | Toast notifications |

---

## Directory Structure

```
app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (app)/                    # Dashboard route group (protected)
│   │   │   ├── layout.tsx            # Dashboard shell (sidebar + topbar)
│   │   │   ├── dashboard/            # Main dashboard overview
│   │   │   ├── agents/               # Agent management and status
│   │   │   ├── aeon/                 # AEON governor interface
│   │   │   ├── apollo/               # APOLLO risk evaluator interface
│   │   │   ├── hermes/               # HERMES intelligence services
│   │   │   ├── analytics/            # Protocol analytics
│   │   │   ├── treasury/             # Treasury monitoring and CCS splits
│   │   │   ├── economics/            # Economic model overview
│   │   │   ├── axioms/               # Axiom compliance display
│   │   │   ├── security/             # Security status and circuit breakers
│   │   │   ├── services/             # Service catalog and pricing
│   │   │   ├── activity/             # On-chain activity feed
│   │   │   ├── alerts/               # Alert management
│   │   │   ├── settings/             # User and protocol settings
│   │   │   ├── wallet-scanner/       # Wallet exposure analysis
│   │   │   ├── pool-analyzer/        # Pool risk analysis
│   │   │   ├── yield-optimizer/      # Yield optimization interface
│   │   │   ├── liquidation-scanner/  # Liquidation risk scanner
│   │   │   ├── token/                # Token overview
│   │   │   ├── token-deep-dive/      # In-depth token analysis
│   │   │   ├── protocol-auditor/     # Protocol audit interface
│   │   │   ├── price-monitor/        # Real-time price monitoring
│   │   │   ├── integrations/         # Third-party integrations
│   │   │   └── airdrop/              # Airdrop tooling
│   │   │
│   │   ├── api/                      # Next.js API Routes
│   │   │   ├── _shared/              # Auth middleware (HMAC-SHA256 verification)
│   │   │   ├── proof/                # Proof verification endpoint
│   │   │   ├── risk-score/           # Risk score query
│   │   │   ├── effective-apr/        # Effective APR calculation
│   │   │   ├── pool-analyzer/        # Pool analysis endpoint
│   │   │   ├── wallet-scanner/       # Wallet scan endpoint
│   │   │   ├── yield-optimizer/      # Yield optimization endpoint
│   │   │   ├── yield-trap/           # Yield trap detection
│   │   │   ├── liquidation-scanner/  # Liquidation risk endpoint
│   │   │   ├── protocol-auditor/     # Protocol audit endpoint
│   │   │   ├── price-monitor/        # Price monitoring endpoint
│   │   │   ├── token-deep-dive/      # Token analysis endpoint
│   │   │   ├── verify-tier/          # Service tier verification
│   │   │   └── economy/              # Economy/CCS data endpoint
│   │   │
│   │   ├── why-axionblade/           # Marketing/explainer page
│   │   ├── widget/                   # Embeddable widget
│   │   ├── layout.tsx                # Root layout (providers, metadata)
│   │   ├── page.tsx                  # Landing page
│   │   ├── providers.tsx             # Root provider composition
│   │   └── globals.css               # Global styles (Tailwind base)
│   │
│   ├── components/
│   │   ├── atoms/                    # 16 base UI components
│   │   │   ├── GlassCard.tsx         # Glassmorphism card with gradient/glow/hover
│   │   │   ├── Badge.tsx             # Status and label badges
│   │   │   ├── Button.tsx            # Button variants
│   │   │   ├── CircularGauge.tsx     # Circular progress gauge
│   │   │   ├── ConfidenceBadge.tsx   # Risk confidence indicator
│   │   │   ├── DataSourceBadge.tsx   # Data source attribution
│   │   │   ├── DisclaimerCard.tsx    # Mandatory disclaimer (A0-26)
│   │   │   ├── AnimatedNumber.tsx    # Animated numeric display
│   │   │   ├── SparklineChart.tsx    # Inline trend chart
│   │   │   ├── StatusBadge.tsx       # System status indicator
│   │   │   ├── TierCard.tsx          # Service tier card
│   │   │   ├── Tooltip.tsx           # Accessible tooltip
│   │   │   ├── Shimmer.tsx           # Loading skeleton
│   │   │   ├── RecentChangesFeed.tsx # Live changes list
│   │   │   └── TechnicalDetails.tsx  # Expandable technical metadata
│   │   │
│   │   ├── molecules/                # 10 compound components
│   │   │   └── Card.tsx              # (and others)
│   │   │
│   │   ├── organisms/                # 8 complex UI components
│   │   │   ├── NavigationSidebar.tsx # Main nav (Agents/Analytics/Tools/System)
│   │   │   ├── TopBar.tsx            # Live protocol ticker
│   │   │   ├── AgentCard.tsx         # Agent status card
│   │   │   ├── AgentActivityFeed.tsx # Real-time agent activity
│   │   │   ├── AgentPerformancePanel.tsx
│   │   │   ├── AgentSettingsModal.tsx
│   │   │   ├── ChartContainer.tsx    # Reusable chart wrapper
│   │   │   ├── DataTable.tsx         # Sortable/filterable table
│   │   │   ├── ActivityFeed.tsx      # On-chain activity list
│   │   │   └── UpgradeModal.tsx      # Service tier upgrade flow
│   │   │
│   │   ├── effects/
│   │   │   └── ParticlesBackground.tsx  # Canvas particle animation
│   │   │
│   │   ├── illustrations/
│   │   │   └── AgentIllustrations.tsx   # SVG per-agent illustrations
│   │   │
│   │   └── ui/                       # shadcn/ui primitive overrides
│   │
│   ├── hooks/                        # 18 custom React hooks
│   │   ├── usePayment.ts             # Solana payment flow
│   │   ├── useBalance.ts             # Wallet SOL balance
│   │   ├── useProgram.ts             # Anchor program client
│   │   ├── usePoolData.ts            # Pool data fetching
│   │   ├── usePrices.ts              # Token price feeds
│   │   ├── usePricing.ts             # Service pricing queries
│   │   ├── useAgentActivity.ts       # Agent on-chain activity
│   │   ├── useAgentPerformance.ts    # Agent performance metrics
│   │   ├── useAgentPermissions.ts    # Agent permission checks
│   │   ├── useActivityFeed.ts        # Protocol activity feed
│   │   ├── useProtocolStats.ts       # Protocol-level stats
│   │   ├── useRiskScores.ts          # Risk score queries
│   │   ├── useRevenueChart.ts        # Revenue chart data
│   │   ├── useTokenLaunch.ts         # Token launch state
│   │   ├── useAirdrop.ts             # Airdrop tooling
│   │   └── useOfflineDetection.ts    # Network connectivity
│   │
│   ├── lib/                          # Business logic (no React)
│   │   ├── risk-engine.ts            # Core risk evaluation logic
│   │   ├── proof-generator.ts        # On-chain proof creation via noumen_proof
│   │   ├── payment-verifier.ts       # Solana transaction payment verification
│   │   ├── pricing-engine.ts         # Service pricing enforcement (A0-8)
│   │   ├── pricing-stabilizer.ts     # Pricing epoch management
│   │   ├── agent-orchestrator.ts     # Agent coordination and delegation
│   │   ├── ai-engine.ts              # Advisory ML layer (never makes final decisions)
│   │   ├── correlation-analyzer.ts   # Cross-signal correlation
│   │   ├── cost-tracker.ts           # Per-operation cost tracking
│   │   ├── il-simulator.ts           # Impermanent loss simulation
│   │   ├── yield-ranker.ts           # Pool yield ranking
│   │   ├── yield-trap-detector.ts    # Yield trap signal detection
│   │   ├── protocol-aggregator.ts    # Multi-protocol data aggregation
│   │   ├── protocol-db.ts            # Protocol metadata registry
│   │   ├── pyth-client.ts            # Pyth oracle price feeds
│   │   ├── holder-analyzer.ts        # Token holder analysis
│   │   ├── retry-with-backoff.ts     # RPC retry logic
│   │   ├── pda.ts                    # PDA derivation helpers
│   │   ├── program.ts                # Anchor program client factory
│   │   ├── transactions.ts           # Transaction building utilities
│   │   ├── constants.ts              # Protocol-wide constants
│   │   ├── format.ts                 # Display formatting
│   │   ├── utils.ts                  # General utilities
│   │   ├── agents/                   # Agent-specific logic modules
│   │   └── wallet-scanner/           # Wallet analysis modules
│   │
│   ├── providers/
│   │   ├── WalletProvider.tsx        # @solana/wallet-adapter setup (8 adapters)
│   │   ├── QueryProvider.tsx         # TanStack Query client
│   │   └── RealtimeProvider.tsx      # WebSocket / real-time subscriptions
│   │
│   └── stores/                       # Zustand global state
│       ├── useProtocolStore.ts       # Protocol config, agent status
│       ├── useSettingsStore.ts       # User preferences and settings
│       └── useTierStore.ts           # Service tier and entitlements
│
├── public/                           # Static assets
├── next.config.ts                    # Security headers, CSP, HSTS
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── postcss.config.mjs
```

---

## Environment Variables

Copy `.env.local` and fill in the required values. Never commit `.env.local` to version control.

```bash
cp .env.local.example .env.local
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLUSTER` | Solana cluster | `mainnet-beta` or `devnet` |
| `NEXT_PUBLIC_RPC_URL` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `NEXT_PUBLIC_PROGRAM_CORE` | `noumen_core` program ID | `9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE` |
| `NEXT_PUBLIC_PROGRAM_PROOF` | `noumen_proof` program ID | `3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV` |
| `NEXT_PUBLIC_PROGRAM_APOLLO` | `noumen_apollo` program ID | `92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee` |
| `NEXT_PUBLIC_PROGRAM_TREASURY` | `noumen_treasury` program ID | `EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu` |
| `NEXT_PUBLIC_PROGRAM_HERMES` | `noumen_hermes` program ID | `Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj` |
| `NEXT_PUBLIC_PROGRAM_AUDITOR` | `noumen_auditor` program ID | `CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe` |
| `NEXT_PUBLIC_PROGRAM_SERVICE` | `noumen_service` program ID | `9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY` |
| `NEXT_PUBLIC_AEON_CONFIG_PDA` | AEON governance config PDA | (on-chain derived address) |
| `NEXT_PUBLIC_PROTOCOL_VERSION` | Protocol version string | `3.4.0` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID — required for WalletConnect wallet adapter |
| `NEXT_PUBLIC_TIPLINK_CLIENT_ID` | TipLink client ID — required for TipLink wallet adapter |

### Server-Only Variables (never expose to client)

| Variable | Description |
|----------|-------------|
| `API_HMAC_SECRET` | 64-char hex secret for HMAC-SHA256 API key signing and validation |

---

## Development Workflow

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# --> http://localhost:3000

# Type-check without building
npx tsc --noEmit

# Lint
npm run lint

# Production build (validates configuration)
npm run build

# Start production server locally
npm run start
```

---

## Building and Deploying to Vercel

### Automatic (recommended)

Connect the repository to Vercel. Every push to `main` triggers a production deployment. Pull requests get preview deployments automatically.

Set all environment variables in the Vercel project settings under **Settings > Environment Variables**. The `API_HMAC_SECRET` must be marked as **Server** only (not exposed to the browser).

### Manual

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

The `vercel.json` at the project root controls routing and build configuration.

---

## API Authentication

All non-public API routes require HMAC-SHA256 authentication.

### Key Format

```
nk_{tier}_{16-char-payload}_{8-char-hmac-signature}
```

Where `tier` is one of: `entry`, `premium`, `b2b`.

### Request Format

Pass the API key in the `x-api-key` request header:

```http
GET /api/risk-score?pool=<address>
x-api-key: nk_premium_a1b2c3d4e5f6g7h8_deadbeef
```

### Verification

The `app/src/app/api/_shared/` middleware verifies the HMAC signature against `API_HMAC_SECRET` on every request. Requests with invalid, expired, or mismatched keys receive `401 Unauthorized`.

Keys are issued on-chain after service payment is verified by `payment-verifier.ts`. The payment verifier queries the Solana RPC directly — no mock, no custodial intermediary.

---

## Key Components Guide

### `GlassCard` — `src/components/atoms/GlassCard.tsx`

The primary card surface. Accepts `gradient`, `glow` (per-agent brand color), and `hover` props. Used throughout the dashboard for agent panels, service cards, and data displays.

### `TopBar` — `src/components/organisms/TopBar.tsx`

Live protocol ticker rendered at the top of every dashboard page. Displays: Treasury balance, on-chain proof count, system uptime, agent count (N/100 cap), active services, and axiom compliance (50/50).

### `NavigationSidebar` — `src/components/organisms/NavigationSidebar.tsx`

Main navigation with 4 sections: **Agents** (AEON, APOLLO, HERMES, KRONOS), **Analytics**, **Tools** (wallet scanner, pool analyzer, etc.), **System** (treasury, axioms, security). Collapses on mobile.

### `AgentIllustrations` — `src/components/illustrations/AgentIllustrations.tsx`

SVG illustrations for each agent with correct brand colors: AEON (rose `#F43F5E`), APOLLO (cyan `#00D4FF`), HERMES (purple `#A855F7`), KRONOS (amber `#F59E0B`).

### `ParticlesBackground` — `src/components/effects/ParticlesBackground.tsx`

Canvas-based particle animation on the landing page. Runs as a Web Worker to avoid blocking the main thread.

### `DisclaimerCard` — `src/components/atoms/DisclaimerCard.tsx`

Mandatory disclaimer rendered on all paid service outputs per Axiom A0-26. Displays `not_investment_advice`, `uncertainty_flags`, and `decision_class` metadata from the canonical proof hash.

### `usePayment` — `src/hooks/usePayment.ts`

Handles the full Solana payment flow: builds the transfer transaction, submits to the wallet, waits for confirmation, then passes the signature to `payment-verifier.ts` for on-chain verification before issuing service access.

### `risk-engine.ts` — `src/lib/risk-engine.ts`

Core risk evaluation logic. Aggregates signals from the 5 evidence families (Price/Volume, Liquidity, Behavior, Incentive, Protocol), applies the evidence quorum check (>= 2 independent families required), and enforces the APOLLO weight cap (<= 40%). Returns either an actionable risk score or ALERT-ONLY status.

### `proof-generator.ts` — `src/lib/proof-generator.ts`

Interfaces with `noumen_proof` on-chain program to call `log_decision()`. Every service output that feeds into an execution decision must call this before the decision is acted upon (A0-5).

---

## Supported Wallets

| Wallet | Adapter |
|--------|---------|
| Phantom | `@solana/wallet-adapter-wallets` |
| Solflare | `@solana/wallet-adapter-wallets` |
| Coinbase Wallet | `@solana/wallet-adapter-wallets` |
| Ledger | `@solana/wallet-adapter-wallets` |
| Trust Wallet | `@solana/wallet-adapter-wallets` |
| WalletConnect | `@walletconnect/solana-adapter` |
| Solana Mobile | `@solana-mobile/wallet-adapter-mobile` |
| TipLink | `@tiplink/wallet-adapter` |

WalletConnect and TipLink require their respective environment variables to be set (see above).
