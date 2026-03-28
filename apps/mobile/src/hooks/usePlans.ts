import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Plan } from '../types';

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data } = await api.get('/api/plans');
      return data;
    },
  });
}
