import { createHmac, randomUUID } from 'crypto';
import { prisma } from './prisma';

export type BillingCycle = 'monthly' | 'yearly';

type IyzicoSubscriptionData = {
  referenceCode?: string;
  parentReferenceCode?: string;
  pricingPlanReferenceCode?: string;
  customerReferenceCode?: string;
  subscriptionStatus?: string;
  createdDate?: number;
  startDate?: number;
  endDate?: number;
};

function getIyzicoConfig() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const baseUrl = process.env.IYZICO_BASE_URL;
  const callbackUrl = process.env.IYZICO_CALLBACK_URL;

  if (!apiKey || !secretKey || !baseUrl || !callbackUrl) {
    throw new Error('Iyzico yapılandırması eksik. IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL ve IYZICO_CALLBACK_URL gerekli.');
  }

  return {
    apiKey,
    secretKey,
    baseUrl: baseUrl.replace(/\/$/, ''),
    callbackUrl,
    merchantId: process.env.IYZICO_MERCHANT_ID || null,
  };
}

function buildAuthorization(path: string, bodyText: string, apiKey: string, secretKey: string) {
  const randomKey = randomUUID().replace(/-/g, '');
  const signature = createHmac('sha256', secretKey)
    .update(randomKey + path + bodyText)
    .digest('hex');

  const authorization = Buffer.from(
    `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`,
  ).toString('base64');

  return {
    randomKey,
    authorization: `IYZWSv2 ${authorization}`,
  };
}

async function iyzicoRequest<T>(path: string, init?: { method?: 'GET' | 'POST'; body?: Record<string, unknown> }) {
  const config = getIyzicoConfig();
  const method = init?.method || 'GET';
  const bodyText = init?.body ? JSON.stringify(init.body) : '';
  const { authorization, randomKey } = buildAuthorization(path, bodyText, config.apiKey, config.secretKey);

  const response = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
      'x-iyzi-rnd': randomKey,
    },
    body: method === 'GET' ? undefined : bodyText,
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || json?.status === 'failure') {
    const message = json?.errorMessage || json?.message || 'Iyzico isteği başarısız oldu.';
    throw new Error(message);
  }

  return json as T;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    name: parts[0] || fullName || 'TalepSat',
    surname: parts.slice(1).join(' ') || 'Kullanıcı',
  };
}

function toDate(value?: number | null) {
  return value ? new Date(value) : null;
}

export function normalizeSubscriptionStatus(status?: string | null) {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'PENDING':
      return 'pending';
    case 'CANCELED':
      return 'canceled';
    case 'UNPAID':
      return 'past_due';
    case 'UPGRADED':
      return 'upgraded';
    case 'EXPIRED':
      return 'expired';
    default:
      return 'inactive';
  }
}

export function isEntitledSubscriptionStatus(status?: string | null) {
  return ['active', 'pending'].includes(normalizeSubscriptionStatus(status));
}

export async function getSubscriptionSnapshot(userId: string) {
  const [user, entitledSubscription, latestSubscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        badge: true,
      },
    }),
    prisma.userSubscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'pending'] },
      },
      include: {
        plan: true,
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.userSubscription.findFirst({
      where: { userId },
      include: {
        plan: true,
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    }),
  ]);

  return {
    badge: user?.badge || 'free',
    entitledSubscription,
    subscription: entitledSubscription || latestSubscription,
  };
}

export async function syncSubscriptionRecord(input: {
  userId: string;
  planId: string;
  billingCycle: BillingCycle;
  providerCheckoutToken?: string | null;
  data: IyzicoSubscriptionData;
}) {
  const normalizedStatus = normalizeSubscriptionStatus(input.data.subscriptionStatus);
  const providerSubscriptionRef =
    input.data.referenceCode || `pending-${input.userId}-${input.planId}-${input.billingCycle}`;

  const subscription = await prisma.userSubscription.upsert({
    where: {
      providerSubscriptionRef,
    },
    update: {
      planId: input.planId,
      billingCycle: input.billingCycle,
      status: normalizedStatus,
      providerCustomerRef: input.data.customerReferenceCode || null,
      providerCheckoutToken: input.providerCheckoutToken ?? null,
      startedAt: toDate(input.data.createdDate),
      currentPeriodStart: toDate(input.data.startDate),
      currentPeriodEnd: toDate(input.data.endDate),
      cancelAtPeriodEnd: normalizedStatus === 'canceled',
    },
    create: {
      userId: input.userId,
      planId: input.planId,
      provider: 'iyzico',
      billingCycle: input.billingCycle,
      status: normalizedStatus,
      providerCustomerRef: input.data.customerReferenceCode || null,
      providerSubscriptionRef,
      providerCheckoutToken: input.providerCheckoutToken ?? null,
      startedAt: toDate(input.data.createdDate),
      currentPeriodStart: toDate(input.data.startDate),
      currentPeriodEnd: toDate(input.data.endDate),
      cancelAtPeriodEnd: normalizedStatus === 'canceled',
    },
    include: {
      plan: true,
    },
  });

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      badge: isEntitledSubscriptionStatus(input.data.subscriptionStatus) ? subscription.plan.slug : 'free',
    },
  });

  return subscription;
}

