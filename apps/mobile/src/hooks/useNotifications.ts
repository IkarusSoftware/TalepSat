import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Notification } from '../types';

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/api/notifications');
      return data;
    },
  });
}

export function useUnreadCount() {
  return useQuery<{ messages: number; notifications: number }>({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const { data } = await api.get('/api/unread-count');
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id?: string) => {
      const body = id ? { id } : { markAllRead: true };
      const { data } = await api.patch('/api/notifications', body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}
