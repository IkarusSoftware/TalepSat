import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import api from './api';

const PUSH_PREFS_KEY = 'talepsat_notif_prefs';
const PUSH_TOKEN_KEY = 'expo_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type StoredNotificationPrefs = {
  push?: boolean;
};

async function readPushPreference() {
  try {
    const raw = await SecureStore.getItemAsync(PUSH_PREFS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as StoredNotificationPrefs;
    return Boolean(parsed.push);
  } catch {
    return false;
  }
}

function getProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    undefined
  );
}

export async function unregisterStoredPushToken() {
  const storedToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  if (!storedToken) return;

  try {
    await api.delete('/api/mobile/push-tokens', {
      data: { expoPushToken: storedToken },
    });
  } catch {
    // Logout should still succeed even if unregistering the device fails.
  } finally {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  }
}

export async function syncPushPreference(forceEnabled?: boolean) {
  const pushEnabled = typeof forceEnabled === 'boolean' ? forceEnabled : await readPushPreference();

  await api.patch('/api/users/preferences', {
    push: pushEnabled,
  }).catch(() => {});

  if (!pushEnabled) {
    await unregisterStoredPushToken();
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  let permissionStatus = existing.status;

  if (permissionStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    permissionStatus = requested.status;
  }

  if (permissionStatus !== 'granted') {
    return null;
  }

  const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  await api.post('/api/mobile/push-tokens', {
    expoPushToken,
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version || Constants.nativeAppVersion || null,
    enabled: true,
  });

  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, expoPushToken);
  return expoPushToken;
}
