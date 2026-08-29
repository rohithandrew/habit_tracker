import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/habits';
import { MOOD_COLORS } from '@/lib/types';

export interface MoodHistoryStripProps {
  days: number;
  entries: { date: string; mood: 1 | 2 | 3 | 4 | 5 }[];
  selectedDate?: string;
  onSelectDate?: (dateKey: string) => void;
}

const MIN_SEGMENT_WIDTH = 10;
const SEGMENT_GAP = 4;
const SCROLL_THRESHOLD = 15;

export function MoodHistoryStrip({ days, entries, selectedDate, onSelectDate }: MoodHistoryStripProps) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const byDate = new Map(entries.map((e) => [e.date, e.mood]));
  const needsScroll = days > SCROLL_THRESHOLD;

  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return toDateKey(d);
  });

  const row = (
    <View
      style={[
        styles.row,
        needsScroll && { width: days * MIN_SEGMENT_WIDTH + (days - 1) * SEGMENT_GAP },
      ]}>
      {cells.map((key) => {
        const mood = byDate.get(key);
        const isSelected = key === selectedDate;
        const Segment = onSelectDate ? Pressable : View;
        return (
          <Segment
            key={key}
            {...(onSelectDate ? { onPress: () => onSelectDate(key), hitSlop: 4 } : null)}
            style={[styles.column, needsScroll && styles.fixedColumn]}>
            {isSelected ? <View style={[styles.dot, { backgroundColor: theme.accent }]} /> : null}
            <View
              style={[
                styles.segment,
                { backgroundColor: mood ? MOOD_COLORS[mood] : theme.backgroundSelected },
              ]}
            />
          </Segment>
        );
      })}
    </View>
  );

  if (!needsScroll) return row;

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
      {row}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SEGMENT_GAP, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  column: { flex: 1, position: 'relative' },
  fixedColumn: { flex: undefined, width: MIN_SEGMENT_WIDTH },
  dot: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  segment: { height: 32, borderRadius: 4 },
});
