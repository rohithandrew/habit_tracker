import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ContributionGrid, ContributionLegend } from '@/components/contribution-grid';
import { HabitFormModal } from '@/components/habit-form-modal';
import type { HabitFormValues } from '@/components/habit-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isHabitEffectivelyArchived, scheduleLabel } from '@/lib/habits';
import {
  deleteHabit,
  fetchHabitById,
  fetchLogsForHabit,
  updateHabit,
} from '@/lib/habits-api';
import type { Habit, HabitLog } from '@/lib/types';

const HISTORY_DAYS = 14 * 7;

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
      const since = new Date();
      since.setDate(since.getDate() - HISTORY_DAYS);
      const [fetchedHabit, fetchedLogs] = await Promise.all([
        fetchHabitById(id),
        fetchLogsForHabit(id, since),
      ]);
      setHabit(fetchedHabit);
      setLogs(fetchedLogs);
      navigation.setOptions({ title: fetchedHabit.title });
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
      setHabit(updated);
      navigation.setOptions({ title: updated.title });
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
        <SafeAreaView style={styles.safeArea}>
          <ThemedText themeColor="textSecondary">Loading…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const doneCount = logs.filter((l) => l.status === 'done').length;
  const ended = isHabitEffectivelyArchived(habit);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={[styles.iconCircle, { backgroundColor: `${habit.color_tag}33` }]}>
              <ThemedText style={styles.icon}>{habit.emoji}</ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle" style={styles.title}>
                {habit.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                {scheduleLabel(habit.schedule_data)}
                {ended ? ' — Ended' : ''}
              </ThemedText>
            </View>
          </View>

          <Card style={styles.statsCard}>
            <ThemedText type="title" style={styles.statNumber}>
              {doneCount}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              times completed in the last {Math.round(HISTORY_DAYS / 7)} weeks
            </ThemedText>
          </Card>

          <Card style={{ marginTop: Spacing.three }}>
            <ThemedText type="smallBold">History</ThemedText>
            <ContributionGrid logs={logs} onSelectDate={() => {}} />
            <ContributionLegend />
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
  scroll: { paddingBottom: Spacing.six, gap: Spacing.three },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 26 },
  title: { fontSize: 22 },
  statsCard: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 36 },
  actions: { gap: Spacing.two, marginTop: Spacing.three },
  deleteButton: { alignItems: 'center', paddingVertical: Spacing.two },
});
