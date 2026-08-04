import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/habits';
import { useAuth } from '@/lib/auth-context';
import { fetchActiveSession, fetchSessionHistory, startSession, stopSession } from '@/lib/timer-api';
import type { TimerSession } from '@/lib/types';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TimerScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { session } = useAuth();

  const [activeSession, setActiveSession] = useState<TimerSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<TimerSession[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const [active, history] = await Promise.all([
        fetchActiveSession(session.user.id),
        fetchSessionHistory(session.user.id, since),
      ]);
      setActiveSession(active);
      setRecentSessions(history.slice(0, 5));
    } catch (err) {
      Alert.alert('Could not load timer', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => load());
    return unsubscribe;
  }, [navigation, load]);

  useEffect(() => {
    if (!activeSession) return;
    const started = new Date(activeSession.started_at).getTime();
    const tick = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  async function handleStart() {
    if (!session || !taskInput.trim()) return;
    setStarting(true);
    try {
      const created = await startSession(session.user.id, taskInput.trim());
      setActiveSession(created);
      setTaskInput('');
    } catch (err) {
      Alert.alert('Could not start', err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  }

  async function handleStop() {
    if (!activeSession) return;
    setStopping(true);
    try {
      await stopSession(activeSession.id, activeSession.started_at);
      setActiveSession(null);
      setElapsedSeconds(0);
      await load();
    } catch (err) {
      Alert.alert('Could not stop', err instanceof Error ? err.message : String(err));
    } finally {
      setStopping(false);
    }
  }

  if (!session) return null;

  const todayKey = toDateKey(new Date());
  const todaySeconds = recentSessions
    .filter((s) => toDateKey(new Date(s.started_at)) === todayKey)
    .reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle" style={styles.pageTitle}>
            Focus timer
          </ThemedText>

          {activeSession ? (
            <Card style={[styles.timerCard, { backgroundColor: theme.primary }]}>
              <ThemedText type="small" style={[styles.activeLabel, { color: theme.onPrimary }]}>
                Working on
              </ThemedText>
              <ThemedText type="subtitle" style={[styles.taskText, { color: theme.onPrimary }]}>
                {activeSession.task_description}
              </ThemedText>
              <ThemedText style={[styles.elapsedText, { color: theme.onPrimary }]}>
                {formatElapsed(elapsedSeconds)}
              </ThemedText>
              <Button label="Stop" variant="secondary" loading={stopping} onPress={handleStop} />
            </Card>
          ) : (
            <Card style={styles.card}>
              <ThemedText type="smallBold">What are you working on?</ThemedText>
              <TextField
                placeholder="e.g. Deep work: finish report"
                value={taskInput}
                onChangeText={setTaskInput}
              />
              <Button
                label="Start timer"
                disabled={!taskInput.trim()}
                loading={starting}
                onPress={handleStart}
              />
            </Card>
          )}

          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { flex: 1 }]}>
              <ThemedText type="title" style={styles.statNumber}>
                {formatElapsed(todaySeconds)}
              </ThemedText>
              <ThemedText themeColor="textSecondary">focused today</ThemedText>
            </Card>
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold">Recent sessions</ThemedText>
            <Pressable onPress={() => router.push('/timer/history')}>
              <ThemedText type="small" themeColor="accent">
                View all
              </ThemedText>
            </Pressable>
          </View>

          <Card style={styles.card}>
            {loading ? (
              <ThemedText themeColor="textSecondary">Loading…</ThemedText>
            ) : recentSessions.length === 0 ? (
              <ThemedText themeColor="textSecondary">No sessions yet — start your first one above.</ThemedText>
            ) : (
              recentSessions.map((s) => (
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
                    {formatElapsed(s.duration_seconds ?? 0)}
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
    paddingTop: Spacing.four,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  pageTitle: { fontSize: 24 },
  card: { gap: Spacing.three },
  timerCard: { alignItems: 'center', gap: Spacing.two },
  activeLabel: { opacity: 0.7 },
  taskText: { fontSize: 20, textAlign: 'center' },
  elapsedText: { fontSize: 40, fontVariant: ['tabular-nums'], fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: Spacing.three },
  statCard: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 28 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000015',
  },
});
