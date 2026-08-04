import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buildContributionMap, contributionLevel, toDateKey } from '@/lib/habits';
import { useSettings } from '@/lib/settings-context';
import type { HabitLog } from '@/lib/types';

const CELL_SIZE = 12;
const CELL_GAP = 3;
const WEEKS = 14;

// Okabe-Ito inspired blue -> orange sequential scale, safe for the common
// forms of color-blindness (unlike a green/red or purple-intensity-only scale).
const COLOR_BLIND_SCALE = ['#E0E0E0', '#A6CEE3', '#3E8DC4', '#F2A541', '#D9534F'] as const;

function buildColumns(weeks: number): Date[][] {
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
}: {
  logs: HabitLog[];
  onSelectDate: (dateKey: string) => void;
}) {
  const theme = useTheme();
  const { colorBlindPalette } = useSettings();
  const columns = useMemo(() => buildColumns(WEEKS), []);
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={styles.grid}>
        {columns.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.column}>
            {week.map((date) => {
              const key = toDateKey(date);
              const isFuture = key > todayKey;
              const level = contributionLevel(contributionMap.get(key) ?? 0);
              return (
                <Pressable
                  key={key}
                  disabled={isFuture}
                  onPress={() => onSelectDate(key)}
                  style={[
                    styles.cell,
                    { backgroundColor: isFuture ? 'transparent' : levelColors[level] },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
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
  scroll: { paddingVertical: Spacing.two },
  grid: { flexDirection: 'row', gap: CELL_GAP },
  column: { gap: CELL_GAP },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.two },
  legendCell: { width: CELL_SIZE, height: CELL_SIZE, borderRadius: 3 },
});
