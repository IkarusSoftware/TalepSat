import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { syncPushPreference } from '../lib/push';

export function PushProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user?.id) return;

    syncPushPreference().catch(() => {
      // Push registration should never block the app boot flow.
    });
  }, [loading, user?.id]);

  return <>{children}</>;
}
