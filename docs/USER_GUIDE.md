# AXIONBLADE v3.3.0 — User Guide

Welcome to AXIONBLADE, the autonomous risk assessment infrastructure with verifiable proof for DeFi and AI agents.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [AI Agents](#ai-agents)
3. [DeFi Services](#defi-services)
4. [Economy Dashboard](#economy-dashboard)
5. [Pricing & Volume Discounts](#pricing--volume-discounts)
6. [Proof Verification](#proof-verification)

---

## Getting Started

### Connect Your Wallet

1. Click "Connect Wallet" in the top right
2. Select your Solana wallet (Phantom, Solflare, etc.)
3. Approve the connection

### Fund Your Wallet

Ensure you have sufficient SOL for service payments:
- Wallet Scanner: 0.05 SOL (10x cheaper than before!)
- Pool Analyzer: 0.005 SOL
- Protocol Auditor: 0.01 SOL
- Yield Optimizer: 0.008 SOL
- Token Deep Dive: 0.012 SOL
- AEON Monthly: 0.02 SOL

**Volume Discounts Available**: Get up to 30% off with frequent usage!

---

## AI Agents

AXIONBLADE features 3 autonomous AI agents that monitor, analyze, and execute on your behalf.

### AEON Guardian — 24/7 Monitoring

**Purpose**: Detect and respond to threats in real-time

**Features**:
- Monitors unlimited token approvals
- Tracks impermanent loss in LP positions
- Watches health factors in lending positions
- Auto-executes defensive actions (with your permission)

**How to Use**:
1. Navigate to `/agents`
2. Click "Activate" on AEON Guardian
3. Click "Configure" to set:
   - IL Threshold (default: 10%)
   - Health Factor Threshold (default: 1.2)
   - Auto-revoke approvals: ON/OFF
   - Auto-exit pools: ON/OFF
   - Auto-unstake: ON/OFF
4. Click "Save On-Chain" (creates AgentPermissionConfig PDA)
5. AEON starts monitoring immediately

**Pricing**: 0.02 SOL/month

**Example Alert**:
```
⚠️ High IL Detected
Impermanent loss exceeded 12% in SOL-USDC pool on Raydium
Action: AEON requested APOLLO analysis
```

### APOLLO Analyst — Deep Risk Analysis

**Purpose**: Evaluate risks using 5 evidence families

**Features**:
- Analyzes pools, protocols, and positions
- Generates natural language risk reports
- Uses 5 evidence families (Price/Volume, Liquidity, Behavior, Incentive, Protocol)
- Creates on-chain proofs for all assessments

**How to Use**:
1. Navigate to `/agents`
2. Click "Activate" on APOLLO Analyst
3. Configure auto-analysis frequency (1-24 hours)
4. APOLLO analyzes your positions automatically

**Evidence Families**:
1. **Price/Volume**: Price stability, volume trends, volatility
2. **Liquidity**: DEX depth, holder distribution, exit capacity
3. **Behavior**: Transaction patterns, whale movements, wash trading
4. **Incentive**: APR structure, emissions, fee generation
5. **Protocol**: Audit status, TVL trends, governance health

**Pricing**: Included with paid scans

### HERMES Executor — Autonomous Actions

**Purpose**: Execute approved actions with proof-before-action

**Features**:
- Swap tokens via Jupiter
- Add/remove liquidity
- Stake/unstake from protocols
- Revoke dangerous approvals
- DCA (Dollar-Cost Averaging)
- Auto-rebalancing

**How to Use**:
1. Navigate to `/agents`
2. Click "Activate" on HERMES Executor
3. Configure execution limits:
   - Max TX Amount (e.g., 0.5 SOL)
   - Daily TX Limit (e.g., 10 txs/day)
   - Max Slippage (e.g., 1%)
   - Allowed Protocols (Jupiter, Raydium, etc.)
   - Enable DCA: ON/OFF
   - Enable Rebalancing: ON/OFF
4. Click "Save On-Chain"

**Safety Guarantees** (Axioms A0-31 through A0-35):
- ✅ Requires explicit per-action authorization
- ✅ Validates >=2 evidence families before execution
- ✅ References recent APOLLO assessment (<1h old)
- ✅ Can be paused by AEON if anomaly detected
- ✅ Can be revoked by you instantly

**Pricing**: 0.1% per transaction (min 0.001 SOL)

---

## DeFi Services

### 1. Wallet Scanner (0.05 SOL)

**Comprehensive wallet risk assessment**

**What You Get**:
- Overall risk score (0-100)
- Risk tier (S/A/B/C/D/F)
- Token holdings analysis
- DeFi positions breakdown
- Transaction summary
- Risk drivers and recommendations
- On-chain proof

**How to Use**:
1. Navigate to `/wallet-scanner`
2. Enter wallet address (or click "Scan My Wallet")
3. Pay 0.05 SOL
4. Review comprehensive report

**New in v3.3.0** (8 Enhanced Sections):
- Risk Score Engine (S-F tier)
- Portfolio X-Ray (treemap, concentration)
- DeFi Exposure Map
- Threat Detection (scams, approvals)
- Stress Test (market crash simulations)
- Smart Recommendations
- Risk Timeline (7/30/90 day trends)
- Visual Report (PDF export)

### 2. Pool Analyzer (0.005 SOL)

**Deep LP pool analysis**

**What You Get**:
- Real TVL (wash trading filtered)
- Volume/TVL ratio
- Fee APR calculation
- IL simulation (30/60/90 days)
- LP holder concentration (Gini, HHI)
- Smart money flow (24h)
- Rug risk score (0-100)
- Best concentrated liquidity range
- Verdict: Excellent/Good/Fair/Poor/Avoid

**How to Use**:
1. Navigate to `/pool-analyzer`
2. Enter pool address
3. Pay 0.005 SOL
4. Review IL projections and rug risk

**Example Output**:
```
Pool: Raydium SOL-USDC
TVL (Real): $4.75M
Volume/TVL Ratio: 0.17
Fee APR: 18.6%
Rug Risk Score: 85/100 (Low)
Verdict: GOOD ✅
```

### 3. Protocol Auditor (0.01 SOL)

**Comprehensive protocol assessment**

**What You Get**:
- TVL trends and growth analysis
- Security audit status and exploit history
- Governance health (voter participation)
- Revenue and fee analysis
- Smart contract risk assessment
- User retention metrics
- Composite risk score
- Recommendation: Strong Buy/Buy/Hold/Avoid

**How to Use**:
1. Navigate to `/protocol-auditor`
2. Enter protocol name (e.g., "Raydium", "Orca")
3. Pay 0.01 SOL
4. Review comprehensive audit

### 4. Yield Optimizer (0.008 SOL)

**Risk-adjusted yield ranking**

**What You Get**:
- Top 10 yield opportunities ranked by risk-adjusted return
- Portfolio allocation suggestion (diversified)
- Risk profile filtering (conservative/moderate/aggressive)
- IL risk consideration
- Lock period filtering
- Best single opportunity
- Best for safety/yield/overall
- Hedge suggestions

**How to Use**:
1. Navigate to `/yield-optimizer`
2. Enter investment amount (USD)
3. Select risk profile
4. Pay 0.008 SOL
5. Review ranked opportunities

**Example Portfolio Suggestion**:
```
Conservative Profile ($10,000):
- 60% Marinade mSOL (8% APR, Risk: 92/100)
- 30% Jito JitoSOL (9% APR, Risk: 88/100)
- 10% Kamino USDC (12% APR, Risk: 85/100)

Expected Return: $890/year
Avg Risk Score: 89/100
Diversification: Moderate
```

### 5. Token Deep Dive (0.012 SOL)

**Multi-dimensional token analysis**

**What You Get**:
- Holder distribution (Gini, HHI, whale concentration)
- Price correlation with SOL/BTC/ETH
- IL risk prediction based on correlation
- Liquidity analysis across DEXs
- Trading patterns and volume
- Smart money tracking
- Social metrics
- Multi-dimensional risk assessment
- Recommendations and best use cases

**How to Use**:
1. Navigate to `/token-deep-dive`
2. Enter token mint address
3. Pay 0.012 SOL
4. Review comprehensive token analysis

---

## Economy Dashboard

**Real-time protocol economics monitoring** (accessible at `/economy`)

**What You See**:
- Total revenue and costs
- Average margin across all services
- Monthly revenue projection
- 4-way revenue split visualization:
  - Operations: 50%
  - Reserve: 25%
  - Dev Fund: 15%
  - Creator: 10%
- Service performance table (price, cost, margin, requests, trend)
- Margin alerts (when services drop below 30%)
- Volume discount analytics

**Auto-Refresh**: Every 30 seconds

---

## Pricing & Volume Discounts

### Base Pricing (v3.3.0 — Repriced!)

| Service | Old Price | New Price | Savings |
|---------|-----------|-----------|---------|
| Wallet Scanner | 0.5 SOL | 0.05 SOL | **90%** |
| Pool Analyzer | N/A | 0.005 SOL | New |
| Protocol Auditor | N/A | 0.01 SOL | New |
| Yield Optimizer | N/A | 0.008 SOL | New |
| Token Deep Dive | N/A | 0.012 SOL | New |

### Volume Discounts (Automatic!)

Based on monthly wallet scans:

| Scans/Month | Discount | Tier |
|-------------|----------|------|
| 0-9 | 0% | Tier 0 |
| 10-49 | 10% | Tier 1 |
| 50-99 | 20% | Tier 2 |
| 100+ | 30% | Tier 3 |

**Example**:
- Month 1: 5 scans → 0% discount
- Month 2: 15 scans → 10% discount (saves 0.005 SOL per scan)
- Month 3: 60 scans → 20% discount (saves 0.01 SOL per scan)

**Reset**: Discounts reset monthly (every 30 days)

**Tracking**: Your discount tier is tracked on-chain via VolumeDiscountTracker PDA

---

## Proof Verification

Every AXIONBLADE service generates an **on-chain proof** via the `noumen_proof` program.

### What is a Proof?

A cryptographic record that proves:
1. You requested the service
2. What inputs you provided
3. What decision/output was generated
4. When it happened
5. That it's verifiable and auditable

### How to Verify Proofs

1. After receiving service results, look for "Proof Hash"
2. Click the Solana Explorer link
3. Verify the PDA account exists on-chain
4. Check the timestamp and decision hash

**Example**:
```
Proof Hash: 0x1234abcd...5678ef90
Timestamp: 2026-02-12 15:30:45 UTC
Source: axionblade-v3.3.0-pool-analyzer
```

### Axiom A0-6: Proof-Before-Action

For HERMES executions:
- Proof is logged **before** the transaction is executed
- If execution fails, proof remains as evidence
- Every action is auditable retroactively

---

## Support & Resources

- **Documentation**: `/docs`
- **Economy Dashboard**: `/economy`
- **GitHub**: https://github.com/anthropics/axionblade
- **Explorer**: https://explorer.solana.com

**Version**: v3.3.0
**Last Updated**: 2026-02-12
