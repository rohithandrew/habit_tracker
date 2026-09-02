import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { MonthCalendar } from '@/components/month-calendar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/habits';
import { useOnboarding } from '@/lib/onboarding-context';

export default function PeriodDetailsScreen() {
  const theme = useTheme();
  const { draft, update } = useOnboarding();
  const [lastStart, setLastStart] = useState<string | null>(draft.periodLastStart);
  const [cycleLength, setCycleLength] = useState(draft.periodCycleLength);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="small" themeColor="textSecondary">
            Step 5 of 7
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            Period tracker details
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Private by default — you can choose to share it with specific friends later from
            Sharing settings.
          </ThemedText>

          <ThemedText type="smallBold" style={{ marginTop: Spacing.three }}>
            Last period start date
          </ThemedText>
          <Card>
            <MonthCalendar selectedDate={lastStart} onSelectDate={setLastStart} maxDate={toDateKey(new Date())} />
          </Card>

          <ThemedText type="smallBold" style={{ marginTop: Spacing.three }}>
            Average cycle length
          </ThemedText>
          <View style={styles.stepper}>
            <Pressable
              style={[styles.stepperButton, { backgroundColor: theme.backgroundSelected }]}
              onPress={() => setCycleLength((v) => Math.max(20, v - 1))}>
              <ThemedText type="smallBold">−</ThemedText>
            </Pressable>
            <ThemedText type="title" style={styles.stepperValue}>
              {cycleLength}
            </ThemedText>
            <Pressable
              style={[styles.stepperButton, { backgroundColor: theme.backgroundSelected }]}
              onPress={() => setCycleLength((v) => Math.min(45, v + 1))}>
              <ThemedText type="smallBold">+</ThemedText>
            </Pressable>
            <ThemedText themeColor="textSecondary">days</ThemedText>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.three }}>
            Predictions are estimates, not medical advice — irregular cycles reduce accuracy.
          </ThemedText>
        </ScrollView>

        <View style={styles.actions}>
          <Button
            label="Continue"
            disabled={!lastStart}
            onPress={() => {
              update({ periodLastStart: lastStart, periodCycleLength: cycleLength });
              router.push('/(onboarding)/notifications');
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scroll: { gap: Spacing.two, paddingBottom: Spacing.four },
  title: { fontSize: 28, lineHeight: 34 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { fontSize: 28, minWidth: 48, textAlign: 'center' },
  actions: { gap: Spacing.two, paddingVertical: Spacing.four },
});
