import { prisma } from './prisma';
import { eventForUser, emitRealtimeEvent } from './realtime';
import { sendPushToUser } from './push';

type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  description: string;
  link?: string | null;
  entityId?: string;
  pushBody?: string;
};

export async function createNotificationAndPublish(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      description: input.description,
      link: input.link ?? null,
    },
  });

  emitRealtimeEvent(
    eventForUser(
      input.userId,
      'notification.created',
      input.entityId ?? notification.id,
      { notificationId: notification.id },
    ),
  );

  await sendPushToUser(input.userId, {
    title: input.title,
    body: input.pushBody ?? input.description,
    data: input.link ? { link: input.link } : undefined,
  });

  return notification;
}

export async function markNotificationsReadAndPublish(userId: string, notificationIds?: string[]) {
  await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
      ...(notificationIds?.length ? { id: { in: notificationIds } } : {}),
    },
    data: {
      read: true,
    },
  });

  emitRealtimeEvent(
    eventForUser(userId, 'notification.read', notificationIds?.[0] ?? userId),
  );
}
