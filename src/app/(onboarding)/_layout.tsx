import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth-context';
import { OnboardingProvider } from '@/lib/onboarding-context';

export default function OnboardingLayout() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/(auth)/welcome" />;

  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </OnboardingProvider>
  );
}
