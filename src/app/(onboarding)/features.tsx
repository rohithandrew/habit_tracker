import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToggleRow } from '@/components/toggle-row';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/lib/onboarding-context';

export default function FeaturesScreen() {
  const { draft, update } = useOnboarding();
  const [focusTimerEnabled, setFocusTimerEnabled] = useState(draft.focusTimerEnabled);
  const [moodTrackingEnabled, setMoodTrackingEnabled] = useState(draft.moodTrackingEnabled);
  const [periodTrackingEnabled, setPeriodTrackingEnabled] = useState(draft.periodTrackingEnabled);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="small" themeColor="textSecondary">
          Step 4 of 7
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          Anything else you'd like to track?
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          These are optional and can be changed anytime in Settings → Health.
        </ThemedText>

        <Card style={styles.card}>
          <ToggleRow
            emoji="⏱️"
            title="Focus timer"
            description="Run timed work sessions and see your history."
            value={focusTimerEnabled}
            onValueChange={setFocusTimerEnabled}
          />
          <ToggleRow
            emoji="🙂"
            title="Mood tracking"
            description="A quick daily check-in on how you're feeling."
            value={moodTrackingEnabled}
            onValueChange={setMoodTrackingEnabled}
          />
          {draft.gender === 'female' ? (
            <ToggleRow
              emoji="🌙"
              title="Period tracker"
              description="Off by default for friends — you choose who, if anyone, can see it."
              value={periodTrackingEnabled}
              onValueChange={setPeriodTrackingEnabled}
            />
          ) : null}
        </Card>

        <View style={styles.actions}>
          <Button
            label="Continue"
            onPress={() => {
              update({ focusTimerEnabled, moodTrackingEnabled, periodTrackingEnabled });
              if (periodTrackingEnabled) router.push('/(onboarding)/period-details');
              else router.push('/(onboarding)/notifications');
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
  card: { marginTop: Spacing.three, gap: Spacing.two },
  actions: { gap: Spacing.two, marginTop: 'auto', paddingBottom: Spacing.four },
});
