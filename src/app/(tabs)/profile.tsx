import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToggleRow } from '@/components/toggle-row';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

const AVATAR_EMOJIS = [
  '🙂', '😎', '🤓', '🥳', '🦊', '🐼', '🐸', '🐨', '🐯', '🐵', '🦁', '🐶',
  '🦉', '🐢', '🐙', '🌵', '🌸', '⭐', '🌈', '🔥',
];

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, session, refreshProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [avatarEmoji, setAvatarEmoji] = useState(profile?.avatar_emoji ?? '🙂');
  const [savingProfile, setSavingProfile] = useState(false);

  const [moodEnabled, setMoodEnabled] = useState(profile?.mood_tracking_enabled ?? false);
  const [periodEnabled, setPeriodEnabled] = useState(profile?.period_tracking_enabled ?? false);
  const [timerEnabled, setTimerEnabled] = useState(profile?.timer_tracking_enabled ?? true);
  const [savingHealth, setSavingHealth] = useState(false);

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
              <View style={[styles.avatarCircle, { backgroundColor: theme.primarySoft }]}>
                <ThemedText style={styles.avatarEmoji}>{avatarEmoji}</ThemedText>
              </View>
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
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 36 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  emojiCell: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 20 },
});
