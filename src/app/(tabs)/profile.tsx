import { Image } from 'expo-image';
import { Share } from 'react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DotsLoader } from '@/components/dots-loader';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimePicker } from '@/components/time-picker';
import { ToggleRow } from '@/components/toggle-row';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deleteAccountData, exportUserData } from '@/lib/account';
import { useAuth } from '@/lib/auth-context';
import { AVATAR_KEYS, DEFAULT_AVATAR_KEY, avatarSource } from '@/lib/avatars';
import { requestNotificationPermission, syncHabitsReminder } from '@/lib/notifications';
import { useSettings, type ThemeMode } from '@/lib/settings-context';
import { supabase } from '@/lib/supabase';

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

const AVATARS_PER_ROW = 5;
const AVATAR_ROWS = Array.from({ length: Math.ceil(AVATAR_KEYS.length / AVATARS_PER_ROW) }, (_, i) =>
  AVATAR_KEYS.slice(i * AVATARS_PER_ROW, i * AVATARS_PER_ROW + AVATARS_PER_ROW)
);

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, session, refreshProfile, signOut } = useAuth();
  const { themeMode, setThemeMode, colorBlindPalette, setColorBlindPalette } = useSettings();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [avatarKey, setAvatarKey] = useState(profile?.avatar_emoji ?? DEFAULT_AVATAR_KEY);
  const [savingProfile, setSavingProfile] = useState(false);

  const [moodEnabled, setMoodEnabled] = useState(profile?.mood_tracking_enabled ?? false);
  const [timerEnabled, setTimerEnabled] = useState(profile?.timer_tracking_enabled ?? true);
  const [todoEnabled, setTodoEnabled] = useState(profile?.todo_enabled ?? true);

  const [habitReminderEnabled, setHabitReminderEnabled] = useState(Boolean(profile?.habit_reminder_time));
  const [habitReminderTime, setHabitReminderTime] = useState(profile?.habit_reminder_time?.slice(0, 5) ?? '20:00');
  const [savingReminder, setSavingReminder] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!session) return null;

  if (!profile) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <DotsLoader color={theme.primary} size={10} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  async function saveProfile() {
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), avatar_emoji: avatarKey })
      .eq('id', session!.user.id);
    setSavingProfile(false);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    await refreshProfile();
  }

  async function updateHealthSetting(
    key: 'mood_tracking_enabled' | 'timer_tracking_enabled' | 'todo_enabled',
    value: boolean
  ) {
    const setLocal = {
      mood_tracking_enabled: setMoodEnabled,
      timer_tracking_enabled: setTimerEnabled,
      todo_enabled: setTodoEnabled,
    }[key];
    setLocal(value);

    const { error } = await supabase.from('profiles').update({ [key]: value }).eq('id', session!.user.id);
    if (error) {
      setLocal(!value);
      Alert.alert('Could not save', error.message);
      return;
    }
    await refreshProfile();
  }

  async function saveHabitReminder() {
    setSavingReminder(true);
    try {
      if (habitReminderEnabled) {
        await requestNotificationPermission();
      }
      const time = habitReminderEnabled ? habitReminderTime : null;
      const { error } = await supabase
        .from('profiles')
        .update({ habit_reminder_time: time })
        .eq('id', session!.user.id);
      if (error) throw error;

      // Home doesn't know yet whether today's habits are already done, so this
      // optimistically schedules the reminder; Home corrects/cancels it (based on
      // real completion state) the next time it loads.
      await syncHabitsReminder(time, false);
      await refreshProfile();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : String(err));
    } finally {
      setSavingReminder(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const data = await exportUserData(session!.user.id);
      await Share.share({ message: JSON.stringify(data, null, 2), title: 'My Habit Tracker data' });
    } catch (err) {
      Alert.alert('Could not export', err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete all your data?',
      'This permanently deletes your habits, logs, timer sessions, mood entries, period logs, friendships, and sticky notes. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccountData(session!.user.id);
              await signOut();
            } catch (err) {
              setDeleting(false);
              Alert.alert('Could not delete', err instanceof Error ? err.message : String(err));
            }
          },
        },
      ]
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle" style={styles.pageTitle}>
            Profile
          </ThemedText>

          <Card style={styles.card}>
            <ThemedText type="smallBold">@{profile.username}</ThemedText>

            <View style={styles.avatarPreview}>
              <Avatar avatarKey={avatarKey} size={72} />
            </View>

            <TextField label="Display name" value={displayName} onChangeText={setDisplayName} />

            <View style={{ gap: Spacing.two }}>
              <ThemedText type="small" themeColor="textSecondary">
                Avatar
              </ThemedText>
              {AVATAR_ROWS.map((row, i) => (
                <View key={i} style={styles.grid}>
                  {row.map((key) => {
                    const selected = key === avatarKey;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setAvatarKey(key)}
                        style={[
                          styles.avatarCell,
                          { borderColor: selected ? theme.primary : 'transparent' },
                        ]}>
                        <Image source={avatarSource(key)} style={styles.avatarImage} contentFit="cover" />
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            <Button label="Save profile" onPress={saveProfile} loading={savingProfile} />
          </Card>

          <ThemedText type="sectionTitle" style={styles.sectionTitle}>
            Customise
          </ThemedText>
          <Card style={styles.card}>
            <ToggleRow
              emoji="⏱️"
              title="Focus timer"
              value={timerEnabled}
              onValueChange={(v) => updateHealthSetting('timer_tracking_enabled', v)}
            />
            <ToggleRow
              emoji="🙂"
              title="Mood tracking"
              value={moodEnabled}
              onValueChange={(v) => updateHealthSetting('mood_tracking_enabled', v)}
            />
            <ToggleRow emoji="🌙" title="Period cycle tracking" badge="Coming soon" />
            <ToggleRow
              emoji="📝"
              title="Todo list"
              value={todoEnabled}
              onValueChange={(v) => updateHealthSetting('todo_enabled', v)}
            />
          </Card>

          <ThemedText type="sectionTitle" style={styles.sectionTitle}>
            Notifications
          </ThemedText>
          <Card style={styles.card}>
            <ToggleRow
              emoji="🔔"
              title="Habit reminders"
              titleStyle={{ fontSize: 17 }}
              description="Reminds you (IST) about any habits you haven't completed yet today."
              descriptionStyle={{ fontWeight: '400' }}
              value={habitReminderEnabled}
              onValueChange={setHabitReminderEnabled}
            />
            {habitReminderEnabled ? (
              <TimePicker value={habitReminderTime} onChange={setHabitReminderTime} />
            ) : null}
            <Button label="Save" onPress={saveHabitReminder} loading={savingReminder} />
          </Card>

          <ThemedText type="sectionTitle" style={styles.sectionTitle}>
            Appearance
          </ThemedText>
          <Card style={styles.card}>
            <View style={styles.segmented}>
              {THEME_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.mode}
                  onPress={() => setThemeMode(opt.mode)}
                  style={[
                    styles.segment,
                    { backgroundColor: themeMode === opt.mode ? theme.primary : theme.backgroundSelected },
                  ]}>
                  <ThemedText
                    type="small"
                    style={themeMode === opt.mode ? { color: theme.onPrimary } : undefined}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <ToggleRow
              emoji="🎨"
              title="Color-blind-safe contribution grid"
              description="Uses a blue/orange scale instead of purple intensity."
              value={colorBlindPalette}
              onValueChange={setColorBlindPalette}
            />
          </Card>

          <ThemedText type="sectionTitle" style={styles.sectionTitle}>
            Your data
          </ThemedText>
          <Card style={styles.card}>
            <Button label="Export my data" variant="secondary" loading={exporting} onPress={handleExport} />
            <Pressable onPress={confirmDeleteAccount} style={styles.deleteButton} disabled={deleting}>
              <ThemedText themeColor="danger" type="smallBold">
                {deleting ? 'Deleting…' : 'Delete all my data'}
              </ThemedText>
            </Pressable>
          </Card>

          <Button label="Sign out" variant="ghost" onPress={signOut} />
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
  sectionTitle: { marginTop: Spacing.two },
  card: { gap: Spacing.three },
  avatarPreview: { alignItems: 'center' },
  grid: { flexDirection: 'row', gap: Spacing.two },
  avatarCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: Radius.pill,
    borderWidth: 3,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  segmented: { flexDirection: 'row', gap: Spacing.two },
  segment: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: Radius.md },
  deleteButton: { alignItems: 'center', paddingVertical: Spacing.two },
});