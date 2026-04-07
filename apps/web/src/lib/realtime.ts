import type { RealtimeEventPayload, RealtimeEventType } from '../../../../shared/realtime-events';
import { publishRealtimeEvent, publishRealtimeEvents } from './event-bus';

type EventInput = Omit<RealtimeEventPayload, 'timestamp'>;

export function emitRealtimeEvent(input: EventInput) {
  publishRealtimeEvent({
    ...input,
    timestamp: new Date().toISOString(),
  });
}

export function emitRealtimeEvents(inputs: EventInput[]) {
  publishRealtimeEvents(
    inputs.map((input) => ({
      ...input,
      timestamp: new Date().toISOString(),
    })),
  );
}

export function eventForUser(
  userId: string,
  type: RealtimeEventType,
  entityId: string,
  extra: Omit<Partial<RealtimeEventPayload>, 'type' | 'userId' | 'entityId' | 'timestamp'> = {},
): EventInput {
  return {
    userId,
    type,
    entityId,
    ...extra,
  };
}
