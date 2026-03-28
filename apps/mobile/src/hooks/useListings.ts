import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Listing } from '../types';

type SortOption = 'newest' | 'budget_desc' | 'most_offers';

interface UseListingsParams {
  search?: string;
  category?: string | null;
  sort?: SortOption;
}

const sortParamMap: Record<SortOption, string> = {
  newest: '-createdAt',
  budget_desc: '-budgetMax',
  most_offers: '-offerCount',
};

export function useListings({ search, category, sort = 'newest' }: UseListingsParams = {}) {
  return useQuery<Listing[]>({
    queryKey: ['listings', search, category, sort],
    queryFn: async () => {
      const params: Record<string, string> = { status: 'active' };
      if (search) params.search = search;
      if (category) params.category = category;
      params.sort = sortParamMap[sort];
      const res = await api.get('/api/listings', { params });
      return res.data;
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, favorited }: { listingId: string; favorited: boolean }) => {
      if (favorited) {
        await api.delete(`/api/favorites/${listingId}`);
      } else {
        await api.post(`/api/favorites/${listingId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useFavoriteIds() {
  return useQuery<string[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/favorites');
        return (res.data as any[]).map((f: any) => f.listingId ?? f.id);
      } catch {
        // Not authenticated or endpoint not available yet
        return [];
      }
    },
    staleTime: 60_000,
  });
}