export async function initializeIyzicoCheckout(input: {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    city?: string | null;
    taxNumber?: string | null;
    companyName?: string | null;
  };
  planReferenceCode: string;
  billingCycle: BillingCycle;
  callbackUrl?: string;
}) {
  const config = getIyzicoConfig();
  const { name, surname } = splitName(input.user.name);

  if (!input.user.phone || !input.user.city || !input.user.taxNumber) {
    throw new Error('İyzico aboneliği için profilinde telefon, şehir ve vergi/TCKN alanlarını doldurmalısın.');
  }

  return iyzicoRequest<{
    token: string;
    checkoutFormContent: string;
    tokenExpireTime: number;
    conversationId?: string;
    status: string;
  }>('/v2/subscription/checkoutform/initialize', {
    method: 'POST',
    body: {
      locale: 'tr',
      callbackUrl: input.callbackUrl || config.callbackUrl,
      pricingPlanReferenceCode: input.planReferenceCode,
      subscriptionInitialStatus: 'ACTIVE',
      conversationId: `sub-${input.user.id}-${Date.now()}`,
      customer: {
        name,
        surname,
        email: input.user.email,
        gsmNumber: input.user.phone,
        identityNumber: input.user.taxNumber,
        billingAddress: {
          address: input.user.companyName || `${input.user.city} / Türkiye`,
          zipCode: '34000',
          contactName: input.user.name,
          city: input.user.city,
          country: 'Turkey',
        },
        shippingAddress: {
          address: input.user.companyName || `${input.user.city} / Türkiye`,
          zipCode: '34000',
          contactName: input.user.name,
          city: input.user.city,
          country: 'Turkey',
        },
      },
    },
  });
}

export async function retrieveCheckoutResult(token: string) {
  return iyzicoRequest<{
    status: string;
    data?: IyzicoSubscriptionData;
  }>(`/v2/subscription/checkoutform/${token}`, {
    method: 'GET',
  });
}

export async function fetchSubscriptionDetails(referenceCode: string) {
  return iyzicoRequest<{
    status: string;
    data?: {
      items?: IyzicoSubscriptionData[];
    };
  }>(`/v2/subscription/subscriptions/${referenceCode}`, {
    method: 'GET',
  });
}

export async function cancelIyzicoSubscription(referenceCode: string) {
  return iyzicoRequest(`/v2/subscription/subscriptions/${referenceCode}/cancel`, {
    method: 'POST',
    body: { subscriptionReferenceCode: referenceCode },
  });
}

export async function activateIyzicoSubscription(referenceCode: string) {
  return iyzicoRequest(`/v2/subscription/subscriptions/${referenceCode}/activate`, {
    method: 'POST',
    body: { referenceCode },
  });
}

export async function upgradeIyzicoSubscription(referenceCode: string, planReferenceCode: string) {
  return iyzicoRequest<{ data?: IyzicoSubscriptionData }>(`/v2/subscription/subscriptions/${referenceCode}/upgrade`, {
    method: 'POST',
    body: {
      newPricingPlanReferenceCode: planReferenceCode,
      upgradePeriod: 'NEXT_PERIOD',
      useTrial: false,
      resetRecurrenceCount: true,
    },
  });
}

export async function storeBillingEvent(input: {
  userId?: string | null;
  planId?: string | null;
  provider: string;
  eventType: string;
  payload: unknown;
  providerReference?: string | null;
  status?: string;
}) {
  return prisma.billingEvent.create({
    data: {
      userId: input.userId ?? null,
      planId: input.planId ?? null,
      provider: input.provider,
      eventType: input.eventType,
      payload: JSON.stringify(input.payload),
      providerReference: input.providerReference ?? null,
      status: input.status ?? 'pending',
    },
  });
}

export function verifyIyzicoWebhookSignature(payload: Record<string, unknown>, signatureHeader?: string | null) {
  if (!signatureHeader) return false;

  const { secretKey, merchantId } = getIyzicoConfig();
  if (!merchantId) return false;

  const eventType = String(payload.iyziEventType || '');
  const subscriptionReferenceCode = String(payload.subscriptionReferenceCode || '');
  const orderReferenceCode = String(payload.orderReferenceCode || '');
  const customerReferenceCode = String(payload.customerReferenceCode || '');

  const message =
    merchantId +
    secretKey +
    eventType +
    subscriptionReferenceCode +
    orderReferenceCode +
    customerReferenceCode;

  const expected = createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');

  return expected === signatureHeader;
}
