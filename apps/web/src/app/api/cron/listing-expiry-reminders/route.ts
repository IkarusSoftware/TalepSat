import { NextRequest, NextResponse } from 'next/server';
import { createNotificationAndPublish } from '@/lib/notification-service';
import { prisma } from '@/lib/prisma';

function isAuthorized(req: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get('authorization') || '';

  if (!configuredSecret) {
    return process.env.NODE_ENV === 'development';
  }

  return authHeader === `Bearer ${configuredSecret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const listings = await prisma.listing.findMany({
    where: {
      status: { in: ['active', 'pending'] },
      expiresAt: {
        gt: now,
        lte: horizon,
      },
    },
    select: {
      id: true,
      title: true,
      buyerId: true,
    },
  });

  let created = 0;
  let skipped = 0;

  for (const listing of listings) {
    const alreadyExists = await prisma.notification.findFirst({
      where: {
        userId: listing.buyerId,
        type: 'listing_expiry',
        link: `/listing/${listing.id}`,
      },
      select: { id: true },
    });

    if (alreadyExists) {
      skipped += 1;
      continue;
    }

    await createNotificationAndPublish({
      userId: listing.buyerId,
      type: 'listing_expiry',
      title: 'Ilan suren dolmak uzere',
      description: `"${listing.title}" ilanin 24 saat icinde yayindan kalkacak.`,
      link: `/listing/${listing.id}`,
      entityId: listing.id,
      emailSubject: 'Ilan suren dolmak uzere',
      emailCtaLabel: 'Ilani goruntule',
    });

    created += 1;
  }

  return NextResponse.json({
    scanned: listings.length,
    created,
    skipped,
  });
}
