import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { fallbackAnalyticsTierForPlanSlug, normalizeAnalyticsTier } from '../../../../../../../shared/plan-analytics';
import { serializePlan } from '@/lib/plans';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json(plans.map(serializePlan));
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const body = await req.json();
  const { slug, ...data } = body;

  if (!slug) return NextResponse.json({ error: 'slug gerekli' }, { status: 400 });

  const allowed = [
    'name',
    'priceMonthly',
    'priceYearly',
    'offersPerMonth',
    'boostPerMonth',
    'maxListings',
    'analytics',
    'analyticsTier',
    'prioritySupport',
    'verifiedBadge',
    'customProfile',
    'responseTime',
  ];

  const updateData: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) updateData[key] = data[key];
  }

  for (const field of ['offersPerMonth', 'boostPerMonth', 'maxListings']) {
    if (field in updateData) {
      const value = updateData[field];
      updateData[field] = value === null || value === '' || Number(value) <= 0 ? null : Number(value);
    }
  }

  for (const field of ['priceMonthly', 'priceYearly']) {
    if (field in updateData) updateData[field] = Number(updateData[field]);
  }

  if ('analyticsTier' in updateData) {
    const analyticsTier = normalizeAnalyticsTier(updateData.analyticsTier, slug);
    updateData.analyticsTier = analyticsTier;
    updateData.analytics = analyticsTier !== 'none';
  } else if ('analytics' in updateData) {
    const analyticsEnabled = Boolean(updateData.analytics);
    const analyticsTier = analyticsEnabled ? fallbackAnalyticsTierForPlanSlug(slug, true) : 'none';
    updateData.analyticsTier = analyticsTier;
    updateData.analytics = analyticsEnabled;
  }

  const plan = await prisma.plan.update({ where: { slug }, data: updateData });
  return NextResponse.json(serializePlan(plan));
}
