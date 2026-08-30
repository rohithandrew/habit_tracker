import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DotsLoader } from '@/components/dots-loader';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
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
  const { session, profile } = useAuth();

  const [activeSession, setActiveSession] = useState<TimerSession | null>(null);
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const pulse = useRef(new Animated.Value(1)).current;

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
      setSessions(history);
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

  useEffect(() => {
    if (!activeSession) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [activeSession, pulse]);

  async function startWithTask(taskDescription: string) {
    if (!session || !taskDescription.trim()) return;
    setStarting(true);
    try {
      const created = await startSession(session.user.id, taskDescription.trim());
      setActiveSession(created);
      setTaskInput('');
    } catch (err) {
      Alert.alert('Could not start', err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  }

  function handleStart() {
    return startWithTask(taskInput);
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

  if (!session || !profile) return null;

  if (!profile.timer_tracking_enabled) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <ThemedText style={{ fontSize: 48 }}>⏱️</ThemedText>
          <ThemedText type="subtitle" style={{ textAlign: 'center', marginTop: Spacing.three }}>
            Focus timer is off
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.two }}>
            Turn it on from Profile → Health to start tracking focus sessions.
          </ThemedText>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={{ marginTop: Spacing.four }}>
            <ThemedText themeColor="accent" type="smallBold">
              Go to Profile
            </ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const todayKey = toDateKey(new Date());
  const todaySessions = sessions.filter((s) => toDateKey(new Date(s.started_at)) === todayKey);
  const todaySeconds = todaySessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const recentSessions = sessions.slice(0, 5);

  const taskTotalsToday = new Map<string, number>();
  for (const s of todaySessions) {
    taskTotalsToday.set(
      s.task_description,
      (taskTotalsToday.get(s.task_description) ?? 0) + (s.duration_seconds ?? 0)
    );
  }
  const todaysTasks = [...taskTotalsToday.keys()];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.pageTitle}>
              Focus timer
            </ThemedText>
          </View>

          {activeSession ? (
            <Card style={[styles.timerCard, { backgroundColor: theme.primary }]}>
              <View style={styles.liveRow}>
                <ThemedText type="small" style={[styles.activeLabel, { color: theme.onPrimary }]}>
                  Working on
                </ThemedText>
                <View style={styles.liveBadge}>
                  <Animated.View
                    style={[styles.liveDot, { backgroundColor: theme.onPrimary, opacity: pulse }]}
                  />
                  <ThemedText type="small" style={[styles.liveText, { color: theme.onPrimary }]}>
                    LIVE
                  </ThemedText>
                </View>
              </View>
              <ThemedText
                type="subtitle"
                numberOfLines={2}
                style={[styles.taskText, { color: theme.onPrimary }]}>
                {activeSession.task_description}
              </ThemedText>
              <ThemedText style={[styles.elapsedText, { color: theme.onPrimary }]}>
                {formatElapsed(elapsedSeconds)}
              </ThemedText>
              <Button
                label="Stop session"
                icon="stop-circle"
                variant="secondary"
                loading={stopping}
                onPress={handleStop}
              />
            </Card>
          ) : (
            <>
              {todaysTasks.length > 0 ? (
                <Card style={styles.card}>
                  <ThemedText type="sectionTitle">
                    Continue today&apos;s work
                  </ThemedText>
                  {todaysTasks.map((task) => (
                    <Pressable
                      key={task}
                      disabled={starting}
                      onPress={() => startWithTask(task)}
                      style={[styles.continueRow, { borderColor: theme.border }]}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {task}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {formatElapsed(taskTotalsToday.get(task) ?? 0)} logged today
                        </ThemedText>
                      </View>
                      <View style={[styles.resumeButton, { backgroundColor: theme.primary }]}>
                        <Ionicons name="play" size={16} color={theme.onPrimary} />
                      </View>
                    </Pressable>
                  ))}
                </Card>
              ) : null}

              <Card style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="add-circle-outline" size={18} color={theme.text} />
                  <ThemedText type="sectionTitle">
                    Start something new
                  </ThemedText>
                </View>
                <TextField
                  placeholder="e.g. Deep work: finish report"
                  value={taskInput}
                  onChangeText={setTaskInput}
                />
                <Button
                  label="Start timer"
                  icon="play"
                  disabled={!taskInput.trim()}
                  loading={starting}
                  onPress={handleStart}
                />
              </Card>
            </>
          )}

          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { flex: 1 }]}>
              <ThemedText type="title" style={styles.statNumber}>
                {formatElapsed(todaySeconds)}
              </ThemedText>
              <View style={styles.statLabelRow}>
                <Ionicons name="flash-outline" size={14} color={theme.textSecondary} />
                <ThemedText themeColor="textSecondary" type="small">
                  focused today
                </ThemedText>
              </View>
            </Card>
            <Card style={[styles.statCard, { flex: 1 }]}>
              <ThemedText type="title" style={styles.statNumber}>
                {todaySessions.length}
              </ThemedText>
              <View style={styles.statLabelRow}>
                <Ionicons name="checkmark-done-outline" size={14} color={theme.textSecondary} />
                <ThemedText themeColor="textSecondary" type="small">
                  sessions today
                </ThemedText>
              </View>
            </Card>
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText type="sectionTitle">
              Recent sessions
            </ThemedText>
            <Pressable onPress={() => router.push('/timer/history')} style={styles.viewAllRow}>
              <ThemedText type="small" themeColor="accent">
                View all
              </ThemedText>
              <Ionicons name="chevron-forward" size={14} color={theme.accent} />
            </Pressable>
          </View>

          <Card style={styles.recentCard}>
            {loading ? (
              <DotsLoader />
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
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  pageTitle: { fontSize: 24 },
  card: { gap: Spacing.three },
  recentCard: { gap: Spacing.three, paddingVertical: Spacing.three, paddingHorizontal: Spacing.four },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  resumeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCard: { alignItems: 'center', gap: Spacing.two },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  activeLabel: { opacity: 0.7 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: Radius.pill },
  liveText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  taskText: { fontSize: 20, textAlign: 'center' },
  elapsedText: { fontSize: 44, fontVariant: ['tabular-nums'], fontWeight: '700', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: Spacing.three },
  statCard: { alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 26 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000015',
  },
});
