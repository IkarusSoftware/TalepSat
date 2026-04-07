import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiSession } from '@/lib/api-session';
import {
  type BillingCycle,
  getSubscriptionSnapshot,
  initializeIyzicoCheckout,
  storeBillingEvent,
  syncSubscriptionRecord,
  upgradeIyzicoSubscription,
} from '@/lib/billing';
import { createNotificationAndPublish } from '@/lib/notification-service';
import { buildBillingSnapshot } from '@/lib/billing-service';
import { emitRealtimeEvent, eventForUser } from '@/lib/realtime';

function parseBillingCycle(value: unknown): BillingCycle {
  return value === 'yearly' ? 'yearly' : 'monthly';
}

export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const planSlug = typeof body.planSlug === 'string' ? body.planSlug : '';
  const billingCycle = parseBillingCycle(body.billingCycle);

  if (!planSlug) {
    return NextResponse.json({ error: 'Plan seçimi gerekli.' }, { status: 400 });
  }

  const [user, plan, snapshot] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        taxNumber: true,
        companyName: true,
      },
    }),
    prisma.plan.findUnique({
      where: { slug: planSlug },
    }),
    getSubscriptionSnapshot(session.userId),
  ]);

  if (!user) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
  }

  if (!plan) {
    return NextResponse.json({ error: 'Plan bulunamadı.' }, { status: 404 });
  }

  if (plan.slug === 'free') {
    return NextResponse.json({ error: 'Ücretsiz plan için ödeme gerekmez.' }, { status: 400 });
  }

  const planReferenceCode =
    billingCycle === 'yearly' ? plan.iyzicoYearlyPlanRef : plan.iyzicoMonthlyPlanRef;

  if (!planReferenceCode) {
    return NextResponse.json({
      error: 'Bu plan için iyzico referansı henüz tanımlı değil.',
    }, { status: 400 });
  }

  const activeSubscription = snapshot.subscription;
  const canUpgradeInPlace =
    activeSubscription &&
    activeSubscription.provider === 'iyzico' &&
    activeSubscription.providerSubscriptionRef &&
    ['active', 'pending'].includes(activeSubscription.status);

  if (
    canUpgradeInPlace &&
    activeSubscription.plan.slug === plan.slug &&
    activeSubscription.billingCycle === billingCycle &&
    !activeSubscription.cancelAtPeriodEnd
  ) {
    return NextResponse.json({
      mode: 'noop',
      message: 'Bu plan zaten aktif.',
      snapshot: await buildBillingSnapshot(session.userId),
    });
  }

  if (
    canUpgradeInPlace &&
    activeSubscription.plan.slug !== plan.slug &&
    activeSubscription.billingCycle === billingCycle
  ) {
    const result = await upgradeIyzicoSubscription(
      activeSubscription.providerSubscriptionRef!,
      planReferenceCode,
    );
    const data = result.data;

    if (!data) {
      return NextResponse.json({ error: 'Plan yükseltme yanıtı alınamadı.' }, { status: 502 });
    }

    const subscription = await syncSubscriptionRecord({
      userId: session.userId,
      planId: plan.id,
      billingCycle,
      data,
    });

    await storeBillingEvent({
      userId: session.userId,
      planId: plan.id,
      provider: 'iyzico',
      eventType: 'subscription.upgraded',
      providerReference: data.referenceCode || activeSubscription.providerSubscriptionRef,
      payload: result,
      status: 'processed',
    });

    await createNotificationAndPublish({
      userId: session.userId,
      type: 'system',
      title: 'Planın güncellendi',
      description: `${subscription.plan.name} planı bir sonraki döneme hazırlandı.`,
      link: '/subscription',
      entityId: subscription.id,
    });
    emitRealtimeEvent(eventForUser(session.userId, 'subscription.updated', subscription.id));

    return NextResponse.json({
      mode: 'upgrade',
      snapshot: await buildBillingSnapshot(session.userId),
    });
  }

  const callbackUrl = `${req.nextUrl.origin}/api/billing/webhook`;
  const checkout = await initializeIyzicoCheckout({
    user,
    planReferenceCode,
    billingCycle,
    callbackUrl,
  });

  await storeBillingEvent({
    userId: session.userId,
    planId: plan.id,
    provider: 'iyzico',
    eventType: 'checkout.initialized',
    providerReference: checkout.token,
    payload: {
      ...checkout,
      billingCycle,
      planSlug: plan.slug,
      planId: plan.id,
    },
    status: 'pending',
  });

  return NextResponse.json({
    mode: 'checkout',
    token: checkout.token,
    checkoutUrl: `${req.nextUrl.origin}/billing/checkout?token=${encodeURIComponent(checkout.token)}`,
  });
}
