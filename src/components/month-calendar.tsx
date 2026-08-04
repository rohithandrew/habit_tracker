import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/habits';

export type MonthCalendarProps = {
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  minDate?: string;
  maxDate?: string;
  /** Optional background tint per date, e.g. for period/fertile/predicted day coding. */
  dayColor?: (dateKey: string) => string | undefined;
  /** Optional small indicator dot per date, e.g. to mark days that have a task. */
  dayDot?: (dateKey: string) => string | undefined;
};

const WEEKDAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function MonthCalendar({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
  dayColor,
  dayDot,
}: MonthCalendarProps) {
  const theme = useTheme();
  const initial = selectedDate ? new Date(selectedDate) : new Date();
  const [viewDate, setViewDate] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setViewDate(new Date(year, month - 1, 1))}
          style={[styles.navButton, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold" style={styles.navArrow}>
            ‹
          </ThemedText>
        </Pressable>
        <ThemedText type="smallBold">{monthLabel}</ThemedText>
        <Pressable
          onPress={() => setViewDate(new Date(year, month + 1, 1))}
          style={[styles.navButton, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold" style={styles.navArrow}>
            ›
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_HEADERS.map((label) => (
          <ThemedText key={label} type="small" themeColor="textSecondary" style={styles.weekdayCell}>
            {label}
          </ThemedText>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={`empty-${i}`} style={styles.dayCell} />;
          const key = toDateKey(date);
          const isSelected = key === selectedDate;
          const isDisabled = (minDate ? key < minDate : false) || (maxDate ? key > maxDate : false);
          const tint = dayColor?.(key);
          const dot = dayDot?.(key);
          return (
            <View key={key} style={styles.dayCell}>
              <Pressable
                disabled={isDisabled}
                onPress={() => onSelectDate(key)}
                android_ripple={{ color: theme.backgroundSelected, radius: 16 }}
                style={[
                  styles.dayCircle,
                  tint ? { backgroundColor: tint } : isSelected ? { backgroundColor: theme.text } : null,
                ]}>
                <ThemedText
                  type="small"
                  style={[
                    styles.dayNumber,
                    isDisabled && { opacity: 0.3 },
                    (tint || isSelected) && { color: theme.background },
                  ]}>
                  {date.getDate()}
                </ThemedText>
              </Pressable>
              {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: { fontSize: 20, includeFontPadding: false, textAlignVertical: 'center' },
  weekRow: { flexDirection: 'row' },
  weekdayCell: { width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: { position: 'absolute', bottom: 2, width: 15, height: 4, borderRadius: 10 },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayNumber: { fontSize: 14, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
});
