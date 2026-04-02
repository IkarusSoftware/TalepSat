import { prisma } from './prisma';
import {
  type BillingCycle,
  fetchSubscriptionDetails,
  getSubscriptionSnapshot,
  normalizeSubscriptionStatus,
  retrieveCheckoutResult,
  storeBillingEvent,
  syncSubscriptionRecord,
} from './billing';
import { createNotificationAndPublish } from './notification-service';
import { serializePlan as serializePlanRecord } from './plans';
import { emitRealtimeEvent, eventForUser } from './realtime';

type PlanShape = {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  iyzicoMonthlyPlanRef: string | null;
  iyzicoYearlyPlanRef: string | null;
  offersPerMonth: number | null;
  boostPerMonth: number | null;
  maxListings: number | null;
  analytics: boolean;
  analyticsTier: string;
  prioritySupport: boolean;
  verifiedBadge: boolean;
  customProfile: boolean;
  responseTime: string;
  sortOrder: number;
};

type SubscriptionShape = {
  id: string;
  status: string;
  billingCycle: string;
  provider: string;
  providerCustomerRef: string | null;
  providerSubscriptionRef: string | null;
  providerCheckoutToken: string | null;
  startedAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
  plan: PlanShape;
};

function serializeBillingPlan(plan: PlanShape | null) {
  if (!plan) return null;

  return serializePlanRecord(plan);
}

function serializeSubscription(subscription: SubscriptionShape | null) {
  if (!subscription) return null;

  return {
    id: subscription.id,
    status: subscription.status,
    billingCycle: subscription.billingCycle,
    provider: subscription.provider,
    providerCustomerRef: subscription.providerCustomerRef,
    providerSubscriptionRef: subscription.providerSubscriptionRef,
    providerCheckoutToken: subscription.providerCheckoutToken,
    startedAt: subscription.startedAt?.toISOString() || null,
    currentPeriodStart: subscription.currentPeriodStart?.toISOString() || null,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
    plan: serializeBillingPlan(subscription.plan),
  };
}

function parseBillingCycle(value: unknown): BillingCycle {
  return value === 'yearly' ? 'yearly' : 'monthly';
}

function parseJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function buildBillingSnapshot(userId: string) {
  const [snapshot, currentUser, listingCount, totalOffers, acceptedOffers, reviewCount] = await Promise.all([
    getSubscriptionSnapshot(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        phone: true,
        city: true,
        taxNumber: true,
        companyName: true,
      },
    }),
    prisma.listing.count({ where: { buyerId: userId } }),
    prisma.offer.count({ where: { sellerId: userId } }),
    prisma.offer.count({ where: { sellerId: userId, status: { in: ['accepted', 'completed'] } } }),
    prisma.review.count({ where: { revieweeId: userId } }),
  ]);

  const currentPlan =
    snapshot.entitledSubscription?.plan ||
    (await prisma.plan.findFirst({
      where: { slug: snapshot.badge || 'free' },
    })) ||
    (await prisma.plan.findFirst({
      where: { slug: 'free' },
    }));

  const requiredProfileFields = [
    !currentUser?.phone ? 'phone' : null,
    !currentUser?.city ? 'city' : null,
    !currentUser?.taxNumber ? 'taxNumber' : null,
  ].filter(Boolean) as string[];

  return {
    badge: snapshot.badge,
    currentPlan: serializeBillingPlan(currentPlan as PlanShape | null),
    subscription: serializeSubscription(snapshot.subscription as SubscriptionShape | null),
    usage: {
      listingCount,
      totalOffers,
      acceptedOffers,
      reviewCount,
    },
    requiredProfileFields,
    iyzicoConfigured: Boolean(
      process.env.IYZICO_API_KEY &&
      process.env.IYZICO_SECRET_KEY &&
      process.env.IYZICO_BASE_URL &&
      process.env.IYZICO_CALLBACK_URL,
    ),
    pushConfigured: Boolean(process.env.EXPO_ACCESS_TOKEN),
  };
}

