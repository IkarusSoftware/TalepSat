import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { QueryKey, useQueryClient } from '@tanstack/react-query';

export function useRefreshOnFocus(queryKey: QueryKey) {
  const qc = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey });
    }, [queryKey])
  );
}
