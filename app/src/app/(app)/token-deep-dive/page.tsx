// ---------------------------------------------------------------------------
// AXIONBLADE Token Deep Dive — Multi-Dimensional Token Analysis
// ---------------------------------------------------------------------------
// Comprehensive token assessment including:
// - Holder distribution (Gini coefficient, whale concentration)
// - Price correlation with SOL/BTC/ETH
// - IL risk prediction based on correlation
// - Liquidity analysis across DEXs
// - Trading patterns and smart money tracking
// - Social metrics and community health
// - Multi-dimensional risk assessment
//
// Price: 0.012 SOL per analysis
// Proof: On-chain via noumen_proof
// ---------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Loader2, Users, TrendingUp, AlertTriangle, CheckCircle2, ExternalLink, Shield, Activity } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { toast } from 'sonner';

interface TokenDeepDiveResult {
  token: any;
  holderDistribution: any;
  suspiciousActivity: any;
  correlation: any;
  ilRiskPrediction: any;
  liquidity: any;
  trading: any;
  smartMoney: any;
  social: any;
  riskAssessment: any;
  recommendations: any;
  proofHash: string;
  timestamp: number;
  source: string;
}

export default function TokenDeepDivePage() {
  const { publicKey, connected } = useWallet();
  const [tokenMint, setTokenMint] = useState('');
  const [result, setResult] = useState<TokenDeepDiveResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeToken = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    // Validate token mint address
    try {
      new PublicKey(tokenMint);
    } catch {
      toast.error('Invalid Solana token mint address');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // In production: pay 0.012 SOL to treasury, get signature
      const paymentSignature = 'mock_signature_' + Date.now();

      // Call API
      const response = await fetch('/api/token-deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenMint,
          paymentSignature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
      toast.success('Token analysis complete');
    } catch (err) {
      console.error('Token analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Coins className="w-8 h-8 text-amber-400" />
            Token Deep Dive
          </h1>
          <p className="text-gray-400">
            Multi-dimensional token analysis with holder distribution, correlation, and risk assessment
          </p>
        </div>
        <Badge variant="warning" className="text-sm">
          0.012 SOL
        </Badge>
      </div>

      {/* Input Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Token Mint Address
            </label>
            <input
              type="text"
              placeholder="Enter Solana token mint address..."
              value={tokenMint}
              onChange={(e) => setTokenMint(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              disabled={isAnalyzing}
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
            onClick={analyzeToken}
            disabled={isAnalyzing || !tokenMint || !connected}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Token...
              </>
            ) : (
              <>
                <Coins className="w-5 h-5 mr-2" />
                Analyze Token (0.012 SOL)
              </>
            )}
          </Button>

          {!connected && (
            <p className="text-sm text-gray-500 text-center">
              Connect your wallet to analyze tokens
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
            {/* Token Overview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Token Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Symbol</div>
                  <div className="text-xl font-bold">{result.token.symbol}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Price</div>
                  <div className="text-xl font-bold">${result.token.priceUSD.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Market Cap</div>
                  <div className="text-xl font-bold">${(result.token.marketCap / 1e6).toFixed(2)}M</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Total Supply</div>
                  <div className="text-xl font-bold">{(result.token.totalSupply / 1e6).toFixed(1)}M</div>
                </div>
              </div>
            </Card>

            {/* Risk Assessment */}
            <Card className={`p-6 border-2 ${getRiskBorderColor(result.riskAssessment.verdict)}`}>
              <div className="flex items-start gap-3">
                {getRiskIcon(result.riskAssessment.verdict)}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Risk Assessment: {result.riskAssessment.verdict.toUpperCase()}
                  </h3>
                  <p className="text-gray-300 mb-3">{result.riskAssessment.explanation}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Overall Score</div>
                      <div className="text-lg font-bold">{result.riskAssessment.overallScore}/100</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Holder Risk</div>
                      <Badge variant={result.riskAssessment.holderRisk === 'Low' ? 'success' : 'warning'}>
                        {result.riskAssessment.holderRisk}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Liquidity Risk</div>
                      <Badge variant={result.riskAssessment.liquidityRisk === 'Low' ? 'success' : 'warning'}>
                        {result.riskAssessment.liquidityRisk}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Volatility Risk</div>
                      <Badge variant={result.riskAssessment.volatilityRisk === 'Low' ? 'success' : 'warning'}>
                        {result.riskAssessment.volatilityRisk}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Holder Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Holder Distribution
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Total Holders</div>
                  <div className="text-2xl font-bold">{result.holderDistribution.totalHolders.toLocaleString()}</div>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Gini Coefficient</div>
                  <div className="text-2xl font-bold">{result.holderDistribution.giniCoefficient.toFixed(3)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {result.holderDistribution.giniCoefficient > 0.7 ? 'High concentration' : 'Moderate distribution'}
                  </div>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">HHI Index</div>
                  <div className="text-2xl font-bold">{result.holderDistribution.hhi.toFixed(0)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {result.holderDistribution.hhi > 2500 ? 'Highly concentrated' : 'Competitive'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Top 10 Holders</span>
                  <span className="font-semibold">{result.holderDistribution.top10Percentage.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.holderDistribution.top10Percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm mt-3">
                  <span className="text-gray-400">Top 50 Holders</span>
                  <span className="font-semibold">{result.holderDistribution.top50Percentage.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.holderDistribution.top50Percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                </div>
              </div>
            </Card>

            {/* Correlation Analysis */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Price Correlation</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CorrelationCard
                  asset="SOL"
                  correlation={result.correlation.withSOL}
                  beta={result.correlation.betaVsSOL}
                />

                <CorrelationCard
                  asset="BTC"
                  correlation={result.correlation.withBTC}
                  beta={result.correlation.betaVsBTC}
                />

                <CorrelationCard
                  asset="ETH"
                  correlation={result.correlation.withETH}
                  beta={result.correlation.betaVsETH}
                />
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">IL Risk Prediction (LP Positions)</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">vs SOL:</span>{' '}
                    <span className="font-semibold">{(result.ilRiskPrediction.vs_sol * 100).toFixed(1)}% expected IL</span>
                  </div>
                  <div>
                    <span className="text-gray-400">vs USDC:</span>{' '}
                    <span className="font-semibold">{(result.ilRiskPrediction.vs_usdc * 100).toFixed(1)}% expected IL</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Liquidity & Trading */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Liquidity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total DEX Liquidity</span>
                    <span className="font-semibold">${(result.liquidity.totalLiquidity / 1e6).toFixed(2)}M</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Largest Pool</span>
                    <span className="font-semibold">{result.liquidity.largestPool.protocol}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Depth</span>
                    <Badge variant={result.liquidity.depth === 'Deep' ? 'success' : 'warning'}>
                      {result.liquidity.depth}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Trading Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Volume (24h)</span>
                    <span className="font-semibold">${(result.trading.volume24h / 1e6).toFixed(2)}M</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Transactions (24h)</span>
                    <span className="font-semibold">{result.trading.transactions24h.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Volatility (30d)</span>
                    <span className="font-semibold">{(result.trading.volatility30d * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Suspicious Activity */}
            {result.suspiciousActivity.alerts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-red-400">Suspicious Activity Detected</h4>
                    {result.suspiciousActivity.alerts.map((alert: string, idx: number) => (
                      <div key={idx} className="text-sm text-red-300">{alert}</div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recommendations */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recommendations</h3>

              <div className="space-y-3">
                {result.recommendations.actions.map((action: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{action}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="text-sm font-semibold mb-2">Best Use Cases:</div>
                <div className="flex flex-wrap gap-2">
                  {result.recommendations.bestUseCases.map((useCase: string, idx: number) => (
                    <Badge key={idx} variant="info" className="text-xs">{useCase}</Badge>
                  ))}
                </div>
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

function CorrelationCard({ asset, correlation, beta }: { asset: string; correlation: number; beta: number }) {
  return (
    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="font-semibold mb-3">vs {asset}</div>

      <div className="space-y-2">
        <div>
          <div className="text-xs text-gray-500 mb-1">Correlation</div>
          <div className="text-lg font-bold">{correlation.toFixed(2)}</div>
          <div className="text-xs text-gray-500">
            {Math.abs(correlation) > 0.7 ? 'Strong' : Math.abs(correlation) > 0.4 ? 'Moderate' : 'Weak'}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Beta</div>
          <div className="text-lg font-bold">{beta.toFixed(2)}</div>
          <div className="text-xs text-gray-500">
            {beta > 1 ? 'More volatile' : beta < 1 ? 'Less volatile' : 'Same volatility'}
          </div>
        </div>
      </div>
    </div>
  );
}

function getRiskBorderColor(verdict: string): string {
  const colors: Record<string, string> = {
    'safe': 'border-green-500/50',
    'moderate': 'border-blue-500/50',
    'risky': 'border-amber-500/50',
    'high_risk': 'border-red-500/50',
  };
  return colors[verdict] || 'border-gray-500/50';
}

function getRiskIcon(verdict: string) {
  if (verdict === 'safe' || verdict === 'moderate') {
    return <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />;
  }
  return <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />;
}
