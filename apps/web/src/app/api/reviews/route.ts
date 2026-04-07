import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

const MAX_COMMENT_LENGTH = 2000;

// POST /api/reviews - submit a review for a completed offer
export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rateLimit = consumeRateLimit({
    key: `review-create:${session.userId}:${getClientIp(req)}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit, 'Cok sik degerlendirme gonderiyorsunuz.');
  }

  const body = await req.json().catch(() => null);
  const offerId = typeof body?.offerId === 'string' ? body.offerId.trim() : '';
  const rating = Number(body?.rating);
  const comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, MAX_COMMENT_LENGTH) : null;

  if (!offerId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Gecersiz puan (1-5 arasi olmali)' }, { status: 400 });
  }

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { listing: true },
  });

  if (!offer) return NextResponse.json({ error: 'Teklif bulunamadi' }, { status: 404 });
  if (offer.status !== 'completed') {
    return NextResponse.json({ error: 'Sadece tamamlanmis siparislere puan verebilirsiniz' }, { status: 400 });
  }

  const isBuyer = offer.listing.buyerId === session.userId;
  const isSeller = offer.sellerId === session.userId;
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: 'Bu siparise puan veremezsiniz' }, { status: 403 });
  }

  const existing = await prisma.review.findUnique({
    where: { offerId_reviewerId: { offerId, reviewerId: session.userId } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Bu siparis icin zaten puan verdiniz' }, { status: 400 });
  }

  const revieweeId = isBuyer ? offer.sellerId : offer.listing.buyerId;

  const review = await prisma.review.create({
    data: {
      offerId,
      reviewerId: session.userId,
      revieweeId,
      rating,
      comment,
    },
    include: {
      reviewer: { select: { id: true, name: true } },
    },
  });

  const allReviews = await prisma.review.findMany({
    where: { revieweeId },
    select: { rating: true },
  });
  const avgScore = allReviews.reduce((sum, item) => sum + item.rating, 0) / allReviews.length;

  await prisma.user.update({
    where: { id: revieweeId },
    data: { score: Math.round(avgScore * 10) / 10 },
  });

  await prisma.notification.create({
    data: {
      userId: revieweeId,
      type: 'system',
      title: 'Yeni degerlendirme',
      description: `"${offer.listing.title}" siparisi icin ${rating} yildiz degerlendirme aldiniz.`,
      link: '/orders',
    },
  });

  return NextResponse.json(review, { status: 201 });
}
