import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TimePickerProps = {
  /** 'HH:MM' 24-hour string. */
  value: string;
  onChange: (value: string) => void;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const theme = useTheme();
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr) || 0;
  const minute = Number(minuteStr) || 0;

  function setHour(h: number) {
    onChange(`${pad(((h % 24) + 24) % 24)}:${pad(minute)}`);
  }
  function setMinute(m: number) {
    onChange(`${pad(hour)}:${pad(((m % 60) + 60) % 60)}`);
  }
  function togglePeriod() {
    onChange(`${pad(hour < 12 ? hour + 12 : hour - 12)}:${pad(minute)}`);
  }

  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  return (
    <View style={styles.row}>
      <TimeStepper label="Hour" value={pad(displayHour)} onIncrement={() => setHour(hour + 1)} onDecrement={() => setHour(hour - 1)} />
      <ThemedText type="title" style={styles.colon}>
        :
      </ThemedText>
      <TimeStepper label="Min" value={pad(minute)} onIncrement={() => setMinute(minute + 5)} onDecrement={() => setMinute(minute - 5)} />
      <Pressable
        onPress={togglePeriod}
        style={[styles.periodBadge, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">{period}</ThemedText>
      </Pressable>
    </View>
  );
}

function TimeStepper({
  label,
  value,
  onIncrement,
  onDecrement,
}: {
  label: string;
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stepperGroup}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={onDecrement}
          style={[styles.stepperButton, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">−</ThemedText>
        </Pressable>
        <ThemedText type="title" style={styles.stepperValue}>
          {value}
        </ThemedText>
        <Pressable
          onPress={onIncrement}
          style={[styles.stepperButton, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  colon: { fontSize: 24, paddingBottom: Spacing.two },
  stepperGroup: { alignItems: 'center', gap: Spacing.two },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { fontSize: 22, minWidth: 36, textAlign: 'center' },
  periodBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    marginBottom: 2,
  },
});
