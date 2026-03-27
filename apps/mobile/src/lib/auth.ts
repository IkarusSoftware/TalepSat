import * as SecureStore from 'expo-secure-store';
import axios from './axios';

const TOKEN_KEY = 'talepsat_token';
const USER_KEY = 'talepsat_user';

export async function login(email: string, password: string) {
  const res = await axios.post('/api/mobile/auth/login', { email, password });
  const { token, user } = res.data;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  return user;
}

export async function logout() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getStoredUser() {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
