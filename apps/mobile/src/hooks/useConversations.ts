import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Conversation, Message } from '../types';

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/api/conversations');
      return data;
    },
  });
}

export function useMessages(conversationId: string, enabled = true) {
  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/api/conversations/${conversationId}/messages`);
      return data;
    },
    enabled: !!conversationId && enabled,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, text }: { conversationId: string; text: string }) => {
      const { data } = await api.post(`/api/conversations/${conversationId}/messages`, { text });
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { participantId: string; listingId?: string; listingTitle?: string; message: string }) => {
      const { data } = await api.post('/api/conversations', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}
