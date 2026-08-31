import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DotsLoader } from '@/components/dots-loader';
import { TasksWidget } from '@/components/tasks-widget';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { fetchAllTasks } from '@/lib/tasks-api';
import { createTodo, deleteTodo, fetchTodos, toggleTodo } from '@/lib/todos-api';
import type { Task, Todo } from '@/lib/types';

export default function TodoScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { session, profile } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoText, setNewTodoText] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [fetchedTasks, fetchedTodos] = await Promise.all([
        fetchAllTasks(session.user.id),
        fetchTodos(session.user.id),
      ]);
      setTasks(fetchedTasks);
      setTodos(fetchedTodos);
    } catch (err) {
      Alert.alert('Could not load', err instanceof Error ? err.message : String(err));
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

  async function handleAddTodo() {
    if (!session || !newTodoText.trim()) return;
    setAdding(true);
    try {
      const todo = await createTodo(session.user.id, newTodoText.trim());
      setTodos((prev) => [...prev, todo]);
      setNewTodoText('');
    } catch (err) {
      Alert.alert('Could not add task', err instanceof Error ? err.message : String(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleTodo(todo: Todo) {
    const previous = todos;
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)));
    try {
      await toggleTodo(todo.id, !todo.done);
    } catch (err) {
      setTodos(previous);
      Alert.alert('Could not update', err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDeleteTodo(id: string) {
    const previous = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTodo(id);
    } catch (err) {
      setTodos(previous);
      Alert.alert('Could not delete', err instanceof Error ? err.message : String(err));
    }
  }

  if (!session || !profile) return null;

  if (!profile.todo_enabled) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <ThemedText style={{ fontSize: 48 }}>📝</ThemedText>
          <ThemedText type="subtitle" style={{ textAlign: 'center', marginTop: Spacing.three }}>
            Todo list is off
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.two }}>
            Turn it on from Profile → Health to start adding tasks.
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
            Todo
          </ThemedText>

          <TasksWidget tasks={tasks} variant="month" />

          <ThemedText type="sectionTitle" style={styles.sectionSpacing}>
            My tasks
          </ThemedText>
          <Card style={styles.card}>
            <View style={styles.addRow}>
              <View style={{ flex: 1 }}>
                <TextField
                  placeholder="Add a task"
                  value={newTodoText}
                  onChangeText={setNewTodoText}
                  onSubmitEditing={handleAddTodo}
                />
              </View>
              <Button
                label="Add"
                fullWidth={false}
                loading={adding}
                disabled={!newTodoText.trim()}
                onPress={handleAddTodo}
              />
            </View>

            {loading ? (
              <DotsLoader />
            ) : todos.length === 0 ? (
              <ThemedText themeColor="textSecondary">No tasks yet — add one above.</ThemedText>
            ) : (
              todos.map((todo) => (
                <View key={todo.id} style={styles.todoRow}>
                  <Pressable
                    onPress={() => handleToggleTodo(todo)}
                    style={[
                      styles.checkbox,
                      {
                        borderColor: todo.done ? theme.primary : theme.border,
                        backgroundColor: todo.done ? theme.primary : 'transparent',
                      },
                    ]}>
                    {todo.done ? (
                      <ThemedText style={{ color: theme.onPrimary, fontSize: 14 }}>✓</ThemedText>
                    ) : null}
                  </Pressable>
                  <ThemedText
                    style={[styles.todoText, todo.done && { textDecorationLine: 'line-through', opacity: 0.5 }]}>
                    {todo.text}
                  </ThemedText>
                  <Pressable onPress={() => handleDeleteTodo(todo.id)} hitSlop={8}>
                    <ThemedText themeColor="textSecondary">✕</ThemedText>
                  </Pressable>
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
  pageTitle: { fontSize: 24 },
  sectionSpacing: { marginTop: Spacing.two },
  card: { gap: Spacing.three },
  addRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  todoText: { flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
