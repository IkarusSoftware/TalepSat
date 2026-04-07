'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { RealtimeEventPayload } from '../../../../shared/realtime-events';

const WINDOW_EVENT_NAME = 'talepsat:realtime';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const source = new EventSource('/api/events/stream');
    const onUpdate = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as RealtimeEventPayload;
        window.dispatchEvent(new CustomEvent(WINDOW_EVENT_NAME, { detail: payload }));
      } catch {
        // Ignore malformed events without breaking the stream.
      }
    };

    source.addEventListener('update', onUpdate as EventListener);

    return () => {
      source.removeEventListener('update', onUpdate as EventListener);
      source.close();
    };
  }, [session?.user?.id]);

  return <>{children}</>;
}

export const realtimeWindowEventName = WINDOW_EVENT_NAME;
