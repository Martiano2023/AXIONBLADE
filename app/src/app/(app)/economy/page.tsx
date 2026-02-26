// ---------------------------------------------------------------------------
// AXIONBLADE Economy Dashboard — Real-Time Protocol Economics
// ---------------------------------------------------------------------------
// Comprehensive economic monitoring:
// - Total revenue, costs, margins
// - 3-way revenue split (Operations 40%, Treasury 45%, Creator 15%)
// - Service performance tracking
// - Dynamic pricing alerts
// - Volume discount analytics
// ---------------------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { GlassCard } from '@/components/atoms/GlassCard';
import { Badge } from '@/components/atoms/Badge';

interface EconomyData {
  totalRevenue: number;
  totalCosts: number;
  averageMargin: number;
  monthlyProjection: number;
  revenueTrend7d: number;
  costTrend7d: number;
  revenueByCategory: {
    operations: number;
    treasury: number;
    creator: number;
  };
  services: ServicePerformance[];
  volumeDiscounts: {
    totalDiscountsSOL: number;
    tierDistribution: Record<string, number>;
    roi: number;
  };
  alerts: MarginAlert[];
}

interface ServicePerformance {
  serviceId: number;
  serviceName: string;
  priceSOL: number;
  costSOL: number;
  margin: number;
  requestCount7d: number;
  revenue7d: number;
  trend: number;
}

interface MarginAlert {
  serviceId: number;
  serviceName: string;
  currentMargin: number;
  recommendedPrice: number;
}

export default function EconomyPage() {
  const [data, setData] = useState<EconomyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/economy');
      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch economy data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 animate-pulse text-cyan-400" />
          <p className="text-gray-400">Loading economy data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Failed to load economy data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent">
          Economy Dashboard
        </h1>
        <p className="text-gray-400 text-lg">Real-time protocol economics and service performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Revenue"
          value={`${data.totalRevenue.toFixed(2)} SOL`}
          trend={data.revenueTrend7d}
          icon={DollarSign}
          color="text-green-400"
        />

        <MetricCard
          label="Total Costs"
          value={`${data.totalCosts.toFixed(2)} SOL`}
          trend={data.costTrend7d}
          icon={TrendingDown}
          color="text-amber-400"
        />

        <MetricCard
          label="Average Margin"
          value={`${(data.averageMargin * 100).toFixed(1)}%`}
          target={40}
          icon={Percent}
          color="text-cyan-400"
        />

        <MetricCard
          label="Monthly Projection"
          value={`${data.monthlyProjection.toFixed(2)} SOL`}
          icon={Calendar}
          color="text-purple-400"
        />
      </div>

      {/* Margin Alerts */}
      {data.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-400 mb-2">Margin Alerts</h3>
              <div className="space-y-2">
                {data.alerts.map((alert) => (
                  <div key={alert.serviceId} className="text-sm text-gray-300">
                    <strong>{alert.serviceName}:</strong> Margin at {(alert.currentMargin * 100).toFixed(1)}%
                    (recommend raising price to {alert.recommendedPrice.toFixed(4)} SOL)
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Revenue Distribution */}
      <GlassCard gradient="cyan" hover><div className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-400" />
          Revenue Distribution (4-Way Split)
        </h3>

        <div className="space-y-4">
          <RevenueSplitBar
            label="Operations (40%)"
            value={data.revenueByCategory.operations}
            percentage={40}
            color="bg-blue-500"
          />

          <RevenueSplitBar
            label="Treasury (45%)"
            value={data.revenueByCategory.treasury}
            percentage={45}
            color="bg-emerald-500"
          />

          <RevenueSplitBar
            label="Creator (15%)"
            value={data.revenueByCategory.creator}
            percentage={15}
            color="bg-amber-500"
          />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-500 mb-1">Operations</div>
            <div className="font-semibold text-blue-400">{data.revenueByCategory.operations.toFixed(3)} SOL</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">Treasury</div>
            <div className="font-semibold text-emerald-400">{data.revenueByCategory.treasury.toFixed(3)} SOL</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">Creator</div>
            <div className="font-semibold text-amber-400">{data.revenueByCategory.creator.toFixed(3)} SOL</div>
          </div>
        </div>
      </div></GlassCard>

      {/* Service Performance Table */}
      <GlassCard gradient="cyan" hover><div className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Service Performance (Last 7 Days)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
                <th className="pb-3">Service</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Cost</th>
                <th className="pb-3">Margin</th>
                <th className="pb-3">Requests</th>
                <th className="pb-3">Revenue</th>
                <th className="pb-3">Trend</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map((service) => (
                <tr key={service.serviceId} className="border-b border-gray-800/50">
                  <td className="py-3 font-medium">{service.serviceName}</td>
                  <td className="py-3 font-mono text-sm">{service.priceSOL.toFixed(4)} SOL</td>
                  <td className="py-3 font-mono text-sm text-gray-400">{service.costSOL.toFixed(4)} SOL</td>
                  <td className="py-3">
                    <Badge
                      variant={service.margin >= 0.4 ? 'success' : service.margin >= 0.3 ? 'warning' : 'danger'}
                      className="text-xs"
                    >
                      {(service.margin * 100).toFixed(0)}%
                    </Badge>
                  </td>
                  <td className="py-3 text-gray-300">{service.requestCount7d}</td>
                  <td className="py-3 font-mono text-sm text-cyan-400">{service.revenue7d.toFixed(3)} SOL</td>
                  <td className="py-3">
                    <div className={`flex items-center gap-1 text-sm ${service.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {service.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(service.trend).toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></GlassCard>

      {/* Volume Discounts Analytics */}
      <GlassCard gradient="cyan" hover><div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Volume Discounts Analytics</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Total Discounts Granted</div>
            <div className="text-2xl font-bold text-purple-400">
              {data.volumeDiscounts.totalDiscountsSOL.toFixed(3)} SOL
            </div>
          </div>

          <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Discount ROI</div>
            <div className="text-2xl font-bold text-green-400">
              {data.volumeDiscounts.roi.toFixed(1)}x
            </div>
            <div className="text-xs text-gray-500 mt-1">Revenue increase from volume</div>
          </div>

          <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Tier Distribution</div>
            <div className="space-y-1 text-sm">
              {Object.entries(data.volumeDiscounts.tierDistribution).map(([tier, count]) => (
                <div key={tier} className="flex justify-between">
                  <span className="text-gray-400">Tier {tier}:</span>
                  <span className="font-semibold">{count} users</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div></GlassCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  trend,
  target,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  trend?: number;
  target?: number;
  icon: any;
  color: string;
}) {
  return (
    <GlassCard gradient="amber" hover><div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-gray-400">{label}</span>
      </div>

      <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>

      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% (7d)
        </div>
      )}

      {target !== undefined && (
        <div className="text-xs text-gray-500 mt-1">
          Target: {target}%
        </div>
      )}
    </div></GlassCard>
  );
}

function RevenueSplitBar({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: number;
  percentage: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-300">{label}</span>
        <span className="font-mono font-semibold">{value.toFixed(4)} SOL</span>
      </div>

      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
