import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializePlan } from '@/lib/plans';

export async function GET() {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json(plans.map(serializePlan));
}
