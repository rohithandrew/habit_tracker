import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { ContributionGrid, ContributionLegend } from '@/components/contribution-grid';
import { HabitFormModal } from '@/components/habit-form-modal';
import type { HabitFormValues } from '@/components/habit-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeeklyHabitRow } from '@/components/weekly-habit-row';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fromDateKey, isHabitEffectivelyArchived, isPastSchedule } from '@/lib/habits';
import {
  createHabit,
  fetchHabitLogs,
  fetchHabits,
  setHabitArchived,
  toggleHabitLog,
} from '@/lib/habits-api';
import { useAuth } from '@/lib/auth-context';
import type { Habit, HabitLog } from '@/lib/types';

const CONTRIBUTION_HISTORY_DAYS = 14 * 7;

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { session, profile } = useAuth();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [endedExpanded, setEndedExpanded] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!session) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const since = new Date();
        since.setDate(since.getDate() - CONTRIBUTION_HISTORY_DAYS);
        const [fetchedHabits, fetchedLogs] = await Promise.all([
          fetchHabits(session.user.id),
          fetchHabitLogs(session.user.id, since),
        ]);

        const toArchive = fetchedHabits.filter((h) => !h.archived && isPastSchedule(h.schedule_data));
        if (toArchive.length > 0) {
          await Promise.all(toArchive.map((h) => setHabitArchived(h.id, true)));
          for (const h of toArchive) h.archived = true;
        }

        setHabits(fetchedHabits);
        setLogs(fetchedLogs);
      } catch (err) {
        console.error(err);
        Alert.alert('Could not load your habits', err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => load());
    return unsubscribe;
  }, [navigation, load]);

  async function handleToggleDay(habit: Habit, dateKey: string, currentlyDone: boolean) {
    if (!session) return;
    const previousLogs = logs;

    setLogs((prev) =>
      currentlyDone
        ? prev.filter((l) => !(l.habit_id === habit.id && l.date === dateKey))
        : [
            ...prev,
            {
              id: `optimistic-${habit.id}-${dateKey}`,
              habit_id: habit.id,
              user_id: session.user.id,
              date: dateKey,
              status: 'done',
              completed_at: new Date().toISOString(),
            },
          ]
    );

    try {
      await toggleHabitLog(session.user.id, habit.id, dateKey, currentlyDone);
    } catch (err) {
      setLogs(previousLogs);
      Alert.alert('Could not update', err instanceof Error ? err.message : String(err));
    }
  }

  async function handleCreateHabit(values: HabitFormValues) {
    if (!session) return;
    setCreating(true);
    try {
      const habit = await createHabit(session.user.id, values);
      setHabits((prev) => [...prev, habit]);
      setShowAddModal(false);
    } catch (err) {
      Alert.alert('Could not create habit', err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  const activeHabits = habits.filter((h) => !isHabitEffectivelyArchived(h));
  const endedHabits = habits.filter((h) => isHabitEffectivelyArchived(h));

  const selectedDayCount = selectedDateKey
    ? logs.filter((l) => l.date === selectedDateKey && l.status === 'done').length
    : 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>
          <View style={styles.header}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">
                Welcome back
              </ThemedText>
              <ThemedText type="subtitle" style={styles.headerTitle}>
                {profile?.display_name ? profile.display_name : 'Your habits'}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => setShowAddModal(true)}
              style={[styles.addButton, { backgroundColor: theme.primary }]}>
              <ThemedText type="smallBold" style={{ color: '#fff' }}>
                + Add habit
              </ThemedText>
            </Pressable>
          </View>

          <Card>
            <ThemedText type="smallBold">Your activity</ThemedText>
            <ContributionGrid logs={logs} onSelectDate={setSelectedDateKey} />
            <ContributionLegend />
            {selectedDateKey ? (
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
                {fromDateKey(selectedDateKey).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                — {selectedDayCount} habit{selectedDayCount === 1 ? '' : 's'} completed
              </ThemedText>
            ) : null}
          </Card>

          <Card style={{ marginTop: Spacing.three }}>
            <ThemedText type="smallBold" style={{ marginBottom: Spacing.two }}>
              This week
            </ThemedText>
            {loading ? (
              <ThemedText themeColor="textSecondary">Loading…</ThemedText>
            ) : activeHabits.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText themeColor="textSecondary">
                  No habits yet. Tap "+ Add habit" to create your first one.
                </ThemedText>
              </View>
            ) : (
              activeHabits.map((habit) => (
                <WeeklyHabitRow
                  key={habit.id}
                  habit={habit}
                  logs={logs}
                  onToggleDay={(dateKey, done) => handleToggleDay(habit, dateKey, done)}
                />
              ))
            )}
          </Card>

          {endedHabits.length > 0 ? (
            <Card style={{ marginTop: Spacing.three }}>
              <Pressable
                style={styles.endedHeader}
                onPress={() => setEndedExpanded((v) => !v)}>
                <ThemedText type="smallBold">
                  Ended ({endedHabits.length})
                </ThemedText>
                <ThemedText themeColor="textSecondary">{endedExpanded ? '▲' : '▼'}</ThemedText>
              </Pressable>
              {endedExpanded
                ? endedHabits.map((habit) => (
                    <Pressable
                      key={habit.id}
                      style={styles.endedRow}
                      onPress={() => router.push(`/habit/${habit.id}`)}>
                      <ThemedText>{habit.emoji}</ThemedText>
                      <ThemedText themeColor="textSecondary" style={{ flex: 1 }}>
                        {habit.title}
                      </ThemedText>
                    </Pressable>
                  ))
                : null}
            </Card>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <HabitFormModal
        visible={showAddModal}
        title="Add habit"
        submitLabel="Create habit"
        submitting={creating}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateHabit}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scroll: { paddingBottom: Spacing.six, paddingTop: Spacing.two },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  headerTitle: { fontSize: 24 },
  addButton: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.pill },
  emptyState: { paddingVertical: Spacing.three },
  endedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  endedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
});
