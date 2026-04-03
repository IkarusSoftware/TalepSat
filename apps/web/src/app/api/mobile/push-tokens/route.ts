import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { isExpoPushToken, registerPushDevice, unregisterPushDevice } from '@/lib/push';

export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { expoPushToken, platform, appVersion, enabled } = body ?? {};

  if (!expoPushToken || !platform) {
    return NextResponse.json({ error: 'expoPushToken ve platform gerekli' }, { status: 400 });
  }

  if (!isExpoPushToken(expoPushToken)) {
    return NextResponse.json({ error: 'Gecersiz Expo push token' }, { status: 400 });
  }

  if (!['ios', 'android'].includes(platform)) {
    return NextResponse.json({ error: 'Gecersiz platform' }, { status: 400 });
  }

  const device = await registerPushDevice({
    userId: session.userId,
    expoPushToken,
    platform,
    appVersion,
    enabled,
  });

  return NextResponse.json({ id: device.id, enabled: !device.disabledAt });
}

export async function DELETE(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let expoPushToken: string | null | undefined;
  try {
    const body = await req.json();
    expoPushToken = body?.expoPushToken;
  } catch {
    expoPushToken = null;
  }

  await unregisterPushDevice(session.userId, expoPushToken);
  return NextResponse.json({ success: true });
}
