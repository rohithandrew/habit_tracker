import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function NotificationsScreen() {
  async function requestAndContinue() {
    if (Platform.OS !== 'web') {
      try {
        await Notifications.requestPermissionsAsync();
      } catch {
        // Ignore — permission is optional, the app works fully without it.
      }
    }
    router.push('/(onboarding)/first-habit');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="small" themeColor="textSecondary">
          Step 6 of 7
        </ThemedText>
        <ThemedText style={styles.emoji}>🔔</ThemedText>
        <ThemedText type="title" style={styles.title}>
          Stay on top of your streaks
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.body}>
          Turn on notifications so we can remind you about habit streaks and friend requests. You
          can change this anytime in Settings.
        </ThemedText>

        <View style={styles.actions}>
          <Button label="Enable notifications" onPress={requestAndContinue} />
          <Button
            label="Not now"
            variant="ghost"
            onPress={() => router.push('/(onboarding)/first-habit')}
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
  emoji: { fontSize: 56, marginTop: Spacing.five },
  title: { fontSize: 28, lineHeight: 34 },
  body: { fontSize: 16, lineHeight: 22 },
  actions: { gap: Spacing.two, marginTop: 'auto', paddingBottom: Spacing.four },
});
