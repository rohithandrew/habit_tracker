import type { Habit, HabitLog, ScheduleData, Weekday } from '@/lib/types';

/** Formats a Date as a local YYYY-MM-DD string (no timezone shifting like toISOString does). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Returns the Monday-Sunday dates of the week containing `date`. */
export function getWeekDates(date: Date): Date[] {
  const day = date.getDay(); // 0 = Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Su',
  1: 'Mo',
  2: 'Tu',
  3: 'We',
  4: 'Th',
  5: 'Fr',
  6: 'Sa',
};

export function weekdayLabel(day: Weekday): string {
  return WEEKDAY_LABELS[day];
}

/** Whether `date` falls within the habit's active schedule window (ignores day-of-week eligibility). */
export function isDateInScheduleWindow(schedule: ScheduleData, date: Date): boolean {
  const key = toDateKey(date);
  switch (schedule.type) {
    case 'daily':
    case 'weekdays':
    case 'x_per_week':
      return true;
    case 'single_day':
      return key === schedule.date;
    case 'date_range':
      return key >= schedule.startDate && key <= schedule.endDate;
  }
}

/** Whether `date` is a day the habit could be logged on (schedule window + day-of-week rule). */
export function isDateEligible(schedule: ScheduleData, date: Date): boolean {
  if (!isDateInScheduleWindow(schedule, date)) return false;
  if (schedule.type === 'weekdays') {
    return schedule.days.includes(date.getDay() as Weekday);
  }
  return true;
}

/** Human-readable schedule label, e.g. "Everyday", "Mo, We, Fr", "5x / week". */
export function scheduleLabel(schedule: ScheduleData): string {
  switch (schedule.type) {
    case 'daily':
      return 'Everyday';
    case 'weekdays':
      return schedule.days
        .slice()
        .sort((a, b) => a - b)
        .map((d) => weekdayLabel(d))
        .join(', ');
    case 'x_per_week':
      return `${schedule.timesPerWeek}x / week`;
    case 'single_day':
      return `Once — ${schedule.date}`;
    case 'date_range':
      return `${schedule.startDate} → ${schedule.endDate}`;
  }
}

/** Date-range / single-day habits auto-archive once their window has fully passed. */
export function isPastSchedule(schedule: ScheduleData, referenceDate: Date = today()): boolean {
  const key = toDateKey(referenceDate);
  if (schedule.type === 'single_day') return key > schedule.date;
  if (schedule.type === 'date_range') return key > schedule.endDate;
  return false;
}

export function isHabitEffectivelyArchived(habit: Habit): boolean {
  return habit.archived || isPastSchedule(habit.schedule_data);
}

export function countDoneThisWeek(habit: Habit, logs: HabitLog[], referenceDate: Date = today()): number {
  const weekDates = getWeekDates(referenceDate);
  const weekKeys = new Set(weekDates.map(toDateKey));
  return logs.filter(
    (log) => log.habit_id === habit.id && log.status === 'done' && weekKeys.has(log.date)
  ).length;
}

/** Aggregate done-count per day across all habits, for the contribution heatmap. */
export function buildContributionMap(logs: HabitLog[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const log of logs) {
    if (log.status !== 'done') continue;
    map.set(log.date, (map.get(log.date) ?? 0) + 1);
  }
  return map;
}

export function contributionLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}
