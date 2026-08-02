import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ScheduleType } from '@/lib/types';

const OPTIONS: { type: ScheduleType; label: string }[] = [
  { type: 'daily', label: 'Every day' },
  { type: 'weekdays', label: 'Weekdays' },
  { type: 'x_per_week', label: 'X / week' },
  { type: 'single_day', label: 'Single day' },
  { type: 'date_range', label: 'Date range' },
];

export function ScheduleTypePicker({
  value,
  onChange,
}: {
  value: ScheduleType;
  onChange: (type: ScheduleType) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = option.type === value;
        return (
          <Pressable
            key={option.type}
            onPress={() => onChange(option.type)}
            style={[
              styles.chip,
              { backgroundColor: selected ? theme.primary : theme.backgroundSelected },
            ]}>
            <ThemedText type="small" style={selected ? { color: '#fff' } : undefined}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
});
