import { Share } from 'react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimePicker } from '@/components/time-picker';
import { ToggleRow } from '@/components/toggle-row';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deleteAccountData, exportUserData } from '@/lib/account';
import { useAuth } from '@/lib/auth-context';
import { requestNotificationPermission, syncMoodReminder, syncWeeklyRecap } from '@/lib/notifications';
import { useSettings, type ThemeMode } from '@/lib/settings-context';
import { supabase } from '@/lib/supabase';

const AVATAR_EMOJIS = [
  '🙂', '😎', '🤓', '🥳', '🦊', '🐼', '🐸', '🐨', '🐯', '🐵', '🦁', '🐶',
  '🦉', '🐢', '🐙', '🌵', '🌸', '⭐', '🌈', '🔥',
];

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, session, refreshProfile, signOut } = useAuth();
  const { themeMode, setThemeMode, colorBlindPalette, setColorBlindPalette } = useSettings();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [avatarEmoji, setAvatarEmoji] = useState(profile?.avatar_emoji ?? '🙂');
  const [savingProfile, setSavingProfile] = useState(false);

  const [moodEnabled, setMoodEnabled] = useState(profile?.mood_tracking_enabled ?? false);
  const [periodEnabled, setPeriodEnabled] = useState(profile?.period_tracking_enabled ?? false);
  const [timerEnabled, setTimerEnabled] = useState(profile?.timer_tracking_enabled ?? true);
  const [savingHealth, setSavingHealth] = useState(false);

  const [moodReminderEnabled, setMoodReminderEnabled] = useState(Boolean(profile?.mood_reminder_time));
  const [moodReminderTime, setMoodReminderTime] = useState(profile?.mood_reminder_time?.slice(0, 5) ?? '20:00');
  const [weeklyRecapEnabled, setWeeklyRecapEnabled] = useState(profile?.weekly_recap_enabled ?? false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!session) return null;

  if (!profile) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <ActivityIndicator color={theme.primary} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  async function saveProfile() {
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), avatar_emoji: avatarEmoji })
      .eq('id', session!.user.id);
    setSavingProfile(false);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    await refreshProfile();
  }

  async function saveHealthSettings() {
    setSavingHealth(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        mood_tracking_enabled: moodEnabled,
        period_tracking_enabled: periodEnabled,
        timer_tracking_enabled: timerEnabled,
      })
      .eq('id', session!.user.id);
    setSavingHealth(false);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    await refreshProfile();
  }

  async function saveNotificationSettings() {
    setSavingNotifications(true);
    try {
      if (moodReminderEnabled || weeklyRecapEnabled) {
        await requestNotificationPermission();
      }
      const { error } = await supabase
        .from('profiles')
        .update({
          mood_reminder_time: moodReminderEnabled ? moodReminderTime : null,
          weekly_recap_enabled: weeklyRecapEnabled,
        })
        .eq('id', session!.user.id);
      if (error) throw error;

      await syncMoodReminder(moodReminderEnabled ? moodReminderTime : null);
      await syncWeeklyRecap(weeklyRecapEnabled);
      await refreshProfile();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : String(err));
    } finally {
      setSavingNotifications(false);
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
              <Avatar emoji={avatarEmoji} size={72} />
            </View>

            <TextField label="Display name" value={displayName} onChangeText={setDisplayName} />

            <View>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                Avatar
              </ThemedText>
              <View style={styles.grid}>
                {AVATAR_EMOJIS.map((emoji) => {
                  const selected = emoji === avatarEmoji;
                  return (
                    <Pressable
                      key={emoji}
                      onPress={() => setAvatarEmoji(emoji)}
                      style={[
                        styles.emojiCell,
                        { backgroundColor: selected ? theme.primary : theme.background },
                      ]}>
                      <ThemedText style={styles.emojiText}>{emoji}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Button label="Save profile" onPress={saveProfile} loading={savingProfile} />
          </Card>

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Health
          </ThemedText>
          <Card style={styles.card}>
            <ToggleRow
              emoji="⏱️"
              title="Focus timer"
              value={timerEnabled}
              onValueChange={setTimerEnabled}
            />
            <ToggleRow
              emoji="🙂"
              title="Mood tracking"
              value={moodEnabled}
              onValueChange={setMoodEnabled}
            />
            <ToggleRow
              emoji="🌙"
              title="Period cycle tracking"
              description="Private — never shared with friends, under any setting."
              value={periodEnabled}
              onValueChange={setPeriodEnabled}
            />
            <Button label="Save" onPress={saveHealthSettings} loading={savingHealth} />
          </Card>

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Notifications
          </ThemedText>
          <Card style={styles.card}>
            <ToggleRow
              emoji="🔔"
              title="Mood check-in reminder"
              value={moodReminderEnabled}
              onValueChange={setMoodReminderEnabled}
            />
            {moodReminderEnabled ? (
              <TimePicker value={moodReminderTime} onChange={setMoodReminderTime} />
            ) : null}
            <ToggleRow
              emoji="📊"
              title="Weekly recap"
              description="A private summary of your week — never shared."
              value={weeklyRecapEnabled}
              onValueChange={setWeeklyRecapEnabled}
            />
            <Button label="Save" onPress={saveNotificationSettings} loading={savingNotifications} />
          </Card>

          <ThemedText type="smallBold" style={styles.sectionTitle}>
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
                    style={themeMode === opt.mode ? { color: '#fff' } : undefined}>
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

          <ThemedText type="smallBold" style={styles.sectionTitle}>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  emojiCell: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 20 },
  segmented: { flexDirection: 'row', gap: Spacing.two },
  segment: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: Radius.md },
  deleteButton: { alignItems: 'center', paddingVertical: Spacing.two },
});
