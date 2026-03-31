import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  badge: string | null;
  verified: boolean;
  image: string | null;
  city: string | null;
  bio: string | null;
  score: number;
  completedDeals: number;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'both';
};

type RegisterResult = {
  requiresVerification: boolean;
  message?: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('auth_token');
      const storedUser = await SecureStore.getItemAsync('auth_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {}
    setLoading(false);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/api/mobile/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    await SecureStore.setItemAsync('auth_token', newToken);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api.post('/api/mobile/auth/register', data);
    const { token: newToken, user: newUser, requiresVerification, message } = res.data;

    if (!newToken || !newUser) {
      return {
        requiresVerification: Boolean(requiresVerification),
        message,
      };
    }

    await SecureStore.setItemAsync('auth_token', newToken);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return { requiresVerification: false };
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/api/mobile/auth/me');
      const updated = res.data;
      setUser(updated);
      await SecureStore.setItemAsync('auth_user', JSON.stringify(updated));
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
