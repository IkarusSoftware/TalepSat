import { prisma } from './prisma';
import { eventForUser, emitRealtimeEvent } from './realtime';
import { sendPushToUser } from './push';
import { sendNotificationEmailToUser, type UserEmailPreferenceKey } from './email';

type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  description: string;
  link?: string | null;
  entityId?: string;
  pushBody?: string;
  emailPreference?: UserEmailPreferenceKey | null;
  emailSubject?: string;
  emailCtaLabel?: string;
};

function getDefaultEmailPreference(type: string): UserEmailPreferenceKey | null {
  switch (type) {
    case 'offer_received':
      return 'emailNewOfferEnabled';
    case 'listing_expiry':
      return 'emailExpiryEnabled';
    case 'offer_accepted':
    case 'offer_rejected':
    case 'counter_offer':
    case 'offer_updated':
    case 'system':
      return 'emailStatusChangeEnabled';
    default:
      return null;
  }
}

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

  const emailPreference = input.emailPreference === undefined
    ? getDefaultEmailPreference(input.type)
    : input.emailPreference;

  await Promise.all([
    sendPushToUser(input.userId, {
      title: input.title,
      body: input.pushBody ?? input.description,
      data: input.link ? { link: input.link } : undefined,
    }),
    emailPreference
      ? sendNotificationEmailToUser({
          userId: input.userId,
          preferenceKey: emailPreference,
          subject: input.emailSubject ?? input.title,
          heading: input.title,
          body: input.description,
          ctaUrl: input.link ?? null,
          ctaLabel: input.emailCtaLabel,
        })
      : Promise.resolve(null),
  ]);

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
