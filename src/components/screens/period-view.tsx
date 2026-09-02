import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DotsLoader } from '@/components/dots-loader';
import { MonthCalendar } from '@/components/month-calendar';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/habits';
import { classifyDay, predictFromLogs, type PeriodPrediction } from '@/lib/period';
import { fetchPeriodLogs, logPeriodStart } from '@/lib/period-api';
import type { PeriodLog } from '@/lib/types';

export function PeriodView({ userId, readOnly = false }: { userId: string; readOnly?: boolean }) {
  const theme = useTheme();

  const [logs, setLogs] = useState<PeriodLog[]>([]);
  const [prediction, setPrediction] = useState<PeriodPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchPeriodLogs(userId);
      setLogs(rows);
      setPrediction(predictFromLogs(rows));
    } catch (err) {
      Alert.alert('Could not load', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogPeriodStart() {
    if (readOnly) return;
    setLogging(true);
    try {
      const cycleLength = prediction?.averageCycleLength ?? 28;
      await logPeriodStart(userId, selectedDate, cycleLength, null);
      await load();
      Alert.alert('Logged', 'This cycle has been recorded.');
    } catch (err) {
      Alert.alert('Could not log', err instanceof Error ? err.message : String(err));
    } finally {
      setLogging(false);
    }
  }

  const dayKind = classifyDay(selectedDate, logs, prediction);

  return (
    <ScrollView style={styles.flexOne} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {!readOnly ? (
        <ThemedText type="small" themeColor="textSecondary">
          🔒 Private by default — only shared with friends you've explicitly turned this on for.
        </ThemedText>
      ) : null}

      {loading ? (
        <DotsLoader style={{ alignSelf: 'center', marginTop: Spacing.four }} />
      ) : !prediction ? (
        <Card style={styles.card}>
          <ThemedText themeColor="textSecondary">
            {readOnly
              ? 'No cycles logged yet.'
              : 'No cycles logged yet. Tap "Log period start" on the day it began to get your first prediction.'}
          </ThemedText>
        </Card>
      ) : (
        <>
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { flex: 1 }]}>
              <ThemedText type="title" style={styles.statNumber}>
                Day {prediction.currentCycleDay}
              </ThemedText>
              <ThemedText themeColor="textSecondary">of cycle</ThemedText>
            </Card>
            <Card style={[styles.statCard, { flex: 1 }]}>
              {prediction.isIrregular ? (
                <ThemedText type="title" style={styles.statNumberRange}>
                  {prediction.nextPeriodRangeStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {' – '}
                  {prediction.nextPeriodRangeEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </ThemedText>
              ) : (
                <ThemedText type="title" style={styles.statNumber}>
                  {prediction.nextPeriodStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </ThemedText>
              )}
              <ThemedText themeColor="textSecondary">next period (est.)</ThemedText>
            </Card>
          </View>

          {prediction.isIrregular ? (
            <Card style={[styles.card, { borderWidth: 1, borderColor: theme.border }]}>
              <ThemedText type="smallBold">Your cycles have been irregular</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Cycle length has varied by about ±{Math.round(prediction.cycleLengthStdDev)} days recently, so
                we're showing a range instead of one date. This can be normal, or worth mentioning to a
                doctor if it's new or comes with other symptoms (e.g. PCOS is a common cause of irregular
                cycles).
              </ThemedText>
            </Card>
          ) : null}
        </>
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
          <LegendDot color={theme.primary} label={prediction?.isIrregular ? 'Predicted range' : 'Predicted'} />
        </View>
        {dayKind ? (
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
            {selectedDate}:{' '}
            {dayKind === 'period' ? 'Period day' : dayKind === 'fertile' ? 'Fertile window' : 'Predicted period start'}
          </ThemedText>
        ) : null}
      </Card>

      {!readOnly ? (
        <Button label="Log period start on selected day" loading={logging} onPress={handleLogPeriodStart} />
      ) : null}

      {prediction && !prediction.isIrregular ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.footnote}>
          Based on the average of your last {Math.min(logs.length, 6)} cycle
          {logs.length === 1 ? '' : 's'} ({prediction.averageCycleLength}-day average). Predictions are
          estimates, not medical advice — irregular cycles will reduce accuracy.
        </ThemedText>
      ) : null}
    </ScrollView>
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
  flexOne: { flex: 1 },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  card: { gap: Spacing.two },
  statsRow: { flexDirection: 'row', gap: Spacing.three },
  statCard: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 20 },
  statNumberRange: { fontSize: 16 },
  legendRow: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.three, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: Radius.pill },
  footnote: { textAlign: 'center', paddingHorizontal: Spacing.three },
});
