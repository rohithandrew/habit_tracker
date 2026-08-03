import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  countDoneThisWeek,
  getWeekDates,
  isDateEligible,
  scheduleLabel,
  toDateKey,
} from '@/lib/habits';
import { computeCurrentStreak } from '@/lib/streaks';
import type { Habit, HabitLog } from '@/lib/types';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeeklyHabitRow({
  habit,
  logs,
  onToggleDay,
}: {
  habit: Habit;
  logs: HabitLog[];
  onToggleDay: (dateKey: string, currentlyDone: boolean) => void;
}) {
  const theme = useTheme();
  const weekDates = getWeekDates(new Date());
  const doneKeys = new Set(
    logs.filter((l) => l.habit_id === habit.id && l.status === 'done').map((l) => l.date)
  );
  const todayKey = toDateKey(new Date());

  const scheduleText =
    habit.schedule_type === 'x_per_week'
      ? `${countDoneThisWeek(habit, logs)}/${
          habit.schedule_data.type === 'x_per_week' ? habit.schedule_data.timesPerWeek : 0
        } this week`
      : scheduleLabel(habit.schedule_data);

  const streak = computeCurrentStreak(habit, logs);

  return (
    <Pressable
      onPress={() => router.push(`/habit/${habit.id}`)}
      style={[styles.row, { backgroundColor: theme.backgroundElement, shadowColor: theme.text }]}>
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
            {habit.title}
          </ThemedText>
          <ThemedText style={styles.icon}>{habit.emoji}</ThemedText>
          {streak > 0 ? (
            <ThemedText type="small" style={styles.streakBadge}>
              🔥{streak}
            </ThemedText>
          ) : null}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {scheduleText}
        </ThemedText>
      </View>

      <View style={styles.labels}>
        {WEEKDAY_LABELS.map((label) => (
          <ThemedText key={label} type="small" themeColor="textSecondary" style={styles.dayLabel}>
            {label}
          </ThemedText>
        ))}
      </View>

      <View style={styles.days}>
        {weekDates.map((date) => {
          const key = toDateKey(date);
          const eligible = isDateEligible(habit.schedule_data, date);
          const done = doneKeys.has(key);
          const isFuture = key > todayKey;
          return (
            <Pressable
              key={key}
              disabled={!eligible || isFuture}
              onPress={(e) => {
                e.stopPropagation();
                onToggleDay(key, done);
              }}
              style={[
                styles.dayCircle,
                {
                  backgroundColor: done ? theme.primary : 'transparent',
                  borderColor: done ? theme.primary : theme.border,
                  opacity: eligible ? 1 : 0.35,
                },
              ]}>
              {done ? <ThemedText style={styles.doneCheck}>✓</ThemedText> : null}
            </Pressable>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, marginRight: Spacing.two },
  title: { fontSize: 18, flexShrink: 1 },
  icon: { fontSize: 16 },
  streakBadge: { fontSize: 12 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.one },
  dayLabel: { width: 30, textAlign: 'center' },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCheck: { color: '#fff' },
});