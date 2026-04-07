import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      pushNotificationsEnabled: true,
      emailNewOfferEnabled: true,
      emailStatusChangeEnabled: true,
      emailExpiryEnabled: true,
    },
  });

  return NextResponse.json({
    push: Boolean(user?.pushNotificationsEnabled),
    emailNewOffer: Boolean(user?.emailNewOfferEnabled),
    emailStatusChange: Boolean(user?.emailStatusChangeEnabled),
    emailExpiry: Boolean(user?.emailExpiryEnabled),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const updateData: {
    pushNotificationsEnabled?: boolean;
    emailNewOfferEnabled?: boolean;
    emailStatusChangeEnabled?: boolean;
    emailExpiryEnabled?: boolean;
  } = {};

  const booleanFields = [
    ['push', 'pushNotificationsEnabled'],
    ['emailNewOffer', 'emailNewOfferEnabled'],
    ['emailStatusChange', 'emailStatusChangeEnabled'],
    ['emailExpiry', 'emailExpiryEnabled'],
  ] as const;

  for (const [inputKey, columnKey] of booleanFields) {
    const value = body?.[inputKey];
    if (value === undefined) continue;
    if (typeof value !== 'boolean') {
      return NextResponse.json({ error: `${inputKey} boolean olarak gonderilmeli` }, { status: 400 });
    }
    updateData[columnKey] = value;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'En az bir tercih gonderilmeli' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: updateData,
    select: {
      pushNotificationsEnabled: true,
      emailNewOfferEnabled: true,
      emailStatusChangeEnabled: true,
      emailExpiryEnabled: true,
    },
  });

  return NextResponse.json({
    push: user.pushNotificationsEnabled,
    emailNewOffer: user.emailNewOfferEnabled,
    emailStatusChange: user.emailStatusChangeEnabled,
    emailExpiry: user.emailExpiryEnabled,
  });
}
