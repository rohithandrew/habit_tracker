import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Habit } from '@/lib/types';

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function parseTimeString(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

function habitReminderId(habitId: string): string {
  return `habit-reminder-${habitId}`;
}

export async function syncHabitReminder(habit: Habit): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(habitReminderId(habit.id)).catch(() => {});
  if (!habit.reminder_time) return;

  const { hour, minute } = parseTimeString(habit.reminder_time);
  await Notifications.scheduleNotificationAsync({
    identifier: habitReminderId(habit.id),
    content: {
      title: `${habit.emoji} ${habit.title}`,
      body: "Don't break the streak — log it when you're done.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelHabitReminder(habitId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(habitReminderId(habitId)).catch(() => {});
}

const MOOD_REMINDER_ID = 'mood-check-in-reminder';

export async function syncMoodReminder(time: string | null): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(MOOD_REMINDER_ID).catch(() => {});
  if (!time) return;

  const { hour, minute } = parseTimeString(time);
  await Notifications.scheduleNotificationAsync({
    identifier: MOOD_REMINDER_ID,
    content: {
      title: 'How are you feeling today?',
      body: 'Take a moment for a quick mood check-in.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

const WEEKLY_RECAP_ID = 'weekly-recap';

export async function syncWeeklyRecap(enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(WEEKLY_RECAP_ID).catch(() => {});
  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_RECAP_ID,
    content: {
      title: 'Your weekly recap is ready',
      body: 'See how your habits went this week.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 18,
      minute: 0,
    },
  });
}
