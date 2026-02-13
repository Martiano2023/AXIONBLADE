// ---------------------------------------------------------------------------
// AXIONBLADE Pool Analyzer — Comprehensive LP Pool Analysis
// ---------------------------------------------------------------------------
// Deep analysis of liquidity pools including:
// - Real TVL (wash trading filtered)
// - Volume/TVL ratio
// - Fee APR calculation
// - IL simulation (30/60/90 day projections)
// - LP holder concentration
// - Smart money flow tracking
// - Rug risk scoring
// - Comparison to similar pools
//
// Price: 0.005 SOL per analysis
// Proof: On-chain via noumen_proof
// ---------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ExternalLink, Shield } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { toast } from 'sonner';

interface PoolAnalysisResult {
  pool: string;
  tokenPair: string;
  protocol: string;
  tvlReal: number;
  tvlReported: number;
  volumeToTVLRatio: number;
  feeAPR: number;
  ilSimulation: {
    days30: { conservative: number; expected: number; worst: number };
    days60: { conservative: number; expected: number; worst: number };
    days90: { conservative: number; expected: number; worst: number };
    riskLevel: string;
    recommendation: string;
  };
  holderConcentration: {
    giniCoefficient: number;
    top10Percentage: number;
    top50Percentage: number;
    riskLevel: string;
  };
  smartMoneyFlow24h: {
    netFlow: number;
    direction: 'inflow' | 'outflow' | 'neutral';
    percentage: number;
  };
  rugRiskScore: number;
  rugRiskLevel: string;
  comparison: {
    rank: number;
    totalPoolsInCategory: number;
    betterThan: number;
    topPools: Array<{ pool: string; score: number }>;
  };
  bestConcentratedRange: any;
  verdict: string;
  explanation: string;
  proofHash: string;
  timestamp: number;
  source: string;
}

export default function PoolAnalyzerPage() {
  const { publicKey, connected } = useWallet();
  const [poolAddress, setPoolAddress] = useState('');
  const [result, setResult] = useState<PoolAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePool = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    // Validate pool address
    try {
      new PublicKey(poolAddress);
    } catch {
      toast.error('Invalid Solana pool address');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // In production: pay 0.005 SOL to treasury, get signature
      const paymentSignature = 'mock_signature_' + Date.now();

      // Call API
      const response = await fetch('/api/pool-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolAddress,
          paymentSignature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
      toast.success('Pool analysis complete');
    } catch (err) {
      console.error('Pool analysis error:', err);
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
            <Droplet className="w-8 h-8 text-cyan-400" />
            Pool Analyzer
          </h1>
          <p className="text-gray-400">
            Comprehensive LP pool analysis with IL simulation and rug risk scoring
          </p>
        </div>
        <Badge variant="info" className="text-sm">
          0.005 SOL
        </Badge>
      </div>

      {/* Input Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Pool Address
            </label>
            <input
              type="text"
              placeholder="Enter Solana pool address (e.g., Raydium, Orca)..."
              value={poolAddress}
              onChange={(e) => setPoolAddress(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
            onClick={analyzePool}
            disabled={isAnalyzing || !poolAddress || !connected}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Pool...
              </>
            ) : (
              <>
                <Droplet className="w-5 h-5 mr-2" />
                Analyze Pool (0.005 SOL)
              </>
            )}
          </Button>

          {!connected && (
            <p className="text-sm text-gray-500 text-center">
              Connect your wallet to analyze pools
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
            {/* Overview Metrics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pool Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  label="TVL (Real)"
                  value={`$${(result.tvlReal / 1e6).toFixed(2)}M`}
                  icon={TrendingUp}
                  color="text-cyan-400"
                />
                <MetricCard
                  label="Vol/TVL Ratio"
                  value={result.volumeToTVLRatio.toFixed(3)}
                  icon={TrendingUp}
                  color="text-blue-400"
                />
                <MetricCard
                  label="Fee APR"
                  value={`${result.feeAPR.toFixed(2)}%`}
                  icon={TrendingUp}
                  color="text-green-400"
                />
                <MetricCard
                  label="Rug Risk Score"
                  value={`${result.rugRiskScore}/100`}
                  icon={result.rugRiskScore > 70 ? CheckCircle2 : AlertTriangle}
                  color={result.rugRiskScore > 70 ? 'text-green-400' : 'text-amber-400'}
                />
              </div>
            </Card>

            {/* IL Simulation */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Impermanent Loss Simulation</h3>
              <div className="space-y-4">
                <ILProjection label="30 Days" data={result.ilSimulation.days30} />
                <ILProjection label="60 Days" data={result.ilSimulation.days60} />
                <ILProjection label="90 Days" data={result.ilSimulation.days90} />
              </div>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Risk Level:</strong> {result.ilSimulation.riskLevel} — {result.ilSimulation.recommendation}
                </p>
              </div>
            </Card>

            {/* Holder Concentration */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">LP Holder Concentration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Gini Coefficient</div>
                  <div className="text-2xl font-bold">{result.holderConcentration.giniCoefficient.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Top 10 Holders</div>
                  <div className="text-2xl font-bold">{result.holderConcentration.top10Percentage.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Risk Level</div>
                  <Badge variant={result.holderConcentration.riskLevel === 'Low' ? 'success' : 'warning'}>
                    {result.holderConcentration.riskLevel}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Smart Money Flow */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Smart Money Flow (24h)</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Net Flow</div>
                  <div className="text-2xl font-bold">
                    ${result.smartMoneyFlow24h.netFlow.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Direction</div>
                  <Badge
                    variant={result.smartMoneyFlow24h.direction === 'inflow' ? 'success' : result.smartMoneyFlow24h.direction === 'outflow' ? 'danger' : 'neutral'}
                  >
                    {result.smartMoneyFlow24h.direction.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">% of TVL</div>
                  <div className="text-2xl font-bold">{result.smartMoneyFlow24h.percentage.toFixed(2)}%</div>
                </div>
              </div>
            </Card>

            {/* Verdict */}
            <Card className={`p-6 border-2 ${getVerdictColor(result.verdict)}`}>
              <div className="flex items-start gap-3">
                {getVerdictIcon(result.verdict)}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verdict: {result.verdict.toUpperCase()}</h3>
                  <p className="text-gray-300">{result.explanation}</p>
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

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function ILProjection({ label, data }: any) {
  return (
    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="font-semibold mb-3">{label}</div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Conservative</div>
          <div className="font-semibold text-green-400">{(data.conservative * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-gray-500">Expected</div>
          <div className="font-semibold text-blue-400">{(data.expected * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-gray-500">Worst Case</div>
          <div className="font-semibold text-red-400">{(data.worst * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

function getVerdictColor(verdict: string): string {
  const colors: Record<string, string> = {
    excellent: 'border-green-500/50',
    good: 'border-blue-500/50',
    fair: 'border-amber-500/50',
    poor: 'border-orange-500/50',
    avoid: 'border-red-500/50',
  };
  return colors[verdict] || 'border-gray-500/50';
}

function getVerdictIcon(verdict: string) {
  if (verdict === 'excellent' || verdict === 'good') {
    return <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />;
  }
  return <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />;
}
