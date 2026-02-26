// ---------------------------------------------------------------------------
// AXIONBLADE Economy API — Real-Time Economic Metrics
// ---------------------------------------------------------------------------
// Provides comprehensive economic data for the economy dashboard:
// - Aggregated revenue and costs
// - Service-level performance metrics
// - Volume discount statistics
// - Margin alerts
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getTierFromKey, checkRateLimit, getCorsHeaders } from '../_shared/middleware';

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  // ---------------------------------------------------------------------------
  // Authentication — require a valid HMAC-signed API key
  // Economy data is operator-sensitive (real revenue, margins, costs).
  // Only pro+ keys may access it.
  // ---------------------------------------------------------------------------
  const apiKey = request.headers.get('x-api-key');

  if (!validateApiKey(apiKey)) {
    return NextResponse.json(
      { error: 'Unauthorized — valid API key required' },
      { status: 401, headers: getCorsHeaders(request) }
    );
  }

  const tier = getTierFromKey(apiKey!);
  if (tier === 'free') {
    return NextResponse.json(
      { error: 'Forbidden — economy data requires pro or protocol tier' },
      { status: 403, headers: getCorsHeaders(request) }
    );
  }

  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rateLimitKey = `economy:${apiKey!.slice(0, 16)}:${clientIp}`;
  const { allowed, remaining } = checkRateLimit(rateLimitKey, tier);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { ...getCorsHeaders(request), 'X-RateLimit-Remaining': '0' } }
    );
  }

  try {
    // In production, fetch from:
    // 1. On-chain treasury vault data
    // 2. Service performance logs
    // 3. VolumeDiscountTracker PDAs
    // 4. Historical transaction data

    const economyData = generateMockEconomyData();

    return NextResponse.json(economyData, {
      headers: {
        ...getCorsHeaders(request),
        'X-RateLimit-Remaining': String(remaining),
      },
    });
  } catch (error) {
    console.error('Economy API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch economy data' },
      { status: 500, headers: getCorsHeaders(request) }
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
