import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';

// POST /api/reviews — submit a review for a completed offer (both buyer and seller can review)
export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { offerId, rating, comment } = body;

  if (!offerId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Geçersiz puan (1-5 arası olmalı)' }, { status: 400 });
  }

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { listing: true },
  });

  if (!offer) return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 });
  if (offer.status !== 'completed') {
    return NextResponse.json({ error: 'Sadece tamamlanmış siparişlere puan verebilirsiniz' }, { status: 400 });
  }

  const isBuyer = offer.listing.buyerId === session.userId;
  const isSeller = offer.sellerId === session.userId;

  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: 'Bu siparişe puan veremezsiniz' }, { status: 403 });
  }

  // Check if already reviewed by this user
  const existing = await prisma.review.findUnique({
    where: { offerId_reviewerId: { offerId, reviewerId: session.userId } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Bu sipariş için zaten puan verdiniz' }, { status: 400 });
  }

  // Buyer reviews seller, seller reviews buyer
  const revieweeId = isBuyer ? offer.sellerId : offer.listing.buyerId;

  const review = await prisma.review.create({
    data: {
      offerId,
      reviewerId: session.userId,
      revieweeId,
      rating: Math.round(rating),
      comment: comment?.trim() || null,
    },
    include: {
      reviewer: { select: { id: true, name: true } },
    },
  });

  // Recalculate reviewee's average score
  const allReviews = await prisma.review.findMany({
    where: { revieweeId },
    select: { rating: true },
  });
  const avgScore = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await prisma.user.update({
    where: { id: revieweeId },
    data: { score: Math.round(avgScore * 10) / 10 },
  });

  // Notify the reviewee
  await prisma.notification.create({
    data: {
      userId: revieweeId,
      type: 'system',
      title: 'Yeni Değerlendirme',
      description: `"${offer.listing.title}" siparişi için ${rating} yıldız değerlendirme aldınız.`,
      link: `/orders`,
    },
  });

  return NextResponse.json(review, { status: 201 });
}
