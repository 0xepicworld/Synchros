import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const MESSAGES = [
  'What did you notice today? Log a sign while it’s fresh.',
  'Any coincidences today? Even small ones count.',
  'A minute to look back: who or what showed up on time today?',
  'Your intentions are listening. Did anything answer today?',
];

/** Asks for permission if needed. Returns true when notifications are allowed. */
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<boolean> {
  const ok = await ensurePermission();
  if (!ok) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Synchros',
      body: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL,
    },
  });
  return true;
}

export async function cancelReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export const remindersSupported = true;
