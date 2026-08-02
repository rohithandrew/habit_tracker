import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const theme = useTheme();
  const { session } = useAuth();

  // Reactive guard: redirects the instant the session disappears (e.g. sign out),
  // regardless of which tab/screen was active when it happened. Relying on an
  // imperative router.replace() from the action that triggered it isn't reliable
  // when that action fires from deep inside this nested navigator.
  if (!session) return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.backgroundElement, borderTopColor: theme.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="timer"
        options={{ title: 'Timer', tabBarIcon: () => <TabIcon emoji="⏱️" /> }}
      />
      <Tabs.Screen
        name="mood"
        options={{ title: 'Mood', tabBarIcon: () => <TabIcon emoji="🙂" /> }}
      />
      <Tabs.Screen
        name="friends"
        options={{ title: 'Friends', tabBarIcon: () => <TabIcon emoji="🧑‍🤝‍🧑" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: () => <TabIcon emoji="⚙️" /> }}
      />
    </Tabs>
  );
}
