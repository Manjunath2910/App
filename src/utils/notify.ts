// ─── Local daily-reminder notifications ───────────────────────────────────────
// Requires the native module: run `npx expo install expo-notifications` once.
import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }) as any,
});

// Turn the daily reminder ON. Returns false if the user denies permission.
export async function enableDailyReminder(hour = 8, minute = 0): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted) {
    const asked = await Notifications.requestPermissionsAsync();
    granted = asked.granted;
  }
  if (!granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Daily digest',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Mini Shorts',
      body: 'Your marketing digest is ready 🗞️',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'daily',
    } as any,
  });
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
