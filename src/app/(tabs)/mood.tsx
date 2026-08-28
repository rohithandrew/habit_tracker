import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { DotsLoader } from '@/components/dots-loader';
import { MoodHistoryStrip } from '@/components/mood-history-strip';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/habits';
import { useAuth } from '@/lib/auth-context';
import { fetchMoodHistory, upsertMood } from '@/lib/mood-api';
import { MOOD_EMOJIS, MOOD_LABELS } from '@/lib/types';
import type { MoodEntry } from '@/lib/types';

export default function MoodScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { session, profile } = useAuth();

  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const todayKey = toDateKey(new Date());
  const todayEntry = history.find((e) => e.date === todayKey) ?? null;

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const rows = await fetchMoodHistory(session.user.id, since);
      setHistory(rows);
      setNote(rows.find((e) => e.date === toDateKey(new Date()))?.note ?? '');
    } catch (err) {
      Alert.alert('Could not load mood history', err instanceof Error ? err.message : String(err));
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

  async function handleSelectMood(mood: 1 | 2 | 3 | 4 | 5) {
    if (!session) return;
    setSaving(true);
    try {
      const entry = await upsertMood(session.user.id, todayKey, mood, note.trim() || null);
      setHistory((prev) => [...prev.filter((e) => e.date !== todayKey), entry]);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNote() {
    if (!session || !todayEntry) return;
    setSaving(true);
    try {
      const entry = await upsertMood(session.user.id, todayKey, todayEntry.mood, note.trim() || null);
      setHistory((prev) => [...prev.filter((e) => e.date !== todayKey), entry]);
    } catch (err) {
      Alert.alert('Could not save note', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!session || !profile) return null;

  if (!profile.mood_tracking_enabled) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <ThemedText style={{ fontSize: 48 }}>🙂</ThemedText>
          <ThemedText type="subtitle" style={{ textAlign: 'center', marginTop: Spacing.three }}>
            Mood tracking is off
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.two }}>
            Turn it on from Profile → Health to start logging how you feel.
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle" style={styles.pageTitle}>
            Mood
          </ThemedText>

          <Card style={styles.card}>
            <ThemedText type="sectionTitle">
              {todayEntry ? "Today's mood" : 'How are you feeling today?'}
            </ThemedText>
            <View style={styles.moodRow}>
              {([1, 2, 3, 4, 5] as const).map((m) => {
                const selected = todayEntry?.mood === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => handleSelectMood(m)}
                    disabled={saving}
                    style={[
                      styles.moodButton,
                      selected && { backgroundColor: theme.primarySoft },
                    ]}>
                    <ThemedText style={styles.moodEmoji}>{MOOD_EMOJIS[m]}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {MOOD_LABELS[m]}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {todayEntry ? (
              <View style={{ gap: Spacing.two }}>
                <TextField
                  placeholder="Add a private note (only you can see this)"
                  value={note}
                  onChangeText={setNote}
                  onBlur={handleSaveNote}
                  multiline
                />
              </View>
            ) : null}
          </Card>

          <ThemedText type="sectionTitle" style={styles.sectionSpacing}>
            Last 30 days
          </ThemedText>
          <Card>
            {loading ? (
              <DotsLoader />
            ) : (
              <MoodHistoryStrip
                days={30}
                entries={history.map((e) => ({ date: e.date, mood: e.mood }))}
              />
            )}
          </Card>

          {profile.period_tracking_enabled ? (
            <Pressable onPress={() => router.push('/mood/period')} style={styles.periodLink}>
              <Card style={styles.periodCard}>
                <ThemedText type="smallBold">🌙 Period cycle</ThemedText>
                <ThemedText themeColor="textSecondary">›</ThemedText>
              </Card>
            </Pressable>
          ) : null}
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
  pageTitle: { fontSize: 24 },
  card: { gap: Spacing.three },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodButton: { alignItems: 'center', gap: 4, flex: 1, paddingVertical: Spacing.two, borderRadius: 12 },
  moodEmoji: { fontSize: 28 },
  sectionSpacing: { marginTop: Spacing.two },
  periodLink: {},
  periodCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
