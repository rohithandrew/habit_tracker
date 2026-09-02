import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/lib/onboarding-context';
import { supabase } from '@/lib/supabase';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

export default function UsernameScreen() {
  const { draft, update } = useOnboarding();
  const [username, setUsername] = useState(draft.username);
  const [availability, setAvailability] = useState<Availability>('idle');

  useEffect(() => {
    if (username.length === 0) {
      setAvailability('idle');
      return;
    }
    if (!USERNAME_PATTERN.test(username)) {
      setAvailability('invalid');
      return;
    }
    setAvailability('checking');
    const handle = setTimeout(async () => {
      const { data, error } = await supabase.rpc('is_username_available', {
        check_username: username,
      });
      if (error) {
        setAvailability('error');
        return;
      }
      setAvailability(data ? 'available' : 'taken');
    }, 400);
    return () => clearTimeout(handle);
  }, [username]);

  const helperText = {
    idle: 'Letters, numbers, and underscores. 3–20 characters.',
    checking: 'Checking availability…',
    available: '✓ Username available',
    taken: 'That username is already taken.',
    invalid: 'Use 3–20 letters, numbers, or underscores.',
    error: 'Could not check availability, try again.',
  }[availability];

  const canContinue = availability === 'available';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="small" themeColor="textSecondary">
          Step 1 of 7
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          Choose a username
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          This is how friends will search for and find you — it's unique and can't be changed to
          match someone else's.
        </ThemedText>

        <View style={styles.form}>
          <TextField
            label="Username"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. budi_k"
            error={
              availability === 'taken' || availability === 'invalid' || availability === 'error'
                ? helperText
                : null
            }
          />
          {availability !== 'taken' && availability !== 'invalid' && availability !== 'error' ? (
            <ThemedText type="small" themeColor="textSecondary">
              {helperText}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button
            label="Continue"
            disabled={!canContinue}
            onPress={() => {
              update({ username });
              router.push('/(onboarding)/gender');
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
  form: { gap: Spacing.two, marginTop: Spacing.three },
  actions: { gap: Spacing.two, marginTop: 'auto', paddingBottom: Spacing.four },
});
