import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AVATAR_KEYS, avatarSource } from '@/lib/avatars';
import { useOnboarding } from '@/lib/onboarding-context';

export default function AvatarScreen() {
  const theme = useTheme();
  const { draft, update } = useOnboarding();
  const [displayName, setDisplayName] = useState(draft.displayName);
  const [avatarKey, setAvatarKey] = useState(draft.avatarKey);

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
          <Avatar avatarKey={avatarKey} size={88} />
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
          {AVATAR_KEYS.map((key) => {
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

        <View style={styles.actions}>
          <Button
            label="Continue"
            disabled={displayName.trim().length === 0}
            onPress={() => {
              update({ displayName: displayName.trim(), avatarKey });
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  avatarCell: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 3,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  actions: { gap: Spacing.two, marginTop: 'auto', paddingBottom: Spacing.four },
});
