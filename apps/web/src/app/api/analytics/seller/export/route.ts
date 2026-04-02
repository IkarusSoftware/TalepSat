import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { buildSellerAnalyticsCsv, buildSellerAnalyticsSnapshot } from '@/lib/seller-analytics';

export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  if (!['seller', 'both', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Bu ekran sadece satıcı hesapları için kullanılabilir.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';
  if (format !== 'csv') {
    return NextResponse.json({ error: 'Sadece CSV export destekleniyor.' }, { status: 400 });
  }

  const snapshot = await buildSellerAnalyticsSnapshot(session.userId, {
    range: searchParams.get('range'),
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    listingId: searchParams.get('listingId'),
    category: searchParams.get('category'),
    city: searchParams.get('city'),
  });

  if (snapshot.tier !== 'pro') {
    return NextResponse.json({ error: 'CSV export yalnızca Pro planında kullanılabilir.' }, { status: 403 });
  }

  const csv = buildSellerAnalyticsCsv(snapshot);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="seller-analytics-${Date.now()}.csv"`,
    },
  });
}
