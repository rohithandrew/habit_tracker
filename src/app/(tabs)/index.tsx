import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { FocusCarousel } from '@/components/focus-carousel';
import { HabitFormModal } from '@/components/habit-form-modal';
import type { HabitFormValues } from '@/components/habit-form';
import { StickyNotesCanvas } from '@/components/sticky-notes-canvas';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeeklyHabitRow } from '@/components/weekly-habit-row';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isHabitEffectivelyArchived, isPastSchedule, toDateKey } from '@/lib/habits';
import {
  createHabit,
  fetchHabitLogs,
  fetchHabits,
  setHabitArchived,
  toggleHabitLog,
} from '@/lib/habits-api';
import { useAuth } from '@/lib/auth-context';
import { fetchFriendships, fetchProfilesByIds } from '@/lib/friends-api';
import { syncHabitReminder } from '@/lib/notifications';
import { fetchStickyNotes } from '@/lib/sticky-notes-api';
import { computeCurrentStreak, reachedMilestone } from '@/lib/streaks';
import type { Habit, HabitLog, PublicProfile, StickyNote } from '@/lib/types';

const CONTRIBUTION_HISTORY_DAYS = 14 * 7;

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { session, profile } = useAuth();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [endedExpanded, setEndedExpanded] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!session) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const since = new Date();
        since.setDate(since.getDate() - CONTRIBUTION_HISTORY_DAYS);
        const [fetchedHabits, fetchedLogs, notes, friendships] = await Promise.all([
          fetchHabits(session.user.id),
          fetchHabitLogs(session.user.id, since),
          fetchStickyNotes(session.user.id, 'habit_grid'),
          fetchFriendships(session.user.id),
        ]);

        const toArchive = fetchedHabits.filter((h) => !h.archived && isPastSchedule(h.schedule_data));
        if (toArchive.length > 0) {
          await Promise.all(toArchive.map((h) => setHabitArchived(h.id, true)));
          for (const h of toArchive) h.archived = true;
        }

        setHabits(fetchedHabits);
        setLogs(fetchedLogs);
        setStickyNotes(notes);

        const acceptedIds = friendships
          .filter((f) => f.status === 'accepted')
          .map((f) => (f.requester_id === session.user.id ? f.addressee_id : f.requester_id));
        setFriendProfiles(acceptedIds.length > 0 ? await fetchProfilesByIds(acceptedIds) : []);
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
      if (!currentlyDone && dateKey === toDateKey(new Date())) {
        const streak = computeCurrentStreak(habit, [
          ...logs.filter((l) => !(l.habit_id === habit.id && l.date === dateKey)),
          { id: 'x', habit_id: habit.id, user_id: session.user.id, date: dateKey, status: 'done', completed_at: null },
        ]);
        const milestone = reachedMilestone(streak);
        if (milestone) {
          Alert.alert(`${milestone}-day streak! 🔥`, `"${habit.title}" — ${milestone} days in a row.`);
        }
      }
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
      await syncHabitReminder(habit);
      setHabits((prev) => [...prev, habit]);
      setShowAddModal(false);
    } catch (err) {
      Alert.alert('Could not create habit', err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  if (!session) return null;

  const activeHabits = habits.filter((h) => !isHabitEffectivelyArchived(h));
  const endedHabits = habits.filter((h) => isHabitEffectivelyArchived(h));

  const friendIdsWithNotes = new Set(stickyNotes.map((n) => n.author_id));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const today = new Date();
  const dateLabel = `${today.toLocaleDateString(undefined, { weekday: 'long' })}, ${today.getDate()} ${today.toLocaleDateString(undefined, { month: 'long' })}, ${today.getFullYear()}`;
  const firstName = (profile?.display_name ?? '').split(' ')[0] || 'there';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>
          <View style={styles.header}>
            <View style={{ flexShrink: 1 }}>
              <ThemedText type="title" style={styles.headerTitle}>
                {greeting}, {firstName}
              </ThemedText>
              <ThemedText themeColor="textSecondary">{dateLabel}</ThemedText>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/profile')}>
              <Avatar emoji={profile?.avatar_emoji ?? '🙂'} size={52} />
            </Pressable>
          </View>

          <FocusCarousel />

          {friendProfiles.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.friendStrip}
              contentContainerStyle={styles.friendStripContent}>
              {friendProfiles.map((f) => (
                <Pressable key={f.id} onPress={() => router.push(`/friend/${f.id}`)} style={styles.friendAvatar}>
                  <Avatar emoji={f.avatar_emoji} size={44} />
                  {friendIdsWithNotes.has(f.id) ? (
                    <View style={[styles.friendDot, { backgroundColor: theme.danger, borderColor: theme.background }]} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Weekly Habits
            </ThemedText>
            <Pressable onPress={() => setShowAddModal(true)} hitSlop={8}>
              <ThemedText type="smallBold">+ Add habit</ThemedText>
            </Pressable>
          </View>

          <StickyNotesCanvas
            notes={stickyNotes}
            currentUserId={session.user.id}
            ownerId={session.user.id}
            targetType="habit_grid"
            canAuthorNote={false}
            onNotesChange={setStickyNotes}>
            {loading ? (
              <ThemedText themeColor="textSecondary">Loading…</ThemedText>
            ) : activeHabits.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText themeColor="textSecondary">
                  No habits yet. Tap "+ Add habit" to create your first one.
                </ThemedText>
              </View>
            ) : (
              <View style={{ gap: Spacing.two }}>
                {activeHabits.map((habit) => (
                  <WeeklyHabitRow
                    key={habit.id}
                    habit={habit}
                    logs={logs}
                    onToggleDay={(dateKey, done) => handleToggleDay(habit, dateKey, done)}
                  />
                ))}
              </View>
            )}
          </StickyNotesCanvas>

          {endedHabits.length > 0 ? (
            <Card>
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
  scroll: { paddingBottom: Spacing.six, paddingTop: Spacing.two, gap: Spacing.three },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 30, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 22 },
  emptyState: { paddingVertical: Spacing.three },
  friendStrip: { flexGrow: 0 },
  friendStripContent: { gap: Spacing.three, paddingRight: Spacing.two },
  friendAvatar: { position: 'relative' },
  friendDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  endedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  endedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
});
