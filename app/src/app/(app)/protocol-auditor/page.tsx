// ---------------------------------------------------------------------------
// AXIONBLADE Protocol Auditor — Deep Protocol Assessment
// ---------------------------------------------------------------------------
// Comprehensive protocol analysis including:
// - TVL trends and growth analysis
// - Security audit status and history
// - Exploit/hack history and resolution
// - Governance health (token distribution, voter participation)
// - Revenue and fee analysis
// - Smart contract risk assessment
// - User retention metrics
// - Composite risk scoring
//
// Price: 0.01 SOL per audit
// Proof: On-chain via noumen_proof
// ---------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, TrendingUp, AlertTriangle, CheckCircle2, ExternalLink, Shield, Users, DollarSign } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { toast } from 'sonner';

interface ProtocolAuditResult {
  protocol: string;
  chain: string;
  overview: any;
  tvl: any;
  activity: any;
  security: any;
  governance: any;
  financials: any;
  smartContracts: any;
  riskScore: any;
  recommendation: any;
  proofHash: string;
  timestamp: number;
  source: string;
}

export default function ProtocolAuditorPage() {
  const { publicKey, connected } = useWallet();
  const [protocolId, setProtocolId] = useState('');
  const [result, setResult] = useState<ProtocolAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auditProtocol = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!protocolId.trim()) {
      toast.error('Please enter a protocol ID');
      return;
    }

    setIsAuditing(true);
    setError(null);

    try {
      // In production: pay 0.01 SOL to treasury, get signature
      const paymentSignature = 'mock_signature_' + Date.now();

      // Call API
      const response = await fetch('/api/protocol-auditor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolId,
          paymentSignature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Audit failed');
      }

      const data = await response.json();
      setResult(data);
      toast.success('Protocol audit complete');
    } catch (err) {
      console.error('Protocol audit error:', err);
      setError(err instanceof Error ? err.message : 'Audit failed');
      toast.error('Audit failed');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-green-400" />
            Protocol Auditor
          </h1>
          <p className="text-gray-400">
            Deep protocol assessment with security, governance, and financial health analysis
          </p>
        </div>
        <Badge variant="success" className="text-sm">
          0.01 SOL
        </Badge>
      </div>

      {/* Input Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Protocol ID
            </label>
            <input
              type="text"
              placeholder="Enter protocol name (e.g., Raydium, Orca, Marinade)..."
              value={protocolId}
              onChange={(e) => setProtocolId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isAuditing}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2"
            >
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-300">{error}</div>
            </motion.div>
          )}

          <Button
            onClick={auditProtocol}
            disabled={isAuditing || !protocolId || !connected}
            className="w-full"
            size="lg"
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Auditing Protocol...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 mr-2" />
                Audit Protocol (0.01 SOL)
              </>
            )}
          </Button>

          {!connected && (
            <p className="text-sm text-gray-500 text-center">
              Connect your wallet to audit protocols
            </p>
          )}
        </div>
      </Card>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Protocol Overview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Protocol Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Type</div>
                  <div className="font-semibold capitalize">{result.overview.type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Age</div>
                  <div className="font-semibold">{result.overview.ageInDays} days</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">TVL Rank</div>
                  <div className="font-semibold">#{result.overview.rank}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Chain</div>
                  <div className="font-semibold capitalize">{result.chain}</div>
                </div>
              </div>
            </Card>

            {/* Risk Score */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Overall Risk Score</div>
                  <div className="flex items-baseline gap-3">
                    <div className={`text-4xl font-bold ${getRiskScoreColor(result.riskScore.overall)}`}>
                      {result.riskScore.overall}
                    </div>
                    <div className="text-gray-500">/100</div>
                  </div>
                  <Badge
                    variant={result.riskScore.riskLevel === 'low' ? 'success' : result.riskScore.riskLevel === 'medium' ? 'warning' : 'danger'}
                    className="mt-2"
                  >
                    {result.riskScore.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>

                <div className="space-y-3">
                  <RiskScoreBar label="Security" value={result.riskScore.securityScore} />
                  <RiskScoreBar label="Decentralization" value={result.riskScore.decentralizationScore} />
                  <RiskScoreBar label="Maturity" value={result.riskScore.maturityScore} />
                  <RiskScoreBar label="Liquidity" value={result.riskScore.liquidityScore} />
                </div>
              </div>
            </Card>

            {/* TVL & Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  TVL Analysis
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Current TVL</div>
                    <div className="text-2xl font-bold text-cyan-400">{result.tvl.currentFormatted}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-gray-500">24h</div>
                      <div className={result.tvl.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {result.tvl.change24h >= 0 ? '+' : ''}{result.tvl.change24h.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">7d</div>
                      <div className={result.tvl.change7d >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {result.tvl.change7d >= 0 ? '+' : ''}{result.tvl.change7d.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">30d</div>
                      <div className={result.tvl.change30d >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {result.tvl.change30d >= 0 ? '+' : ''}{result.tvl.change30d.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <Badge variant="neutral" className="text-xs">
                    Trend: {result.tvl.trend}
                  </Badge>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  User Activity
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Active (24h)</div>
                      <div className="font-semibold">{result.activity.activeUsers24h.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Active (30d)</div>
                      <div className="font-semibold">{result.activity.activeUsers30d.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Growth Rate</div>
                      <div className={result.activity.userGrowthRate >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {result.activity.userGrowthRate >= 0 ? '+' : ''}{result.activity.userGrowthRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">7d Retention</div>
                      <div className="font-semibold">{result.activity.retention7d.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Security & Governance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Security
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Audit Status</span>
                    {result.security.hasAudit ? (
                      <Badge variant="success">Audited</Badge>
                    ) : (
                      <Badge variant="danger">Not Audited</Badge>
                    )}
                  </div>
                  {result.security.auditFirms.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Audit Firms</div>
                      <div className="flex flex-wrap gap-1">
                        {result.security.auditFirms.map((firm: string) => (
                          <Badge key={firm} variant="neutral" className="text-xs">{firm}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Exploit History</span>
                    <span className={result.security.exploitHistory.length === 0 ? 'text-green-400' : 'text-red-400'}>
                      {result.security.exploitHistory.length} incidents
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Bug Bounty</span>
                    {result.security.bugBountyProgram ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Governance</h3>
                <div className="space-y-3">
                  {result.governance.hasToken && (
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Token</div>
                      <div className="font-semibold">{result.governance.tokenSymbol}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Proposals</div>
                      <div className="font-semibold">{result.governance.proposalCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Voter Participation</div>
                      <div className="font-semibold">{result.governance.voterParticipation.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recommendation */}
            <Card className={`p-6 border-2 ${getRecommendationColor(result.recommendation.verdict)}`}>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  {getRecommendationIcon(result.recommendation.verdict)}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      Recommendation: {result.recommendation.verdict.replace('_', ' ').toUpperCase()}
                    </h3>
                    <p className="text-gray-300">{result.recommendation.explanation}</p>
                  </div>
                </div>

                {result.recommendation.warnings.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-amber-400">Warnings:</h4>
                    {result.recommendation.warnings.map((warning: string, idx: number) => (
                      <div key={idx} className="text-sm text-gray-300">{warning}</div>
                    ))}
                  </div>
                )}

                {result.recommendation.strengths.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-green-400">Strengths:</h4>
                    {result.recommendation.strengths.map((strength: string, idx: number) => (
                      <div key={idx} className="text-sm text-gray-300">{strength}</div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Proof */}
            <Card className="p-6 bg-gray-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-medium">On-Chain Proof</span>
                </div>
                <a
                  href={`https://explorer.solana.com/address/${result.proofHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  {result.proofHash.slice(0, 8)}...{result.proofHash.slice(-6)}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function RiskScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold">{value}/100</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${value > 75 ? 'bg-green-500' : value > 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

function getRiskScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function getRecommendationColor(verdict: string): string {
  const colors: Record<string, string> = {
    strong_buy: 'border-green-500/50',
    buy: 'border-blue-500/50',
    hold: 'border-amber-500/50',
    avoid: 'border-red-500/50',
  };
  return colors[verdict] || 'border-gray-500/50';
}

function getRecommendationIcon(verdict: string) {
  if (verdict === 'strong_buy' || verdict === 'buy') {
    return <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />;
  }
  if (verdict === 'avoid') {
    return <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />;
  }
  return <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />;
}
