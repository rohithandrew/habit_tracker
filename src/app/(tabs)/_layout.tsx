import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { CustomTabBar } from '@/components/custom-tab-bar';
import { MoodCheckInModal } from '@/components/mood-check-in-modal';
import { useAuth } from '@/lib/auth-context';
import { fetchTodayMood, upsertMood } from '@/lib/mood-api';
import { skipMoodPromptToday, wasMoodPromptSkippedToday } from '@/lib/mood-prompt';
import { toDateKey } from '@/lib/habits';

export default function TabsLayout() {
  const { session, profile } = useAuth();
  const [showMoodPrompt, setShowMoodPrompt] = useState(false);

  useEffect(() => {
    if (!session || !profile?.mood_tracking_enabled) return;
    let cancelled = false;

    (async () => {
      const [today, skipped] = await Promise.all([
        fetchTodayMood(session.user.id),
        wasMoodPromptSkippedToday(),
      ]);
      if (!cancelled && !today && !skipped) setShowMoodPrompt(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [session, profile?.mood_tracking_enabled]);

  async function handleMoodSelect(mood: 1 | 2 | 3 | 4 | 5) {
    if (!session) return;
    setShowMoodPrompt(false);
    await upsertMood(session.user.id, toDateKey(new Date()), mood, null);
  }

  async function handleMoodSkip() {
    setShowMoodPrompt(false);
    await skipMoodPromptToday();
  }

  // Reactive guard: redirects the instant the session disappears (e.g. sign out),
  // regardless of which tab/screen was active when it happened. Relying on an
  // imperative router.replace() from the action that triggered it isn't reliable
  // when that action fires from deep inside this nested navigator.
  if (!session) return <Redirect href="/(auth)/welcome" />;

  return (
    <>
    <MoodCheckInModal visible={showMoodPrompt} onSelect={handleMoodSelect} onSkip={handleMoodSkip} />
    <Tabs
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      layout={({ state, navigation, children }) => (
        <View style={{ flex: 1 }}>
          {children}
          <CustomTabBar state={state} navigation={navigation} />
        </View>
      )}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="timer" options={{ title: 'Timer' }} />
      <Tabs.Screen name="todo" options={{ title: 'Todo' }} />
      <Tabs.Screen name="mood" options={{ title: 'Mood' }} />
      <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
    </>
  );
}
