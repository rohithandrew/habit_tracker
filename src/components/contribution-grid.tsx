import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buildContributionMap, contributionLevel, toDateKey } from '@/lib/habits';
import { useSettings } from '@/lib/settings-context';
import type { HabitLog } from '@/lib/types';

const CELL_GAP = 3;
const DEFAULT_WEEKS = 14;

// Okabe-Ito inspired blue -> orange sequential scale, safe for the common
// forms of color-blindness (unlike a green/red or purple-intensity-only scale).
const COLOR_BLIND_SCALE = ['#E0E0E0', '#A6CEE3', '#3E8DC4', '#F2A541', '#D9534F'] as const;

export function buildColumns(weeks: number): Date[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());

  const firstWeekStart = new Date(currentWeekStart);
  firstWeekStart.setDate(currentWeekStart.getDate() - (weeks - 1) * 7);

  return Array.from({ length: weeks }, (_, week) => {
    const weekStart = new Date(firstWeekStart);
    weekStart.setDate(firstWeekStart.getDate() + week * 7);
    return Array.from({ length: 7 }, (_, day) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + day);
      return d;
    });
  });
}

export function ContributionGrid({
  logs,
  onSelectDate,
  weeks = DEFAULT_WEEKS,
  /** A single habit can only be done 0 or 1 times a day, so a 5-step intensity scale never
   * moves past "barely done" — this switches to a plain done/not-done green instead. */
  binary = false,
}: {
  logs: HabitLog[];
  onSelectDate: (dateKey: string) => void;
  weeks?: number;
  binary?: boolean;
}) {
  const theme = useTheme();
  const { colorBlindPalette } = useSettings();
  const columns = useMemo(() => buildColumns(weeks), [weeks]);
  const contributionMap = useMemo(() => buildContributionMap(logs), [logs]);
  const todayKey = toDateKey(new Date());

  const levelColors: Record<0 | 1 | 2 | 3 | 4, string> = colorBlindPalette
    ? {
        0: theme.backgroundSelected,
        1: COLOR_BLIND_SCALE[1],
        2: COLOR_BLIND_SCALE[2],
        3: COLOR_BLIND_SCALE[3],
        4: COLOR_BLIND_SCALE[4],
      }
    : {
        0: theme.backgroundSelected,
        1: '#EEF7C4',
        2: '#DCEB8C',
        3: theme.primary,
        4: '#4B7F3D',
      };

  return (
    <View style={styles.grid}>
      {columns.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.column}>
          {week.map((date) => {
            const key = toDateKey(date);
            const isFuture = key > todayKey;
            const count = contributionMap.get(key) ?? 0;
            const cellColor = binary
              ? count > 0
                ? theme.primary
                : theme.backgroundSelected
              : levelColors[contributionLevel(count)];
            return (
              <Pressable
                key={key}
                disabled={isFuture}
                onPress={() => onSelectDate(key)}
                style={[styles.cell, { backgroundColor: isFuture ? 'transparent' : cellColor }]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function ContributionLegend() {
  const theme = useTheme();
  const { colorBlindPalette } = useSettings();
  const levelColors = colorBlindPalette
    ? [theme.backgroundSelected, ...COLOR_BLIND_SCALE.slice(1)]
    : [theme.backgroundSelected, '#EEF7C4', '#DCEB8C', theme.primary, '#4B7F3D'];
  return (
    <View style={styles.legend}>
      <ThemedText type="small" themeColor="textSecondary">
        Less
      </ThemedText>
      {levelColors.map((color, i) => (
        <View key={i} style={[styles.legendCell, { backgroundColor: color }]} />
      ))}
      <ThemedText type="small" themeColor="textSecondary">
        More
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: CELL_GAP },
  column: { flex: 1, gap: CELL_GAP },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.two },
  legendCell: { width: 12, height: 12, borderRadius: 3 },
});
