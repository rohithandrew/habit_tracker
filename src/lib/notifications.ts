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

const HABITS_REMINDER_ID = 'habits-daily-reminder';
// IST has a fixed +5:30 offset with no DST, so it can be handled as a constant
// rather than pulling in a full timezone library.
const IST_OFFSET_MIN = 5.5 * 60;

/** Next UTC instant matching `time` (a 24h "HH:MM" string) read as IST wall-clock time,
 * today if it hasn't passed yet, otherwise tomorrow. */
function nextIstOccurrence(time: string): Date {
  const { hour, minute } = parseTimeString(time);
  const now = new Date();
  const nowIst = new Date(now.getTime() + IST_OFFSET_MIN * 60000);
  const y = nowIst.getUTCFullYear();
  const m = nowIst.getUTCMonth();
  const d = nowIst.getUTCDate();
  let targetMs = Date.UTC(y, m, d, hour, minute) - IST_OFFSET_MIN * 60000;
  if (targetMs <= now.getTime()) targetMs += 24 * 60 * 60 * 1000;
  return new Date(targetMs);
}

/**
 * A single reminder covering every habit, not per-habit like `syncHabitReminder`.
 * `time` is an IST "HH:MM" wall-clock time; pass `allDoneToday: true` to skip
 * scheduling entirely since there'd be nothing left to remind about. Only ever
 * schedules the next single occurrence — call again (e.g. whenever the Home
 * screen loads) to keep it rolling forward and re-evaluate completion state.
 */
export async function syncHabitsReminder(time: string | null, allDoneToday: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(HABITS_REMINDER_ID).catch(() => {});
  if (!time || allDoneToday) return;

  await Notifications.scheduleNotificationAsync({
    identifier: HABITS_REMINDER_ID,
    content: {
      title: 'Habit reminder',
      body: "You still have habits to complete today — don't break the streak!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextIstOccurrence(time),
    },
  });
}
