import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ContributionGrid } from '@/components/contribution-grid';
import { DotsLoader } from '@/components/dots-loader';
import { HabitFormModal } from '@/components/habit-form-modal';
import type { HabitFormValues } from '@/components/habit-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isHabitEffectivelyArchived, scheduleLabel } from '@/lib/habits';
import {
  deleteHabit,
  fetchHabitById,
  fetchLogsForHabit,
  updateHabit,
} from '@/lib/habits-api';
import { cancelHabitReminder, syncHabitReminder } from '@/lib/notifications';
import { computeCurrentStreak } from '@/lib/streaks';
import type { Habit, HabitLog } from '@/lib/types';

export default function HabitDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [habit, setHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const fetchedHabit = await fetchHabitById(id);
      const fetchedLogs = await fetchLogsForHabit(id, new Date(fetchedHabit.created_at));
      setHabit(fetchedHabit);
      setLogs(fetchedLogs);
      navigation.setOptions({ title: `${fetchedHabit.title} (${scheduleLabel(fetchedHabit.schedule_data)})` });
    } catch (err) {
      Alert.alert('Could not load habit', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(values: HabitFormValues) {
    if (!habit) return;
    setSaving(true);
    try {
      const updated = await updateHabit(habit.id, values);
      await syncHabitReminder(updated);
      setHabit(updated);
      navigation.setOptions({ title: `${updated.title} (${scheduleLabel(updated.schedule_data)})` });
      setShowEditModal(false);
    } catch (err) {
      Alert.alert('Could not save changes', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!habit) return;
    Alert.alert(
      'Delete habit?',
      `"${habit.title}" and its history will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(habit.id);
              await cancelHabitReminder(habit.id);
              router.back();
            } catch (err) {
              Alert.alert('Could not delete', err instanceof Error ? err.message : String(err));
            }
          },
        },
      ]
    );
  }

  if (loading || !habit) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <DotsLoader />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const doneCount = logs.filter((l) => l.status === 'done').length;
  const ended = isHabitEffectivelyArchived(habit);
  const streak = computeCurrentStreak(habit, logs);

  const createdAt = new Date(habit.created_at);
  createdAt.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceCreated =
    Math.round((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {ended ? (
            <ThemedText themeColor="textSecondary">Ended</ThemedText>
          ) : null}

          <View style={styles.statsRow}>
            <Card style={[styles.statsCard, { flex: 1 }]}>
              <ThemedText type="title" style={styles.statNumber}>
                {streak}
              </ThemedText>
              <ThemedText themeColor="textSecondary">day streak {streak > 0 ? '🔥' : ''}</ThemedText>
            </Card>
            <Card style={[styles.statsCard, { flex: 1 }]}>
              <ThemedText type="title" style={styles.statNumber}>
                {doneCount}/{daysSinceCreated}
              </ThemedText>
              <ThemedText themeColor="textSecondary">days done ✅</ThemedText>
            </Card>
          </View>

          <Card style={styles.historyCard}>
            <ThemedText type="sectionTitle">History</ThemedText>
            <ContributionGrid logs={logs} onSelectDate={() => {}} binary />
          </Card>

          <View style={styles.actions}>
            <Button label="Edit habit" variant="secondary" onPress={() => setShowEditModal(true)} />
            <Pressable onPress={confirmDelete} style={styles.deleteButton}>
              <ThemedText themeColor="danger" type="smallBold">
                Delete habit
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <HabitFormModal
        visible={showEditModal}
        title="Edit habit"
        submitLabel="Save changes"
        submitting={saving}
        initialValues={{
          title: habit.title,
          emoji: habit.emoji,
          colorTag: habit.color_tag,
          scheduleType: habit.schedule_type,
          scheduleData: habit.schedule_data,
          reminderTime: habit.reminder_time ? habit.reminder_time.slice(0, 5) : null,
        }}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSave}
      />
    </ThemedView>
  );
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
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: Spacing.six, gap: Spacing.three },
  statsRow: { flexDirection: 'row', gap: Spacing.three },
  statsCard: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 36 },
  historyCard: { gap: Spacing.three },
  actions: { gap: Spacing.two },
  deleteButton: { alignItems: 'center', paddingVertical: Spacing.two },
});