export async function processCheckoutToken(token: string) {
  const initEvent = await prisma.billingEvent.findFirst({
    where: {
      provider: 'iyzico',
      providerReference: token,
      eventType: 'checkout.initialized',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!initEvent?.userId || !initEvent.planId) {
    throw new Error('Bu checkout oturumu için bekleyen abonelik kaydı bulunamadı.');
  }

  const meta = parseJsonObject(initEvent.payload);
  const result = await retrieveCheckoutResult(token);
  const data = result.data;

  if (!data) {
    await prisma.billingEvent.update({
      where: { id: initEvent.id },
      data: {
        status: 'pending',
        payload: JSON.stringify({
          ...meta,
          checkoutResult: result,
        }),
      },
    });
    return null;
  }

  const subscription = await syncSubscriptionRecord({
    userId: initEvent.userId,
    planId: initEvent.planId,
    billingCycle: parseBillingCycle(meta.billingCycle),
    providerCheckoutToken: token,
    data,
  });

  await prisma.billingEvent.update({
    where: { id: initEvent.id },
    data: {
      status: 'processed',
      processedAt: new Date(),
      payload: JSON.stringify({
        ...meta,
        checkoutResult: result,
      }),
    },
  });

  await storeBillingEvent({
    userId: initEvent.userId,
    planId: initEvent.planId,
    provider: 'iyzico',
    eventType: 'checkout.completed',
    providerReference: data.referenceCode || token,
    payload: result,
    status: 'processed',
  });

  await createNotificationAndPublish({
    userId: initEvent.userId,
    type: 'system',
    title: 'Abonelik aktif edildi',
    description: `${subscription.plan.name} planın kullanıma açıldı.`,
    link: '/subscription',
    entityId: subscription.id,
  });
  emitRealtimeEvent(eventForUser(initEvent.userId, 'subscription.updated', subscription.id));

  return subscription;
}

export async function processSubscriptionReference(referenceCode: string, payload: Record<string, unknown>) {
  const existing = await prisma.userSubscription.findFirst({
    where: { providerSubscriptionRef: referenceCode },
    include: { plan: true },
  });

  await storeBillingEvent({
    userId: existing?.userId ?? null,
    planId: existing?.planId ?? null,
    provider: 'iyzico',
    eventType: String(payload.iyziEventType || 'subscription.updated'),
    providerReference: referenceCode,
    payload,
    status: existing ? 'processed' : 'pending',
  });

  if (!existing) return null;

  const previousStatus = existing.status;
  const details = await fetchSubscriptionDetails(referenceCode);
  const data = details.data?.items?.[0];
  if (!data) return null;

  const subscription = await syncSubscriptionRecord({
    userId: existing.userId,
    planId: existing.planId,
    billingCycle: parseBillingCycle(existing.billingCycle),
    data,
  });

  if (normalizeSubscriptionStatus(previousStatus) !== normalizeSubscriptionStatus(subscription.status)) {
    const statusLabel =
      subscription.status === 'active'
        ? 'yenilendi'
        : subscription.status === 'canceled'
          ? 'iptal edildi'
          : subscription.status === 'past_due'
            ? 'ödeme bekliyor'
            : 'güncellendi';

    await createNotificationAndPublish({
      userId: existing.userId,
      type: 'system',
      title: 'Abonelik durumu güncellendi',
      description: `${subscription.plan.name} planın ${statusLabel}.`,
      link: '/subscription',
      entityId: subscription.id,
    });
  }
  emitRealtimeEvent(eventForUser(existing.userId, 'subscription.updated', subscription.id));

  return subscription;
}

export async function getCheckoutFormContent(token: string) {
  const initEvent = await prisma.billingEvent.findFirst({
    where: {
      provider: 'iyzico',
      providerReference: token,
      eventType: 'checkout.initialized',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!initEvent) return null;

  const payload = parseJsonObject(initEvent.payload);
  return typeof payload.checkoutFormContent === 'string' ? payload.checkoutFormContent : null;
}
