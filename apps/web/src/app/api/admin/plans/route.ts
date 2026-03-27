import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { Session } from 'next-auth';

function isAdmin(session: Session | null) {
  const role = (session?.user as { role?: string })?.role;
  return !!(session?.user?.id && role === 'admin');
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json(plans);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const body = await req.json();
  const { slug, ...data } = body;

  if (!slug) return NextResponse.json({ error: 'slug gerekli' }, { status: 400 });

  // Sanitize: only allow known fields
  const allowed = ['name', 'priceMonthly', 'priceYearly', 'offersPerMonth', 'boostPerMonth',
    'maxListings', 'analytics', 'prioritySupport', 'verifiedBadge', 'customProfile', 'responseTime'];

  const updateData: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) updateData[key] = data[key];
  }

  // Null handling for unlimited fields
  for (const field of ['offersPerMonth', 'boostPerMonth', 'maxListings']) {
    if (field in updateData) {
      const val = updateData[field];
      updateData[field] = (val === null || val === '' || Number(val) <= 0) ? null : Number(val);
    }
  }

  // Numeric fields
  for (const field of ['priceMonthly', 'priceYearly']) {
    if (field in updateData) updateData[field] = Number(updateData[field]);
  }

  const plan = await prisma.plan.update({ where: { slug }, data: updateData });
  return NextResponse.json(plan);
}
