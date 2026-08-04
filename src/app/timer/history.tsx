import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarChart, type BarChartDatum } from '@/components/bar-chart';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/habits';
import { useAuth } from '@/lib/auth-context';
import { fetchSessionHistory } from '@/lib/timer-api';
import type { TimerSession } from '@/lib/types';

type Range = 7 | 30;

export default function TimerHistoryScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [range, setRange] = useState<Range>(7);
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 30);
    fetchSessionHistory(session.user.id, since)
      .then(setSessions)
      .catch((err) => Alert.alert('Could not load', err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [session]);

  const chartData: BarChartDatum[] = Array.from({ length: range }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (range - 1 - i));
    const key = toDateKey(d);
    const totalSeconds = sessions
      .filter((s) => toDateKey(new Date(s.started_at)) === key)
      .reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
    return {
      label: range === 7 ? d.toLocaleDateString(undefined, { weekday: 'narrow' }) : String(d.getDate()),
      value: Math.round(totalSeconds / 60),
    };
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.rangeRow}>
            {([7, 30] as Range[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={[
                  styles.rangeChip,
                  { backgroundColor: range === r ? theme.primary : theme.backgroundSelected },
                ]}>
                <ThemedText type="small" style={range === r ? { color: theme.onPrimary } : undefined}>
                  {r} days
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <Card>
            <ThemedText type="smallBold" style={{ marginBottom: Spacing.three }}>
              Minutes focused
            </ThemedText>
            <BarChart data={chartData} />
          </Card>

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            All sessions
          </ThemedText>
          <Card style={styles.card}>
            {loading ? (
              <ThemedText themeColor="textSecondary">Loading…</ThemedText>
            ) : sessions.length === 0 ? (
              <ThemedText themeColor="textSecondary">No sessions in the last 30 days.</ThemedText>
            ) : (
              sessions.map((s) => (
                <View key={s.id} style={styles.sessionRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {s.task_description}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {new Date(s.started_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </ThemedText>
                  </View>
                  <ThemedText themeColor="textSecondary">
                    {Math.round((s.duration_seconds ?? 0) / 60)} min
                  </ThemedText>
                </View>
              ))
            )}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  rangeRow: { flexDirection: 'row', gap: Spacing.two },
  rangeChip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.pill },
  sectionTitle: { marginTop: Spacing.two },
  card: { gap: Spacing.two },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000015',
  },
});
