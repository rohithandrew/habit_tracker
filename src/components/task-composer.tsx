import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { MonthCalendar } from '@/components/month-calendar';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { TASK_COLORS, type Task } from '@/lib/types';

export function TaskComposer({
  visible,
  initialDateKey,
  tasks,
  onClose,
  onAdd,
  onDelete,
}: {
  visible: boolean;
  initialDateKey: string;
  tasks: Task[];
  onClose: () => void;
  onAdd: (dateKey: string, text: string, color: string) => void;
  onDelete: (taskId: string) => void;
}) {
  const theme = useTheme();
  const [dateKey, setDateKey] = useState(initialDateKey);
  const [text, setText] = useState('');
  const [color, setColor] = useState<string>(TASK_COLORS[0]);

  useEffect(() => {
    if (visible) {
      setDateKey(initialDateKey);
      setText('');
    }
  }, [visible, initialDateKey]);

  const tasksForDate = tasks.filter((t) => t.date === dateKey);

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(dateKey, trimmed, color);
    setText('');
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              Add task
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Done
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <TextField placeholder="What do you need to do?" value={text} onChangeText={setText} />

            <View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                Color
              </ThemedText>
              <View style={styles.colorRow}>
                {TASK_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      styles.swatch,
                      { backgroundColor: c },
                      color === c && { borderWidth: 3, borderColor: theme.text },
                    ]}
                  />
                ))}
              </View>
            </View>

            <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
              Day
            </ThemedText>
            <MonthCalendar selectedDate={dateKey} onSelectDate={setDateKey} />

            <Button label="Add task" disabled={!text.trim()} onPress={handleAdd} />

            {tasksForDate.length > 0 ? (
              <View style={styles.list}>
                <ThemedText type="small" themeColor="textSecondary">
                  Tasks on this day
                </ThemedText>
                {tasksForDate.map((t) => (
                  <View key={t.id} style={styles.taskRow}>
                    <View style={[styles.dot, { backgroundColor: t.color }]} />
                    <ThemedText style={{ flex: 1 }}>{t.text}</ThemedText>
                    <Pressable onPress={() => onDelete(t.id)} hitSlop={8}>
                      <ThemedText themeColor="textSecondary">✕</ThemedText>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  title: { fontSize: 20 },
  label: { marginBottom: Spacing.two },
  colorRow: { flexDirection: 'row', gap: Spacing.two },
  swatch: { width: 36, height: 36, borderRadius: Radius.pill },
  list: { gap: Spacing.two },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: Radius.pill },
});
