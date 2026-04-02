import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { buildBillingSnapshot } from '@/lib/billing-service';

export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const snapshot = await buildBillingSnapshot(session.userId);
  return NextResponse.json(snapshot);
}
