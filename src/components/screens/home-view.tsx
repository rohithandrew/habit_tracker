import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { DotsLoader } from '@/components/dots-loader';
import type { HabitFormValues } from '@/components/habit-form';
import { HabitFormModal } from '@/components/habit-form-modal';
import { TasksWidget } from '@/components/tasks-widget';
import { ThemedText } from '@/components/themed-text';
import { WeeklyHabitRow } from '@/components/weekly-habit-row';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { isDateEligible, isHabitEffectivelyArchived, isPastSchedule, toDateKey } from '@/lib/habits';
import { createHabit, fetchHabitLogs, fetchHabits, setHabitArchived, toggleHabitLog } from '@/lib/habits-api';
import { syncHabitReminder, syncHabitsReminder } from '@/lib/notifications';
import { computeCurrentStreak, reachedMilestone } from '@/lib/streaks';
import { fetchUpcomingTasks } from '@/lib/tasks-api';
import type { Habit, HabitLog, Task } from '@/lib/types';

const CONTRIBUTION_HISTORY_DAYS = 14 * 7;

/** Whether every active, today-eligible habit already has a 'done' log for today. */
function computeAllDoneToday(habitsList: Habit[], logsList: HabitLog[]): boolean {
  const now = new Date();
  const todayKey = toDateKey(now);
  const activeToday = habitsList.filter(
    (h) => !isHabitEffectivelyArchived(h) && isDateEligible(h.schedule_data, now)
  );
  if (activeToday.length === 0) return true;
  const doneIds = new Set(
    logsList.filter((l) => l.date === todayKey && l.status === 'done').map((l) => l.habit_id)
  );
  return activeToday.every((h) => doneIds.has(h.id));
}

export function HomeView({
  userId,
  readOnly = false,
  headerSlot,
}: {
  userId: string;
  readOnly?: boolean;
  headerSlot?: React.ReactNode;
}) {
  const navigation = useNavigation();
  const { profile } = useAuth();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [endedExpanded, setEndedExpanded] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const since = new Date();
        since.setDate(since.getDate() - CONTRIBUTION_HISTORY_DAYS);
        const [fetchedHabits, fetchedLogs, fetchedTasks] = await Promise.all([
          fetchHabits(userId),
          fetchHabitLogs(userId, since),
          fetchUpcomingTasks(userId, toDateKey(new Date())),
        ]);

        if (!readOnly) {
          const toArchive = fetchedHabits.filter((h) => !h.archived && isPastSchedule(h.schedule_data));
          if (toArchive.length > 0) {
            await Promise.all(toArchive.map((h) => setHabitArchived(h.id, true)));
            for (const h of toArchive) h.archived = true;
          }
        }

        setHabits(fetchedHabits);
        setLogs(fetchedLogs);
        setTasks(fetchedTasks);

        if (!readOnly) {
          syncHabitsReminder(
            profile?.habit_reminder_time ?? null,
            computeAllDoneToday(fetchedHabits, fetchedLogs)
          ).catch(() => {
            // best-effort; a failed reschedule isn't worth surfacing to the user
          });
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Could not load habits', err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, readOnly, profile?.habit_reminder_time]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => load());
    return unsubscribe;
  }, [navigation, load]);

  async function handleToggleDay(habit: Habit, dateKey: string, currentlyDone: boolean) {
    if (readOnly) return;
    const previousLogs = logs;
    const newLogs = currentlyDone
      ? logs.filter((l) => !(l.habit_id === habit.id && l.date === dateKey))
      : [
          ...logs,
          {
            id: `optimistic-${habit.id}-${dateKey}`,
            habit_id: habit.id,
            user_id: userId,
            date: dateKey,
            status: 'done' as const,
            completed_at: new Date().toISOString(),
          },
        ];
    setLogs(newLogs);

    try {
      await toggleHabitLog(userId, habit.id, dateKey, currentlyDone);
      if (dateKey === toDateKey(new Date())) {
        syncHabitsReminder(
          profile?.habit_reminder_time ?? null,
          computeAllDoneToday(habits, newLogs)
        ).catch(() => {
          // best-effort; a failed reschedule isn't worth surfacing to the user
        });
      }
      if (!currentlyDone && dateKey === toDateKey(new Date())) {
        const streak = computeCurrentStreak(habit, newLogs);
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
    if (readOnly) return;
    setCreating(true);
    try {
      const habit = await createHabit(userId, values);
      await syncHabitReminder(habit);
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

  return (
    <>
      <ScrollView
        style={styles.flexOne}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          !readOnly ? <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} /> : undefined
        }>
        {headerSlot}

        <View style={styles.tasksWidgetWrap}>
          <TasksWidget tasks={tasks} readOnly={readOnly} />
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Weekly Habits
          </ThemedText>
          {!readOnly ? (
            <Pressable onPress={() => setShowAddModal(true)} hitSlop={8} style={{ marginRight: Spacing.two }}>
              <ThemedText type="small" themeColor="accent">
                + Add habit
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <DotsLoader />
        ) : activeHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText themeColor="textSecondary">
              {readOnly ? 'No habits yet.' : 'No habits yet. Tap "+ Add habit" to create your first one.'}
            </ThemedText>
          </View>
        ) : (
          <View style={{ gap: Spacing.two }}>
            {activeHabits.map((habit) => (
              <WeeklyHabitRow
                key={habit.id}
                habit={habit}
                logs={logs}
                readOnly={readOnly}
                onToggleDay={(dateKey, done) => handleToggleDay(habit, dateKey, done)}
              />
            ))}
          </View>
        )}

        {endedHabits.length > 0 ? (
          <Card>
            <Pressable style={styles.endedHeader} onPress={() => setEndedExpanded((v) => !v)}>
              <ThemedText type="sectionTitle">Ended ({endedHabits.length})</ThemedText>
              <ThemedText themeColor="textSecondary">{endedExpanded ? '▲' : '▼'}</ThemedText>
            </Pressable>
            {endedExpanded
              ? endedHabits.map((habit) => (
                  <Pressable
                    key={habit.id}
                    style={styles.endedRow}
                    disabled={readOnly}
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

      {!readOnly ? (
        <HabitFormModal
          visible={showAddModal}
          title="Add habit"
          submitLabel="Create habit"
          submitting={creating}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateHabit}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  scroll: { paddingBottom: Spacing.six, paddingTop: Spacing.two, gap: Spacing.three },
  tasksWidgetWrap: { marginTop: Spacing.two },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sectionTitle: { fontSize: 20 },
  emptyState: { paddingVertical: Spacing.three },
  endedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  endedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
});
