import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiSession } from '@/lib/api-session';
import { cancelIyzicoSubscription, getSubscriptionSnapshot, storeBillingEvent } from '@/lib/billing';
import { createNotificationAndPublish } from '@/lib/notification-service';
import { buildBillingSnapshot } from '@/lib/billing-service';
import { emitRealtimeEvent, eventForUser } from '@/lib/realtime';

export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const snapshot = await getSubscriptionSnapshot(session.userId);
  const subscription = snapshot.subscription;

  if (!subscription?.providerSubscriptionRef) {
    return NextResponse.json({ error: 'Aktif yönetilebilir abonelik bulunamadı.' }, { status: 404 });
  }

  await cancelIyzicoSubscription(subscription.providerSubscriptionRef);

  await prisma.userSubscription.update({
    where: { id: subscription.id },
    data: {
      cancelAtPeriodEnd: true,
    },
  });

  await storeBillingEvent({
    userId: session.userId,
    planId: subscription.planId,
    provider: 'iyzico',
    eventType: 'subscription.cancel_requested',
    providerReference: subscription.providerSubscriptionRef,
    payload: { subscriptionId: subscription.id },
    status: 'processed',
  });

  await createNotificationAndPublish({
    userId: session.userId,
    type: 'system',
    title: 'Abonelik iptal talebin alındı',
    description: `${subscription.plan.name} planın dönem sonunda sona erecek.`,
    link: '/subscription',
    entityId: subscription.id,
  });
  emitRealtimeEvent(eventForUser(session.userId, 'subscription.updated', subscription.id));

  return NextResponse.json({
    success: true,
    snapshot: await buildBillingSnapshot(session.userId),
  });
}
