import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import EventSource from 'react-native-sse';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/constants';
import type { RealtimeEventPayload } from '../../../../shared/realtime-events';

const conversationEventTypes = new Set(['message.created', 'conversation.updated', 'presence.updated']);
const notificationEventTypes = new Set(['notification.created', 'notification.read']);
const offerEventTypes = new Set(['offer.updated']);
const orderEventTypes = new Set(['order.updated']);
const subscriptionEventTypes = new Set(['subscription.updated']);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user?.id || !token) return;

    const source = new EventSource(`${API_URL}/api/events/stream`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const onUpdate = (event: { data?: string }) => {
      if (!event.data) return;

      try {
        const payload = JSON.parse(event.data) as RealtimeEventPayload;

        if (conversationEventTypes.has(payload.type)) {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
          queryClient.invalidateQueries({ queryKey: ['conversation-messages'] });
        }

        if (notificationEventTypes.has(payload.type)) {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        }

        if (offerEventTypes.has(payload.type)) {
          queryClient.invalidateQueries({ queryKey: ['offers'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }

        if (orderEventTypes.has(payload.type)) {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['offers'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }

        if (subscriptionEventTypes.has(payload.type)) {
          queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
          queryClient.invalidateQueries({ queryKey: ['seller-analytics'] });
          queryClient.invalidateQueries({ queryKey: ['plans'] });
          queryClient.invalidateQueries({ queryKey: ['auth-user'] });
        }
      } catch {
        // Keep the stream alive even if one payload is malformed.
      }
    };

    (source as any).addEventListener('update', onUpdate);

    return () => {
      (source as any).removeEventListener('update', onUpdate);
      source.close();
    };
  }, [queryClient, token, user?.id]);

  return <>{children}</>;
}
