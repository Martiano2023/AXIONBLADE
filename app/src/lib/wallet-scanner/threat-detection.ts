// ---------------------------------------------------------------------------
// AXIONBLADE Threat Detection — Scam & Honeypot Identification
// ---------------------------------------------------------------------------
// Identifies dangerous contracts and suspicious patterns:
// - Scam contracts (rug pulls, honeypots)
// - Unlimited token approvals
// - Wash trading patterns
// - Suspicious transaction patterns
// - Hygiene score (0-100)
// ---------------------------------------------------------------------------

export interface ThreatDetectionResult {
  threats: Threat[];
  hygieneScore: number;
  criticalThreats: number;
  highThreats: number;
  mediumThreats: number;
  lowThreats: number;
}

export interface Threat {
  id: string;
  type: 'scam_contract' | 'unlimited_approval' | 'honeypot' | 'wash_trading' | 'suspicious_pattern';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedAsset?: string;
  affectedContract?: string;
  recommendation: string;
  autoFixAvailable: boolean;
}

/**
 * Scan wallet for threats
 */
export function detectThreats(data: {
  tokenHoldings: any[];
  transactions: any[];
  approvals: any[];
}): ThreatDetectionResult {
  const threats: Threat[] = [];

  // Check 1: Scam contracts
  const scamThreats = detectScamContracts(data.tokenHoldings);
  threats.push(...scamThreats);

  // Check 2: Unlimited approvals
  const approvalThreats = detectUnlimitedApprovals(data.approvals);
  threats.push(...approvalThreats);

  // Check 3: Honeypots
  const honeypotThreats = detectHoneypots(data.tokenHoldings);
  threats.push(...honeypotThreats);

  // Check 4: Wash trading
  const washTradingThreats = detectWashTrading(data.transactions);
  threats.push(...washTradingThreats);

  // Check 5: Suspicious patterns
  const suspiciousPatterns = detectSuspiciousPatterns(data.transactions);
  threats.push(...suspiciousPatterns);

  // Count by severity
  const criticalThreats = threats.filter(t => t.severity === 'critical').length;
  const highThreats = threats.filter(t => t.severity === 'high').length;
  const mediumThreats = threats.filter(t => t.severity === 'medium').length;
  const lowThreats = threats.filter(t => t.severity === 'low').length;

  // Calculate hygiene score (0-100, higher is better)
  const hygieneScore = calculateHygieneScore(threats);

  return {
    threats,
    hygieneScore,
    criticalThreats,
    highThreats,
    mediumThreats,
    lowThreats,
  };
}

// ---------------------------------------------------------------------------
// Detection Functions
// ---------------------------------------------------------------------------

function detectScamContracts(holdings: any[]): Threat[] {
  const threats: Threat[] = [];

  // Known scam contract addresses (in production, maintain updated list)
  const knownScams = new Set([
    // Mock scam addresses
    'scam1...abc',
    'scam2...def',
  ]);

  for (const holding of holdings) {
    if (knownScams.has(holding.mint)) {
      threats.push({
        id: `scam_${holding.mint}`,
        type: 'scam_contract',
        severity: 'critical',
        title: 'Scam Token Detected',
        description: `${holding.symbol} is a known scam token. Contract has been flagged for rug pull risk.`,
        affectedAsset: holding.symbol,
        affectedContract: holding.mint,
        recommendation: 'Immediately sell or burn this token. Do not interact with the contract.',
        autoFixAvailable: false,
      });
    }
  }

  return threats;
}

function detectUnlimitedApprovals(approvals: any[]): Threat[] {
  const threats: Threat[] = [];

  // In production, fetch actual token approvals from on-chain data
  // Mock: detect approvals with max uint256 allowance

  const dangerousApprovals = [
    { token: 'USDC', spender: 'UnknownDEX...abc', isUnlimited: true },
    { token: 'SOL', spender: 'SuspiciousRouter...def', isUnlimited: true },
  ];

  for (const approval of dangerousApprovals) {
    if (approval.isUnlimited) {
      threats.push({
        id: `approval_${approval.token}_${approval.spender}`,
        type: 'unlimited_approval',
        severity: 'high',
        title: 'Unlimited Token Approval',
        description: `${approval.token} has unlimited approval to ${approval.spender.slice(0, 12)}... This allows the contract to spend all your tokens.`,
        affectedAsset: approval.token,
        affectedContract: approval.spender,
        recommendation: 'Revoke this approval immediately. Use limited approvals for safety.',
        autoFixAvailable: true, // AEON can auto-revoke
      });
    }
  }

  return threats;
}

