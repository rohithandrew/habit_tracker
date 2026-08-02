import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SLIDES = [
  {
    emoji: '📈',
    title: 'Track habits your way',
    body: 'Daily, specific weekdays, a weekly target, or a one-off challenge — build the routine that fits your life.',
  },
  {
    emoji: '🧑‍🤝‍🧑',
    title: 'Share progress with friends',
    body: 'Accept a friend request and choose exactly what they can see — nothing is shared by default.',
  },
  {
    emoji: '🎯',
    title: 'Focus timer & mood check-ins',
    body: 'Run a focus session and log how you’re feeling — private by default, visible to friends only if you choose.',
  },
];

export default function WelcomeScreen() {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.slide}>
          <ThemedText style={styles.emoji}>{slide.emoji}</ThemedText>
          <ThemedText type="title" style={styles.title}>
            {slide.title}
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.body}>
            {slide.body}
          </ThemedText>
        </View>

        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.title}
              style={[
                styles.dot,
                { backgroundColor: i === index ? theme.primary : theme.backgroundSelected },
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            label={isLast ? 'Get started' : 'Next'}
            onPress={() => {
              if (isLast) router.push('/(auth)/sign-up');
              else setIndex((i) => i + 1);
            }}
          />
          <Button
            label="I already have an account"
            variant="ghost"
            onPress={() => router.push('/(auth)/sign-in')}
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
    paddingBottom: Spacing.four,
    gap: Spacing.four,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  emoji: { fontSize: 64 },
  title: { fontSize: 28, lineHeight: 34, textAlign: 'center' },
  body: { textAlign: 'center', fontSize: 16, lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: { gap: Spacing.two },
});
