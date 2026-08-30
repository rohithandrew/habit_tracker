import type { MaterialCommunityIcons } from '@expo/vector-icons';

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
  todo_enabled: boolean;
  onboarding_completed: boolean;
  weekly_recap_enabled: boolean;
  mood_reminder_time: string | null;
  /** IST 'HH:MM' — when set, remind about any not-yet-done habits at this time. */
  habit_reminder_time: string | null;
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

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at: string | null;
}

export interface FriendPermission {
  id: string;
  owner_id: string;
  friend_id: string;
  can_view_habits: boolean;
  can_view_timer: boolean;
  can_view_mood: boolean;
  can_comment: boolean;
}

export interface PublicProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_emoji: string;
}

export interface TimerSession {
  id: string;
  user_id: string;
  task_description: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  is_active: boolean;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  note: string | null;
  created_at: string;
}

export interface PeriodLog {
  id: string;
  user_id: string;
  cycle_start_date: string;
  cycle_length_days: number;
  period_length_days: number | null;
  notes: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  date: string;
  text: string;
  color: string;
  created_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  text: string;
  done: boolean;
  created_at: string;
}

export type StickyNoteTargetType = 'habit_grid' | 'timer_session' | 'mood_calendar';

export interface StickyNote {
  id: string;
  author_id: string;
  owner_id: string;
  target_type: StickyNoteTargetType;
  target_id: string | null;
  position_x: number;
  position_y: number;
  color: string;
  text: string;
  read: boolean;
  created_at: string;
}

export const MOOD_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Rough',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

export const MOOD_ICONS: Record<1 | 2 | 3 | 4 | 5, keyof typeof MaterialCommunityIcons.glyphMap> = {
  1: 'emoticon-cry-outline',
  2: 'emoticon-sad-outline',
  3: 'emoticon-neutral-outline',
  4: 'emoticon-happy-outline',
  5: 'emoticon-excited-outline',
};

export const MOOD_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#FF6B81',
  2: '#FF9E7D',
  3: '#F2C94C',
  4: '#7ED6A5',
  5: '#4CAF82',
};

export const STICKY_NOTE_COLORS = ['#FFE58A', '#FFB8C6', '#B8E0FF', '#C9F2C9', '#E0C9FF'] as const;

export const HABIT_COLORS = [
  '#7C9DFF',
  '#7ED6A5',
  '#FFB86B',
  '#FF8FA3',
  '#C792EA',
  '#5FD0D6',
  '#F2C94C',
] as const;

export const TASK_COLORS = HABIT_COLORS;

export const HABIT_EMOJIS = [
  '✅', '💧', '📖', '🏃', '🧘', '🍎', '😴', '✍️', '🎯', '🎨', '🧹', '💪',
] as const;
