import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { User, Review } from '../types';

export function useUserProfile(id: string) {
  return useQuery<User>({
    queryKey: ['user', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUserReviews(id: string) {
  return useQuery<Review[]>({
    queryKey: ['userReviews', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/users/${id}/reviews`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: any }) => {
      const { data } = await api.patch(`/api/users/${id}`, body);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['user', vars.id] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      const { data } = await api.post('/api/users/change-password', body);
      return data;
    },
  });
}
