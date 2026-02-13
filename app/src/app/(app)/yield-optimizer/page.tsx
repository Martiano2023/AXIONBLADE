// ---------------------------------------------------------------------------
// AXIONBLADE Yield Optimizer — Risk-Adjusted Yield Ranking
// ---------------------------------------------------------------------------
// Finds optimal yield opportunities based on user's risk profile:
// - Filters by risk profile (conservative/moderate/aggressive)
// - Ranks by risk-adjusted returns (Sharpe-like ratio)
// - Considers IL risk, protocol risk, liquidity risk
// - Respects deposit amount constraints and lock periods
// - Provides actionable recommendations
// - Portfolio diversification suggestions
//
// Price: 0.008 SOL per optimization
// Proof: On-chain via noumen_proof
// ---------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Loader2, Target, PieChart, AlertTriangle, ExternalLink, Shield, DollarSign } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { toast } from 'sonner';

interface YieldOptimizerResult {
  parameters: any;
  opportunities: any[];
  portfolio: any;
  metrics: any;
  recommendations: any;
  warnings: string[];
  proofHash: string;
  timestamp: number;
  source: string;
}

export default function YieldOptimizerPage() {
  const { publicKey, connected } = useWallet();
  const [amount, setAmount] = useState('');
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [result, setResult] = useState<YieldOptimizerResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeYield = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      // In production: pay 0.008 SOL to treasury, get signature
      const paymentSignature = 'mock_signature_' + Date.now();

      // Call API
      const response = await fetch('/api/yield-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          riskProfile,
          paymentSignature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Optimization failed');
      }

      const data = await response.json();
      setResult(data);
      toast.success('Yield optimization complete');
    } catch (err) {
      console.error('Yield optimization error:', err);
      setError(err instanceof Error ? err.message : 'Optimization failed');
      toast.error('Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-400" />
            Yield Optimizer
          </h1>
          <p className="text-gray-400">
            Find optimal yield opportunities based on your risk profile and capital
          </p>
        </div>
        <Badge variant="info" className="text-sm">
          0.008 SOL
        </Badge>
      </div>

      {/* Input Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Investment Amount (USD)
            </label>
            <input
              type="number"
              placeholder="Enter amount in USD..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isOptimizing}
              min="0"
              step="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Risk Profile
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setRiskProfile('conservative')}
                className={`px-4 py-3 rounded-lg border transition-all ${
                  riskProfile === 'conservative'
                    ? 'bg-green-500/20 border-green-500/50 text-green-300'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
                disabled={isOptimizing}
              >
                <div className="font-semibold">Conservative</div>
                <div className="text-xs mt-1">Lower risk, stable returns</div>
              </button>

              <button
                onClick={() => setRiskProfile('moderate')}
                className={`px-4 py-3 rounded-lg border transition-all ${
                  riskProfile === 'moderate'
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
                disabled={isOptimizing}
              >
                <div className="font-semibold">Moderate</div>
                <div className="text-xs mt-1">Balanced risk/return</div>
              </button>

              <button
                onClick={() => setRiskProfile('aggressive')}
                className={`px-4 py-3 rounded-lg border transition-all ${
                  riskProfile === 'aggressive'
                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
                disabled={isOptimizing}
              >
                <div className="font-semibold">Aggressive</div>
                <div className="text-xs mt-1">Higher risk, max returns</div>
              </button>
            </div>
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
            onClick={optimizeYield}
            disabled={isOptimizing || !amount || !connected}
            className="w-full"
            size="lg"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Target className="w-5 h-5 mr-2" />
                Optimize Yield (0.008 SOL)
              </>
            )}
          </Button>

          {!connected && (
            <p className="text-sm text-gray-500 text-center">
              Connect your wallet to optimize yield opportunities
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
            {/* Summary Metrics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Optimization Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <div className="text-sm text-gray-400 mb-1">Opportunities Found</div>
                  <div className="text-2xl font-bold text-purple-400">{result.opportunities.length}</div>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="text-sm text-gray-400 mb-1">Avg Risk-Adjusted Return</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {result.metrics.avgRiskAdjustedReturn?.toFixed(2) || 'N/A'}
                  </div>
                </div>

                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                  <div className="text-sm text-gray-400 mb-1">Avg APR</div>
                  <div className="text-2xl font-bold text-green-400">
                    {result.metrics.avgAPR?.toFixed(1) || '0'}%
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <div className="text-sm text-gray-400 mb-1">Avg Risk Score</div>
                  <div className="text-2xl font-bold text-amber-400">
                    {result.metrics.avgRiskScore?.toFixed(0) || '0'}/100
                  </div>
                </div>
              </div>
            </Card>

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {result.warnings.map((warning: string, idx: number) => (
                      <div key={idx} className="text-sm text-amber-300">{warning}</div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Portfolio Suggestion */}
            {result.portfolio && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  Recommended Portfolio Allocation
                </h3>

                <div className="space-y-3 mb-4">
                  {result.portfolio.allocation.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold">{item.opportunity.protocol} — {item.opportunity.pool}</div>
                          <div className="text-sm text-gray-400">{item.opportunity.type}</div>
                        </div>
                        <Badge variant="info">{item.percentage}%</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                        <div>
                          <div className="text-gray-500">Amount</div>
                          <div className="font-semibold">${item.amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">APR</div>
                          <div className="font-semibold text-green-400">{item.opportunity.effectiveAPR.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Expected Return</div>
                          <div className="font-semibold">${item.expectedReturn.toLocaleString()}/yr</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total Expected Return</div>
                    <div className="text-xl font-bold text-purple-400">
                      ${result.portfolio.totalExpectedReturn.toLocaleString()}/yr
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Avg Risk Score</div>
                    <div className="text-xl font-bold">{result.portfolio.avgRiskScore.toFixed(0)}/100</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Diversification</div>
                    <div className="text-xs text-gray-300">{result.portfolio.diversificationBenefit}</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Top Recommendations */}
            {result.recommendations && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Recommendations</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RecommendationCard
                    title="Best Overall"
                    opportunity={result.recommendations.bestOverall}
                    highlight="purple"
                  />

                  <RecommendationCard
                    title="Best for Safety"
                    opportunity={result.recommendations.bestForSafety}
                    highlight="green"
                  />

                  <RecommendationCard
                    title="Best for Yield"
                    opportunity={result.recommendations.bestForYield}
                    highlight="blue"
                  />

                  <RecommendationCard
                    title="Best Single Opportunity"
                    opportunity={result.recommendations.bestSingleOpportunity}
                    highlight="cyan"
                  />
                </div>
              </Card>
            )}

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

function RecommendationCard({
  title,
  opportunity,
  highlight,
}: {
  title: string;
  opportunity: any;
  highlight: string;
}) {
  const colors: Record<string, string> = {
    purple: 'border-purple-500/50 bg-purple-500/10',
    green: 'border-green-500/50 bg-green-500/10',
    blue: 'border-blue-500/50 bg-blue-500/10',
    cyan: 'border-cyan-500/50 bg-cyan-500/10',
  };

  if (!opportunity) {
    return (
      <div className={`p-4 rounded-lg border ${colors[highlight]}`}>
        <div className="font-semibold mb-2">{title}</div>
        <div className="text-sm text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${colors[highlight]}`}>
      <div className="font-semibold mb-2">{title}</div>
      <div className="space-y-2">
        <div>
          <div className="text-sm text-gray-400">{opportunity.protocol} — {opportunity.pool}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-500">APR</div>
            <div className="font-semibold text-green-400">{opportunity.effectiveAPR?.toFixed(1) || '0'}%</div>
          </div>
          <div>
            <div className="text-gray-500">Risk Score</div>
            <div className="font-semibold">{opportunity.riskScore?.toFixed(0) || '0'}/100</div>
          </div>
        </div>
      </div>
    </div>
  );
}
