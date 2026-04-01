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
      await api.post(`/api/listings/${listingId}/favorite`, { favorited: !favorited });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-ids'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useFavoriteIds() {
  return useQuery<string[]>({
    queryKey: ['favorite-ids'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/listings/favorites');
        return (res.data as Listing[]).map((listing) => listing.id);
      } catch {
        // Not authenticated or endpoint not available yet
        return [];
      }
    },
    staleTime: 60_000,
  });
}

export function useFavoriteListings(enabled = true) {
  return useQuery<Listing[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await api.get('/api/listings/favorites');
      return res.data;
    },
    enabled,
    staleTime: 30_000,
  });
}
