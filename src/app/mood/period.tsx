import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DotsLoader } from '@/components/dots-loader';
import { MonthCalendar } from '@/components/month-calendar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/habits';
import { useAuth } from '@/lib/auth-context';
import { fetchPeriodLogs, logPeriodStart } from '@/lib/period-api';
import { classifyDay, predictFromLogs, type PeriodPrediction } from '@/lib/period';
import type { PeriodLog } from '@/lib/types';

export default function PeriodCalculatorScreen() {
  const theme = useTheme();
  const { session, profile } = useAuth();

  const [logs, setLogs] = useState<PeriodLog[]>([]);
  const [prediction, setPrediction] = useState<PeriodPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const rows = await fetchPeriodLogs(session.user.id);
      setLogs(rows);
      setPrediction(predictFromLogs(rows));
    } catch (err) {
      Alert.alert('Could not load', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogPeriodStart() {
    if (!session) return;
    setLogging(true);
    try {
      const cycleLength = prediction?.averageCycleLength ?? 28;
      await logPeriodStart(session.user.id, selectedDate, cycleLength, null);
      await load();
      Alert.alert('Logged', 'This cycle has been recorded.');
    } catch (err) {
      Alert.alert('Could not log', err instanceof Error ? err.message : String(err));
    } finally {
      setLogging(false);
    }
  }

  const dayKind = classifyDay(selectedDate, logs, prediction);

  if (profile && !profile.period_tracking_enabled) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <ThemedText themeColor="textSecondary">Period tracking is off.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="small" themeColor="textSecondary">
            🔒 Private — never shared with friends, under any setting.
          </ThemedText>

          {loading ? (
            <DotsLoader style={{ alignSelf: 'center', marginTop: Spacing.four }} />
          ) : !prediction ? (
            <Card style={styles.card}>
              <ThemedText themeColor="textSecondary">
                No cycles logged yet. Tap "Log period start" on the day it began to get your first
                prediction.
              </ThemedText>
            </Card>
          ) : (
            <View style={styles.statsRow}>
              <Card style={[styles.statCard, { flex: 1 }]}>
                <ThemedText type="title" style={styles.statNumber}>
                  Day {prediction.currentCycleDay}
                </ThemedText>
                <ThemedText themeColor="textSecondary">of cycle</ThemedText>
              </Card>
              <Card style={[styles.statCard, { flex: 1 }]}>
                <ThemedText type="title" style={styles.statNumber}>
                  {prediction.nextPeriodStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </ThemedText>
                <ThemedText themeColor="textSecondary">next period (est.)</ThemedText>
              </Card>
            </View>
          )}

          <Card>
            <ThemedText type="sectionTitle" style={{ marginBottom: Spacing.two }}>
              Calendar
            </ThemedText>
            <MonthCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              dayColor={(key) => {
                const kind = classifyDay(key, logs, prediction);
                if (kind === 'period') return theme.danger;
                if (kind === 'fertile') return '#7ED6A5';
                if (kind === 'predicted') return theme.primary;
                return undefined;
              }}
            />
            <View style={styles.legendRow}>
              <LegendDot color={theme.danger} label="Period" />
              <LegendDot color="#7ED6A5" label="Fertile" />
              <LegendDot color={theme.primary} label="Predicted" />
            </View>
            {dayKind ? (
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
                {selectedDate}:{' '}
                {dayKind === 'period' ? 'Period day' : dayKind === 'fertile' ? 'Fertile window' : 'Predicted period start'}
              </ThemedText>
            ) : null}
          </Card>

          <Button label="Log period start on selected day" loading={logging} onPress={handleLogPeriodStart} />

          {prediction ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.footnote}>
              Based on the average of your last {Math.min(logs.length, 6)} cycle
              {logs.length === 1 ? '' : 's'} ({prediction.averageCycleLength}-day average). Predictions
              are estimates, not medical advice — irregular cycles will reduce accuracy.
            </ThemedText>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
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
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  card: { gap: Spacing.two },
  statsRow: { flexDirection: 'row', gap: Spacing.three },
  statCard: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 20 },
  legendRow: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.three, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: Radius.pill },
  footnote: { textAlign: 'center', paddingHorizontal: Spacing.three },
});
