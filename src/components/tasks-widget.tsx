import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fromDateKey, getWeekDates, toDateKey } from '@/lib/habits';
import type { Task } from '@/lib/types';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TasksWidget({ tasks }: { tasks: Task[] }) {
  const theme = useTheme();
  const todayKey = toDateKey(new Date());
  const weekDates = getWeekDates(new Date());

  function firstTaskColorFor(dateKey: string): string | undefined {
    return tasks.find((t) => t.date === dateKey)?.color;
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
                <ThemedText type="small" themeColor="textSecondary">
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
            <ThemedText type="small" themeColor="textSecondary">
              Upcoming
            </ThemedText>
            {tasks.slice(0, 3).map((t) => (
              <View key={t.id} style={styles.taskRow}>
                <View style={[styles.taskBar, { backgroundColor: t.color }]} />
                <ThemedText style={{ flex: 1 }} numberOfLines={1}>
                  {t.text}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {fromDateKey(t.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
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
  dayNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayNumber: { fontSize: 14, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  dot: { width: 15, height: 4, borderRadius: 10 },
  upcoming: { gap: Spacing.two },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  taskBar: { width: 4, height: 16, borderRadius: 2 },
});
