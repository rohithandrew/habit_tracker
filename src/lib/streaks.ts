import { isDateEligible, toDateKey, today } from '@/lib/habits';
import type { Habit, HabitLog } from '@/lib/types';

export const STREAK_MILESTONES = [7, 30, 100] as const;

/**
 * Current streak counts consecutive *eligible* days that are done, walking
 * backwards from today. A day the habit wasn't scheduled on doesn't break it.
 */
export function computeCurrentStreak(habit: Habit, logs: HabitLog[]): number {
  const doneKeys = new Set(
    logs.filter((l) => l.habit_id === habit.id && l.status === 'done').map((l) => l.date)
  );

  let streak = 0;
  const cursor = today();
  const todayKey = toDateKey(cursor);

  // If today is eligible but not yet done, start counting from yesterday
  // instead of breaking the streak outright.
  if (isDateEligible(habit.schedule_data, cursor) && !doneKeys.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let i = 0; i < 3650; i++) {
    if (isDateEligible(habit.schedule_data, cursor)) {
      const key = toDateKey(cursor);
      if (doneKeys.has(key)) {
        streak++;
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function reachedMilestone(streak: number): number | null {
  return STREAK_MILESTONES.find((m) => m === streak) ?? null;
}