function detectHoneypots(holdings: any[]): Threat[] {
  const threats: Threat[] = [];

  // Honeypot detection heuristics:
  // - Can't sell (buy-only tokens)
  // - Very high tax on sells
  // - Blacklist functionality

  // Mock honeypot detection
  for (const holding of holdings) {
    // Mock: flag tokens with "HONEY" in name
    if (holding.symbol.includes('HONEY')) {
      threats.push({
        id: `honeypot_${holding.mint}`,
        type: 'honeypot',
        severity: 'critical',
        title: 'Honeypot Token Detected',
        description: `${holding.symbol} appears to be a honeypot token. Contract may prevent selling.`,
        affectedAsset: holding.symbol,
        affectedContract: holding.mint,
        recommendation: 'Do not attempt to sell. This will likely fail and waste gas.',
        autoFixAvailable: false,
      });
    }
  }

  return threats;
}

function detectWashTrading(transactions: any[]): Threat[] {
  const threats: Threat[] = [];

  // Wash trading patterns:
  // - High frequency back-and-forth trades
  // - Same amount repeatedly
  // - Circular transfers

  // Mock detection
  if (transactions.length > 100) {
    const suspiciousPatternCount = Math.floor(Math.random() * 3);
    if (suspiciousPatternCount > 0) {
      threats.push({
        id: 'wash_trading_pattern',
        type: 'wash_trading',
        severity: 'medium',
        title: 'Wash Trading Pattern Detected',
        description: `${suspiciousPatternCount} potential wash trading pattern(s) detected in transaction history.`,
        recommendation: 'Review recent transactions for circular or suspicious activity.',
        autoFixAvailable: false,
      });
    }
  }

  return threats;
}

function detectSuspiciousPatterns(transactions: any[]): Threat[] {
  const threats: Threat[] = [];

  // Suspicious patterns:
  // - Sudden large transfers
  // - Interactions with flagged contracts
  // - Unusual transaction frequency

  // Mock detection: flag if >50 transactions in last 24h
  const recentCount = transactions.filter(
    tx => Date.now() - tx.timestamp < 86400000
  ).length;

  if (recentCount > 50) {
    threats.push({
      id: 'high_frequency_txs',
      type: 'suspicious_pattern',
      severity: 'low',
      title: 'High Transaction Frequency',
      description: `${recentCount} transactions in last 24 hours. This may indicate bot activity or wash trading.`,
      recommendation: 'Review transaction history for unusual patterns.',
      autoFixAvailable: false,
    });
  }

  return threats;
}

// ---------------------------------------------------------------------------
// Hygiene Score Calculation
// ---------------------------------------------------------------------------

function calculateHygieneScore(threats: Threat[]): number {
  let score = 100;

  // Deduct points based on threat severity
  for (const threat of threats) {
    switch (threat.severity) {
      case 'critical':
        score -= 20;
        break;
      case 'high':
        score -= 10;
        break;
      case 'medium':
        score -= 5;
        break;
      case 'low':
        score -= 2;
        break;
    }
  }

  // Floor at 0
  return Math.max(0, score);
}

/**
 * Get hygiene level from score
 */
export function getHygieneLevel(score: number): {
  level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  color: string;
  description: string;
} {
  if (score >= 90) {
    return {
      level: 'Excellent',
      color: 'text-green-400',
      description: 'No major security concerns detected.',
    };
  }
  if (score >= 70) {
    return {
      level: 'Good',
      color: 'text-blue-400',
      description: 'Minor issues detected. Address when convenient.',
    };
  }
  if (score >= 50) {
    return {
      level: 'Fair',
      color: 'text-amber-400',
      description: 'Some security concerns. Review and address soon.',
    };
  }
  if (score >= 30) {
    return {
      level: 'Poor',
      color: 'text-orange-400',
      description: 'Multiple security issues. Take action immediately.',
    };
  }
  return {
    level: 'Critical',
    color: 'text-red-400',
    description: 'Severe security risks. Urgent action required.',
  };
}
