import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HabitForm, type HabitFormValues } from '@/components/habit-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { syncHabitReminder } from '@/lib/notifications';
import { useOnboarding } from '@/lib/onboarding-context';
import { supabase } from '@/lib/supabase';
import type { Habit } from '@/lib/types';

const TEMPLATES: { title: string; emoji: string }[] = [
  { title: 'Drink water', emoji: '💧' },
  { title: 'Read', emoji: '📖' },
  { title: 'Workout', emoji: '🏃' },
  { title: 'Meditate', emoji: '🧘' },
];

export default function FirstHabitScreen() {
  const theme = useTheme();
  const { session, refreshProfile } = useAuth();
  const { draft } = useOnboarding();
  const [template, setTemplate] = useState<{ title: string; emoji: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: HabitFormValues) {
    if (!session) return;
    setSubmitting(true);
    setError(null);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: draft.username,
        display_name: draft.displayName,
        avatar_emoji: draft.avatarKey,
        mood_tracking_enabled: draft.moodTrackingEnabled,
        period_tracking_enabled: draft.periodTrackingEnabled,
        timer_tracking_enabled: draft.focusTimerEnabled,
        onboarding_completed: true,
      })
      .eq('id', session.user.id);

    if (profileError) {
      setSubmitting(false);
      setError(profileError.message);
      return;
    }

    if (draft.periodTrackingEnabled && draft.periodLastStart) {
      await supabase.from('period_logs').insert({
        user_id: session.user.id,
        cycle_start_date: draft.periodLastStart,
        cycle_length_days: draft.periodCycleLength,
      });
    }

    const { data: createdHabit, error: habitError } = await supabase
      .from('habits')
      .insert({
        user_id: session.user.id,
        title: values.title,
        emoji: values.emoji,
        color_tag: values.colorTag,
        schedule_type: values.scheduleType,
        schedule_data: values.scheduleData,
        reminder_time: values.reminderTime,
      })
      .select('*')
      .single();

    setSubmitting(false);

    if (habitError) {
      setError(habitError.message);
      return;
    }

    await syncHabitReminder(createdHabit as Habit);
    await refreshProfile();
    router.replace('/(tabs)');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="small" themeColor="textSecondary">
            Step 6 of 6
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            Create your first habit
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Pick a starting point, or make it your own.
          </ThemedText>

          <View style={styles.templateRow}>
            {TEMPLATES.map((t) => {
              const selected = template?.title === t.title;
              return (
                <Pressable
                  key={t.title}
                  onPress={() => setTemplate(t)}
                  style={[
                    styles.templateChip,
                    { backgroundColor: selected ? theme.primary : theme.backgroundElement },
                  ]}>
                  <ThemedText>{t.emoji}</ThemedText>
                  <ThemedText type="small" style={selected ? { color: theme.onPrimary } : undefined}>
                    {t.title}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <HabitForm
            key={template?.title ?? 'blank'}
            initialValues={template ? { title: template.title, emoji: template.emoji } : undefined}
            submitLabel="Create habit & finish"
            submitting={submitting}
            onSubmit={handleSubmit}
          />

          {error ? (
            <ThemedText themeColor="danger" type="small">
              {error}
            </ThemedText>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.five },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  title: { fontSize: 28, lineHeight: 34 },
  templateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
});
