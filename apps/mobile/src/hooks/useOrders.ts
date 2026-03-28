import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Order } from '../types';

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/api/orders');
      return data;
    },
  });
}
