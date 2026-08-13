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
      style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
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
        <ThemedText type="small" themeColor="textSecondary" style={styles.scheduleText}>
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
              {done ? <ThemedText style={{ color: theme.onPrimary }}>✓</ThemedText> : null}
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
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, marginRight: Spacing.two },
  title: { fontSize: 18, fontWeight: 'medium', flexShrink: 1 },
  icon: { fontSize: 16 },
  streakBadge: { fontSize: 12 },
  scheduleText: { fontWeight: '500', fontSize: 14 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.one },
  dayLabel: { width: 30, textAlign: 'center', fontSize: 14, fontWeight: '400' },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -Spacing.one },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});