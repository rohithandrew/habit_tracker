import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboarding } from '@/lib/onboarding-context';
import type { Gender } from '@/lib/types';

const OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other / prefer not to say' },
];

export default function GenderScreen() {
  const theme = useTheme();
  const { draft, update } = useOnboarding();
  const [gender, setGender] = useState<Gender | null>(draft.gender);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="small" themeColor="textSecondary">
          Step 2 of 7
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          What's your gender?
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Used only to show you relevant features — e.g. period tracking is only offered to
          women.
        </ThemedText>

        <View style={styles.options}>
          {OPTIONS.map((opt) => {
            const selected = gender === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setGender(opt.value)}
                style={[
                  styles.option,
                  { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primarySoft : 'transparent' },
                ]}>
                <ThemedText type="smallBold">{opt.label}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button
            label="Continue"
            disabled={!gender}
            onPress={() => {
              update({ gender });
              router.push('/(onboarding)/avatar');
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
  options: { gap: Spacing.two, marginTop: Spacing.three },
  option: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  actions: { gap: Spacing.two, marginTop: 'auto', paddingBottom: Spacing.four },
});
