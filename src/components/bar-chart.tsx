import { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface BarChartDatum {
  label: string;
  value: number;
}

const MIN_COLUMN_WIDTH = 34;
const COLUMN_GAP = 6;
const SCROLL_THRESHOLD = 10;

export function BarChart({ data, formatValue }: { data: BarChartDatum[]; formatValue?: (v: number) => string }) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const needsScroll = data.length > SCROLL_THRESHOLD;

  const columns = (
    <View
      style={[
        styles.container,
        needsScroll && {
          width: data.length * MIN_COLUMN_WIDTH + (data.length - 1) * COLUMN_GAP,
        },
      ]}>
      {data.map((d, i) => {
        const heightPct = Math.max(4, (d.value / max) * 100);
        // The generator always appends today as the last entry, so this is a
        // reliable "you are here" anchor without threading an extra field through.
        const isToday = i === data.length - 1;
        return (
          <View key={i} style={[styles.column, needsScroll && styles.fixedColumn]}>
            {d.value > 0 ? (
              <ThemedText
                type="small"
                themeColor="textSecondary"
                numberOfLines={1}
                style={styles.valueLabel}>
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
            <ThemedText
              type="small"
              themeColor={isToday ? 'accent' : 'textSecondary'}
              numberOfLines={1}
              style={[styles.axisLabel, isToday && styles.axisLabelToday]}>
              {d.label}
            </ThemedText>
            {isToday ? <View style={[styles.todayDot, { backgroundColor: theme.accent }]} /> : null}
          </View>
        );
      })}
    </View>
  );

  if (!needsScroll) return columns;

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
      {columns}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 160, gap: COLUMN_GAP },
  column: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 },
  fixedColumn: { flex: undefined, width: MIN_COLUMN_WIDTH },
  valueLabel: { fontSize: 10 },
  axisLabel: { fontSize: 10 },
  axisLabelToday: { fontWeight: '700' },
  todayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000015',
  },
  bar: { width: '100%', borderTopLeftRadius: Radius.sm, borderTopRightRadius: Radius.sm, minHeight: 4 },
});
