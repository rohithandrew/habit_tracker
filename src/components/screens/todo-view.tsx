import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DotsLoader } from '@/components/dots-loader';
import { TasksWidget } from '@/components/tasks-widget';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchAllTasks } from '@/lib/tasks-api';
import { createTodo, deleteTodo, fetchTodos, toggleTodo } from '@/lib/todos-api';
import type { Task, Todo } from '@/lib/types';

export function TodoView({ userId, readOnly = false }: { userId: string; readOnly?: boolean }) {
  const theme = useTheme();
  const navigation = useNavigation();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoText, setNewTodoText] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedTasks, fetchedTodos] = await Promise.all([
        fetchAllTasks(userId),
        fetchTodos(userId),
      ]);
      setTasks(fetchedTasks);
      setTodos(fetchedTodos);
    } catch (err) {
      Alert.alert('Could not load', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => load());
    return unsubscribe;
  }, [navigation, load]);

  async function handleAddTodo() {
    if (readOnly || !newTodoText.trim()) return;
    setAdding(true);
    try {
      const todo = await createTodo(userId, newTodoText.trim());
      setTodos((prev) => [...prev, todo]);
      setNewTodoText('');
    } catch (err) {
      Alert.alert('Could not add task', err instanceof Error ? err.message : String(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleTodo(todo: Todo) {
    if (readOnly) return;
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
    if (readOnly) return;
    const previous = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTodo(id);
    } catch (err) {
      setTodos(previous);
      Alert.alert('Could not delete', err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <ScrollView style={styles.flexOne} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {!readOnly ? (
        <ThemedText type="subtitle" style={styles.pageTitle}>
          Todo
        </ThemedText>
      ) : null}

      <TasksWidget tasks={tasks} variant="month" readOnly={readOnly} />

      <ThemedText type="sectionTitle" style={styles.sectionSpacing}>
        {readOnly ? 'Tasks' : 'My tasks'}
      </ThemedText>
      <Card style={styles.card}>
        {!readOnly ? (
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
        ) : null}

        {loading ? (
          <DotsLoader />
        ) : todos.length === 0 ? (
          <ThemedText themeColor="textSecondary">
            {readOnly ? 'No tasks yet.' : 'No tasks yet — add one above.'}
          </ThemedText>
        ) : (
          todos.map((todo) => (
            <View key={todo.id} style={styles.todoRow}>
              <Pressable
                disabled={readOnly}
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
              {!readOnly ? (
                <Pressable onPress={() => handleDeleteTodo(todo.id)} hitSlop={8}>
                  <ThemedText themeColor="textSecondary">✕</ThemedText>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
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
