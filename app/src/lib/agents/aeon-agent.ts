// ---------------------------------------------------------------------------
// AEON Guardian Agent — 24/7 Monitoring & Threat Detection
// ---------------------------------------------------------------------------
// Monitors user wallets via Helius webhooks for:
// 1. Dangerous token approvals (unlimited approvals)
// 2. High impermanent loss in LP positions
// 3. Low health factors in lending positions
// 4. Suspicious transaction patterns
//
// AEON never executes directly — it delegates to APOLLO for analysis,
// then HERMES for execution (A0-14: evaluators cannot execute).
// ---------------------------------------------------------------------------

import { PublicKey, Connection } from '@solana/web3.js';
import { AgentPermissions } from '../agent-orchestrator';

export interface Threat {
  type: 'DangerousApproval' | 'HighIL' | 'LowHealthFactor' | 'SuspiciousActivity';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  detail: string;
  action: 'revoke_approval' | 'exit_pool' | 'unstake' | 'alert_only';
  pool?: string;
  protocol?: string;
  position?: DeFiPosition;
  detectedAt: number;
}

export interface DeFiPosition {
  type: 'LP' | 'Lending' | 'Staking' | 'Token';
  protocol: string;
  pool?: string;
  amountUSD: number;
  healthFactor?: number;
  ilPercentage?: number;
}

export class AeonAgent {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Scan wallet for threats and return actionable alerts
   */
  async scanWallet(wallet: PublicKey, permissions: AgentPermissions): Promise<Threat[]> {
    const threats: Threat[] = [];

    // Fetch all positions (LP, lending, staking, tokens)
    const positions = await this.fetchAllPositions(wallet);

    // Threat 1: Dangerous token approvals
    const dangerousApprovals = await this.findUnlimitedApprovals(wallet);
    if (dangerousApprovals.length > 0) {
      for (const approval of dangerousApprovals) {
        threats.push({
          type: 'DangerousApproval',
          severity: 'High',
          detail: `Unlimited approval for ${approval.tokenSymbol} to ${approval.spender}`,
          action: 'revoke_approval',
          protocol: approval.spender,
          detectedAt: Date.now(),
        });
      }
    }

    // Threat 2: High IL in LP positions
    for (const lp of positions.filter(p => p.type === 'LP')) {
      const il = lp.ilPercentage || 0;
      const threshold = permissions.aeon_il_threshold_bps / 10000;

      if (il > threshold) {
        threats.push({
          type: 'HighIL',
          severity: il > threshold * 2 ? 'High' : 'Medium',
          detail: `${lp.pool}: IL ${(il * 100).toFixed(1)}% (threshold ${(threshold * 100).toFixed(1)}%)`,
          action: 'exit_pool',
          pool: lp.pool!,
          protocol: lp.protocol,
          position: lp,
          detectedAt: Date.now(),
        });
      }
    }

    // Threat 3: Low health factor in lending positions
    for (const lending of positions.filter(p => p.type === 'Lending')) {
      const healthFactor = lending.healthFactor || 999;
      const threshold = permissions.aeon_health_factor_threshold_bps / 10000;

      if (healthFactor < threshold) {
        threats.push({
          type: 'LowHealthFactor',
          severity: healthFactor < 1.1 ? 'Critical' : 'High',
          detail: `${lending.protocol}: Health Factor ${healthFactor.toFixed(2)} (threshold ${threshold.toFixed(2)})`,
          action: 'unstake',
          protocol: lending.protocol,
          position: lending,
          detectedAt: Date.now(),
        });
      }
    }

    // Threat 4: Suspicious activity (wash trading, bot activity)
    const suspiciousActivity = await this.detectSuspiciousActivity(wallet);
    if (suspiciousActivity) {
      threats.push({
        type: 'SuspiciousActivity',
        severity: 'Medium',
        detail: suspiciousActivity.detail,
        action: 'alert_only',
        detectedAt: Date.now(),
      });
    }

    return threats;
  }

  /**
   * Fetch all DeFi positions for a wallet
   */
  private async fetchAllPositions(wallet: PublicKey): Promise<DeFiPosition[]> {
    // In production, this would aggregate from multiple sources:
    // - Helius DAS API for token accounts
    // - Jupiter/Raydium APIs for LP positions
    // - Kamino/MarginFi/Solend APIs for lending positions
    // For now, return mock data
    return [
      {
        type: 'LP',
        protocol: 'Raydium',
        pool: 'SOL-USDC',
        amountUSD: 5000,
        ilPercentage: 0.12, // 12% IL
      },
      {
        type: 'Lending',
        protocol: 'Kamino',
        amountUSD: 10000,
        healthFactor: 1.35,
      },
      {
        type: 'Staking',
        protocol: 'Marinade',
        amountUSD: 2000,
      },
    ];
  }

  /**
   * Find unlimited token approvals (security risk)
   */
  private async findUnlimitedApprovals(wallet: PublicKey): Promise<Array<{
    tokenSymbol: string;
    spender: string;
  }>> {
    // In production, query token program for approve instructions
    // and check for max uint64 amounts
    // For now, return mock data
    return [
      // Example: User has unlimited USDC approval to a sketchy DEX
      // {
      //   tokenSymbol: 'USDC',
      //   spender: 'UnknownDEX',
      // },
    ];
  }

  /**
   * Detect suspicious transaction patterns
   */
  private async detectSuspiciousActivity(wallet: PublicKey): Promise<{ detail: string } | null> {
    // In production, analyze transaction history for:
    // - Wash trading patterns (buy/sell with same counterparty)
    // - Bot-like behavior (exact timing, amounts)
    // - Phishing attack patterns
    // For now, return null (no suspicious activity)
    return null;
  }

  /**
   * Calculate impermanent loss for an LP position
   */
  private calculateIL(lp: DeFiPosition): number {
    // Simplified IL calculation
    // In production, fetch historical prices and calculate actual IL
    // IL = (V_hodl - V_lp) / V_hodl
    // where V_hodl = if you just held the tokens
    // and V_lp = current LP position value
    return lp.ilPercentage || 0;
  }
}
