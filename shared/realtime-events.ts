export type RealtimeEventType =
  | 'message.created'
  | 'conversation.updated'
  | 'notification.created'
  | 'notification.read'
  | 'offer.updated'
  | 'order.updated'
  | 'presence.updated'
  | 'subscription.updated';

export type RealtimeEventCounts = {
  messages?: number;
  notifications?: number;
};

export type RealtimeEventPayload = {
  type: RealtimeEventType;
  userId: string;
  entityId: string;
  conversationId?: string | null;
  notificationId?: string | null;
  counts?: RealtimeEventCounts;
  timestamp: string;
};
