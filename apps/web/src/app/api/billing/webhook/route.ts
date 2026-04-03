import { NextRequest, NextResponse } from 'next/server';
import { processCheckoutToken, processSubscriptionReference } from '@/lib/billing-service';
import { verifyIyzicoWebhookSignature } from '@/lib/billing';

async function parsePayload(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return (await req.json().catch(() => ({}))) as Record<string, unknown>;
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const formData = await req.formData();
    return Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [key, typeof value === 'string' ? value : value.name]),
    );
  }

  const text = await req.text().catch(() => '');
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return Object.fromEntries(new URLSearchParams(text));
  }
}

function redirectToSubscription(req: NextRequest, status: 'success' | 'pending' | 'error') {
  return NextResponse.redirect(new URL(`/subscription?billing=${status}`, req.nextUrl.origin));
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return redirectToSubscription(req, 'error');
  }

  try {
    const subscription = await processCheckoutToken(token);
    return redirectToSubscription(req, subscription ? 'success' : 'pending');
  } catch {
    return redirectToSubscription(req, 'error');
  }
}

export async function POST(req: NextRequest) {
  const payload = await parsePayload(req);
  const token = typeof payload.token === 'string' ? payload.token : null;
  const eventType = typeof payload.iyziEventType === 'string' ? payload.iyziEventType : null;
  const subscriptionReferenceCode =
    typeof payload.subscriptionReferenceCode === 'string' ? payload.subscriptionReferenceCode : null;

  if (token) {
    const subscription = await processCheckoutToken(token);
    return NextResponse.json({
      success: true,
      status: subscription ? 'processed' : 'pending',
    });
  }

  const signature =
    req.headers.get('x-iyzi-signature') ||
    req.headers.get('x-iyz-signature') ||
    req.headers.get('authorization-hash');

  const isWebhookEvent = Boolean(subscriptionReferenceCode || eventType);
  if (isWebhookEvent) {
    if (!process.env.IYZICO_MERCHANT_ID) {
      return NextResponse.json(
        { error: 'Webhook imza dogrulamasi icin IYZICO_MERCHANT_ID gerekli.' },
        { status: 503 },
      );
    }

    if (!signature || !verifyIyzicoWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: 'Gecersiz webhook imzasi.' }, { status: 401 });
    }
  }

  if (subscriptionReferenceCode) {
    await processSubscriptionReference(subscriptionReferenceCode, payload);
  }

  return NextResponse.json({ success: true });
}
