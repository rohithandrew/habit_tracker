import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { DotsLoader } from '@/components/dots-loader';
import { useResolvedScheme, useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { configureNotificationHandler } from '@/lib/notifications';
import { SettingsProvider } from '@/lib/settings-context';

SplashScreen.preventAutoHideAsync();
configureNotificationHandler();

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ThemedRootNavigator />
      </AuthProvider>
    </SettingsProvider>
  );
}

function ThemedRootNavigator() {
  const scheme = useResolvedScheme();

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { loading } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <DotsLoader color={theme.primary} size={10} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="habit/[id]"
        options={{ headerShown: true, headerBackTitle: 'Back', title: 'Habit' }}
      />
      <Stack.Screen
        name="friend/[id]"
        options={{ headerShown: true, headerBackTitle: 'Back', title: 'Friend' }}
      />
      <Stack.Screen
        name="timer/history"
        options={{ headerShown: true, headerBackTitle: 'Back', title: 'Focus history' }}
      />
      <Stack.Screen
        name="mood/period"
        options={{ headerShown: true, headerBackTitle: 'Back', title: 'Period cycle' }}
      />
      <Stack.Screen
        name="tasks/all"
        options={{ headerShown: true, headerBackTitle: 'Back', title: 'Tasks' }}
      />
    </Stack>
  );
}
