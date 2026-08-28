import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/habits';
import { MOOD_COLORS } from '@/lib/types';

export interface MoodHistoryStripProps {
  days: number;
  entries: { date: string; mood: 1 | 2 | 3 | 4 | 5 }[];
}

export function MoodHistoryStrip({ days, entries }: MoodHistoryStripProps) {
  const theme = useTheme();
  const byDate = new Map(entries.map((e) => [e.date, e.mood]));

  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return toDateKey(d);
  });

  return (
    <View style={styles.row}>
      {cells.map((key) => {
        const mood = byDate.get(key);
        return (
          <View
            key={key}
            style={[
              styles.segment,
              { backgroundColor: mood ? MOOD_COLORS[mood] : theme.backgroundSelected },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, paddingVertical: Spacing.two },
  segment: { flex: 1, height: 32, borderRadius: 4 },
});
