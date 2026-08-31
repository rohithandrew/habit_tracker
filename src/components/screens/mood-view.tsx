import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { DotsLoader } from '@/components/dots-loader';
import { MoodHistoryStrip } from '@/components/mood-history-strip';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fromDateKey, toDateKey } from '@/lib/habits';
import { fetchFriendMoodHistory, fetchMoodHistory, upsertMood } from '@/lib/mood-api';
import { MOOD_ICONS, MOOD_LABELS } from '@/lib/types';
import type { MoodEntry } from '@/lib/types';

export function MoodView({
  userId,
  readOnly = false,
  showPeriodLink = false,
}: {
  userId: string;
  readOnly?: boolean;
  /** Period data is never shared with friends, under any setting — only ever pass true in owned mode. */
  showPeriodLink?: boolean;
}) {
  const theme = useTheme();
  const navigation = useNavigation();

  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));

  const todayKey = toDateKey(new Date());
  const isToday = selectedDate === todayKey;
  const selectedEntry = history.find((e) => e.date === selectedDate) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const rows = readOnly ? await fetchFriendMoodHistory(userId, since) : await fetchMoodHistory(userId, since);
      setHistory(rows);
    } catch (err) {
      Alert.alert('Could not load mood history', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [userId, readOnly]);

  useEffect(() => {
    setNote(selectedEntry?.note ?? '');
  }, [selectedDate, selectedEntry?.note]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => load());
    return unsubscribe;
  }, [navigation, load]);

  async function handleSelectMood(mood: 1 | 2 | 3 | 4 | 5) {
    if (readOnly) return;
    setSaving(true);
    try {
      const entry = await upsertMood(userId, selectedDate, mood, note.trim() || null);
      setHistory((prev) => [...prev.filter((e) => e.date !== selectedDate), entry]);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNote() {
    if (readOnly || !selectedEntry) return;
    setSaving(true);
    try {
      const entry = await upsertMood(userId, selectedDate, selectedEntry.mood, note.trim() || null);
      setHistory((prev) => [...prev.filter((e) => e.date !== selectedDate), entry]);
    } catch (err) {
      Alert.alert('Could not save note', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.flexOne} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {!readOnly ? (
        <ThemedText type="subtitle" style={styles.pageTitle}>
          Mood
        </ThemedText>
      ) : null}

      <Card style={styles.card}>
        <View style={styles.cardTitleRow}>
          <ThemedText type="sectionTitle">
            {isToday
              ? selectedEntry
                ? "Today's mood"
                : readOnly
                  ? 'No entry for today yet'
                  : 'How are you feeling today?'
              : fromDateKey(selectedDate).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
          </ThemedText>
          {!isToday ? (
            <Pressable onPress={() => setSelectedDate(todayKey)} hitSlop={8}>
              <ThemedText type="small" themeColor="accent">
                Back to today
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.moodRow}>
          {([1, 2, 3, 4, 5] as const).map((m) => {
            const selected = selectedEntry?.mood === m;
            return (
              <Pressable
                key={m}
                onPress={() => handleSelectMood(m)}
                disabled={saving || readOnly}
                style={[styles.moodButton, selected && { backgroundColor: theme.primary }]}>
                <MaterialCommunityIcons
                  name={MOOD_ICONS[m]}
                  size={selected ? 32 : 28}
                  color={selected ? theme.onPrimary : theme.text}
                />
                <ThemedText
                  type="small"
                  themeColor={selected ? 'onPrimary' : 'textSecondary'}
                  style={selected && styles.moodLabelSelected}>
                  {MOOD_LABELS[m]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        {!readOnly && isToday && selectedEntry ? (
          <View style={{ gap: Spacing.two }}>
            <TextField
              placeholder="Add a note"
              value={note}
              onChangeText={setNote}
              onBlur={handleSaveNote}
              multiline
            />
          </View>
        ) : selectedEntry?.note ? (
          <ThemedText themeColor="textSecondary">{selectedEntry.note}</ThemedText>
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
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}
      </Card>

      {!readOnly && showPeriodLink ? (
        <Pressable onPress={() => router.push('/mood/period')} style={styles.periodLink}>
          <Card style={styles.periodCard}>
            <ThemedText type="smallBold">🌙 Period cycle</ThemedText>
            <ThemedText themeColor="textSecondary">›</ThemedText>
          </Card>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  pageTitle: { fontSize: 24 },
  card: { gap: Spacing.three },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodButton: { alignItems: 'center', gap: 4, flex: 1, paddingVertical: Spacing.two, borderRadius: 12 },
  moodLabelSelected: { fontWeight: '700' },
  sectionSpacing: { marginTop: Spacing.two },
  periodLink: {},
  periodCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
