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
};

const WEEKDAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function MonthCalendar({ selectedDate, onSelectDate, minDate, maxDate, dayColor }: MonthCalendarProps) {
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
          <ThemedText type="smallBold">‹</ThemedText>
        </Pressable>
        <ThemedText type="smallBold">{monthLabel}</ThemedText>
        <Pressable
          onPress={() => setViewDate(new Date(year, month + 1, 1))}
          style={[styles.navButton, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">›</ThemedText>
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
          return (
            <Pressable
              key={key}
              disabled={isDisabled}
              onPress={() => onSelectDate(key)}
              style={[
                styles.dayCell,
                styles.dayCellButton,
                tint && { backgroundColor: tint },
                isSelected && { borderWidth: 2, borderColor: theme.text },
              ]}>
              <ThemedText type="small" style={[isDisabled && { opacity: 0.3 }, tint && { color: '#fff' }]}>
                {date.getDate()}
              </ThemedText>
            </Pressable>
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
  weekRow: { flexDirection: 'row' },
  weekdayCell: { width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCellButton: { borderRadius: Radius.pill },
});
