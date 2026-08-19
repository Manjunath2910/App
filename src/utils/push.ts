// ─── Push registration ────────────────────────────────────────────────────────
// Gets this device's Expo push token and registers it with the push-server so it
// can receive "new blog / news" notifications. No-ops safely in Expo Go / web or
// until PUSH_SERVER is set. Needs a dev build + expo-notifications.
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ▶ After you deploy /push-server, paste its public URL here (e.g. Render URL).
export const PUSH_SERVER: string = '';

export async function registerForPush(): Promise<void> {
  try {
    if (Platform.OS === 'web' || !PUSH_SERVER) return;

    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      (Constants.expoConfig as any)?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
    const tokenRes = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = tokenRes?.data;
    if (!token) return;

    await fetch(`${PUSH_SERVER.replace(/\/$/, '')}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => {});
  } catch {
    // ignore — push is best-effort
  }
}
