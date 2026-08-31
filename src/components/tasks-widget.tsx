import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fromDateKey, getWeekDates, toDateKey } from '@/lib/habits';
import type { Task } from '@/lib/types';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TasksWidget({
  tasks,
  variant = 'home',
}: {
  tasks: Task[];
  /** 'home': compact week strip + 2-task preview, tap through to see the rest.
   * 'month': browse a month at a time, listing every task due in it. */
  variant?: 'home' | 'month';
}) {
  const theme = useTheme();
  const todayKey = toDateKey(new Date());
  const weekDates = getWeekDates(new Date());

  function firstTaskColorFor(dateKey: string): string | undefined {
    return tasks.find((t) => t.date === dateKey)?.color;
  }

  function taskDateLabel(t: Task): string {
    return fromDateKey(t.date).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  if (variant === 'month') {
    const now = new Date();
    const monthLabel = now.toLocaleDateString(undefined, { month: 'long' });

    const monthStart = toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = toDateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const monthTasks = tasks
      .filter((t) => t.date >= monthStart && t.date <= monthEnd)
      .sort((a, b) => a.date.localeCompare(b.date));

    return (
      <Pressable onPress={() => router.push('/tasks/all')}>
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {monthLabel}
            </ThemedText>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.arrow}>
              ›
            </ThemedText>
          </View>

          {monthTasks.length > 0 ? (
            <View style={styles.upcoming}>
              {monthTasks.slice(0, 2).map((t) => (
                <View key={t.id} style={[styles.taskRow, { backgroundColor: `${t.color}26` }]}>
                  <ThemedText style={{ flex: 1 }} numberOfLines={1}>
                    {t.text}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {taskDateLabel(t)}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText themeColor="textSecondary">No tasks this month.</ThemedText>
          )}
        </Card>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => router.push('/tasks/all')}>
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Tasks
          </ThemedText>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.arrow}>
            ›
          </ThemedText>
        </View>

        <View style={styles.weekRow}>
          {weekDates.map((date, i) => {
            const key = toDateKey(date);
            const isToday = key === todayKey;
            const dotColor = firstTaskColorFor(key);
            return (
              <View key={key} style={styles.dayCell}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.weekdayLabel}>
                  {WEEKDAY_LABELS[i]}
                </ThemedText>
                <View style={[styles.dayNumberWrap, isToday && { backgroundColor: theme.primary }]}>
                  <ThemedText
                    type="smallBold"
                    style={[styles.dayNumber, isToday && { color: theme.onPrimary }]}>
                    {date.getDate()}
                  </ThemedText>
                </View>
                <View style={[styles.dot, { backgroundColor: dotColor ?? 'transparent' }]} />
              </View>
            );
          })}
        </View>

        {tasks.length > 0 ? (
          <View style={styles.upcoming}>
            {tasks.slice(0, 2).map((t) => (
              // Alpha suffix on the task's own color for a light tinted row,
              // matching the reference image's pastel event backgrounds.
              <View key={t.id} style={[styles.taskRow, { backgroundColor: `${t.color}26` }]}>
                <ThemedText style={{ flex: 1 }} numberOfLines={1}>
                  {t.text}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {taskDateLabel(t)}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 20, includeFontPadding: false, textAlignVertical: 'center' },
  arrow: { fontSize: 22, includeFontPadding: false, textAlignVertical: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', gap: 4, width: 32 },
  weekdayLabel: { fontWeight: '400' },
  dayNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayNumber: { fontSize: 14, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  dot: { width: 15, height: 4, borderRadius: Radius.pill },
  upcoming: { gap: Spacing.two },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 13,
    borderRadius: Radius.md,
  },
});
