import { prisma } from './prisma';

type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
};

function isExpoPushToken(token: string) {
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

export async function registerPushDevice(input: {
  userId: string;
  platform: string;
  expoPushToken: string;
  appVersion?: string | null;
  enabled?: boolean;
}) {
  return prisma.pushDevice.upsert({
    where: { expoPushToken: input.expoPushToken },
    update: {
      userId: input.userId,
      platform: input.platform,
      appVersion: input.appVersion ?? null,
      lastSeenAt: new Date(),
      disabledAt: input.enabled === false ? new Date() : null,
    },
    create: {
      userId: input.userId,
      platform: input.platform,
      expoPushToken: input.expoPushToken,
      appVersion: input.appVersion ?? null,
      lastSeenAt: new Date(),
      disabledAt: input.enabled === false ? new Date() : null,
    },
  });
}

export async function unregisterPushDevice(userId: string, expoPushToken?: string | null) {
  return prisma.pushDevice.updateMany({
    where: {
      userId,
      ...(expoPushToken ? { expoPushToken } : {}),
      disabledAt: null,
    },
    data: {
      disabledAt: new Date(),
    },
  });
}

export async function sendPushToUser(userId: string, message: PushMessage) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      pushNotificationsEnabled: true,
      status: true,
    },
  });

  if (!user || user.status !== 'active' || !user.pushNotificationsEnabled) {
    return;
  }

  const devices = await prisma.pushDevice.findMany({
    where: {
      userId,
      disabledAt: null,
    },
    select: {
      expoPushToken: true,
    },
  });

  const tokens = devices
    .map((device: { expoPushToken: string }) => device.expoPushToken)
    .filter(isExpoPushToken);

  if (tokens.length === 0) return;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(
      tokens.map((to: string) => ({
        // Expo push is best-effort and should not block the main transaction.
        to,
        title: message.title,
        body: message.body,
        data: message.data,
        sound: message.sound ?? 'default',
      })),
    ),
  }).catch(() => {
    // Push should never break the main application flow.
  });
}
