import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface BarChartDatum {
  label: string;
  value: number;
}

export function BarChart({ data, formatValue }: { data: BarChartDatum[]; formatValue?: (v: number) => string }) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={styles.container}>
      {data.map((d, i) => {
        const heightPct = Math.max(4, (d.value / max) * 100);
        return (
          <View key={i} style={styles.column}>
            {d.value > 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.valueLabel}>
                {formatValue ? formatValue(d.value) : d.value}
              </ThemedText>
            ) : null}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${heightPct}%`,
                    backgroundColor: d.value > 0 ? theme.primary : theme.backgroundSelected,
                  },
                ]}
              />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {d.label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 160, gap: 6 },
  column: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 },
  valueLabel: { fontSize: 10 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: Radius.sm, minHeight: 4 },
});
