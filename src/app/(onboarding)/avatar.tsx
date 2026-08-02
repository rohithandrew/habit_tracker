import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboarding } from '@/lib/onboarding-context';

const AVATAR_EMOJIS = [
  '🙂', '😎', '🤓', '🥳', '🦊', '🐼', '🐸', '🐨', '🐯', '🐵', '🦁', '🐶',
  '🦉', '🐢', '🐙', '🌵', '🌸', '⭐', '🌈', '🔥',
];

export default function AvatarScreen() {
  const theme = useTheme();
  const { draft, update } = useOnboarding();
  const [displayName, setDisplayName] = useState(draft.displayName);
  const [avatarEmoji, setAvatarEmoji] = useState(draft.avatarEmoji);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="small" themeColor="textSecondary">
          Step 2 of 6
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          Pick your look
        </ThemedText>

        <View style={styles.avatarPreview}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.primarySoft }]}>
            <ThemedText style={styles.avatarEmoji}>{avatarEmoji}</ThemedText>
          </View>
        </View>

        <TextField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="What should friends call you?"
        />

        <ThemedText type="smallBold" style={{ marginTop: Spacing.three }}>
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
                  { backgroundColor: selected ? theme.primary : theme.backgroundElement },
                ]}>
                <ThemedText style={styles.emojiText}>{emoji}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button
            label="Continue"
            disabled={displayName.trim().length === 0}
            onPress={() => {
              update({ displayName: displayName.trim(), avatarEmoji });
              router.push('/(onboarding)/features');
            }}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.three,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  title: { fontSize: 28, lineHeight: 34 },
  avatarPreview: { alignItems: 'center', marginVertical: Spacing.three },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 44 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  emojiCell: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 26 },
  actions: { gap: Spacing.two, marginTop: 'auto', paddingBottom: Spacing.four },
});
