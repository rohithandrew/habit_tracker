export type ScheduleType = 'daily' | 'weekdays' | 'x_per_week' | 'date_range' | 'single_day';

/** 0 = Sunday ... 6 = Saturday, matching JS Date#getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ScheduleData =
  | { type: 'daily' }
  | { type: 'weekdays'; days: Weekday[] }
  | { type: 'x_per_week'; timesPerWeek: number }
  | { type: 'date_range'; startDate: string; endDate: string }
  | { type: 'single_day'; date: string };

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_emoji: string;
  mood_tracking_enabled: boolean;
  period_tracking_enabled: boolean;
  timer_tracking_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  color_tag: string;
  schedule_type: ScheduleType;
  schedule_data: ScheduleData;
  reminder_time: string | null;
  archived: boolean;
  created_at: string;
}

export type HabitLogStatus = 'done' | 'skipped' | 'missed';

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  status: HabitLogStatus;
  completed_at: string | null;
}

export const HABIT_COLORS = [
  '#7C9DFF',
  '#7ED6A5',
  '#FFB86B',
  '#FF8FA3',
  '#C792EA',
  '#5FD0D6',
  '#F2C94C',
] as const;

export const HABIT_EMOJIS = [
  '✅', '💧', '📖', '🏃', '🧘', '🍎', '😴', '✍️', '🎯', '🎨', '🧹', '💪',
] as const;
