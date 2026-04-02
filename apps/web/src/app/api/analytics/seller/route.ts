import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { buildSellerAnalyticsSnapshot } from '@/lib/seller-analytics';

export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  if (!['seller', 'both', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Bu ekran sadece satıcı hesapları için kullanılabilir.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const snapshot = await buildSellerAnalyticsSnapshot(session.userId, {
    range: searchParams.get('range'),
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    listingId: searchParams.get('listingId'),
    category: searchParams.get('category'),
    city: searchParams.get('city'),
  });

  return NextResponse.json(snapshot);
}
