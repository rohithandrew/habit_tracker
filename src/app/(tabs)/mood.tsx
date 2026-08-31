import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MoodView } from '@/components/screens/mood-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function MoodScreen() {
  const { session, profile } = useAuth();

  if (!session || !profile) return null;

  if (!profile.mood_tracking_enabled) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <ThemedText style={{ fontSize: 48 }}>🙂</ThemedText>
          <ThemedText type="subtitle" style={{ textAlign: 'center', marginTop: Spacing.three }}>
            Mood tracking is off
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.two }}>
            Turn it on from Profile → Health to start logging how you feel.
          </ThemedText>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={{ marginTop: Spacing.four }}>
            <ThemedText themeColor="accent" type="smallBold">
              Go to Profile
            </ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <MoodView userId={session.user.id} showPeriodLink={profile.period_tracking_enabled} />
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
});
