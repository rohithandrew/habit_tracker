import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DotsLoader } from '@/components/dots-loader';
import { MonthCalendar } from '@/components/month-calendar';
import { TaskComposer } from '@/components/task-composer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { fromDateKey, toDateKey } from '@/lib/habits';
import { createTask, deleteTask, fetchAllTasks } from '@/lib/tasks-api';
import type { Task } from '@/lib/types';

export default function AllTasksScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDateKey, setComposerDateKey] = useState(toDateKey(new Date()));

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      setTasks(await fetchAllTasks(session.user.id));
    } catch (err) {
      Alert.alert('Could not load tasks', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  function openComposerFor(dateKey: string) {
    setComposerDateKey(dateKey);
    setComposerOpen(true);
  }

  async function handleAdd(dateKey: string, text: string, color: string) {
    if (!session) return;
    try {
      const task = await createTask(session.user.id, dateKey, text, color);
      setTasks((prev) => [...prev, task].sort((a, b) => a.date.localeCompare(b.date)));
    } catch (err) {
      Alert.alert('Could not add task', err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete(taskId: string) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(taskId);
    } catch (err) {
      setTasks(previous);
      Alert.alert('Could not delete task', err instanceof Error ? err.message : String(err));
    }
  }

  function dotColorFor(dateKey: string): string | undefined {
    return tasks.find((t) => t.date === dateKey)?.color;
  }

  if (!session) return null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View>
            <MonthCalendar
              selectedDate={null}
              onSelectDate={openComposerFor}
              dayDot={dotColorFor}
            />

            <Pressable
              onPress={() => openComposerFor(toDateKey(new Date()))}
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                + Add task
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText type="sectionTitle" style={styles.sectionTitle}>
            All tasks
          </ThemedText>

          {loading ? (
            <DotsLoader />
          ) : tasks.length === 0 ? (
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              No tasks yet. Tap a date to add one.
            </ThemedText>
          ) : (
            <View style={{ gap: Spacing.four }}>
              {groupByDate(tasks).map(([dateKey, dayTasks]) => (
                <View key={dateKey} style={{ gap: Spacing.two }}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {fromDateKey(dateKey).toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </ThemedText>
                  {dayTasks.map((t) => (
                    <View key={t.id} style={styles.taskRow}>
                      <View style={[styles.taskBar, { backgroundColor: t.color }]} />
                      <ThemedText style={{ flex: 1 }}>{t.text}</ThemedText>
                      <Pressable onPress={() => handleDelete(t.id)} hitSlop={8}>
                        <ThemedText themeColor="textSecondary">✕</ThemedText>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <TaskComposer
        visible={composerOpen}
        initialDateKey={composerDateKey}
        tasks={tasks}
        onClose={() => setComposerOpen(false)}
        onAdd={handleAdd}
        onDelete={handleDelete}
      />
    </ThemedView>
  );
}

function groupByDate(tasks: Task[]): [string, Task[]][] {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    const list = map.get(t.date) ?? [];
    list.push(t);
    map.set(t.date, list);
  }
  return Array.from(map.entries());
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
  scroll: { gap: Spacing.four, paddingBottom: Spacing.six },
  addButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  sectionTitle: { marginTop: Spacing.three },
  emptyText: { fontWeight: '400' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  taskBar: { width: 4, height: 24, borderRadius: 2 },
});
