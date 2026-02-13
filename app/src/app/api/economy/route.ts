// ---------------------------------------------------------------------------
// AXIONBLADE Economy API — Real-Time Economic Metrics
// ---------------------------------------------------------------------------
// Provides comprehensive economic data for the economy dashboard:
// - Aggregated revenue and costs
// - Service-level performance metrics
// - Volume discount statistics
// - Margin alerts
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In production, fetch from:
    // 1. On-chain treasury vault data
    // 2. Service performance logs
    // 3. VolumeDiscountTracker PDAs
    // 4. Historical transaction data

    // Mock data for now
    const economyData = generateMockEconomyData();

    return NextResponse.json(economyData);
  } catch (error) {
    console.error('Economy API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch economy data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Mock Data Generation
// ---------------------------------------------------------------------------

function generateMockEconomyData() {
  // Service definitions with new repriced values
  const services = [
    {
      serviceId: 1,
      serviceName: 'Wallet Scanner',
      priceSOL: 0.05, // 10x cheaper
      costSOL: 0.015,
      requestCount7d: 450,
    },
    {
      serviceId: 2,
      serviceName: 'Pool Analyzer',
      priceSOL: 0.005,
      costSOL: 0.002,
      requestCount7d: 180,
    },
    {
      serviceId: 3,
      serviceName: 'Protocol Auditor',
      priceSOL: 0.01,
      costSOL: 0.003,
      requestCount7d: 120,
    },
    {
      serviceId: 4,
      serviceName: 'Yield Optimizer',
      priceSOL: 0.008,
      costSOL: 0.002,
      requestCount7d: 200,
    },
    {
      serviceId: 5,
      serviceName: 'Token Deep Dive',
      priceSOL: 0.012,
      costSOL: 0.004,
      requestCount7d: 90,
    },
    {
      serviceId: 6,
      serviceName: 'AEON Monthly',
      priceSOL: 0.02,
      costSOL: 0.005,
      requestCount7d: 50,
    },
    {
      serviceId: 7,
      serviceName: 'HERMES Per TX',
      priceSOL: 0.001,
      costSOL: 0.0003,
      requestCount7d: 300,
    },
  ];

  // Calculate totals
  let totalRevenue = 0;
  let totalCosts = 0;

  const servicesWithMetrics = services.map(service => {
    const revenue7d = service.priceSOL * service.requestCount7d;
    const cost7d = service.costSOL * service.requestCount7d;
    const margin = (service.priceSOL - service.costSOL) / service.priceSOL;

    totalRevenue += revenue7d;
    totalCosts += cost7d;

    return {
      ...service,
      revenue7d,
      margin,
      trend: (Math.random() - 0.3) * 30, // -10% to +20% trend
    };
  });

  const averageMargin = (totalRevenue - totalCosts) / totalRevenue;
  const monthlyProjection = (totalRevenue / 7) * 30;

  // 4-way revenue split
  const revenueByCategory = {
    operations: totalRevenue * 0.50,
    reserve: totalRevenue * 0.25,
    devFund: totalRevenue * 0.15,
    creator: totalRevenue * 0.10,
  };

  // Volume discounts
  const volumeDiscounts = {
    totalDiscountsSOL: 0.45, // Total discounts granted
    tierDistribution: {
      '0': 850, // 0% discount (0-9 scans)
      '1': 120, // 10% discount (10-49 scans)
      '2': 25, // 20% discount (50-99 scans)
      '3': 5, // 30% discount (100+ scans)
    },
    roi: 1.8, // 1.8x revenue increase from volume incentive
  };

  // Margin alerts (services below 30%)
  const alerts = servicesWithMetrics
    .filter(s => s.margin < 0.30)
    .map(s => ({
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      currentMargin: s.margin,
      recommendedPrice: s.costSOL * 1.4, // 40% margin
    }));

  return {
    totalRevenue,
    totalCosts,
    averageMargin,
    monthlyProjection,
    revenueTrend7d: 12.5, // +12.5% growth
    costTrend7d: 8.2, // +8.2% growth (lower than revenue)
    revenueByCategory,
    services: servicesWithMetrics,
    volumeDiscounts,
    alerts,
  };
}
