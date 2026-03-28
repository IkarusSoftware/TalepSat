import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Offer } from '../types';

export function useOffers(params?: { role?: string; status?: string; listingId?: string }) {
  return useQuery<Offer[]>({
    queryKey: ['offers', params],
    queryFn: async () => {
      const { data } = await api.get('/api/offers', { params });
      return data;
    },
  });
}

export function useOffer(id: string) {
  return useQuery<Offer>({
    queryKey: ['offer', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/offers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { listingId: string; price: number; deliveryDays: number; note?: string }) => {
      const { data } = await api.post('/api/offers', body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers'] });
      qc.invalidateQueries({ queryKey: ['listing'] });
    },
  });
}

export function useOfferAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; action: string; [key: string]: any }) => {
      const { data } = await api.patch(`/api/offers/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers'] });
      qc.invalidateQueries({ queryKey: ['offer'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
