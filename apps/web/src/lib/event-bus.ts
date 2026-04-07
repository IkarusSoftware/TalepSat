import type { RealtimeEventPayload } from '../../../../shared/realtime-events';

type Listener = (event: RealtimeEventPayload) => void;

const listenersByUser = new Map<string, Map<string, Listener>>();
const MAX_SUBSCRIPTIONS_PER_USER = 5;
const MAX_SUBSCRIPTIONS_GLOBAL = 2000;

function ensureUserBucket(userId: string) {
  if (!listenersByUser.has(userId)) {
    listenersByUser.set(userId, new Map());
  }

  return listenersByUser.get(userId)!;
}

function getGlobalSubscriptionCount() {
  let count = 0;
  for (const bucket of listenersByUser.values()) {
    count += bucket.size;
  }
  return count;
}

export function canSubscribeUserEvents(userId: string) {
  const bucket = listenersByUser.get(userId);
  return (bucket?.size || 0) < MAX_SUBSCRIPTIONS_PER_USER && getGlobalSubscriptionCount() < MAX_SUBSCRIPTIONS_GLOBAL;
}

export function subscribeUserEvents(userId: string, subscriptionId: string, listener: Listener) {
  const bucket = ensureUserBucket(userId);
  if (bucket.size >= MAX_SUBSCRIPTIONS_PER_USER || getGlobalSubscriptionCount() >= MAX_SUBSCRIPTIONS_GLOBAL) {
    return null;
  }

  bucket.set(subscriptionId, listener);

  return () => {
    const currentBucket = listenersByUser.get(userId);
    if (!currentBucket) return;

    currentBucket.delete(subscriptionId);
    if (currentBucket.size === 0) {
      listenersByUser.delete(userId);
    }
  };
}

export function publishRealtimeEvent(event: RealtimeEventPayload) {
  const bucket = listenersByUser.get(event.userId);
  if (!bucket) return;

  for (const listener of bucket.values()) {
    try {
      listener(event);
    } catch {
      // Keep other listeners alive when one subscriber misbehaves.
    }
  }
}

export function publishRealtimeEvents(events: RealtimeEventPayload[]) {
  for (const event of events) {
    publishRealtimeEvent(event);
  }
}
