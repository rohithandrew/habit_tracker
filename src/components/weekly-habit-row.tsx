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

const WEEKDAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
      style={[styles.row, { borderColor: theme.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: `${habit.color_tag}33` }]}>
        <ThemedText style={styles.icon}>{habit.emoji}</ThemedText>
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <ThemedText type="smallBold" numberOfLines={1} style={{ flexShrink: 1 }}>
            {habit.title}
          </ThemedText>
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

      <View style={styles.days}>
        {weekDates.map((date, i) => {
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
                  backgroundColor: done ? habit.color_tag : theme.background,
                  borderColor: eligible ? habit.color_tag : theme.border,
                  opacity: eligible ? 1 : 0.35,
                },
              ]}>
              <ThemedText type="small" style={done ? styles.doneCheck : undefined}>
                {done ? '✓' : WEEKDAY_HEADERS[i]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  info: { flex: 1, gap: 2, minWidth: 90 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakBadge: { fontSize: 12 },
  days: { flexDirection: 'row', gap: 4 },
  dayCircle: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCheck: { color: '#fff' },
});
